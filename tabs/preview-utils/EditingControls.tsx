import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const EditingControls = ({blobUrl}) => {
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);

    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('log', ({ message }) => {
            messageRef.current.innerHTML = message;
            console.log(message);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setLoaded(true);
    }

    const loadWaveForm = () => {
        if (waveContainerRef.current && !waveSurferRef.current) {
            waveSurferRef.current = WaveSurfer.create({
                container: waveContainerRef.current,
                waveColor: '#ddd',
                progressColor: '#555',
                cursorColor: '#333',
                height: 100,
                barWidth: 2,
                // responsive: true,
                interact: false, // Optional: disables seeking through waveform
            });

            waveSurferRef.current.on('ready', () => {
                setIsWaveSurferReady(true);
            });
        }
    }


    useEffect(() => {
        loadWaveForm()

        return () => {
            waveSurferRef.current?.destroy();
            waveSurferRef.current = null;
        };
    }, []);

    const fetchSource = () => {}

    useEffect(() => {
        if(blobUrl) {
            fetchSource()
            waveSurferRef.current.load(blobUrl);
        }
    }, [blobUrl])

    return (
        <>
            <div className={style["editing-container"]} >
                <div className={style["redo-undo"]} >
                    <div className="undo" > <LiaUndoAltSolid color="10abd9" fontSize={24} /> </div>
                    <div className="redo" > <LiaRedoAltSolid color="10abd9" fontSize={24} /> </div>
                </div>
                <div className={style["editing-actions"]} >
                    {
                        ["cut", "trim", "delete recording", "publish"].map(action => (
                            <button key={action} className={action === 'publish' ? style["publish-btn"] : ""} >
                                {["cut", "trim"].includes(action) && <span  >
                                    {action === 'cut' ? <BsScissors fontSize={14} color="10abd9" /> : <MdOutlineCrop fontSize={14} color="10abd9" />}
                                </span>}
                                <p>
                                    {action}
                                </p>
                            </button>
                        ))
                    }
                </div>
            </div>
            <div className={style["wavesurfer-wrapper"]} >
                <div ref={waveContainerRef} style={{ marginTop: '10px' }} />
                {!isWaveSurferReady && <p>Loading waveform...</p>}
            </div>
        </>
    )
}

export default EditingControls
import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import WaveformGenerator from "~tabs/waveform-generator"

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const EditingControls = ({blobUrl, timeData, blob}) => {
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);

    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef(null);
    const messageRef = useRef(null);
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


    // useEffect(() => {
    //     loadWaveForm()

    //     return () => {
    //         waveSurferRef.current?.destroy();
    //         waveSurferRef.current = null;
    //     };
    // }, []);

    const fetchSource = () => {}

    useEffect(() => {
        if(blobUrl) {
            // fetchSource()
            // waveSurferRef.current.load(blobUrl);
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
                <WaveformGenerator  blob={blob} time={timeData.time} updatePlayerTime={timeData.updatePlayerTime} />
            </div>
        </>
    )
}

export default EditingControls
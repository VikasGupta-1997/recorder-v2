import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import WaveSurfer from 'wavesurfer.js';
import VideoPreview from "./preview-utils/VideoPreview";
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}
// import { getAudio,  initDB, storeAudio } from '~indexDB'

function PreviewPage() {
    const videoRef = useRef(null)
    const audioRef = useRef(null);
    const [isAudio, setIsAudio] = useState('ideal')

    const [loadingVideo, setVideoLoading] = useState(true)
    const url = useRef('')
    const containerRef = useRef(null)
    // const wavesurferRef = useRef(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                console.log("onMountListeners1212", message)
                switch (message.type) {
                    case "PLAY_PREVIEW": {
                        console.log("GET_INDEXDB_RECORDING12121212", isAudio)
                        setVideoLoading(false)
                    }
                }
            }
        )
    }

    useEffect(() => {
        if (!loadingVideo) {
            playRecordingInVideoTag()
        }
    }, [loadingVideo, isAudio])

    useEffect(() => {
        chrome.storage.local.get(["saving_in_indexdb"], async result => {
            console.log("result===>", result)
            if (!result?.saving_in_indexdb) {
                console.log("setVideoLoadingCALLEDDDD!!!!!")
                setVideoLoading(false)
            }
        })
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

        return () => {
            waveSurferRef.current?.destroy();
            waveSurferRef.current = null;
        };
    }, []);

    function loadRecordingFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("videoDatabase", 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("videos", "readonly");
                const store = transaction.objectStore("videos");
                const getRequest = store.get("recording");

                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        resolve(getRequest.result.data);
                    } else {
                        reject("No recording found in IndexedDB");
                    }
                };

                getRequest.onerror = reject;
            };

            request.onerror = reject;
        });
    }

    async function playRecordingInVideoTag() {
        try {
            const base64Data = await loadRecordingFromIndexedDB() as string;

            // Convert Base64 to a Blob URL and set as the video src
            const response = await fetch(base64Data);
            console.log(videoRef.current, "response1221", response)
            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            url.current = videoUrl
            // setVideoLoading(false)
            if (isAudio === 'video') {
                console.log("videoRef121", videoRef.current)
                videoRef.current.src = url.current;
            } else {
                console.log("Set Audio Here !")
                audioRef.current.src = url.current;
            }
        } catch (error) {
            // setVideoLoading(false)
            console.error("Error loading and playing recording:", error);
        }
    }

    useLayoutEffect(() => {
        onMountListeners()
    }, [isAudio])


    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly"], async (result) => {
            // playRecordingInVideoTag()
            if (result?.isAudioOnly) {
                setIsAudio('audio');
            } else {
                setIsAudio('video');
            }
        });
    }, []);

    useEffect(() => {
        if (!loadingVideo) {
            // playRecordingInVideoTag()
            // waveSurferRef.current.load(url.current);
        }
    }, [loadingVideo, isAudio])

    if (loadingVideo) {
        return (
            <div>
                ...Loading Video
            </div>
        )
    }

    return (
        <div className={style["container"]}>
            <h1 className={style["heading-title"]}>
                {`Rec-11122024-desktop.${isAudio === 'video' ? 'mp4' : 'mp3'}`}
                {" "}
                <span className={style["edit-icon"]} >
                    <FaRegEdit color={'white'} size={10} />
                </span>
            </h1>
            <div className={style["ref-wrapper"]}>
                {isAudio === 'video' && <VideoPreview videoRef={videoRef} />
                }
                {isAudio === 'audio' && <AudioPreview audioRef={audioRef} containerRef={containerRef} />}
            </div>
            <div className={style["editing-control-wrapper"]} >
                <EditingControls />
            </div>
            <div className={style["wavesurfer-wrapper"]} >
                <div ref={waveContainerRef} style={{ marginTop: '10px' }} />
                {!isWaveSurferReady && <p>Loading waveform...</p>}
            </div>
        </div>
    );
}

export default PreviewPage;
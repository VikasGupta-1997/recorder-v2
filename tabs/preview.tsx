import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
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
    const [blobUrl, setBlobUrl] = useState(null)
    const [loadingVideo, setVideoLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [blob, setBlob] = useState(null)
    const url = useRef('')
    const containerRef = useRef(null)

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                switch (message.type) {
                    case "PLAY_PREVIEW": {
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
        chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
            if (!result?.saving_in_indexdb) {
                setVideoLoading(false)
            }
            if (result?.isAudioOnly) {
                setIsAudio('audio');
            } else {
                setIsAudio('video');
            }
        });
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
            setBlob(blob)
            const videoUrl = URL.createObjectURL(blob);
            url.current = videoUrl
            setBlobUrl(videoUrl)
            // setVideoLoading(false)
            if (isAudio === 'video') {
                console.log("videoRef121", videoRef.current)
                // videoRef.current.src = url.current;
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

    if (loadingVideo) {
        return (
            <div className={style["loading-container"]} >
                <div className={style["loader"]}></div>
            </div>
        )
    }


    const changeMode = () => {
        console.log("MODE")
        setIsEditMode(prev => !prev)
    }

    const handleCancelEditing = () => {
        setIsEditMode(false)
    }

    return (
        <div className={style["container"]}>
            <h1 className={style["heading-title"]}>
                <span className={style["title"]} >
                    {`Rec-11122024-desktop.${isAudio === 'video' ? 'mp4' : 'mp3'}`}
                    {" "}
                    <span className={style["edit-icon"]} >
                        <FaRegEdit color={'white'} size={10} />
                    </span>
                </span>
                {isEditMode && <span>
                    <button onClick={handleCancelEditing} className={style["rounded-btn"]}>cancel</button>
                </span>}
            </h1>
            <div className={style["ref-wrapper"]}>
                {isAudio === 'video' && <VideoPreview blob={blob} blobUrl={blobUrl} />
                }
                {isAudio === 'audio' && <AudioPreview blob={blob} audioRef={audioRef} containerRef={containerRef} />}
            </div>
            {isEditMode ? null : <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} onClick={changeMode} >Edit Video</button></div>}
            {isEditMode && <div className={style["editing-control-wrapper"]} >
                <EditingControls blobUrl={blobUrl} />
            </div>}
        </div>
    );
}

export default PreviewPage;
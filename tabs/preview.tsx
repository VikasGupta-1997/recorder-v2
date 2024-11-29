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

const receivedChunks = [];
let isPlaying = false;


function PreviewPage() {
    const videoRef = useRef(null)
    const audioRef = useRef(null);
    const [isAudio, setIsAudio] = useState('ideal')
    const [blobUrl, setBlobUrl] = useState(null)
    const [loadingVideo, setVideoLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [blob, setBlob] = useState(null)
    const [timeData, setTimeData] = useState({time: 0, updatePlayerTime: false})
    const url = useRef('')
    const containerRef = useRef(null)

    console.log(blobUrl, "blobblob1", blob,)
    const playPartialRecording = async () => {
        try {
            // Convert available chunks to a Blob
            const base64Data = receivedChunks.filter(Boolean).join('');
            if (!base64Data) {
                console.warn('No data available to play');
                return;
            }

            // Check if the data is a data URL
            if (base64Data.startsWith('data:')) {
                try {
                    const response = await fetch(base64Data);
                    console.log("response1212", response)
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const newBlob = await response.blob();
                    console.log("newBlob1121", newBlob)
                    const newBlobUrl = URL.createObjectURL(newBlob);
                    console.log("newBlobUrl11221", newBlobUrl)

                    setBlob(newBlob);
                    setBlobUrl(newBlobUrl);
                    setVideoLoading(false)
                    // window.postMessage({type: "SEND_FROM_PREVIEW", data: newBlobUrl}, '*')
                    // Revoke old URL to prevent memory leaks
                    if (url.current) {
                        URL.revokeObjectURL(url.current);
                    }
                    url.current = newBlobUrl;
                } catch (fetchError) {
                    console.error('Error fetching or processing blob:', fetchError);
                    // Handle the error appropriately, maybe set an error state
                }
            } else {
                console.warn('Invalid data format - expected data URL');
            }
        } catch (error) {
            console.error('Error in playPartialRecording:', error);
            // Handle the error appropriately, maybe set an error state
        }
    };

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                console.log("MESSAAGE", message)
                switch (message.type) {
                    case "RECORDING_CHUNK_PREVIEW": {
                        // Debug log to see chunk format
                        console.log('Received chunk format:', {
                            index: message.index,
                            dataStart: message.data.substring(0, 50) + '...',
                            dataLength: message.data.length
                        });

                        receivedChunks[message.index] = message.data;
                        console.log(`Received chunk ${message.index}`);

                        // Try to start playing the video when enough data is received
                        if (!isPlaying && receivedChunks.length >= 5) { // Assuming 5 chunks are sufficient to start
                            isPlaying = true;
                            playPartialRecording();
                        }

                        if (message.isLastChunk) {
                            console.log("All chunks received. Reassembling...");
                            playPartialRecording(); // Play the complete recording
                        }
                    }
                        break;
                }
            }
        )
    }

    const sendPostMessage = (message) => {
        window.parent.postMessage(message, "*");
    }

    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
            console.log("resultresult", result)
            sendPostMessage({ type: "IS_CONTENT_TYPE", isAudioOnly: result?.isAudioOnly })
            if (!result?.saving_in_indexdb) {
                // setVideoLoading(false)
            }
            if (result?.isAudioOnly) {
                setIsAudio('audio');
                if(audioRef.current){
                    console.log("audioRef.current", url.current)
                    audioRef.current.src = url.current;
                }
            } else {
                setIsAudio('video');
            }
        });
    }, [blobUrl]);

    useLayoutEffect(() => {

        window.addEventListener("message", (event) => {
            // Make sure the message is coming from a trusted source
            const message = event.data;
            console.log("Message received in iframe:", message);
            // if(message.)
            // Handle the message from the parent
        });

        onMountListeners()
    }, [])

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
        // sendPostMessage({ type: "SEND_FROM_PREVIEW", blob: blob })
    }

    const handleCancelEditing = () => {
        setIsEditMode(false)
    }
    console.log("timeData", timeData)
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
            {(isAudio === 'video') && <VideoPreview setTimeData={setTimeData} blob={blob} blobUrl={blobUrl} />
            }
            {(isAudio === 'audio') && <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={audioRef} containerRef={containerRef} />}
          </div>
          {(!isEditMode) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} onClick={changeMode} >Edit Video</button></div>}
          {(isEditMode) &&  <div className={style["editing-control-wrapper"]} >
            <EditingControls blob={blob} timeData={timeData} blobUrl={blobUrl} />
          </div>}
        </div>
    );
}

export default PreviewPage;
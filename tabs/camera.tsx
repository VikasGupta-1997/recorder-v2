import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ToolBarBox from '~components/ToolBar';
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import Modal from '~components/Modal';
import styleText from "data-text:./camera.module.css"
import * as style from './camera.module.css'
import formatTime from '~utils/formatTime';
import countDown from '~utils/countDown';
import useStorage from "~useStorageCustom";
import { saveRecordingToIndexedDB } from "~utils/saveRecordingToIndexedDB";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

let recorder;
let isRecordingStarted = false;
let recordedChunksV = []
let isRestartRecording = false
const Camera = () => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null); // Ref for the video element
    const [isRecordingPaused, setIsRecordingPaused] = useStorage("isRecordingPaused", false);
    // const [isRecordingPaused, setIsRecordingPaused] = useState(false)
    const [selections, setSelections] = useState(null)
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const [count, setCount] = useState<any>(5);
    const [startRecordingNow, setStartRecordingNow] = useState(false);
    const [mediaStream, setMediaStream] = useState(null)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isPopupConfirmation, setIsPopupConfirmation] = useState('')
    const formattedTimeRef = useRef(null)

    useEffect(() => countDown(showStartOverlay, count, setCount, setShowStartOverlay, setStartRecordingNow), [showStartOverlay, count]);

    useEffect(() => {
        if (startRecordingNow) {
            console.log("NOW START RECORDING!!", selections)
            recordedChunksV = []
            startRecording()
        }
    }, [startRecordingNow])

    // console.log("startRecordingNow1212", startRecordingNow)

    useEffect(() => {
        if (selections) {
            startMediaStream({
                audioDevice: selections?.micRecording,
                videoDevice: selections?.cameraRecording
            })
            setShowStartOverlay(true)
        }
    }, [selections])

    const startMediaStream = async ({ audioDevice, videoDevice }) => {
        console.log(audioDevice, videoDevice, "startMediaStream==>", videoRef)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log("devices1212", devices)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: audioDevice.value !== "mic_off" ? { deviceId: audioDevice?.value } : false,
                video: { deviceId: videoDevice?.value }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setMediaStream(mediaStream)
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }

    const startRecording = async () => {
        console.log("mediaStream112", mediaStream)
        // Initialize MediaRecorder
        recorder = new MediaRecorder(mediaStream);
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksV.push(event.data)
                // Handle recorded data (e.g., save it or upload it)
                console.log('Recorded data available:', event.data);
            }
        };
        recorder.start();

        recorder.onstop = async () => {

            const blob = new Blob(recordedChunksV, { type: 'video/webm' });
            // Convert Blob to Base64
            console.log("onstop", blob)
            function onComplete() {
                console.log("Recording saved to IndexedDB")
                const url = (URL as any).createObjectURL(blob);
                console.log("BLOB URL", url, chrome?.storage)
                chrome.runtime.sendMessage({
                    type: 'OPEN_PREVIEW_TAB',
                    videoUrl: url
                });
                chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
                recordedChunksV = []
            }
            onComplete()
            saveRecordingToIndexedDB(blob, onComplete)
        };

        recorder.onended = () => {
            recorder.onstop()
        }

        recorder.onstart = () => {
            console.log("STARTED HERE!!")
            setIsRecordingPaused(false);
            chrome.runtime.sendMessage({ type: 'startTimer' })
            chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" })
            isRecordingStarted = true
        }

        setMediaRecorder(recorder);
    };

    const endRecording = () => {
        console.log("mediaRecorder121", mediaRecorder)
        recorder?.stop();
        // setTimeout(() => {
        //     window.close()
        // }, 100)
    }

    const onMountListners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                // console.log("MESSAGE MOUNT", message)
                switch (message.type) {
                    case "startCamOnlyRecording": {
                        setSelections(message?.selections)
                    }
                        break;
                    case "updateTimer": {
                        // console.log("updateTimer===>", message.time)
                        formatTime(message.time, formattedTimeRef)
                    }
                        break;
                    case "END_CAM_ONLY_RECORDING_CAMERA": {
                        endRecording()
                    }
                        break;
                    case "CLOSE_WINDOW_CAMERA": {
                        if (isRestartRecording) {
                            isRestartRecording = false
                        } else {
                            setTimeout(() => {
                                window?.close()
                            }, 250)
                        }
                    }
                        break;
                }
            }
        )
    }

    // useEffect(() => {
    useLayoutEffect(() => {
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        // Listen for messages from the background script
        onMountListners()
    }, []);

    // if()

    // console.log("SELECTIONS", selections)

    useEffect(() => {
        return () => {
            // Cleanup: stop all tracks when the component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
        };
    }, [stream, mediaRecorder]);

    const handleIconClick = (type) => {
        switch (type) {
            case "record": {
                console.log("Record Clicked")
            }
                break
            case "play": {
                console.log("PLAY ", mediaRecorder)
                recorder.pause();
                chrome.runtime.sendMessage({ type: 'resumeTimer' })
                setIsRecordingPaused(false)

                // chrome.runtime.sendMessage({ type: "RECORDING_PLAY" })
            }
                break;
            case "pause": {
                console.log("PAUSE ", mediaRecorder)
                setIsRecordingPaused(true)
                recorder.pause();
                chrome.runtime.sendMessage({ type: 'pauseTimer' })
                // chrome.runtime.sendMessage({ type: "RECORDING_PAUSE" })
            }
                break
            case "stop": {
                console.log("STOP!! ")
                endRecording()
                // resetScreen()
                // chrome.runtime.sendMessage({ type: "RECORDING_END" })
            }
                break;
            case "restart": {
                console.log("restart ")
                // resetScreen()

                recorder.pause();
                setIsPopupConfirmation('restart')
                setIsRecordingPaused(true);

                chrome.runtime.sendMessage({ type: "pauseTimer" })
                // chrome.runtime.sendMessage({ type: "RECORDING_RESTART" })

            }
                break;
            case "delete": {
                console.log("delete ")
                // resetScreen()

                setIsPopupConfirmation('delete')
                setIsRecordingPaused(true);
                recorder.pause();
                chrome.runtime.sendMessage({ type: "pauseTimer" })
                // chrome.runtime.sendMessage({ type: "RECORDING_DELETE" })
            }
                break;
        }
    }

    useEffect(() => {
        if (!!isPopupConfirmation) {
            const isConfirmed = isPopupConfirmation.split('-')[1]
            console.log("IS CONFINMMR OUTER")
            if (isConfirmed) {
                if (isConfirmed === 'delete') {
                    chrome.runtime.sendMessage({ type: "stopTimer" })
                    chrome.runtime.sendMessage({ type: "RECORDING_END" })
                    chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
                    console.log("IS CONFINMMR")
                    setTimeout(() => {
                        window.close()
                    }, 100)
                    //   resetScreen()
                    //   resetAllNew()
                } else {
                    console.log("IS RESTARTED!!!")
                    isRestartRecording = true
                    if (recorder) {
                        console.log("DEJA VU!!")
                        // recorder.stop();
                        recordedChunksV = []
                        console.log("MELAAA VU!!")
                        setCount(5)
                        setShowStartOverlay(true)
                        setStartRecordingNow(false)
                    }
                    //   chrome.runtime.sendMessage({ type: "RECORDING_RESTART" })
                    chrome.runtime.sendMessage({ type: "stopTimer" })
                    chrome.runtime.sendMessage({ type: "NoPreviewShow" })
                    //   setTimer(0)
                    //   setCount(5)
                    //   setShowStartOverlay(false)
                    //   setIsRestarted(true)
                }
                setIsPopupConfirmation('')
            }
        }
    }, [isPopupConfirmation])

    const toggleFullscreen = () => {
        console.log("TOGGLE CALLEWDDD")
        if (videoRef.current) {
            setIsFullScreen(prev => !prev)
            if (!document.fullscreenElement) {
                videoRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enter fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit fullscreen: ${err.message}`);
                });
            }
        }
    };

    const modalClose = (type) => {
        const isValidValue = typeof type === 'string'
        const setVal = isValidValue ? type : ''
        if (!isValidValue) {
            setIsRecordingPaused(false)
            recorder.resume();
            chrome.runtime.sendMessage({ type: "RECORDING_PLAY" })
            chrome.runtime.sendMessage({ type: "PreviewShow" })
        }
        setIsPopupConfirmation(setVal)
    }

    return (
        <div
            style={{
                opacity: showStartOverlay ? '0.5' : '1',
            }}
            className={showStartOverlay ? style.recordingStartOverlay : ''} >
            {showStartOverlay && <div className={style.countdownText}>{count || ""}</div>}
            <video ref={videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
            <div>
                <ToolBarBox
                    isPopupConfirmation={isPopupConfirmation}
                    formattedTimeRef={formattedTimeRef}
                    isRecordingPaused={isRecordingPaused}
                    handleIconClick={handleIconClick}
                />
            </div>
            {
                !!isPopupConfirmation && <Modal isPopupConfirmation={isPopupConfirmation}
                    onClose={modalClose} />
            }
            {
                startRecordingNow && <div className={style.screenToggle}
                >
                    {
                        isFullScreen ? <MdFullscreenExit fontSize={24} color='black' onClick={toggleFullscreen} /> : <MdFullscreen fontSize={24} color='black' onClick={toggleFullscreen} />
                    }
                </div>
            }
        </div>
    );
};

export default Camera;

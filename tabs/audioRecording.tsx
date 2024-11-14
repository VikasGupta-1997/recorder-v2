import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ToolBarBox from '~components/ToolBar';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import { BiMicrophone } from "react-icons/bi";
import Modal from '~components/Modal';
import styleText from "data-text:./audioRecording.module.css"
import * as style from './audioRecording.module.css'
import formatTime from '~utils/formatTime';
import countDown from '~utils/countDown';
import useStorage from '~useStorageCustom';
import { saveRecordingToIndexedDB } from '~utils/saveRecordingToIndexedDB';

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

let recorder;
let recordedChunks = [];
let isRecordingStarted = false;
let isRestartRecording = false

const Audio = () => {
    const [isRecordingPaused, setIsRecordingPaused] = useStorage("isRecordingPaused", false);
    // const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const [selections, setSelections] = useState(null);
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const [count, setCount] = useState<any>(5);
    const [startRecordingNow, setStartRecordingNow] = useState(false);
    const [isRecordingStartedS, setIsRecordingStartedS] = useState(false)
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const audioContextRef = useRef(null);
    const bufferLengthRef = useRef(null);
    const [isPopupConfirmation, setIsPopupConfirmation] = useState('')

    const svgMicRef = useRef(null)
    const formattedTimeRef = useRef(null)

    useEffect(() => countDown(showStartOverlay,count,setCount,setShowStartOverlay,setStartRecordingNow), [showStartOverlay, count]);

    useEffect(() => {
        if (startRecordingNow) {
            startRecording();
        }
    }, [startRecordingNow]);

    useEffect(() => {
        if (selections) {
            startMediaStream({
                audioDevice: selections?.micRecording,
            });
            setShowStartOverlay(true);
        }
    }, [selections]);

    const startMediaStream = async ({ audioDevice }) => {
        try {
            const audioConstraints = {
                audio: { deviceId: audioDevice?.value }
            };
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            mediaStreamRef.current = stream;

            // Set up AudioContext and AnalyserNode
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            source.connect(analyser);
            analyser.fftSize = 256; // Adjust for the granularity of frequency data
            bufferLengthRef.current = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLengthRef.current);
            dataArrayRef.current = dataArray;
            analyserRef.current = analyser;
            audioContextRef.current = audioContext;

            visualizeMic(); // Start visualizing based on frequency data

        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    const visualizeMic = () => {
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        const visualize = () => {
            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);

                // Get an average volume from the frequency data
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const averageVolume = sum / dataArray.length;

                // Scale the mic icon based on average volume (you can tweak this)
                const scale = Math.min(1 + (averageVolume / 128), 2);  // Adjust the scaling factor as needed
                if (svgMicRef.current) {
                    svgMicRef.current.style.transform = `scale(${scale})`;
                }
                // document.querySelector('.svg-mic').style.transform = `scale(${scale})`;
            }

            requestAnimationFrame(visualize); // Continue the loop
        };

        requestAnimationFrame(visualize); // Start the loop
    };

    const startRecording = async () => {
        if (mediaStreamRef.current) {
            recorder = new MediaRecorder(mediaStreamRef.current);
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            recorder.onstop = saveRecording;
            recorder.start();
            recorder.onstart = () => {
                console.log("YES STYARTED")
                recordedChunks = []
                chrome.runtime.sendMessage({ type: 'startTimer' })
                // setIsRecordingStarted(true)
                setIsRecordingPaused(false)
                isRecordingStarted = true
                chrome.runtime.sendMessage({type: "RECORDING_IN_PROGRESS"})
            }
            setIsRecordingStartedS(true)
            console.log('Recording started...');
            setMediaRecorder(recorder)
        } else {
            console.error('No media stream available for recording');
        }
    };

    const endRecording = () => {
        console.log("EDN RECORD CALLED")
        if (recorder && isRecordingStarted) {
            recorder.stop();
            isRecordingStarted = false;
            setIsRecordingStartedS(false)
        }
    };

    const saveRecording = () => {
        const blob = new Blob(recordedChunks, {
            type: 'audio/webm; codecs=opus'
        });
        function onComplete(){
            const url = (URL as any).createObjectURL(blob);
            console.log("url1122", url)
            chrome.runtime.sendMessage({
                type: 'OPEN_PREVIEW_TAB',
                videoUrl: url,
                isAudioOnly: true
            });
            chrome.runtime.sendMessage({type: "RECORDING_IN_PROGRESS_END"})
        }
        onComplete()
        saveRecordingToIndexedDB(blob, onComplete)
    };

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                console.log("MESSAGE MOUNT", message);
                switch (message.type) {
                    case "startMicOnlyRecording": {
                        setSelections(message?.selections);
                    }
                        break;
                    case "updateTimer": {
                        formatTime(message.time, formattedTimeRef)
                    }
                        break;
                    case "CLOSE_WINDOW_MIC": {
                        if(isRestartRecording){
                            isRestartRecording = false
                        }else {
                            setTimeout(() => {
                                window?.close()
                            }, 250)
                        }
                    }
                    break;
                    case "END_MIC_ONLY_RECORDING_AUDIO": {
                        endRecording()
                    }
                        break;
                }
            }
        );
    };

    // useEffect(() => {
    useLayoutEffect(() => {
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        onMountListeners();
    }, []);

    useEffect(() => {
        if (!!isPopupConfirmation) {
            const isConfirmed = isPopupConfirmation.split('-')[1]
            if (isConfirmed) {
                if (isConfirmed === 'delete') {
                    chrome.runtime.sendMessage({ type: "stopTimer" })
                    chrome.runtime.sendMessage({ type: "RECORDING_END" })
                    chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
                      setTimeout(() => {
                        window.close()
                      }, 100)
                } else {
                    console.log("RECORDING STOPEED!")
                    isRestartRecording = true
                    if (recorder) {
                        setIsRecordingStartedS(false)
                        recorder.stop();
                        setCount(5)
                        setShowStartOverlay(true)
                        setStartRecordingNow(false)
                    }
                    chrome.runtime.sendMessage({ type: "stopTimer" })
                    chrome.runtime.sendMessage({ type: "NoPreviewShow" })
                }
                setIsPopupConfirmation('')
            }
        }
    }, [isPopupConfirmation])

    const handleIconClick = (type) => {
        switch (type) {
            case "record": {
                console.log("Record Clicked");
                if (!isRecordingStarted && recorder) {
                    recorder.start();
                    isRecordingStarted = true;
                    setIsRecordingStartedS(true)
                }
            }
                break;
            case "play": {
                console.log("PLAY ");
                if (recorder && recorder.state === "paused") {
                    chrome.runtime.sendMessage({ type: 'resumeTimer' })
                    recorder.resume();  // Resumes the recording
                    setIsRecordingPaused(false);
                    chrome.runtime.sendMessage({ type: "RECORDING_PLAY" });
                }
            }
                break;
            case "pause": {
                console.log("PAUSE ");
                if (recorder && recorder.state === "recording") {
                    chrome.runtime.sendMessage({ type: 'pauseTimer' })
                    recorder.pause();  // Pauses the recording
                    setIsRecordingPaused(true);
                    chrome.runtime.sendMessage({ type: "RECORDING_PAUSE" });
                }
            }
                break;
            case "stop": {
                console.log("STOP!! ");
                endRecording();
            }
                break;
            case "restart": {
                console.log("restart ");
                chrome.runtime.sendMessage({ type: "pauseTimer" })

                setIsPopupConfirmation('restart')
                recorder.pause();  // Pauses the recording
                setIsRecordingPaused(true);
                // chrome.runtime.sendMessage({ type: "RECORDING_RESTART" });
            }
                break;
            case "delete": {
                console.log("delete ");
                chrome.runtime.sendMessage({ type: "pauseTimer" })
                recorder.pause();  // Pauses the recording
                setIsRecordingPaused(true);
                setIsPopupConfirmation('delete')
                // resetAll();
                // chrome.runtime.sendMessage({ type: "RECORDING_DELETE" });
            }
                break;
        }
    };

    const modalClose = (type) => {
        const isValidValue = typeof type === 'string'
        const setVal = isValidValue ? type : ''
        if (!isValidValue) {
            setIsRecordingPaused(false)
            chrome.runtime.sendMessage({ type: "RECORDING_PLAY" })
            recorder.resume();  // Pauses the recording
            setIsRecordingPaused(false);
            chrome.runtime.sendMessage({ type: "PreviewShow" })
        }
        setIsPopupConfirmation(setVal)
    }

    return (
        <div
            style={{
                // background: 'transparent'
            }}
            className={showStartOverlay ? style['recording-start-overlay'] : ''} >
            {
                showStartOverlay && <div className={style["countdown-text"]}>{count || ""}</div>
            }
            {
                !!isPopupConfirmation && <Modal isPopupConfirmation={isPopupConfirmation}
                    onClose={modalClose} />
            }
            {isRecordingStartedS && <div className={style["recording-container"]}>
                <div className={style["mic-icon"]}>
                    <div ref={svgMicRef} className={style['svg-mic-outer']} >
                        <div className={style['svg-mic']} >
                            <BiMicrophone fontSize={36} color='white' />
                        </div>
                    </div>
                </div>
                <ToolBarBox
                    isPopupConfirmation={isPopupConfirmation}
                    isRecordingPaused={isRecordingPaused}
                    handleIconClick={handleIconClick}
                    formattedTimeRef={formattedTimeRef} />
                <LiveAudioVisualizer
                    width={870}
                    height={120}
                    barColor='#21455e'
                    mediaRecorder={mediaRecorder} // Pass the media stream to the component
                />
            </div>}
            {/* </div> */}
        </div>
    );
};

export default Audio;

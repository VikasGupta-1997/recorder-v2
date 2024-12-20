import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import onSubmitAdvanceAuphonic, { fetchMp3File } from '~utils/auphonicProduction';
import { defaultAdvanceAuphonicState } from '~utils/constants';
import getAuphonicProcessedData from '~utils/getAuphonicProcessedData';

const PreviewContext = createContext<any>(undefined);

const receivedChunks = [];
let isPlaying = false;
const auphonicUrl = 'https://auphonic.com/api'
// const AUPHONIC_USERNAME = 'bigcommand';
const AUPHONIC_USERNAME = 'vikasgupta';
// const AUPHONIC_PASSWORD = 'zbp@hty3gnb.AFB1hqc';
const AUPHONIC_PASSWORD = 'Adilo@0987';
const AUTH_HEADER = {
    'Authorization': 'Basic ' + btoa(`${AUPHONIC_USERNAME}:${AUPHONIC_PASSWORD}`)
};

export function PreviewProvider({ children }: { children: React.ReactNode }) {
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const audioRef = useRef(null);
    const customCursorRef = useRef(null);

    const [blobUrl, setBlobUrl] = useState(null)
    const [originalVideo, setOriginalVideo] = useState({
        blob: new Blob(), url: ''
    })
    const [isVideoEndcoding, setIsVideoEncoding] = useState(true)
    const originalDuration = useRef(0)
    const plyrRef = useRef(null);

    const [loadingVideo, setLoadingVideo] = useState(true)
    const [blob, setBlob] = useState(null)
    const blobRef = useRef(null)
    const url = useRef('')
    const auphonicPlyrRef = useRef(null)

    const [showAuphonicAdvanceForm, setShowAuphonicAdvanceForm] = useState(false)
    const [confirmSendToAuphonic, setConfirmSendToAuphonic] = useState(false)
    const [history, setHistory] = useState([])
    const [redoHistory, setRedoHistory] = useState([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [videoTime, setVideoTime] = useState(0)
    const [duration, setDuration] = useState(0);
    const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false)
    const [ffmpegLoadError, setFfmpegLoadError] = useState(false)
    const [ffmpegRunning, setIsFfmpegRunning] = useState(false)
    const [isPublishing, setIspublishing] = useState(false)
    const [videoSource, setVideoSource] = useState(null);
    const [auphonicVideoUrlPreview, setAuphonicVideoUrlPreview] = useState('')
    const [isAuphonicUiMode, setIsAuphonicUiMode] = useState(false)
    const audioF = useRef(null)
    const switchModeAudios = useRef({
        auphonicAudio: null,
        originalAudio: null,
        trimState: {
            startTime: 0,
            endTime: 0,
            duration: 0,
        }
    })
    const [trimState, setTrimState] = useState({
        start: 0,
        end: 1,
        dragInteracted: false,
        startTime: 0,
        endTime: 0,
        duration: 0
    });
    const uuidRef = useRef(null)
    const [uuidState, setUuid] = useState(null)
    const [showRevertButton, setShowRevertButtons] = useState(false)
    const fileNameRef = useRef('')
    const playPartialRecording = async (receivedChunks) => {
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
                    setBlobUrl(newBlobUrl)
                    blobRef.current = newBlob
                    setBlob(newBlob)
                    setLoadingVideo(false)
                    // Revoke old URL to prevent memory leaks
                    if (url.current) {
                        URL.revokeObjectURL(url.current);
                    }
                    url.current = newBlobUrl;
                    return { newBlob, newBlobUrl }
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
            async function async(message) {
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
                            playPartialRecording(receivedChunks);
                        }

                        if (message.isLastChunk) {
                            console.log("All chunks received. Reassembling...");

                            const { newBlob, newBlobUrl } = await playPartialRecording(receivedChunks); // Play the complete recording
                            sendPostMessage({ type: "fixMetadata", blob: newBlob })
                            // setOriginalVideo({
                            //     blob: newBlob,
                            //     url: URL.createObjectURL(newBlob)
                            // })
                        }
                    }
                        break;
                }
            }
        )
    }

    const updateCursorPosition = (currentTime) => {
        if (!customCursorRef.current) return;
        // Get the parent container's width (where the waveform is rendered)
        const containerRect = customCursorRef.current.parentElement.getBoundingClientRect();
        const containerWidth = containerRect.width;

        const position = (currentTime / duration) * containerWidth;
        customCursorRef.current.style.left = `${position}px`;
    };

    const addToHistory = (newState) => {
        // Add the current state to history before applying new changes
        console.log("newStatenewStatenewState", newState)
        const newHistory = [...history, {
            trimState: { ...trimState },
            blob: blob,
            blobUrl: blobUrl,
            isAuphonicMode: isAuphonicUiMode,
            auphonicBlob: newState.auphonicBlob,
            originalAudioBlob: newState?.originalAudioBlob,
            showRevertButton: showRevertButton
        }];
        setHistory(newHistory);

        // Clear redo history since we're creating a new branch
        setRedoHistory([]);
    }

    const sendPostMessage = (message) => {
        window.parent.postMessage(message, "*");
    }

    const getPresets = async () => {
        try {
            const response = await fetch(`${auphonicUrl}/presets.json`, {
                method: 'GET',
                headers: AUTH_HEADER,
            });
            const { data } = await response.json();
            return data
        } catch (error) {
            console.error("Error fetching presets:", error);
            return [];
        }
    };


    useEffect(() => {
        document.body.style.margin = "0px";
        document.body.style.padding = "0px";
        sendPostMessage({ type: "load-ffmpeg" });
        // window.onbeforeunload = function () {
        //     return true;
        // };
    }, [])

    useEffect(() => {
        window.addEventListener("message", async (event) => {
            const message = event.data;
            if (message.type === "updated-blob") {
                if (message?.isEdit) {
                    setShowRevertButtons(false)
                    console.log("switchModeAudios.current", switchModeAudios.current)
                    if (switchModeAudios.current.originalAudio) {
                        console.log("originalAudio send", message)
                        const messageTobeSent = {
                            type: "cut-original-audio",
                            blob: switchModeAudios.current.originalAudio,
                            startTime: switchModeAudios.current.trimState.startTime,
                            endTime: switchModeAudios.current.trimState.endTime,
                            cut: message.cut,
                            duration: switchModeAudios.current.trimState.duration,
                            encode: false,
                        };
                        sendPostMessage(messageTobeSent);
                    }
                    setIsAuphonicUiMode(false)
                }
            }

            if (message.type === 'updated-original-blob') {
                console.log("updated-original-blob called!!", switchModeAudios.current)
                switchModeAudios.current.originalAudio = message.blob
                if (switchModeAudios.current.auphonicAudio) {
                    console.log("auphonicAudio send")
                    const messageTobeSent = {
                        type: "cut-auphonic-audio",
                        blob: switchModeAudios.current.auphonicAudio,
                        startTime: switchModeAudios.current.trimState.startTime,
                        endTime: switchModeAudios.current.trimState.endTime,
                        cut: message.cut,
                        duration: switchModeAudios.current.trimState.duration,
                        encode: false,
                    };
                    sendPostMessage(messageTobeSent);
                }
            }

            if (message.type === 'updated-auphonic-blob') {
                console.log("Edited Auphonic Blob", message)
            }

            if (message.type === 'extracted-audio-blob') {
                setConfirmSendToAuphonic(false)
                chrome.storage.local.get(['advanceAuphonicSettings'], async result => {
                    let sendData;
                    if (result?.advanceAuphonicSettings && result?.advanceAuphonicSettings?.trackCutting) {
                        sendData = result?.advanceAuphonicSettings
                    } else {
                        sendData = defaultAdvanceAuphonicState
                    }
                    try {
                        switchModeAudios.current.originalAudio = message.blob;
                        const file = await onSubmitAdvanceAuphonic(sendData, message.blob, setIspublishing, uuidRef, setUuid, fileNameRef)
                        switchModeAudios.current.auphonicAudio = file
                        console.log(blobRef.current, ":RecoievedFile", file)
                        sendPostMessage({ type: "replace-videos-audio", videoBlob: blobRef.current, audioBlob: file, auphonicMode: true, auphonicBlob: file, originalAudioBlob: message.blob })
                    } catch (error) {
                        console.log("Error Occured:", error)
                    }
                })
            }

            if (message.type === 'auphonic-merged-video') {
                console.log("auphonic-merged-video", message)
                const videoP = document.getElementById('check-video') as HTMLVideoElement
                videoP.src = URL.createObjectURL(message.blob);
                videoP.play()
            }
        })
    }, [])

    useLayoutEffect(() => {
        window.addEventListener("message", async (event) => {
            const message = event.data;
            if (message.type === "updated-original-blob") {
                switchModeAudios.current.originalAudio = message.blob
            }
            if (message.type === "updated-auphonic-blob") {
                switchModeAudios.current.auphonicAudio = message.blob
            }
            if (message.type === "updated-blob") {
                console.log("Received updated blob:", message.blob);
                // Update the blob and blobUrl for the preview
                const newBlobUrl = URL.createObjectURL(message.blob);

                if (message.addToHistory) {
                    if (message.auphonicMode) {
                        console.log("YES IT COMES HERE!!!!", message)
                        setIsAuphonicUiMode(true)
                        addToHistory({
                            trimState: { ...trimState },
                            blob: blob,
                            blobUrl: blobUrl,
                            isAuphonicMode: isAuphonicUiMode,
                            auphonicBlob: message.auphonicBlob,
                            originalAudioBlob: message.originalAudioBlob
                        });
                    } else {
                        addToHistory({
                            trimState: { ...trimState },
                            blob: blob,
                            blobUrl: blobUrl,
                            isAuphonicMode: isAuphonicUiMode
                        });
                    }
                   
                }

                if (message.isMergedTrack) {
                    console.log("Is Merged Tracked!!")
                    setShowRevertButtons(true)
                    // setIsAuphonicUiMode(true)
                }

               

                if (message.fixMetadata) {
                    setIsVideoEncoding(false)
                    setOriginalVideo({
                        blob: message.blob,
                        url: URL.createObjectURL(message.blob)
                    })
                }

                setBlobUrl(newBlobUrl)
                setBlob(message.blob)
                blobRef.current = message.blob
                setTrimState(prev => ({
                    ...prev,
                    start: 0,
                    end: 1,
                    startTime: 0,
                    endTime: prev.duration,
                    dragInteracted: false
                }));
                setIsFfmpegRunning(false)
                if (waveSurferRef.current) {
                    waveSurferRef.current.seekTo(0);
                }
                // setBlob(message.blob);
                // setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }
            if (message.type === "ffmpeg-loaded") {
                setIsFfmpegLoaded(true)
                console.log("ffmpeg-loaded Call from Demo!!")
            }
            if (message.type === "ffmpeg-load-error") {
                console.log("ffmpeg-load-error==>", message)
                setIsFfmpegLoaded(true)
                setFfmpegLoadError(true)
            }
        });

        onMountListeners()
    }, [history, trimState])


    const changeMode = () => {
        setIsEditMode(prev => !prev)
        // sendPostMessage({ type: "SEND_FROM_PREVIEW", blob: blob })
    }

    const handleCancelEditing = () => {
        // setIsEditMode(false)
        // console.log("originalVideooriginalVideo", originalVideo)
        const newBlobUrl = URL.createObjectURL(originalVideo?.blob);
        // setBlob(originalVideo?.blob);
        setBlobUrl(newBlobUrl);
        setIsEditMode(false)
        setBlob(originalVideo.blob)
        blobRef.current = originalVideo.blob
        setIsAuphonicUiMode(false)
        setUuid(null)
        uuidRef.current = null
        fileNameRef.current = ''
        setTrimState({
            start: 0,
            end: 1,
            dragInteracted: false,
            startTime: 0,
            endTime: 0,
            duration: 0
        })
        setHistory([])
        setAuphonicVideoUrlPreview('')

        setRedoHistory([])
        if (url.current) {
            URL.revokeObjectURL(url.current);
        }
        url.current = newBlobUrl;
        setDuration(originalDuration.current)
        // if(audioRef.current){
        //     // console.log("audioRef.current", url.current)
        //     audioRef.current.src = newBlobUrl;
        // }
    }

    const handleUndo = () => {
        if (history.length > 0) {
            // Get the last state from history
            const lastState = history[history.length - 1];
            console.log("lastStatelastState", lastState)
            // Save current state to redo history
            const currentState = {
                trimState: { ...trimState },
                blob: blob,
                blobUrl: blobUrl,
                isAuphonicMode: isAuphonicUiMode,
                showRevertButton: showRevertButton,
                auphonicBlob: lastState?.auphonicBlob,
                originalAudioBlob: lastState?.originalAudioBlob
            };
            setRedoHistory([...redoHistory, currentState]);

            // if(lastState?.auphonicBlob) {
            //     setShowRevertButtons(true)
            // }

            // Restore the previous state
            if (lastState.blob) {
                const newBlobUrl = URL.createObjectURL(lastState.blob);
                setBlob(lastState.blob);
                blobRef.current = lastState.blob
                setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTrimState(lastState.trimState);
            setIsAuphonicUiMode(lastState.isAuphonicMode);

            // Remove the last state from history
            setHistory(history.slice(0, -1));
        }
    }

    const handleRedo = () => {
        if (redoHistory.length > 0) {
            // Get the last state from redo history
            const redoState = redoHistory[redoHistory.length - 1];
            console.log("redoState", redoState)
            // Save current state to history
            const currentState = {
                trimState: { ...trimState },
                blob: blob,
                blobUrl: blobUrl,
                isAuphonicMode: isAuphonicUiMode,
                showRevertButton: showRevertButton,
                auphonicBlob: redoState?.auphonicBlob,
                originalAudioBlob: redoState?.originalAudioBlob
            };
            setHistory([...history, currentState]);

            // if(redoState?.auphonicBlob) {
            //     setShowRevertButtons(true)
            // }
            // Restore the redo state
            if (redoState.blob) {
                const newBlobUrl = URL.createObjectURL(redoState.blob);
                setBlob(redoState.blob);
                blobRef.current = redoState.blob
                setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTrimState(redoState.trimState);
            setIsAuphonicUiMode(redoState.isAuphonicMode);

            // Remove the used redo state
            setRedoHistory(redoHistory.slice(0, -1));
        }
    };

    const showAuphonicPreview = (url) => {
        setAuphonicVideoUrlPreview(url)
    }


    function getDynamicTimestamp() {
        const now = new Date();

        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${day}${month}${year}${hours}${minutes}${seconds}`;
    }

    const startAuphonicAudioProcessing = () => {
        sendPostMessage({ type: 'extract-audio', blob: blob })
    }

    const handleSwitch = () => {
        // addToHistory({
        //     trimState: { ...trimState },
        //     blob: blob,
        //     blobUrl: blobUrl,
        //     isAuphonicMode: isAuphonicUiMode
        // })
        // if()
        // sendPostMessage({ type: "replace-videos-audio", videoBlob: blob, audioBlob: file, auphonicMode: true })
        console.log("LastHistory", history[history.length - 1])
        const lastHistoryAudioBlobData = history[history.length - 1]
        // return;
        if (isAuphonicUiMode) {
            sendPostMessage({ type: "replace-videos-audio", videoBlob: blob, audioBlob: lastHistoryAudioBlobData?.originalAudioBlob, auphonicMode: false, isFromSwitch: true })
        } else {
            sendPostMessage({ type: "replace-videos-audio", videoBlob: blob, audioBlob: lastHistoryAudioBlobData?.auphonicBlob, auphonicMode: false, isFromSwitch: true })
        }
        setIsAuphonicUiMode(prev => !prev)

    }

    const value = {
        playPartialRecording,
        blobUrl,
        setBlobUrl,
        loadingVideo,
        setLoadingVideo,
        blob,
        setBlob,
        trimState,
        setTrimState,
        history,
        setHistory,
        redoHistory,
        setRedoHistory,
        waveSurferRef,
        originalVideo,
        addToHistory,
        audioRef,
        handleCancelEditing,
        changeMode,
        isEditMode,
        handleUndo,
        handleRedo,
        plyrRef,
        videoTime,
        setVideoTime,
        customCursorRef,
        duration,
        setDuration,
        updateCursorPosition,
        isFfmpegLoaded,
        ffmpegLoadError,
        setIsFfmpegRunning,
        ffmpegRunning,
        isPublishing,
        getPresets,
        originalDuration,
        videoSource,
        setVideoSource,
        getDynamicTimestamp,
        showAuphonicPreview,
        auphonicPlyrRef,
        auphonicVideoUrlPreview,
        isVideoEndcoding,
        audioF,
        showAuphonicAdvanceForm,
        setShowAuphonicAdvanceForm,
        confirmSendToAuphonic,
        setConfirmSendToAuphonic,
        startAuphonicAudioProcessing,
        uuidState,
        handleSwitch,
        isAuphonicUiMode,
        switchModeAudios,
        showRevertButton
    };

    return (
        <PreviewContext.Provider value={value}>
            {children}
        </PreviewContext.Provider>
    );
}

export function usePreview() {
    const context = useContext(PreviewContext);
    if (!context) {
        throw new Error('usePreview must be used within a PreviewProvider');
    }
    return context;
}
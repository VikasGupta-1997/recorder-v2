import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import onSubmitAdvanceAuphonic from '~utils/auphonicProduction';
import { defaultAdvanceAuphonicState } from '~utils/constants';

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
    const customCursorRef = useRef(null);

    const [blobUrl, setBlobUrl] = useState(null)
    const [originalVideo, setOriginalVideo] = useState({
        blob: new Blob(), url: ''
    })
    const [isVideoEndcoding, setIsVideoEncoding] = useState(true)
    const originalDuration = useRef(0)
    const plyrRef = useRef(null);

    const [blob, setBlob] = useState(null)
    const blobRef = useRef(null)
    const url = useRef('')
    const auphonicPlyrRef = useRef(null)
    const hasAudio = useRef(null);
    const durationTillNow = useRef(0)

    const [loadingVideo, setLoadingVideo] = useState(true)
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
    const [publishingUpload, setPublishingUpload] = useState(false)
    const [videoSource, setVideoSource] = useState(null);
    const [auphonicVideoUrlPreview, setAuphonicVideoUrlPreview] = useState('')
    const [isAuphonicUiMode, setIsAuphonicUiMode] = useState(false)
    const [cutDataState, setCutDataState] = useState([])
    const [auphonicProcessingError, setAuphonicProcessingError] = useState(null)
    const [confirmPublish, setConfirmPublish] = useState(false)
    const [uploadStatus, setUploadStatus] = useState(null)
    const uploadProgressRef = useRef(null)
    const progressStrokeWidth = useRef(null)
    const [uploadError, setUploadError] = useState(null)
    const latestAuphonicDataRef = useRef(null)
    const showConfirmation = useRef(true)
    const currentUniqid = useRef(null)
    const undoRedoClick = useRef(null)
    const auphonicAlgorithm = useRef(null)
    const controllersRef = useRef([]); // This will hold the AbortController for each chunk
    let isPausedref = useRef(false); // Flag to track if upload is paused
    let currentPartIndexRef = useRef(0);
    let totalUploadedRef = useRef(0);
    let lastUpdateTimeRef = useRef(0);
    let ETagRef = useRef([]);
    const tabsInfo = useRef({ tabId: null, tabIds: null })
    const partsUrlsRef = useRef([])
    const keyRef = useRef(null)
    const userDetailRef = useRef(null)
    const uploadIdRef = useRef(null)
    const newBlobRef = useRef(null)
    const selectedProjectRef = useRef(null)
    const [publishedData, setPublishedData] = useState(null)
    const switchModeAudios = useRef({
        auphonicAudio: null,
        originalAudio: null,
        trimState: {
            startTime: 0,
            endTime: 0,
            duration: 0,
        }
    })
    const isAuphonicSubmitted = useRef(false)
    const stoppedUpload = useRef(false)
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
            // const base64Data = receivedChunks.filter(Boolean).join('');
            const validChunks = receivedChunks.filter(Boolean);
            // if (!base64Data) {
            //     console.warn('No data available to play');
            //     return;
            // }
            if (validChunks.length === 0) {
                console.warn('No chunks available to play');
                return null; // Explicitly return null if no chunks are available
            }

            // Combine all chunks into a single Blob
        const newBlob = new Blob(validChunks, { type: "video/webm; codecs=vp8, opus" });

        // Create a Blob URL
        const newBlobUrl = URL.createObjectURL(newBlob);

        // Update states or references for playback
        setBlobUrl(newBlobUrl);
        blobRef.current = newBlob;
        setBlob(newBlob);
        setLoadingVideo(false);

        // Revoke the previous URL to prevent memory leaks
        if (url.current) {
            URL.revokeObjectURL(url.current);
        }
        url.current = newBlobUrl;

        console.log("Partial recording ready for playback");
        return { newBlob, newBlobUrl };
            // Check if the data is a data URL
            // if (base64Data.startsWith('data:')) {
            //     try {
            //         const response = await fetch(base64Data);
            //         // console.log("response1212", response)
            //         if (!response.ok) {
            //             throw new Error(`HTTP error! status: ${response.status}`);
            //         }
            //         const recievedBlob = await response.blob();
            //         const newBlob = new Blob([recievedBlob], {
            //             type: "video/webm; codecs=vp8, opus",
            //         });
            //         // console.log("newBlob1121", newBlob)
            //         const newBlobUrl = URL.createObjectURL(newBlob);
            //         // console.log("newBlobUrl11221", newBlobUrl)
            //         setBlobUrl(newBlobUrl)
            //         blobRef.current = newBlob
            //         setBlob(newBlob)
            //         setLoadingVideo(false)
            //         // Revoke old URL to prevent memory leaks
            //         if (url.current) {
            //             URL.revokeObjectURL(url.current);
            //         }
            //         url.current = newBlobUrl;
            //         return { newBlob, newBlobUrl }
            //     } catch (fetchError) {
            //         console.error('Error fetching or processing blob:', fetchError);
            //         // Handle the error appropriately, maybe set an error state
            //     }
            // } else {
            //     console.warn('Invalid data format - expected data URL');
            // }
        } catch (error) {
            console.error('Error in playPartialRecording:', error);
            // Handle the error appropriately, maybe set an error state
        }
    };

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            async function async(message) {
                console.log("OonMountListenersonMountListenersn", message)
                switch (message.type) {
                    case "PREVIEW_TAB_INFO_PREVIEW": {
                        console.log("Message1===>", message)
                        tabsInfo.current = { tabId: message.tabId, tabIds: message.tabIds }
                    }
                        break;
                    case "DELETE_UPLOAD": {
                        // handleDeleteUpload()
                        stoppedUpload.current = true
                        console.log("In Delete====>", xhrRef.current)
                        if(xhrRef.current) {
                            xhrRef.current.abort()
                        }
                        setIspublishing(false)
                        setUploadStatus(false)
                        setPublishingUpload(false)
                        resetUploadRefs()
                    }
                    break;
                    case "PAUSE_UPLOAD": {
                        console.log("Pause upload here!")
                        handlePauseUpload()
                    }
                        break;
                    case "RESUME_UPLOAD": {
                        console.log("resume upload here!")
                        handleResumeUpload()
                    }
                        break;
                    case "RECORDING_CHUNK_PREVIEW": {
                        receivedChunks[message.index] = message.data;
                        const uint8Array = new Uint8Array(message.data);
                        const blobChunk = new Blob([uint8Array], { type: "video/webm" });
                        receivedChunks[message.index] = blobChunk;
                    
                        // Try to start playing the video when enough data is received
                        if (!isPlaying && receivedChunks.length >= 2) { // Assuming 5 chunks are sufficient to start
                            isPlaying = true;
                            playPartialRecording(receivedChunks);
                        }

                        if (message.isLastChunk) {
                            console.log("All chunks received. Reassembling...");
                            const { newBlob, newBlobUrl } = await playPartialRecording(receivedChunks); // Play the complete recording
                            sendPostMessage({ type: "fixMetadata", blob: newBlob })
                        }
                    }
                        break;
                }
            }
        )
    }

    const updateCursorPosition = (currentTime) => {
        if (!customCursorRef.current || !duration) return;
        const containerRect = customCursorRef.current.parentElement.getBoundingClientRect();
        const containerWidth = containerRect.width;

        // Ensure currentTime doesn't exceed duration
        const normalizedTime = Math.min(currentTime, duration);
        const position = (normalizedTime / duration) * containerWidth;

        // Ensure position stays within container bounds
        const boundedPosition = Math.max(0, Math.min(position, containerWidth));
        customCursorRef.current.style.left = `${boundedPosition}px`;
    };

    const addToHistory = (newState) => {
        // Add the current state to history before applying new changes
        // console.log(currentUniqid.current, "newStatenewStatenewState", newState)
        // if(newState?.uniqid){
        //     setHistory(prev => prev.map(p => {
        //         if(p.uniqid === newState.uniqid && !!p.auphonicBlob){
        //             console.log("PP", p)
        //             return {
        //                 ...p
        //             }
        //         }
        //         return {...p}
        //     }))
        // } else {
        const newHistory = [...history, {
            trimState: { ...trimState },
            blob: blob,
            blobUrl: blobUrl,
            isAuphonicMode: isAuphonicUiMode,
            auphonicBlob: newState.auphonicBlob,
            originalAudioBlob: newState?.originalAudioBlob,
            showRevertButton: showRevertButton,
            uniqid: newState?.uniqid || currentUniqid.current
        }];
        setHistory(newHistory);

        // Clear redo history since we're creating a new branch
        setRedoHistory([]);
        // }
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
        if (navigator.platform.indexOf('Mac') !== -1) {
            document.body.classList.add('mac');
        } else {
            document.body.classList.add('windows');
        }
        sendPostMessage({ type: "load-ffmpeg" });
        onMountListeners()
        window.onbeforeunload = async function () {
        await chrome.storage.local.set({"showUploadStatus": false})
            return true;
        };
    }, [])

    const latestAuphonicData = useMemo(() => {
        if (!!cutDataState?.length) {
            const lastHistoryData = history[history.length - 1];
            // console.log(cutDataState, "lastHistoryDatalastHistoryData", lastHistoryData)
            const reprocessState = cutDataState?.find(cut => cut.id === lastHistoryData?.uniqid)
            latestAuphonicDataRef.current = reprocessState
            return reprocessState
        }
        return null
    }, [history, cutDataState])

    // console.log("lReffff", latestAuphonicData)

    useEffect(() => {
        window.addEventListener("message", async (event) => {
            const message = event.data;
            if (message.type === "download-blob-file") {
                downloadFile(message.blob)
            }
            if (message.type === "updated-blob") {
                if (message.isMergedTrack) {
                    if (message?.uuid) {
                        // console.log("GOT HERE!!")
                        if (!!!latestAuphonicDataRef?.current?.auphonicBlob) {
                            // console.log("HERE!!!!")
                            setCutDataState(prev => [...prev, {
                                id: message.uniqid,
                                auphonicBlob: message.auphonicBlob,
                                originalAudioBlob: message.originalAudioBlob,
                                uuid: message.uuid,
                                fileName: message.fileName
                            }])
                        }
                    }
                    // setIsAuphonicUiMode(true)
                }

                if (message?.isEdit) {
                    const window10 = navigator.userAgent.match(/Windows NT 10.0/)
                    if (window10 && hasAudio.current === 'false') {
                        const video = document.createElement("video");
                        video.preload = "metadata";
                        video.onloadedmetadata = async () => {
                            console.log("video.durationvideo.duration", video.duration)
                            setTimeout(() => {
                                setTrimState(prev => ({ ...prev, endTime: video.duration }))
                            }, 800)
                            URL.revokeObjectURL(video.src);
                            video.remove();
                        };
                        video.src = URL.createObjectURL(message.blob);
                    }
                    setShowRevertButtons(false)
                    // if(!!!latestAuphonicDataRef?.current?.auphonicBlob){
                    setCutDataState(prev => [...prev, {
                        id: message.uniqid,
                        auphonicBlob: null,
                        originalAudioBlob: null,
                        uuid: null,
                        fileName: null
                    }])
                    // }
                    // console.log("switchModeAudios.current", switchModeAudios.current)
                    if (switchModeAudios.current.originalAudio) {
                        // console.log("originalAudio send", message)
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
                // console.log("updated-original-blob called!!", switchModeAudios.current)
                switchModeAudios.current.originalAudio = message.blob
                if (switchModeAudios.current.auphonicAudio) {
                    // console.log("auphonicAudio send")
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
                // console.log("Edited Auphonic Blob", message)
            }

            if (message.type === 'extracted-audio-blob') {
                // setConfirmSendToAuphonic(false)
                chrome.storage.local.get(['advanceAuphonicSettings'], async result => {
                    let sendData;
                    console.log("resultadvanceAuphonicSettings=>", result)
                    // if (result?.advanceAuphonicSettings && result?.advanceAuphonicSettings?.trackCutting) {
                    //     console.log("In Advance Method Mode !!")
                    //     sendData = result?.advanceAuphonicSettings
                    // } else {
                    //     console.log("In Default Method Mode !!")
                    //     sendData = defaultAdvanceAuphonicState
                    // }
                    console.log("auphonicAlgorithm====>", auphonicAlgorithm.current)

                    try {
                        if (auphonicAlgorithm.current) {
                            sendData = auphonicAlgorithm.current
                        } else {
                            sendData = defaultAdvanceAuphonicState
                        }
                        console.log("sendDatasendData==>", sendData)
                        switchModeAudios.current.originalAudio = message.blob;
                        // console.log(latestAuphonicDataRef.current, "latestAuphonicDatalatestAuphonicData 318", latestAuphonicData)
                        // setConfirmSendToAuphonic(false)
                        const { file, uuid, fileName } = await onSubmitAdvanceAuphonic(sendData, message.blob, setIspublishing, uuidRef, setUuid, fileNameRef, isAuphonicSubmitted, switchModeAudios.current, latestAuphonicDataRef.current, toast)
                        switchModeAudios.current.auphonicAudio = file
                        // console.log(blobRef.current, ":RecoievedFile", file)
                        const sendUniqId = latestAuphonicDataRef.current?.uuid ? latestAuphonicDataRef.current?.id : null
                        const isFromSwitch = latestAuphonicDataRef.current?.uuid ? false : true
                        sendPostMessage({ type: "replace-videos-audio", isFromSwitch: isFromSwitch, fileName: fileName, uniqid: sendUniqId, uuid: uuid, videoBlob: blobRef.current, audioBlob: file, auphonicMode: true, auphonicBlob: file, originalAudioBlob: message.blob })
                    } catch (error) {
                        // console.log("Error Occured:", error)
                        setAuphonicProcessingError(error)
                        setIspublishing(false)
                    }
                })
            }

            if (message.type === 'auphonic-merged-video') {
                // console.log("auphonic-merged-video", message)
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
                // console.log("Received updated blob:", message.blob);
                // Update the blob and blobUrl for the preview
                const newBlobUrl = URL.createObjectURL(message.blob);


                if (message.addToHistory) {
                    const historyData = {
                        trimState: { ...trimState },
                        blob: blob,
                        blobUrl: blobUrl,
                        isAuphonicMode: isAuphonicUiMode,
                    }

                    if (message.isEdit) {
                        currentUniqid.current = message.uniqid
                        historyData["uniqid"] = message.uniqid
                    }

                    if (message.isMergedTrack) {
                        setShowRevertButtons(true)
                        // if(!!!latestAuphonicDataRef?.current?.auphonicBlob){
                        // console.log("HERE I COMEE!!")
                        currentUniqid.current = message.uniqid
                        historyData["uniqid"] = message.uniqid
                        // }
                        // setIsAuphonicUiMode(true)
                    }

                    if (message.auphonicMode) {
                        // console.log("YES IT COMES HERE!!!!", message)
                        setIsAuphonicUiMode(true)
                        addToHistory({
                            ...historyData,
                            auphonicBlob: message.auphonicBlob,
                            originalAudioBlob: message.originalAudioBlob
                        });
                    } else {
                        addToHistory(historyData);
                    }
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
                if (!message.isMergedTrack) {
                    setTrimState(prev => ({
                        ...prev,
                        start: 0,
                        end: 1,
                        startTime: 0,
                        endTime: prev.duration,
                        dragInteracted: false
                    }));
                    if (waveSurferRef.current) {
                        waveSurferRef.current.seekTo(0);
                    }
                }

                setIsFfmpegRunning(false)

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
                console.log("ffmpeg-loaded Call from Demo!!", message)
                hasAudio.current = message.hasAudio
                durationTillNow.current = +message.durationTillNow
                // chrome.runtime.sendMessage({ type: "START_UPLOAD_CHUNKS_BG" })
                chrome.runtime.sendMessage({ type: "START_RECIEVING_BLOB_OFFSCREEN" })
                chrome.runtime.sendMessage({ type: "PREVIEW_TAB_INFO" })
            }
            if (message.type === "ffmpeg-load-error") {
                // console.log("ffmpeg-load-error==>", message)
                setIsFfmpegLoaded(true)
                setFfmpegLoadError(true)
            }
        });
    }, [history, trimState])


    const changeMode = () => {
        setIsEditMode(prev => !prev)
        // sendPostMessage({ type: "SEND_FROM_PREVIEW", blob: blob })
    }

    const handleCancelEditing = () => {
        // setIsEditMode(false)
        // console.log("originalVideooriginalVideo", originalVideo)
        const newBlobUrl = URL.createObjectURL(originalVideo?.blob);
        undoRedoClick.current = null
        // setBlob(originalVideo?.blob);
        setBlobUrl(newBlobUrl);
        setIsEditMode(false)
        setBlob(originalVideo.blob)
        latestAuphonicDataRef.current = null
        blobRef.current = originalVideo.blob
        setIsAuphonicUiMode(false)
        setUuid(null)
        uuidRef.current = null
        currentUniqid.current = null;
        setCutDataState([])
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
        setShowRevertButtons(false)
        setRedoHistory([])
        if (url.current) {
            URL.revokeObjectURL(url.current);
        }
        url.current = newBlobUrl;
        setDuration(originalDuration.current)
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
                originalAudioBlob: lastState?.originalAudioBlob,
                uniqid: lastState?.uniqid || currentUniqid.current
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
            undoRedoClick.current = { type: "undo", lastTrimState: lastState.trimState }
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
                originalAudioBlob: redoState?.originalAudioBlob,
                uniqid: redoState?.uniqid || currentUniqid.current
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
            undoRedoClick.current = { type: "undo", lastTrimState: redoState.trimState }
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
        setConfirmSendToAuphonic(false)
        setIspublishing(true)
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
        console.log(latestAuphonicDataRef.current, "LastHistory", history[history.length - 1])
        // const lastHistoryAudioBlobData = history[history.length - 1]
        // return;
        if (isAuphonicUiMode) {
            sendPostMessage({ type: "replace-videos-audio", uniqid: latestAuphonicDataRef.current?.id, videoBlob: blob, audioBlob: latestAuphonicDataRef.current?.originalAudioBlob, auphonicMode: false, isFromSwitch: false })
        } else {
            sendPostMessage({ type: "replace-videos-audio", uniqid: latestAuphonicDataRef.current?.id, videoBlob: blob, audioBlob: latestAuphonicDataRef.current?.auphonicBlob, auphonicMode: false, isFromSwitch: false })
        }
        setIsAuphonicUiMode(prev => !prev)
    }

    const recordingName = useMemo(() => {
        return `Rec-${getDynamicTimestamp()}-desktop.mp4`
    }, [])


    const handlePauseUpload = () => {
        console.log("Pause the upload!@")
        isPausedref.current = true; // Set the flag to true
        if (controllersRef.current[currentPartIndexRef.current]) {
            controllersRef.current[currentPartIndexRef.current].abort(); // Abort the current chunk upload
            console.log("Upload p2aused at part", currentPartIndexRef.current + 1);
        }
        if(xhrRef.current){
            xhrRef.current.abort()
        }
    }

    const handleResumeUpload = () => {
        console.log("Resume the upload")
        isPausedref.current = false; // Set the flag to false
        console.log("Resuming upload...");
        // partUrls, uploadId, key, userDetails, blob, selectedProject
        handleUpload(partsUrlsRef.current, uploadIdRef.current, keyRef.current, userDetailRef.current, newBlobRef.current, selectedProjectRef.current);
    }

    const resetUploadRefs = () => {
        isPausedref.current = false
        controllersRef.current.forEach((controller) => controller.abort());
        currentPartIndexRef.current = 0
        totalUploadedRef.current = 0
        lastUpdateTimeRef.current = 0
        ETagRef.current = []
        partsUrlsRef.current = []
        keyRef.current = null
        // userDetailRef.current = null
        uploadIdRef.current = null
        // newBlobRef.current = null
        // selectedProjectRef.current = null
         // Optionally, reset the UI progress
        // if (progressStrokeWidth.current) {
        //     progressStrokeWidth.current.innerHTML = ''; // Clear progress SVG
        // }
        // if (uploadProgressRef.current) {
        //     uploadProgressRef.current.innerText = '0%'; // Reset text progress
        // }
    }

    const handleDeleteUpload = () => {
        // resetUploadRefs()
        console.log("Pause the upload Delete!")
        if (controllersRef.current[currentPartIndexRef.current]) {
            controllersRef.current[currentPartIndexRef.current].abort(); // Abort the current chunk upload
            console.log("Upload paused at part", currentPartIndexRef.current + 1);
        }
        console.log("xhrRef.current", xhrRef.current)
        if(xhrRef.current){
            console.log("Aborting!")
            xhrRef.current.abort()
        }
        console.log("controllersRef.current", controllersRef.current)
        controllersRef.current.forEach((controller) => controller.abort());
        controllersRef.current = []; // Clear controllers
        console.log("Pause the upload Delete2 !")
        isPausedref.current = true; // Set the flag to true
        setIspublishing(false)
        // setUploadStatus(null)
        // toast.error("Uploading stopped!!")
    }

    const xhrRef = useRef(null)

    const handleUpload = async (partUrls, uploadId, key, userDetails, newBlob, selectedProject) => {
        console.log("partUrlspartUrls", partUrls)
        const startTime = Date.now();
        const throttleInterval = 500
        setUploadStatus(true)
        for (let i = 0; i < partUrls.length; i++) {
            const { partNumber, uploadUrl, chunk } = partUrls[i];

            // Create a new AbortController for each chunk upload
            const controller = new AbortController();
            controllersRef.current.push(controller);
            // xhrRef.current.push(uploadUrl)
            // Check if upload is paused, if so, exit loop
            if (isPausedref.current) {
                currentPartIndexRef.current = i; // Save the current index for resuming
                console.log("Upload paused at part", partNumber);
                return; // Exit the loop if paused
            }

            if(stoppedUpload.current){
                currentPartIndexRef.current = i; // Save the current index for resuming
                console.log("Deleted upload api1@4", partNumber);
                stoppedUpload.current = false
                handleDeleteUpload()

                setIspublishing(false)
                // setPublishedData(saveData)
                // chrome.runtime.sendMessage({ type: "REFETCH_MEDIA_LIST", project: selectedProject, userDetails })
                resetUploadRefs()
                toast.error("Uploading Deleted !")

                return; // Exit the loop if paused
            }
            console.log("Current XHR", xhrRef.current)
            try {
                await new Promise(async (resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", uploadUrl, true);
                    xhrRef.current = xhr
                    // await chrome.storage.local.set({ "showUploadStatus": {
                    //     ...showUploadStatus,
                    //     [tabsInfo.current.tabId]: true,
                    //     tabIds: tabsInfo.current.tabIds
                    // }})
                    xhr.upload.onprogress = async (event) => {
                        if (event.lengthComputable) {
                            const chunkProgress = (event.loaded / chunk.size) * 100;
                            const overallProgress = Math.min(
                                100,
                                Math.round(((totalUploadedRef.current + event.loaded) / newBlob.size) * 100)
                            );
                            const elapsedTime = (Date.now() - startTime) / 1000; // Seconds
                            const uploadSpeed = (totalUploadedRef.current + event.loaded) / elapsedTime; // Bytes per second
                            const timeLeft = Math.round((newBlob.size - (totalUploadedRef.current + event.loaded)) / uploadSpeed); // Seconds
                            const uploadStatus = {
                                progress: overallProgress,
                                uploadSize: totalUploadedRef.current + event.loaded,
                                timeLeft: timeLeft,
                                totalSize: newBlob.size
                            }

                            const radius = 45; // Radius of the circle
                            const strokeWidth = 5; // Thickness of the circle
                            const normalizedRadius = radius - strokeWidth / 2;
                            const circumference = 2 * Math.PI * normalizedRadius;
                            const strokeDashoffset = circumference - (overallProgress / 100) * circumference;
                            // console.log("progressStrokeWidth==>", progressStrokeWidth)
                            // console.log("uploadProgressRef==>", uploadProgressRef)
                            if (progressStrokeWidth.current) {
                                progressStrokeWidth.current.innerHTML = `
                                    <svg
                                        height="${radius * 2}"
                                        width="${radius * 2}"
                                        style="transform: rotate(-90deg);"
                                    >
                                        <circle
                                            stroke="#CEEFFC"
                                            fill="transparent"
                                            stroke-width="${strokeWidth}"
                                            r="${normalizedRadius}"
                                            cx="${radius}"
                                            cy="${radius}"
                                        />
                                        <circle
                                            stroke="#0DABD8"
                                            fill="transparent"
                                            stroke-width="${strokeWidth}"
                                            stroke-dasharray="${circumference} ${circumference}"
                                            stroke-linecap="round"
                                            stroke-dashoffset="${strokeDashoffset}"
                                            r="${normalizedRadius}"
                                            cx="${radius}"
                                            cy="${radius}"
                                        />
                                    </svg>
                                `;
                            }

                            if (uploadProgressRef.current) {
                                uploadProgressRef.current.innerText = `${overallProgress}%`
                            }

                            const currentTime = Date.now();
                            if (currentTime - lastUpdateTimeRef.current > throttleInterval) {
                                // if(!stoppedUpload.current) {
                                    chrome.runtime.sendMessage({ type: "upload-status", 
                                        uploadStatus, 
                                        recordingName,
                                        tabId: tabsInfo.current.tabId,
                                        tabIds: tabsInfo.current.tabIds,
                                     });
                                     console.log("uploadStatus", uploadStatus)
                                      // Send the message to the popup
                                    lastUpdateTimeRef.current = currentTime;
                                // }
                            }
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const eTag = xhr.getResponseHeader("ETag");
                            ETagRef.current.push({ PartNumber: partNumber, ETag: eTag });
                            totalUploadedRef.current += chunk.size;
                            console.log("Here If is null")
                            xhrRef.current = null
                            partsUrlsRef.current = partsUrlsRef.current.filter(
                                (part) => part.partNumber !== partNumber
                            );
                            resolve(true);
                        } else {
                            reject(new Error(`Failed to upload part ${partNumber}`));
                        }
                    };

                    xhr.onerror = () => {
                        stoppedUpload.current = false
                        reject(new Error(`Network error on part ${partNumber}`));
                    };

                    // Set the abort signal for this request
                    (xhr as any).signal = controller.signal;
                    xhr.send(chunk);
                });

            } catch (error) {
                stoppedUpload.current = false
                console.error(`Error uploading part ${partNumber}:`, error);
                resetUploadRefs()
                break; // Optionally stop the process on error
            }
        }

        console.log("Upload completed");

        console.log("ETagETag", ETagRef.current)
        setUploadStatus(null)
        chrome.storage.local.get(['uploadsData'], async result => {
            if(result.uploadsData) {
                const newUp = {...result.uploadsData}
                delete newUp[tabsInfo.current.tabId]
                await chrome.storage.local.set({"uploadsData": newUp})                                    
            }
        })
        //showUploadStatusRef.current
        console.log("showUploadStatusRef.current",)
        // chrome.storage.local.get([''])
        chrome.storage.local.get(['uploadData'], async result => {
            const showUploadStatus = result?.uploadData || {}
            let newUpdates = { ...showUploadStatus }
            if (tabsInfo.current.tabId in newUpdates) {
                console.log("YEs Delete!!")
                delete newUpdates[tabsInfo.current.tabId]
            }
            console.log("newUpdates", newUpdates)
            if (!!newUpdates) {
                if (Object.keys(newUpdates)?.length === 0) {
                    newUpdates = null
                }
            }
            console.log("After newUpdates", newUpdates)
            await chrome.storage.local.set({
                "showUploadStatus": false,
                "uploadStatus": newUpdates
            })
        })

        console.log(ETagRef.current, "Check uploadedPartsuploadedParts")
        let completeData;
        try {
            const completeResponse = await fetch(
                `${process.env.PLASMO_PUBLIC_ADILO_API}/s3/multipart/${uploadId}/complete?key=${key}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${userDetails.access_token}`
                    },
                    body: JSON.stringify({
                        parts: ETagRef.current,
                    }),
                }
            );
    
            completeData = await completeResponse.json();
        } catch(error){
            throw new Error(error?.message || "Upload Failed please try again!")
        }
       
        console.log("Upload completed:", completeData);
        console.log("keykey=>", key)
        console.log("selectedProject=>", selectedProject)
        console.log("blob=>", newBlob)
        try {
            const savePayload = {
                video: {
                    location: completeData.location,
                },
                video_id: key.split('/')[0], // Pass your videoId
                project_id: selectedProject.id, // Pass your projectId
                fileType: newBlob.type || "video/mp4",
                drm_protection: "false",
                mediaType: "uploadVideos",
                filesize: newBlob.size,
            };
            console.log("savePayload==>", savePayload)
            const saveResponse = await fetch(
                `${process.env.PLASMO_PUBLIC_ADILO_API}/video-upload/s3-sign/save`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${userDetails.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(savePayload),
                }
            );
            const saveData = await saveResponse.json();
            console.log("Video saved successfully:", saveData);
            setIspublishing(false)
            setPublishedData(saveData)
            setPublishingUpload(false)
            stoppedUpload.current = false
            chrome.runtime.sendMessage({type: "REMOVE_FROM_UPLOAD_LIST", tabId: tabsInfo.current.tabId })
            chrome.runtime.sendMessage({ type: "REFETCH_MEDIA_LIST", project: selectedProject, userDetails })
            resetUploadRefs()
            toast.success("Recording succeccfully saved to your adilo account.")
        } catch(error){
            throw new Error(error?.message || "Upload Failed please try again!")
        }
    };

    const handlePublish = async () => {
        chrome.storage.local.get(['userInfo', 'selectedProject', 'uploadStatus'], async result => {
            console.log(blob, "result223", result)
            const userDetails = result.userInfo;
            const selectedProject = result.selectedProject
            selectedProjectRef.current = selectedProject
            // const chunk_size = 16242880;
            const chunk_size =  5 * 1024 * 1024;
            // Determine chunk size based on blob size
            console.log(chunk_size, "Echunk_sizehandlePublish====>", blob)
            // const chunk_size =  16 * 1024 * 1024;
            // const chunk_size = 1 * 1024 * 1024;
            const totalChunks = Math.ceil(blob.size / chunk_size);
            let uploadId;
            let key;
            const partUrls = [];
            let ETag = [];
            const startTime = Date.now();
            console.log(blob.name, "totalChunks==>", totalChunks)
            // return;
            setIspublishing(true)
            setConfirmPublish(false)
            setPublishingUpload(true)
            try {
                const formData = new FormData();
                formData.append("type", blob.type); // Update with actual type if dynamic
                formData.append("filename", recordingName); // Use actual file name
                formData.append("media_type", blob.type);
                formData.append("name", recordingName);
                formData.append("total_bytes", blob.size);
                formData.append("status", "undefined");
                const initResponse = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/s3/multipart`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${userDetails.access_token}`
                    },
                    body: formData,
                });
                const initData = await initResponse.json();
                console.log("initDatainitData=>", initData)
                console.log("Original Blob Type:", blob.type);
                if (initData?.uploadId) {
                    uploadId = initData.uploadId;
                    key = initData.key;
                    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
                        const start = (partNumber - 1) * chunk_size;
                        const end = Math.min(start + chunk_size, blob.size);
                        // console.log("chunkchunk", chunk)
                        // Request pre-signed URL for this part
                        const partResponse = await fetch(
                            `${process.env.PLASMO_PUBLIC_ADILO_API}/s3/multipart/${uploadId}/${partNumber}?key=${key}`, {
                            method: 'GET',
                            headers: {
                                "Authorization": `Bearer ${userDetails.access_token}`
                            }
                        }
                        );
                        const partData = await partResponse.json();

                        const uploadUrl = partData.url;
                        partUrls.push({
                            partNumber,
                            uploadUrl,
                            // chunk
                            chunk: blob.slice((partNumber - 1) * chunk_size, partNumber * chunk_size, "video/mp4")
                        });
                    }
                    console.log("Received pre-signed URLs for all parts", partUrls);
                    // Step 3: Upload  each chunk to S3
                    let totalUploaded = 0;
                    let lastUpdateTime = 0;
                    const throttleInterval = 500
                    if(stoppedUpload.current){
                        stoppedUpload.current = false
                    } else {
                        // setUploadStatus(true)
                    }
                    partsUrlsRef.current = partUrls
                    keyRef.current = key
                    userDetailRef.current = userDetails
                    uploadIdRef.current = uploadId
                    newBlobRef.current = blob
                    await handleUpload(partUrls, uploadId, key, userDetails, blob, selectedProject)
                    stoppedUpload.current = false
                }
            } catch (error) {
                await chrome.storage.local.set({ "showUploadStatus": false })
                setUploadError(true)
                toast.error("Publishing recording failed, Please contact to Adilo support.")
                setIspublishing(false)
                setPublishingUpload(false)
                setUploadStatus(null)
                resetUploadRefs()
                console.error("Error during upload:", error.message);
            }
        })
    }

    const downloadFile = blob => {
        const url = window.URL.createObjectURL(blob);
        chrome.downloads.download(
            {
                url: url,
                filename: recordingName,
            },
            () => {
                window.URL.revokeObjectURL(url);
            }
        );
    }

    const downloadBlob = () => {
        sendPostMessage({ type: "download-playable-file", blob: blob })
    };

    const isModalOpened = confirmSendToAuphonic || confirmPublish || auphonicProcessingError || uploadStatus || uploadError || showAuphonicAdvanceForm || isPublishing

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
        showAuphonicAdvanceForm,
        setShowAuphonicAdvanceForm,
        confirmSendToAuphonic,
        setConfirmSendToAuphonic,
        startAuphonicAudioProcessing,
        uuidState,
        handleSwitch,
        isAuphonicUiMode,
        switchModeAudios,
        showRevertButton,
        showConfirmation,
        auphonicProcessingError,
        setAuphonicProcessingError,
        cutDataState,
        hasAudio,
        auphonicAlgorithm,
        handlePublish,
        recordingName,
        confirmPublish,
        setConfirmPublish,
        uploadStatus,
        setUploadStatus,
        uploadProgressRef,
        progressStrokeWidth,
        uploadError,
        setUploadError,
        downloadBlob,
        publishedData,
        undoRedoClick,
        handlePauseUpload,
        handleResumeUpload,
        tabsInfo,
        publishingUpload,
        latestAuphonicDataRef,
        isModalOpened
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
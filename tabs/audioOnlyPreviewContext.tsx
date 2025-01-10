import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import onSubmitAdvanceAuphonic from '~utils/auphonicProduction';
import { defaultAdvanceAuphonicState } from '~utils/constants';

const PreviewContext = createContext<any>(undefined);

const receivedChunks = [];
let isPlaying = false;
const auphonicUrl = 'https://auphonic.com/api'
const AUPHONIC_USERNAME = 'vikasgupta';
const AUPHONIC_PASSWORD = 'Adilo@0987';
const AUTH_HEADER = {
    'Authorization': 'Basic ' + btoa(`${AUPHONIC_USERNAME}:${AUPHONIC_PASSWORD}`)
};

export function AudioOnlyPreviewProvider({ children }: { children: React.ReactNode }) {
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const audioRef = useRef(null);
    const auphonicAudioRef = useRef(null);
    const customCursorRef = useRef(null);
    const audioPlyrRef = useRef(null)
    const [audioSource, setAudioSource] = useState(null);
    const [auphonicAudioSource, setAuphonicAudioSource] = useState(null);
    const [blobUrl, setBlobUrl] = useState(null)
    const [originalVideo, setOriginalVideo] = useState({
        blob: new Blob(), url: ''
    })
    const originalDuration = useRef(0)
    const auphonicAlgorithm = useRef(null)
    const [isVideoEndcoding, setIsVideoEncoding] = useState(true)
    const [loadingVideo, setLoadingVideo] = useState(true)
    const [showAuphonicAdvanceForm, setShowAuphonicAdvanceForm] = useState(false)
    const [confirmSendToAuphonic, setConfirmSendToAuphonic] = useState(false)

    const plyrRef = useRef(null);
    const wrapAuphonicAudioRef = useRef(null)
    const normalAudioWrap = useRef(null)

    const [blob, setBlob] = useState(null)
    const blobRef = useRef(null)
    const url = useRef('')
    const [history, setHistory] = useState([])
    const [redoHistory, setRedoHistory] = useState([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [videoTime, setVideoTime] = useState(0)
    const [duration, setDuration] = useState(0);
    const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false)
    const [ffmpegLoadError, setFfmpegLoadError] = useState(false)
    const [ffmpegRunning, setIsFfmpegRunning] = useState(false)
    const [isPublishing, setIspublishing] = useState(false)
    const [isAuphonicUiMode, setIsAuphonicUiMode] = useState(false)
    const latestAuphonicDataRef = useRef(null)
    const [auphonicProcessingError, setAuphonicProcessingError] = useState(null)
    const [cutDataState, setCutDataState] = useState([])
    const [confirmPublish, setConfirmPublish] = useState(false)
    const [videoSource, setVideoSource] = useState(null);

    const currentConfirmation = useRef(null)
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
    const isAuphonicSubmitted = useRef(false)
    const [uuidState, setUuid] = useState(null)
    const [showRevertButton, setShowRevertButtons] = useState(false)
    const fileNameRef = useRef('')
    const [showAuphonicWrap, setShowAuphonicWrap] = useState(false)
    const currentUniqid = useRef(null)

    const setSource = (url) => {
        setAudioSource({
            type: "audio",
            sources: [
                {
                    src: url,
                    type: "audio/mpeg",
                },
            ],
        });
    }

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
                    setSource(newBlobUrl)
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
                            //     url: newBlobUrl
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
        if (blob) {
            console.log(audioRef.current, "New Blob Set!!", blob)
            const setUrl = URL.createObjectURL(blob);
            audioRef.current.src = setUrl;
        }
    }, [blob])

    // useEffect(() => {
    //     chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
    //         console.log("resultresult", result)
    //         sendPostMessage({ type: "IS_CONTENT_TYPE", isAudioOnly: result?.isAudioOnly })
    //         if (!result?.saving_in_indexdb) {
    //             // setVideoLoading(false)
    //         }
    //         if (result?.isAudioOnly) {
    //             if (audioRef.current) {
    //                 console.log("audioRef.current", url.current)
    //                 audioRef.current.src = url.current;
    //             }
    //         } else {
    //         }
    //     });
    // }, [blobUrl]);

    const latestAuphonicData = useMemo(() => {
        if (!!cutDataState?.length) {
            const lastHistoryData = history[history.length - 1];
            console.log(cutDataState, "lastHistoryDatalastHistoryData", lastHistoryData)
            const reprocessState = cutDataState?.find(cut => cut.id === lastHistoryData?.uniqid)
            latestAuphonicDataRef.current = reprocessState
            return reprocessState
        }
        return null
    }, [history, cutDataState])

    useEffect(() => {
        window.addEventListener("message", async (event) => {
            const message = event.data;
            if (message.type === "updated-blob") {
                if (message.isMergedTrack) {
                    if (message?.uuid) {
                        if (!!!latestAuphonicDataRef?.current?.auphonicBlob) {
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
                    setShowRevertButtons(false)
                    setCutDataState(prev => [...prev, {
                        id: message.uniqid,
                        auphonicBlob: null,
                        originalAudioBlob: null,
                        uuid: null,
                        fileName: null
                    }])
                    console.log("switchModeAudios.current", switchModeAudios.current)
                    setIsAuphonicUiMode(false)
                }
            }
        })
    }, [])

    useLayoutEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            if (message.type === "updated-blob") {
                console.log("Received updated blob:", message.blob);
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
                        console.log("Is Merged Tracked!!")
                        setShowRevertButtons(true)
                        currentUniqid.current = message.uniqid
                        historyData["uniqid"] = message.uniqid
                        // setIsAuphonicUiMode(true)
                    }

                    if (message.auphonicMode) {
                        console.log("YES IT COMES HERE!!!!", message)
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
                setBlobUrl(newBlobUrl)
                setSource(newBlobUrl)
                setBlob(message.blob)

                // if (message.isMergedTrack) {
                //     console.log("Is Merged Tracked!!")
                //     setShowRevertButtons(true)
                //     currentUniqid.current = message.uniqid
                //     historyData["uniqid"] = message.uniqid
                //     // setIsAuphonicUiMode(true)
                // }


                setIsFfmpegRunning(false)
                // setBlob(message.blob);
                // setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            if (message.fixMetadata) {
                setIsVideoEncoding(false)
                setOriginalVideo({
                    blob: message.blob,
                    url: URL.createObjectURL(message.blob)
                })
            }

            if (message.type === "ffmpeg-loaded") {
                setIsFfmpegLoaded(true)
                console.log("ffmpeg-loaded Call from Demo!!")
                chrome.runtime.sendMessage({ type: "START_UPLOAD_CHUNKS" })
            }
            if (message.type === "ffmpeg-load-error") {
                console.log("ffmpeg-load-error==>", message)
                setIsFfmpegLoaded(true)
                setFfmpegLoadError(true)
            }
        });

        onMountListeners()
    }, [history, trimState])

    const handleSwitch = () => {
        // addToHistory({
        //     trimState: { ...trimState },
        //     blob: blob,
        //     blobUrl: blobUrl,
        //     isAuphonicMode: isAuphonicUiMode
        // })
        // if()
        console.log("LastHistory", history[history.length - 1])
        const lastHistoryAudioBlobData = history[history.length - 1]
        // return;
        if (isAuphonicUiMode) {
            sendPostMessage({ type: "replace-videos-audio", uniqid: latestAuphonicDataRef.current?.id, audioBlob: latestAuphonicDataRef.current?.originalAudioBlob, auphonicMode: false, isFromSwitch: false })
        } else {
            sendPostMessage({ type: "replace-videos-audio", uniqid: latestAuphonicDataRef.current?.id, audioBlob: latestAuphonicDataRef.current?.auphonicBlob, auphonicMode: false, isFromSwitch: false })
        }
        setIsAuphonicUiMode(prev => !prev)

    }


    const changeMode = () => {
        console.log("MODE")
        setIsEditMode(prev => !prev)
        // sendPostMessage({ type: "SEND_FROM_PREVIEW", blob: blob })
    }

    const handleCancelEditing = () => {
        // setIsEditMode(false)
        // console.log("originalVideooriginalVideo", originalVideo)
        const newBlobUrl = URL.createObjectURL(originalVideo?.blob);
        // setBlob(originalVideo?.blob);
        setBlobUrl(newBlobUrl);
        setSource(newBlobUrl)
        setIsEditMode(false)
        setBlob(originalVideo.blob)
        setCutDataState([])
        latestAuphonicDataRef.current = null
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
        setShowRevertButtons(false)
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

    const recordingName = useMemo(() => {
        return `Rec-${getDynamicTimestamp()}-desktop.mp3`
    }, [])

    const handlePublish = async () => {
        chrome.storage.local.get(['userInfo', 'selectedProject'], async result => {
            console.log(blob, "result223", result)
            const userDetails = result.userInfo;
            const selectedProject = result.selectedProject
            const chunk_size = 16242880;

            console.log(chunk_size, "Echunk_sizehandlePublish====>", blob)
            // const chunk_size =  16 * 1024 * 1024;
            // const chunk_size = 1 * 1024 * 1024;
            const totalChunks = Math.ceil(blob.size / chunk_size);
            let uploadId;
            let key;
            const partUrls = [];
            let ETag = [];
            console.log(recordingName, "totalChunks==>", totalChunks)
            // return;
            setIspublishing(true)
            setConfirmPublish(false)
            try {
                const formData = new FormData();
                formData.append("type", blob.type); // Update with actual type if dynamic
                formData.append("filename", recordingName); // Use actual file name
                // formData.append("metadata", JSON.stringify({
                //     "type": blob.type,
                //     "filename": recordingName,
                //     "drm_protection": false,
                //     "duration": "0",
                //     "duration_formatted": "00:00:00",
                //     "projectId": selectedProject.id,
                //     "access_token": userDetails.access_token
                // })); // Add any metadata here
                formData.append("media_type", blob.type);
                formData.append("name", recordingName);
                formData.append("total_bytes", blob.size);
                formData.append("status", "undefined");
                console.log("FormData Contents:");
                for (const [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                }
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
                const promises = [];
                if (initData?.uploadId) {
                    uploadId = initData.uploadId;
                    key = initData.key;
                    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
                        const start = (partNumber - 1) * chunk_size;
                        const end = Math.min(start + chunk_size, blob.size);
                        const chunk = blob.slice(start, end, "video/mp4");
                        console.log("chunkchunk", chunk)
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
                        partUrls.push({ partNumber, uploadUrl, chunk });
                    }
                    console.log("Received pre-signed URLs for all parts", partUrls);
                    // Step 3: Upload each chunk to S3
                    const uploadPromises = [];
                    // for (let i = 0; i < partUrls.length; i++) {
                    //     const { partNumber, uploadUrl, chunk } = partUrls[i];
                    //     const uploadResponse = await fetch(uploadUrl, {
                    //         method: "PUT",
                    //         body: chunk
                    //     });

                    //     if (!uploadResponse.ok) {
                    //         throw new Error(`Failed to upload part ${partNumber}`);
                    //     }
                    //     const eTag = uploadResponse.headers.get('ETag');
                    //     ETag = eTag
                    //     console.log(`Uploaded part ${partNumber}, ETag: ${eTag}`);
                    // }
                    // Step 4: Complete Multipart Upload
                    for (let i = 0; i < partUrls.length; i++) {
                        const { partNumber, uploadUrl, chunk } = partUrls[i];

                        // Create a promise for each upload
                        const uploadPromise = fetch(uploadUrl, {
                            method: "PUT",
                            body: chunk
                        })
                            .then(uploadResponse => {
                                if (!uploadResponse.ok) {
                                    throw new Error(`Failed to upload part ${partNumber}`);
                                }
                                const eTag = uploadResponse.headers.get('ETag');
                                ETag.push({ PartNumber: partNumber, ETag: eTag })
                                console.log(`Uploaded part ${partNumber}, ETag: ${eTag}`);
                                return { PartNumber: partNumber, ETag: eTag }; // Return part number and ETag for further use
                            })
                            .catch(error => {
                                console.error(`Error uploading part ${partNumber}:`, error);
                                setIspublishing(false)
                                throw error; // Ensure errors propagate if needed
                            });

                        uploadPromises.push(uploadPromise); // Add the promise to the array
                    }

                    // Wait for all uploads to complete
                    const uploadedParts = await Promise.all(uploadPromises);
                    console.log(ETag, "Check uploadedPartsuploadedParts", uploadedParts)
                    const completeResponse = await fetch(
                        `${process.env.PLASMO_PUBLIC_ADILO_API}/s3/multipart/${uploadId}/complete?key=${key}`,
                        {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${userDetails.access_token}`
                            },
                            body: JSON.stringify({
                                parts: uploadedParts,
                            }),
                        }
                    );

                    const completeData = await completeResponse.json();
                    console.log("Upload completed:", completeData);
                    const savePayload = {
                        video: {
                            location: completeData.location,
                        },
                        video_id: key.split('/')[0], // Pass your videoId
                        project_id: selectedProject.id, // Pass your projectId
                        fileType: blob.type || "video/mp4",
                        drm_protection: "false",
                        mediaType: "uploadVideos",
                        filesize: blob.size,
                    };
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
                    toast.success("Recording succeccfully saved to your adilo account.")
                }
            } catch (error) {
                toast.error("Publishing recording failed, Please contact to Adilo support.")
                setIspublishing(false)
                console.error("Error during upload:", error.message);
            }
        })
    }

    const handleUndo = () => {
        if (history.length > 0) {
            // Get the last state from history
            const lastState = history[history.length - 1];

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

            // Restore the previous state
            if (lastState.blob) {
                const newBlobUrl = URL.createObjectURL(lastState.blob);
                setBlob(lastState.blob);
                setBlobUrl(newBlobUrl);
                blobRef.current = lastState.blob
                setSource(newBlobUrl)
                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTimeout(() => {
                setTrimState(lastState.trimState);
            }, 500)

            setIsAuphonicUiMode(lastState.isAuphonicMode);
            // Remove the last state from history
            setHistory(history.slice(0, -1));
        }
    }

    const handleRedo = () => {
        if (redoHistory.length > 0) {
            // Get the last state from redo history
            const redoState = redoHistory[redoHistory.length - 1];

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

            // Restore the redo state
            if (redoState.blob) {
                const newBlobUrl = URL.createObjectURL(redoState.blob);
                setBlob(redoState.blob);
                setBlobUrl(newBlobUrl);
                blobRef.current = redoState.blob
                setSource(newBlobUrl)
                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTimeout(() => {
                setTrimState(redoState.trimState);
            }, 500)
            setIsAuphonicUiMode(redoState.isAuphonicMode);
            // Remove the used redo state
            setRedoHistory(redoHistory.slice(0, -1));
        }
    };

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

    // useEffect(() => {
    //     if(showAuphonicWrap){
    //         console.log("auphonicAudioRef1212",auphonicAudioRef.current )
    //         auphonicAudioRef.current.src = "http://localhost:8080/stream?url=https://auphonic.com/api/download/audio-result/beS6vmTQNGqr6M4Yo5neaV/audio_1733314734721_5kzbwl0u.mp3"
    //     }
    // }, [showAuphonicWrap])

    const getAuphonicData = () => {
        setShowAuphonicWrap(true);
        setAuphonicAudioSource({
            type: "audio",
            sources: [
                {
                    src: "http://localhost:8080/stream?url=https://auphonic.com/api/download/audio-result/beS6vmTQNGqr6M4Yo5neaV/audio_1733314734721_5kzbwl0u.mp3",
                    type: "audio/mpeg",
                },
            ],
        })
    };

    const startAuphonicAudioProcessing = async () => {
        console.log("Blob===>", blob)

        setConfirmSendToAuphonic(false)
        chrome.storage.local.get(['advanceAuphonicSettings'], async result => {
            let sendData;
            // if (result?.advanceAuphonicSettings && result?.advanceAuphonicSettings?.trackCutting) {
            //     sendData = result?.advanceAuphonicSettings
            // } else {
            //     sendData = defaultAdvanceAuphonicState
            // }
            try {
                if (auphonicAlgorithm.current) {
                    sendData = auphonicAlgorithm.current
                } else {
                    sendData = defaultAdvanceAuphonicState
                }
                switchModeAudios.current.originalAudio = blob;
                const { file, uuid, fileName } = await onSubmitAdvanceAuphonic(sendData, blob, setIspublishing, uuidRef, setUuid, fileNameRef, isAuphonicSubmitted, switchModeAudios.current, latestAuphonicDataRef.current, toast)
                switchModeAudios.current.auphonicAudio = file
                console.log(blobRef.current, ":RecoievedFile", file)
                const sendUniqId = latestAuphonicDataRef.current?.uuid ? latestAuphonicDataRef.current?.id : null
                const isFromSwitch = latestAuphonicDataRef.current?.uuid ? false : true
                sendPostMessage({ type: "replace-videos-audio", isFromSwitch: isFromSwitch, fileName: fileName, uniqid: sendUniqId, uuid: uuid, audioBlob: file, auphonicMode: true, auphonicBlob: file, originalAudioBlob: blob })
            } catch (error) {
                console.log("Error Occured:", error)
                setAuphonicProcessingError(error)
            }
        })

        // sendPostMessage({ type: 'extract-audio', blob: blob })
    }

    useEffect(() => {
        if (confirmSendToAuphonic) {
            currentConfirmation.current = 'auphonicConfirmation'
        }
        if (confirmSendToAuphonic) {
            currentConfirmation.current = 'publishConfirmation'
        }
    }, [confirmSendToAuphonic, confirmSendToAuphonic])


    // const onSubmitAdvanceAuphonic = async data => {
    //     console.log("Data", data)
    //     setShowAuphonicAdvanceForm(false)
    //     setConfirmSendToAuphonic(true)
    // }

    const value = {
        playPartialRecording,
        blobUrl,
        setBlobUrl,
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
        getAuphonicData,
        auphonicAudioRef,
        wrapAuphonicAudioRef,
        normalAudioWrap,
        showAuphonicWrap,
        audioSource,
        setAudioSource,
        audioPlyrRef,
        auphonicAudioSource,
        loadingVideo,
        showAuphonicAdvanceForm,
        setShowAuphonicAdvanceForm,
        confirmSendToAuphonic,
        setConfirmSendToAuphonic,
        switchModeAudios,
        startAuphonicAudioProcessing,
        isVideoEndcoding,
        handleSwitch,
        showRevertButton,
        uuidState,
        isAuphonicUiMode,
        cutDataState,
        auphonicProcessingError,
        setAuphonicProcessingError,
        auphonicAlgorithm,
        handlePublish,
        recordingName,
        currentConfirmation,
        confirmPublish,
        setConfirmPublish
    };

    return (
        <PreviewContext.Provider value={value}>
            {children}
        </PreviewContext.Provider>
    );
}

export function useAudioOnlyPreview() {
    const context = useContext(PreviewContext);
    if (!context) {
        throw new Error('usePreview must be used within a AudioOnlyPreviewProvider');
    }
    return context;
}
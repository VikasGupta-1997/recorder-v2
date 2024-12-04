import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

const PreviewContext = createContext<any>(undefined);

const receivedChunks = [];
let isPlaying = false;

export function PreviewProvider({ children }: { children: React.ReactNode }) {
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const audioRef = useRef(null);
    const customCursorRef = useRef(null);

    const [blobUrl, setBlobUrl] = useState(null)
    const [originalVideo, setOriginalVideo] = useState({
        blob: new Blob(), url: ''
    })
    const [isAudio, setIsAudio] = useState('ideal')
    const plyrRef = useRef(null);

    const [loadingVideo, setLoadingVideo] = useState(true)
    const [blob, setBlob] = useState(null)
    const url = useRef('')
    const [history, setHistory] = useState([])
    const [redoHistory, setRedoHistory] = useState([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [videoTime, setVideoTime] = useState(0)
    const [duration, setDuration] = useState(0);
    const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false)
    const [ffmpegLoadError, setFfmpegLoadError] = useState(false)
    const [ffmpegRunning, setIsFfmpegRunning] = useState(false)
    const [trimState, setTrimState] = useState({
        start: 0,
        end: 1,
        dragInteracted: false,
        startTime: 0,
        endTime: 0,
        duration: 0
    });

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
                            setOriginalVideo({
                                blob: newBlob,
                                url: newBlobUrl
                            })
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
            blobUrl: blobUrl
        }];
        setHistory(newHistory);

        // Clear redo history since we're creating a new branch
        setRedoHistory([]);
    }

    const sendPostMessage = (message) => {
        window.parent.postMessage(message, "*");
    }

    useEffect(() => {
        sendPostMessage({ type: "load-ffmpeg" });
    }, [])

    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
            console.log("resultresult", result)
            sendPostMessage({ type: "IS_CONTENT_TYPE", isAudioOnly: result?.isAudioOnly })
            if (!result?.saving_in_indexdb) {
                // setVideoLoading(false)
            }
            if (result?.isAudioOnly) {
                setIsAudio('audio');
                if (audioRef.current) {
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
            const message = event.data;
            if (message.type === "updated-blob") {
                console.log("Received updated blob:", message.blob);
                // Update the blob and blobUrl for the preview
                const newBlobUrl = URL.createObjectURL(message.blob);
                addToHistory({
                    trimState: { ...trimState },
                    blob: blob,
                    blobUrl: blobUrl
                });
                setBlobUrl(newBlobUrl)
                setBlob(message.blob)



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
        setIsEditMode(false)
        setBlob(originalVideo.blob)
        setTrimState({
            start: 0,
            end: 1,
            dragInteracted: false,
            startTime: 0,
            endTime: 0,
            duration: 0
        })
        setHistory([])
        setRedoHistory([])
        if (url.current) {
            URL.revokeObjectURL(url.current);
        }
        url.current = newBlobUrl;
        // if(audioRef.current){
        //     // console.log("audioRef.current", url.current)
        //     audioRef.current.src = newBlobUrl;
        // }
    }

    const handleUndo = () => {
        if (history.length > 0) {
            // Get the last state from history
            const lastState = history[history.length - 1];

            // Save current state to redo history
            const currentState = {
                trimState: { ...trimState },
                blob: blob,
                blobUrl: blobUrl
            };
            setRedoHistory([...redoHistory, currentState]);

            // Restore the previous state
            if (lastState.blob) {
                const newBlobUrl = URL.createObjectURL(lastState.blob);
                setBlob(lastState.blob);
                setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTrimState(lastState.trimState);

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
                blobUrl: blobUrl
            };
            setHistory([...history, currentState]);

            // Restore the redo state
            if (redoState.blob) {
                const newBlobUrl = URL.createObjectURL(redoState.blob);
                setBlob(redoState.blob);
                setBlobUrl(newBlobUrl);

                // Cleanup old blob URL
                if (url.current) {
                    URL.revokeObjectURL(url.current);
                }
                url.current = newBlobUrl;
            }

            setTrimState(redoState.trimState);

            // Remove the used redo state
            setRedoHistory(redoHistory.slice(0, -1));
        }
    };

    const processAudioWithAuphonic = async (audioBlob, isAudio) => {
        const AUPHONIC_USERNAME = 'bigcommand';
        const AUPHONIC_PASSWORD = 'zbp@hty3gnb.AFB1hqc';
        const AUTH_HEADER = {
            'Authorization': 'Basic ' + btoa(`${AUPHONIC_USERNAME}:${AUPHONIC_PASSWORD}`)
        };

        try {
            console.log("processAudioWithAuphonic called with Blob:", audioBlob);

            // Step 1: Create a new production
            const formData = new FormData();
            const timestamp = Date.now(); // Get current timestamp in milliseconds
            const randomString = Math.random().toString(36).substring(2, 10);
            // Step 1: Create a new production
            const fileName = isAudio === 'audio' ? `audio_${timestamp}_${randomString}.mp3` : `video_${timestamp}_${randomString}.mov`
            formData.append('input_file', audioBlob, fileName);
            formData.append('preset', 'em7Cac7GkJzhH8yw7qDfWo');

            const productionResponse = await fetch('https://auphonic.com/api/simple/productions.json', {
                method: 'POST',
                headers: AUTH_HEADER,
                body: formData
            });

            if (!productionResponse.ok) {
                const errorText = await productionResponse.text();
                console.error("Failed to create Auphonic production:", errorText);
                throw new Error(`Production creation failed: ${productionResponse.statusText}`);
            }

            const productionData = await productionResponse.json();
            const uuid = productionData?.data?.uuid;

            if (!uuid) {
                console.error("UUID not found in production response:", productionData);
                throw new Error("Failed to retrieve production UUID");
            }
            console.log("Production created with UUID:", uuid);

            // Step 2: Start the production
            const startResponse = await fetch(`https://auphonic.com/api/production/${uuid}/start.json`, {
                method: 'POST',
                headers: AUTH_HEADER
            });

            if (!startResponse.ok) {
                const errorText = await startResponse.text();
                console.error("Failed to start Auphonic production:", errorText);
                throw new Error(`Production start failed: ${startResponse.statusText}`);
            }
            console.log("Production started successfully.");

            // Step 3: Poll for completion
            const checkStatus = async () => {
                try {
                    const statusResponse = await fetch(`https://auphonic.com/api/production/${uuid}/status.json`, {
                        headers: AUTH_HEADER
                    });

                    if (!statusResponse.ok) {
                        const errorText = await statusResponse.text();
                        console.error("Error fetching production status:", errorText);
                        throw new Error(`Failed to fetch production status: ${statusResponse.statusText}`);
                    }

                    const statusData = await statusResponse.json();
                    console.log("Current production status:", statusData.data.status_string);
                    // return statusData?.data?.status_string; // when checking for status_string
                    return  statusData?.data?.status; // when checking for status 
                } catch (error) {
                    console.error("Error during status check:", error);
                    throw error;
                }
            };

            let status;
            do {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
                status = await checkStatus();
            }  while ([1, 4, 5].includes(status)); // when checking for status 
            // } while ( ["Audio Encoding",  "Audio Processing"].includes(status)); // when checking for status_string

            console.log("Final production status:", status);

            // Step 4: Handle completion
            // if (status === 'Done') { // when checking for status_string
            if (status === 3) { // when checking for status 
                console.log("Production completed. Downloading the processed file...");
                // const downloadResponse = await fetch(`https://auphonic.com/api/production/${uuid}/download.json`, {
                //     headers: AUTH_HEADER
                // });
                const downloadResponse = await fetch(`https://auphonic.com/api/production/${uuid}.json`, {
                    method: 'GET',
                    headers: AUTH_HEADER,
                });
                const resolvedRes = await downloadResponse.json()
                console.log(resolvedRes, "downloadResponse121212", downloadResponse)
                if (!downloadResponse.ok) {
                    const errorText = await downloadResponse.text();
                    console.error("Error downloading processed file:", errorText);
                    throw new Error(`Download failed: ${downloadResponse.statusText}`);
                }

                const processedBlob = await downloadResponse.blob();
                console.log("Processed file downloaded successfully.", processedBlob);
                return processedBlob;
            } else {
                console.error("Production did not complete successfully:", status);
                throw new Error(`Processing failed with status: ${status}`);
            }
        } catch (error) {
            console.error("Error processing audio with Auphonic:", error);
            throw error; // Re-throw the error for further handling if needed
        }
    };


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
        isAudio,
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
        processAudioWithAuphonic,
        isFfmpegLoaded,
        ffmpegLoadError,
        setIsFfmpegRunning,
        ffmpegRunning
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
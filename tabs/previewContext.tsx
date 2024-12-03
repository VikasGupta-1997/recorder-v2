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
    // const [originalVideo, setOriginalVideo] = useState({
    //     blob: new Blob() , url: ''
    // })
    const [blob, setBlob] = useState(null)
    const url = useRef('')
    const [history, setHistory] = useState([])
    const [redoHistory, setRedoHistory] = useState([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [videoTime, setVideoTime] = useState(0)
    const [duration, setDuration] = useState(0);

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
                    // setContentState(prev => ({
                    //     ...prev,
                    //     // blob: newBlob,
                    //     // blobUrl: newBlobUrl,
                    //     // loadingVideo: false
                    // }))
                    setLoadingVideo(false)
                    // setBlob(newBlob);
                    // setBlobUrl(newBlobUrl);
                    // setVideoLoading(false)

                    // window.postMessage({type: "SEND_FROM_PREVIEW", data: newBlobUrl}, '*')
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
            console.log("Message received in iframe:", message);
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
        updateCursorPosition
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
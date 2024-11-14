import { useEffect, useMemo, useRef, useState } from "react";
import { AudioVisualizer, LiveAudioVisualizer } from 'react-audio-visualize';
import { BiMicrophone } from "react-icons/bi";
import { HiOutlineVolumeUp, HiOutlineVolumeOff } from "react-icons/hi";
import { FaPlay, FaPause } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";
import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import EditingControls from "./preview-utils/EditingControls";
import WaveSurfer from 'wavesurfer.js';

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}
// import { getAudio,  initDB, storeAudio } from '~indexDB'

function PreviewPage() {
    const videoRef = useRef(null)
    const audioRef = useRef(null);


    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const [analyseRefS, setAnalyseRefS] = useState(null);
    const dataArrayRef = useRef(null);
    const [dataArrayRefS, setDataArrayRefS] = useState(null);

    const [isAudio, setIsAudio] = useState('ideal')
    const [widthHeight, setWidthHeight] = useState({
        width: 0,
        height: 0
    })
    const [currentTime, setCurrentTime] = useState(0); // Track current audio time
    const [duration, setDuration] = useState(0); // Track the audio duration
    const [isPlaying, setIsPlaying] = useState(true); // Track if audio is playing
    const [audioLevel, setAudioLevel] = useState(0); // Track audio level for bouncing
    const [playing, setPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>()
    const [loadingVideo, setVideoLoading] = useState(true)
    const svgMicRef = useRef(null)
    const url = useRef('')
    const containerRef = useRef(null)
    // const wavesurferRef = useRef(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);

    const handleResize = () => {
        // setWidthHeight({
        //   width: audioGraphRef?.current?.clientWidth,
        //   height: audioGraphRef?.current?.clientHeight
        // });
    };

    const onMountListeners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                console.log("onMountListeners1212", message)
                switch (message.type) {
                    case "PLAY_PREVIEW": {
                        console.log("GET_INDEXDB_RECORDING12121212")
                        setVideoLoading(false)
                    }
                }
            }
        )
    }

    useEffect(() => {
        onMountListeners()
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
        console.log("ENTERED!!~!", isAudio)
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


    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly"], async (result) => {
            // playRecordingInVideoTag()
            if (result?.isAudioOnly) {
                setIsAudio('audio');
            } else {
                setIsAudio('video');
            }
            if (containerRef?.current) {
                setWidthHeight({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        });

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            // document.body.removeChild(script);
        };
    }, []);

    // Reset MediaRecorder and Analyser when playback stops
    const resetMediaRecorderAndAnalyser = () => {
        if (mediaRecorder) {
            mediaRecorder.onstop = null;
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setMediaRecorder(null);
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
    };

    // Handle time updates to track progress
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleAudioEnded = () => {
        console.log("ENDED PLAYING!!")
        setIsPlaying(false); // Stop bouncing effect when audio ends
        if (svgMicRef.current) {
            svgMicRef.current.style.transform = 'scale(1)'; // Reset the scale when audio ends
        }
        resetMediaRecorderAndAnalyser()
        // mediaRecorder.stop();
        // setMediaRecorder(mediaRecorder)
    };

    const handleAudioPlay = () => {
        setWidthHeight({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
        })
        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.warn("Recording is already in progress");
            return; // Don't start recording again if it's already recording
        }
        const stream = audioRef.current.captureStream();
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
            const recordedBlob = new Blob([e.data], { type: 'audio/webm' });
            console.log("Recorded Blob:", recordedBlob);
        };

        recorder.start();
        setMediaRecorder(recorder);
        console.log("handleAudioPlayCalled")
        setIsPlaying(true); // Start bouncing effect when audio plays
        setupAnalyser()
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration); // Set the duration when the audio metadata is loaded
        }
    };

    // Calculate the moving line's position as a percentage of the audio progress
    const progressPercentage = useMemo(() => {
        return (currentTime / duration) * 100 || 0
    }, [currentTime, duration]);

    useEffect(() => {
        let animationFrameId;

        const animateFrequency = () => {
            // if (!isPlaying || !analyserRef.current || !dataArrayRef.current){
            if (!isPlaying || !analyseRefS || !dataArrayRefS) {
                return;
            }
            const analyser = analyseRefS;
            const dataArray = dataArrayRefS;

            analyser.getByteFrequencyData(dataArray); // Capture real audio frequency data
            const maxFrequency = Math.max(...dataArray);
            const normalizedLevel = maxFrequency / 255; // Normalize the audio level to 0-1
            setAudioLevel(normalizedLevel); // Use normalized level to update the bounce effect

            animationFrameId = requestAnimationFrame(animateFrequency);
        };

        if (isPlaying) {
            animateFrequency(); // Start animation if audio is playing
        }

        return () => {
            cancelAnimationFrame(animationFrameId); // Clean up animation when component unmounts
        };
    }, [isPlaying, analyseRefS, dataArrayRef]);

    const setupAnalyser = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256; // Determines frequency resolution
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyserRef.current = analyser;
        setAnalyseRefS(analyser)
        dataArrayRef.current = dataArray;
        setDataArrayRefS(dataArray)
        visualizeMic();
    };

    // Function to animate and visualize the mic icon
    const visualizeMic = () => {
        if (!analyserRef.current) return;

        const dataArray = dataArrayRef.current;
        const analyser = analyserRef.current;

        const animate = () => {
            analyser.getByteFrequencyData(dataArray);
            const maxFreq = Math.max(...dataArray);
            const normalizedLevel = maxFreq / 255; // Normalize the value between 0 and 1

            // Set the mic scale based on the normalized level
            if (svgMicRef.current) {
                const scale = 1 + normalizedLevel * 0.5; // Adjust the scale
                svgMicRef.current.style.transform = `scale(${scale})`;
            }

            requestAnimationFrame(animate); // Continue the animation
        };

        requestAnimationFrame(animate); // Start animation loop
    };

    const handlePlayPause = () => {
        console.log("handlePlayPause Called", isAudio, playing)
        if (isAudio === 'video') {
            if (videoRef.current) {
                console.log("INIDEDDDD")
                if (playing) {
                    console.log("isPlaying Video")
                    videoRef.current.pause();
                } else {
                    console.log("isPAuding Video")
                    videoRef.current.play();
                }
            }
        } else {

        }
        setPlaying(prev => !prev);
    };

    const handleVolumeChange = (event) => {
        const newVolume = event.target.value;
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume; // Update video volume
        }
    };

    useEffect(() => {
        if (!loadingVideo) {
            playRecordingInVideoTag()

            // waveSurferRef.current.load(url.current);
        }
    }, [loadingVideo, isAudio])

    console.log("mediaRecorder1212", widthHeight)

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
                {isAudio === 'video' && <div className={style["react-player-wrapper-video "]}>
                    <video preload="metadata" ref={videoRef} className={style["video"]} id="ext-vid-previewVideo" autoPlay ></video>
                    <div className={style["video-controls"]}>
                        <button onClick={handlePlayPause}>
                            {playing ? <FaPause size={14} color="white" /> : <FaPlay size={14} color="white" />}
                        </button>
                        <span className={style["volume-span"]} >
                            {volume === 0 ? <HiOutlineVolumeOff size={18} color="white" /> : <HiOutlineVolumeUp size={18} color="white" />}
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                className={style["volume-slider"]}
                                value={volume}
                                onChange={handleVolumeChange}
                                style={{ width: '100px', marginLeft: 12 }}
                            />
                        </span>
                        <div style={{ color: 'white', marginLeft: 'auto', marginRight: 12 }}>
                            {/* {formatTime(currentTime)} / {formatTime(duration)} */}
                        </div>
                    </div>
                </div>
                }
                {
                    isAudio === 'audio' && <div className={style["audio-container"]} ref={containerRef}>
                        <div className={style["audio-absolute"]}>
                            <span>
                                <div className={style["mic-icon"]}>
                                    <div ref={svgMicRef} className={style['svg-mic-outer']}>
                                        <div className={style['svg-mic']}>
                                            <BiMicrophone fontSize={36} color='white' />
                                        </div>
                                    </div>
                                </div>
                            </span>
                        </div>
                        {(mediaRecorder
                            // && widthHeight?.height > 0 && widthHeight?.width > 0
                        ) && <span style={{
                            margin: 'auto'
                        }} >
                                <LiveAudioVisualizer
                                    // width={882}
                                    width={widthHeight.width}
                                    // height={635}
                                    height={widthHeight.height}
                                    barColor='#21455e'
                                    mediaRecorder={mediaRecorder} // Pass the media stream to the component
                                />
                            </span>
                        }
                        <audio
                            ref={audioRef}
                            style={{
                                height: "30px",
                                width: "98%",
                                borderRadius: '8px',
                                paddingLeft: '6px',
                                position: 'absolute',
                                bottom: '5px',
                                // alignSelf: 'flex-end',
                                // paddingBottom: 8
                            }}
                            controls
                            autoPlay
                            onTimeUpdate={handleTimeUpdate} // Update progress
                            onLoadedMetadata={handleLoadedMetadata} // Set duration when metadata is loaded
                            onEnded={handleAudioEnded} // Stop animation when audio ends
                            onPlay={handleAudioPlay} // Start animation when audio plays
                        ></audio>
                    </div>
                }
            </div>
            <div className={style["editing-control-wrapper"]} >
                <div className={style["editing-container"]} >
                    <div className={style["redo-undo"]} >
                        <div className={style["undo"]}>
                            <button className={style["rounded-btn"]}>
                                Undo
                                {/* <LiaUndoAltSolid color="10abd9" size={24} /> */}
                            </button>
                        </div>
                        <div className={style["redo"]}>
                            <button className={style["rounded-btn"]} >
                                Redo
                            </button>
                            {/* <LiaRedoAltSolid color="10abd9" size={24} /> */}
                        </div>
                    </div>
                    <div className={style["editing-actions"]} >
                        {
                            ["cut", "trim", "delete recording", "publish"].map(action => (
                                <button key={action} className={action === 'publish' ? style["publish-btn"] : ""} >
                                    {["cut", "trim"].includes(action) && <span style={{ display: 'none' }}  >
                                        {/* Hello */}
                                        {/* {action === 'cut' ? <BsScissors fontSize={14} color="10abd9" /> : <MdOutlineCrop fontSize={14} color="10abd9" />} */}
                                    </span>}
                                    <p>
                                        {action}
                                    </p>
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className={style["wavesurfer-wrapper"]} >
                <div ref={waveContainerRef} style={{ marginTop: '10px' }} />
                {!isWaveSurferReady && <p>Loading waveform...</p>}
            </div>
        </div>
    );
}

export default PreviewPage;
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import { AudioVisualizer, LiveAudioVisualizer } from 'react-audio-visualize';
import { BiMicrophone } from "react-icons/bi";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}


export default function AudioPreview({
    containerRef,
    audioRef,
}) {
    const [isPlaying, setIsPlaying] = useState(true); // Track if audio is playing
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>()
    const [analyseRefS, setAnalyseRefS] = useState(null);
    const [dataArrayRefS, setDataArrayRefS] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0); // Track audio level for bouncing
    const [currentTime, setCurrentTime] = useState(0); // Track current audio time
    const [duration, setDuration] = useState(0); // Track the audio duration
    const [widthHeight, setWidthHeight] = useState({
        width: 0,
        height: 0
    })

    const svgMicRef = useRef(null)
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    const handleResize = () => {
        // setWidthHeight({
        //   width: audioGraphRef?.current?.clientWidth,
        //   height: audioGraphRef?.current?.clientHeight
        // });
    };

    useEffect(() => {
        if (containerRef?.current) {
            setWidthHeight({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            })
        }
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            // document.body.removeChild(script);
        };
    }, [containerRef])

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
    // Handle time updates to track progress
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration); // Set the duration when the audio metadata is loaded
        }
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

    return (
        <div className={style["audio-container"]} ref={containerRef}>
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
    )
}
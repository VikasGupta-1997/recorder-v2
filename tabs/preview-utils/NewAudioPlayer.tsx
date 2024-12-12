import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useEffect, memo } from "react"
import { BiMicrophone } from "react-icons/bi";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const NewAudioPlayer = ({ audioSource }) => {
    const containerRef = useRef(null);
    const svgMicRef = useRef(null);
    const plyrRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const sourceRef = useRef(null);

    const options = {
        controls: [
            "play",
            "mute",
            "progress",
            "current-time",
            "duration",
            "volume",
        ],
        keyboard: {
            global: true,
        },
        crossorigin: "anonymous",
    };

    const initializeAudioContext = () => {
        const audioElement = plyrRef.current?.plyr?.media;
        if (!audioElement) return;

        try {
            // Create audio context if it doesn't exist
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Create and configure analyzer if it doesn't exist
            if (!analyserRef.current) {
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;
            }

            // Create and connect source if it doesn't exist
            if (!sourceRef.current) {
                sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            }

            return true;
        } catch (error) {
            console.error('Error initializing audio context:', error);
            return false;
        }
    };

    const startVisualization = () => {
        if (!initializeAudioContext()) return;

        const analyser = analyserRef.current;
        if (!analyser) return;

        // Start animation loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const animate = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average frequency
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            
            // Scale the mic icon based on the average frequency (0-255)
            const scale = 1 + (average / 255) * 0.5; // Will scale between 1x and 1.5x
            if (svgMicRef.current) {
                svgMicRef.current.style.transform = `scale(${scale})`;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    const stopVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        // Reset mic scale
        if (svgMicRef.current) {
            svgMicRef.current.style.transform = 'scale(1)';
        }
    };

    const handleClick = () => {
        if (plyrRef.current && plyrRef.current.plyr) {
            plyrRef.current.plyr.on("play", () => {
                console.log("On Play Called", plyrRef.current.plyr.currentTime);
                startVisualization();
            });
            
            plyrRef.current.plyr.on("ended", () => {
                console.log("On EndEDDEE Called", plyrRef.current.plyr.currentTime);
                stopVisualization();
            });
            
            plyrRef.current.plyr.on("pause", () => {
                console.log("On Pause Called", plyrRef.current.plyr.currentTime);
                stopVisualization();
            });
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopVisualization();
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }
            if (analyserRef.current) {
                analyserRef.current.disconnect();
                analyserRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

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
            <div className={style["plyr-wrap-audio"]} onClick={handleClick}>
                <Plyr
                    ref={plyrRef}
                    source={audioSource}
                    options={options}
                    onLoadedMetadata={() => {
                        console.log("LoadedMta Data Called!!")
                    }}
                />
            </div>
            <style>
                {`
                    .${style['custom-duration']} {
                        position: absolute;
                        bottom: 12px;
                        right: 20px;
                        color: white;
                        z-index: 1000;
                        display: none;
                    }
                    .plyr {
                        height: auto;
                        width: 100%;
                        position: absolute;
                        bottom: 0;
                    }
                    .plyr__progress--played {
                        background-color: #ff5733 !important; /* Your custom color */
                    }
                    .plyr__controls {
                        background-color: rgba(35, 153, 219, 0.8) !important;
                        padding: 16px 10px! important;
                        color: white !important
                    }
                `}
            </style>
        </div>
    );
};

export default memo(NewAudioPlayer);

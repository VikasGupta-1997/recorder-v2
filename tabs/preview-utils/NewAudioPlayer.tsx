import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useEffect, useState } from "react"
import { BiMicrophone } from "react-icons/bi";
import { LiveAudioVisualizer } from 'react-audio-visualize';

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const NewAudioPlayer = ({
    blobUrl
}) => {
    const containerRef = useRef(null)
    const svgMicRef = useRef(null)
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const audioRef = useRef(null);
    const animationFrameRef = useRef(null);
    const audioContextRef = useRef(null);

    const initializeAudioContext = async () => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            audioContextRef.current = new AudioContext();
            await audioContextRef.current.resume();
            
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(audioContextRef.current.destination);

            startVisualization();
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    };

    const startVisualization = () => {
        const animate = () => {
            if (!svgMicRef.current || !analyserRef.current || !dataArrayRef.current) return;
            
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Get average frequency
            const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;
            
            // Scale the mic icon based on the average frequency
            const scale = 1 + (average / 256) * 2; // Max scale will be 1.5
            svgMicRef.current.style.transform = `scale(${scale})`;
            
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handlePlay = () => {
        initializeAudioContext();
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
            <audio 
                ref={audioRef} 
                src={blobUrl} 
                controls 
                onPlay={handlePlay}
            />
        </div>
    )
}

export default NewAudioPlayer
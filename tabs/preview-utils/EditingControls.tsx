import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const EditingControls = ({ blobUrl, timeData, blob }) => {
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const trimmerRef = useRef(null);
    const startHandleRef = useRef(null);
    const endHandleRef = useRef(null);
    const isDragging = useRef(false);
    const activeHandle = useRef(null);
    const [duration, setDuration] = useState(0);

    const [trimState, setTrimState] = useState({
        start: 0,
        end: 1,
        dragInteracted: false,
        startTime: 0,        // actual start time in seconds
        endTime: 0          // actual end time in seconds
    });

    const handleMouseDown = (e, handle) => {
        e.preventDefault();
        isDragging.current = true;
        activeHandle.current = handle;

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !duration) return;

        const trimmerRect = trimmerRef.current.getBoundingClientRect();
        const trimmerWidth = trimmerRect.width;
        const mouseX = e.clientX - trimmerRect.left;
        let newPosition = mouseX / trimmerWidth;

        if (activeHandle.current === "start") {
            newPosition += 0;
            const validPosition = Math.max(
                Math.min(newPosition, trimState.end - 0.02),
                0
            );
            const startTime = validPosition * duration;
            setTrimState(prev => ({
                ...prev,
                start: validPosition,
                startTime
            }));
        } else if (activeHandle.current === "end") {
            newPosition -= 0;
            const validPosition = Math.min(
                Math.max(newPosition, trimState.start + 0.02),
                1
            );
            const endTime = validPosition * duration;
            setTrimState(prev => ({
                ...prev,
                end: validPosition,
                endTime
            }));
        }

        // Update wavesurfer playback position
        if (waveSurferRef.current) {
            const currentTime = activeHandle.current === "start" ?
                trimState.startTime : trimState.endTime;
            waveSurferRef.current.setTime(currentTime);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        activeHandle.current = null;

        setTrimState(prev => ({
            ...prev,
            dragInteracted: true,
        }));

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    useEffect(() => {
        if (startHandleRef.current && endHandleRef.current) {
            startHandleRef.current.style.left = `calc(${trimState.start * 100}%)`;
            endHandleRef.current.style.left = `${trimState.end * 100}%`;
        }
    }, [trimState.start, trimState.end]);

    const loadWaveForm = async () => {
        if (waveContainerRef.current && !waveSurferRef.current) {
            waveSurferRef.current = WaveSurfer.create({
                container: waveContainerRef.current,
                waveColor: '#ddd',
                progressColor: '#555',
                cursorColor: '#333',
                height: 100,
                barWidth: 2,
            });

            waveSurferRef.current.on('ready', () => {
                const videoDuration = waveSurferRef.current.getDuration();
                setDuration(videoDuration);
                // Initialize end time with full duration
                setTrimState(prev => ({
                    ...prev,
                    endTime: videoDuration
                }));
            });

            if (blobUrl) {
                await waveSurferRef.current.load(blobUrl);
            }
        }
    }

    useEffect(() => {
        loadWaveForm();
        return () => {
            waveSurferRef.current?.destroy();
            waveSurferRef.current = null;
        };
    }, [blobUrl]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const milliseconds = Math.floor((time % 1) * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };

    console.log("Trim times:", {
        startTime: formatTime(trimState.startTime),
        endTime: formatTime(trimState.endTime),
        duration: formatTime(duration)
    });

    return (
        <>
            <div className={style["trimmer-container"]} ref={trimmerRef}>
                <div className={style["trim-wrap"]}>
                    <div
                        className={style["left-overlay"]}
                        style={{ width: `${trimState.start * 100}%` }}
                    />
                    <div
                        className={style["right-overlay"]}
                        style={{ width: `${(1 - trimState.end) * 100}%` }}
                    />
                    <div
                        className={style["trim-section"]}
                        style={{
                            width: `${(trimState.end - trimState.start) * 100}%`,
                            left: `${trimState.start * 100}%`,
                        }}
                    />
                    <div className={style["time-indicators"]}>
                        <span className={style["start-time"]}>{formatTime(trimState.startTime)}</span>
                        <span className={style["end-time"]}>{formatTime(trimState.endTime)}</span>
                    </div>
                    <div className={style["trimmer"]}>
                        <div
                            className={`${style["handle"]} ${style["start-handle"]}`}
                            onMouseDown={(e) => handleMouseDown(e, "start")}
                            ref={startHandleRef}
                        />
                        <div
                            className={`${style["handle"]} ${style["end-handle"]}`}
                            onMouseDown={(e) => handleMouseDown(e, "end")}
                            ref={endHandleRef}
                        />
                    </div>
                </div>
                <div ref={waveContainerRef} className={style["wave-container"]} />
            </div>
            <div className={style["editing-container"]}>
                <div className={style["redo-undo"]} >
                    <div className="undo" > <LiaUndoAltSolid color="10abd9" fontSize={24} /> </div>
                    <div className="redo" > <LiaRedoAltSolid color="10abd9" fontSize={24} /> </div>
                </div>

                <div className={style["editing-actions"]} >
                    {
                        ["cut", "trim", "delete recording", "publish"].map(action => (
                            <button key={action} className={action === 'publish' ? style["publish-btn"] : ""} >
                                {["cut", "trim"].includes(action) && <span  >
                                    {action === 'cut' ? <BsScissors fontSize={14} color="10abd9" /> : <MdOutlineCrop fontSize={14} color="10abd9" />}
                                </span>}
                                <p>
                                    {action}
                                </p>
                            </button>
                        ))
                    }
                </div>
            </div>
        </>
    );
}

export default EditingControls
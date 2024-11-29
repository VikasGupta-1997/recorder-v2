import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as styles from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import WaveformGenerator from "~tabs/waveform-generator"

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
    const customCursorRef = useRef(null);
    const ghostCursorRef = useRef(null);
    const [showGhost, setShowGhost] = useState(false);
    const mouseDown = useRef(false);
    const [duration, setDuration] = useState(0);

    const [trimState, setTrimState] = useState({
        start: 0,
        end: 1,
        dragInteracted: false,
        startTime: 0,
        endTime: 0
    });

    const [cursorPosition, setCursorPosition] = useState(0);

    const handleMouseDown = (e, handle) => {
        e.preventDefault();
        isDragging.current = true;
        activeHandle.current = handle;
        setShowGhost(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !duration) return;

        const trimmerRect = trimmerRef.current.getBoundingClientRect();
        const trimmerWidth = trimmerRect.width;
        const mouseX = Math.max(0, Math.min(e.clientX - trimmerRect.left, trimmerWidth));
        const position = mouseX / trimmerWidth;

        if (activeHandle.current === "start") {
            const validPosition = Math.max(0, Math.min(position, trimState.end - 0.02));
            const startTime = validPosition * duration;
            setTrimState(prev => ({
                ...prev,
                start: validPosition,
                startTime,
                dragInteracted: true
            }));

            if (waveSurferRef.current) {
                waveSurferRef.current.setTime(startTime);
            }
        } else if (activeHandle.current === "end") {
            const validPosition = Math.min(Math.max(position, trimState.start + 0.02), 1);
            const endTime = validPosition * duration;
            setTrimState(prev => ({
                ...prev,
                end: validPosition,
                endTime,
                dragInteracted: true
            }));

            if (waveSurferRef.current) {
                waveSurferRef.current.setTime(endTime);
            }
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        activeHandle.current = null;
        mouseDown.current = false;
        setShowGhost(true);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleWaveformClick = (e) => {
        if (!waveContainerRef.current || !duration) return;

        const containerRect = waveContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - containerRect.left;
        const position = clickX / containerRect.width;
        const time = position * duration;

        setCursorPosition(position);

        if (waveSurferRef.current) {
            waveSurferRef.current.setTime(time);
        }
    };

    const handleWaveformMouseMove = (e) => {
        if (!waveContainerRef.current || isDragging.current) return;

        const containerRect = waveContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const position = (mouseX / containerRect.width) * 100;

        if (ghostCursorRef.current) {
            ghostCursorRef.current.style.left = `${position}%`;
        }
    };

    const handleWaveformMouseEnter = () => {
        if (!isDragging.current) {
            setShowGhost(true);
        }
    };

    const handleWaveformMouseLeave = () => {
        setShowGhost(false);
    };

    useEffect(() => {
        if (startHandleRef.current && endHandleRef.current) {
            startHandleRef.current.style.left = `${trimState.start * 100}%`;
            endHandleRef.current.style.left = `${trimState.end * 100}%`;
        }
    }, [trimState.start, trimState.end]);

    const loadWaveForm = async () => {
        if (waveContainerRef.current && !waveSurferRef.current) {
            waveSurferRef.current = WaveSurfer.create({
                container: waveContainerRef.current,
                waveColor: '#A3BAC6',
                progressColor: '#555',
                cursorColor: 'transparent',
                height: 100,
                barWidth: 2,
            });

            waveSurferRef.current.on('ready', () => {
                const videoDuration = waveSurferRef.current.getDuration();
                setDuration(videoDuration);
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

    const toTimeStamp = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time - minutes * 60);

        if (seconds < 10) {
            return `${minutes}:0${seconds}`;
        } else {
            return `${minutes}:${seconds}`;
        }
    };

    console.log("trimStatetrimState", trimState)

    return (
        <>
            <div>
                <div className={styles.timeWrap}>
                    <span>{toTimeStamp(trimState.startTime) + " - " + toTimeStamp(trimState.endTime)}</span>
                </div>
                <div className={styles.trimmerContainer} ref={trimmerRef}>
                    <div className={styles.trimWrap}>
                        <div
                            className={styles.leftOverlay}
                            style={{ width: `${trimState.start * 100}%` }}
                        />
                        <div
                            className={styles.rightOverlay}
                            style={{ width: `${(1 - trimState.end) * 100}%` }}
                        />
                        <div
                            className={styles.trimSection}
                            style={{
                                width: `${(trimState.end - trimState.start) * 100}%`,
                                left: `${trimState.start * 100}%`
                            }}
                        />
                        <div className={styles.trimmer}>
                            <div
                                className={`${styles.handle} ${styles.startHandle}`}
                                onMouseDown={(e) => handleMouseDown(e, "start")}
                                ref={startHandleRef}
                                style={{ left: `${trimState.start * 100}%` }}
                            />
                            <div
                                className={`${styles.handle} ${styles.endHandle}`}
                                onMouseDown={(e) => handleMouseDown(e, "end")}
                                ref={endHandleRef}
                                style={{ left: `${trimState.end * 100}%` }}
                            />
                        </div>
                    </div>
                    <div
                        ref={waveContainerRef}
                        className={styles.waveform}
                        onClick={handleWaveformClick}
                        onMouseMove={handleWaveformMouseMove}
                        onMouseEnter={handleWaveformMouseEnter}
                        onMouseLeave={handleWaveformMouseLeave}
                    >
                        <div
                            className={styles.cursor}
                            ref={customCursorRef}
                            style={{ left: `${cursorPosition * 100}%` }}
                        />
                        <div
                            className={styles.ghostCursor}
                            ref={ghostCursorRef}
                            style={{ opacity: showGhost ? 1 : 0 }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles["editing-container"]}>
                <div className={styles["redo-undo"]} >
                    <div className="undo" > <LiaUndoAltSolid color="10abd9" fontSize={24} /> </div>
                    <div className="redo" > <LiaRedoAltSolid color="10abd9" fontSize={24} /> </div>
                </div>

                <div className={styles["editing-actions"]} >
                    {
                        ["cut", "trim", "delete recording", "publish"].map(action => (
                            <button key={action} className={action === 'publish' ? styles["publish-btn"] : ""} >
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
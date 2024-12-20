import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as styles from '../preview.module.css'
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { GrMagic } from "react-icons/gr";
import { GiSplashyStream } from "react-icons/gi";
import { MdOutlineCameraswitch } from "react-icons/md";
import { TbSwitch2 } from "react-icons/tb";
// import { usePreview } from "~tabs/previewContext"

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const EditingControls = ({
    setShowGhost,
    showGhost,
    usePreview,
    isAudio,
    getAuphonicData
}) => {

    const {
        blob,
        blobUrl,
        setTrimState,
        trimState,
        history,
        waveSurferRef,
        addToHistory,
        handleUndo,
        handleRedo,
        redoHistory,
        customCursorRef,
        setDuration,
        duration,
        setIsFfmpegRunning,
        ffmpegRunning,
        isPublishing,
        originalDuration,
        setShowAuphonicAdvanceForm,
        setConfirmSendToAuphonic,
        uuidState,
        handleSwitch,
        isAuphonicUiMode
    } = usePreview();

    const waveContainerRef = useRef<HTMLDivElement>(null);
    const trimmerRef = useRef(null);
    const startHandleRef = useRef(null);
    const endHandleRef = useRef(null);
    const isDragging = useRef(false);
    const activeHandle = useRef(null);
    const ghostCursorRef = useRef(null);
    const mouseDown = useRef(false);
    const [undoDisabled, setUndoDisabled] = useState(true);
    const [redoDisabled, setRedoDisabled] = useState(true);
    const [cursorPosition, setCursorPosition] = useState(0);

    const sendMessage = (message) => {
        window.parent.postMessage(message, "*");
    }

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
        console.log("NOW MOUSE LEFT!!")
        addToHistory(trimState)
        isDragging.current = false;
        activeHandle.current = null;
        mouseDown.current = false;
        setShowGhost(true);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleWaveformClick = (e) => {
        if (!waveContainerRef.current || !duration || isPublishing) return;

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
        if (!waveContainerRef.current || isDragging.current || isPublishing) return;

        const containerRect = waveContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const position = (mouseX / containerRect.width) * 100;

        if (ghostCursorRef.current) {
            ghostCursorRef.current.style.left = `${position}%`;
        }
    };

    const handleWaveformMouseEnter = () => {
        if (isPublishing) return;
        if (!isDragging.current) {
            setShowGhost(true);
        }
    };

    const handleWaveformMouseLeave = () => {
        if (isPublishing) return
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
                waveColor: isAuphonicUiMode ? '#50bb50' : '#A3BAC6',
                progressColor: '#555',
                cursorColor: 'transparent',
                height: 100,
                barWidth: 2,
            });

            waveSurferRef.current.on('error', (error) => {
                console.log(waveSurferRef.current, "ERROR", error)
            })

            waveSurferRef.current.on('ready', () => {
                const videoDuration = waveSurferRef.current.getDuration();
                setDuration(videoDuration);
                if (!originalDuration.current) {
                    originalDuration.current = videoDuration
                }
                setTrimState(prev => ({
                    ...prev,
                    endTime: videoDuration,
                    duration: videoDuration
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
    }, [blobUrl, isAuphonicUiMode]);

    useEffect(() => {
        if (history.length > 0) {
            setUndoDisabled(false);
        } else {
            setUndoDisabled(true);
        }
    }, [history]);


    useEffect(() => {
        if (redoHistory.length > 0) {
            setRedoDisabled(false);
        } else {
            setRedoDisabled(true);
        }
    }, [redoHistory]);

    const toTimeStamp = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time - minutes * 60);

        if (seconds < 10) {
            return `${minutes}:0${seconds}`;
        } else {
            return `${minutes}:${seconds}`;
        }
    };

    const handleTrim = async (cut) => {
        try {
            if (!blob) {
                console.error("No blob available for trimming");
                return;
            }
            console.log("Duration", duration)
            // Send message to cut video
            const message = {
                type: "cut-video",
                blob: blob,
                startTime: trimState.startTime,
                endTime: trimState.endTime,
                cut: cut,
                duration: trimState.duration,
                encode: false,
            };

            console.log("Sending trim message:", {
                startTime: trimState.startTime,
                endTime: trimState.endTime,
                duration: trimState.duration
            });

            // Send the message to process the trim
            sendMessage(message);
            setIsFfmpegRunning(true)
        } catch (error) {
            console.error("Error in handleTrim:", error);
        }
    };

    const handleClick = (action) => {
        console.log("Action clicked:", action);
        if (action === 'trim') {
            handleTrim(false);
        }
        if (action === 'cut') {
            handleTrim(true);
        }
        if (action === 'publish') {
            console.log("publish called", blob)
            getAuphonicData()
        }
    };

    const disableButtons = (action) => {
        if (["cut", "trim"].includes(action)) {
            return (trimState.start === 0 && trimState.end === 1) || ffmpegRunning || isPublishing
        }
        return ffmpegRunning || isPublishing
    }

    const handleMagic = () => {
        console.log("handleMagic")
        const message = {
            type: "extract-audio",
            blob: blob,
        };
        // Send the message to process the trim
        // sendMessage(message);
        setConfirmSendToAuphonic(true)
    }

    return (
        <>
            <div>
                <div className={styles.timeWrap}>
                    <span>{toTimeStamp(trimState.startTime) + " - " + toTimeStamp(trimState.endTime)}</span>
                </div>
                {uuidState && <div className={styles['switch-ui']} >
                    <span onClick={handleSwitch} className={styles["click-wrapper"]} >
                        <div className={styles['reverse-container']} >
                            <TbSwitch2 fontSize={12} />
                        </div>
                        <p>Switch original audio</p>
                    </span>
                </div>}
                <div className={styles.trimmerContainer} ref={trimmerRef}>
                    <div className={styles.trimWrap}>
                        <div
                            className={styles.leftOverlay}
                            style={{ background: '#F292F2', opacity: '0.5', width: `${trimState.start * 100}%` }}
                        />
                        <div
                            className={styles.rightOverlay}
                            style={{ background: '#F292F2', opacity: '0.5', width: `${(1 - trimState.end) * 100}%` }}
                        />
                        <div
                            className={styles.trimSection}
                            style={{
                                width: `${(trimState.end - trimState.start) * 100}%`,
                                left: `${trimState.start * 100}%`,
                                borderColor: isAuphonicUiMode ? '#50bb50' : '#10abd9'
                            }}
                        />
                        <div className={styles.trimmer}>
                            <div
                                className={`${styles.handle} ${styles.startHandle}`}
                                onMouseDown={(e) => handleMouseDown(e, "start")}
                                ref={startHandleRef}
                                style={{ background: isAuphonicUiMode ? '#50bb50' : '#10abd9', left: `${trimState.start * 100}%` }}
                            />
                            <div
                                className={`${styles.handle} ${styles.endHandle}`}
                                onMouseDown={(e) => handleMouseDown(e, "end")}
                                ref={endHandleRef}
                                style={{ background: isAuphonicUiMode ? '#50bb50' : '#10abd9', left: `${trimState.end * 100}%` }}
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
                            style={{ background: isAuphonicUiMode ? '#50bb50' : '#10abd9', left: `${cursorPosition * 100}%` }}
                        />
                        <div
                            className={styles.ghostCursor}
                            ref={ghostCursorRef}
                            style={{ background: isAuphonicUiMode ? '#0AD68896' : 'rgba(16, 171, 217, 0.5)', opacity: showGhost ? 1 : 0 }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles["editing-container"]}>
                <div className={styles["redo-undo"]} >
                    <button disabled={undoDisabled || ffmpegRunning || isPublishing} className="undo" onClick={handleUndo} > <LiaUndoAltSolid color="10abd9" fontSize={24} /> </button>
                    <button disabled={redoDisabled || ffmpegRunning || isPublishing} className="redo" onClick={handleRedo} > <LiaRedoAltSolid color="10abd9" fontSize={24} /> </button>
                </div>

                <div className={styles["editing-actions"]} >
                    <div>
                        <button disabled={isPublishing} onClick={() => handleMagic()} className={`${styles["magic-btn"]} ${isPublishing ? styles["shining"] : ""}`} >
                            {isPublishing ? <span className={styles["little-spinner-loader"]}></span>
                                : <span>
                                    <GrMagic fontSize={14} color="black" />
                                </span>}
                            <p>
                                {isPublishing ? "Audio Enhacement in Progress" : uuidState ? "Reprocess This Audio" : "Magic Audio Cleaner"}
                            </p>
                        </button>
                        <p
                            style={{ fontSize: '10px', textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => setShowAuphonicAdvanceForm(true)} >
                            <GiSplashyStream />
                            {isPublishing ? "Uploading to the AI machine..." : "Advanced Enhancement"}
                        </p>
                    </div>
                    {
                        ["cut", "trim", "delete recording", "publish"].map(action => (
                            <button disabled={disableButtons(action)} onClick={() => handleClick(action)} key={action} className={action === 'publish' ? styles["publish-btn"] : ""} >
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

export default (EditingControls)
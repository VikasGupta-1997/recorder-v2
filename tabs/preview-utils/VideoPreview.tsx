import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useState, useEffect, memo, useLayoutEffect } from "react"
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import { usePreview } from "../previewContext";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

function VideoPreview({
    blobUrl,
}) {
    const {
        plyrRef,
        isEditMode,
        updateCursorPosition,
        waveSurferRef,
        duration,
        setVideoSource,
        videoSource,
        setDuration,
        setTrimState
    } = usePreview();

    useEffect(() => {
        if (blobUrl) {
            setVideoSource({
                type: "video",
                sources: [
                    {
                        src: blobUrl,
                        type: "video/mp4",
                    },
                ],
            });
        }
    }, [blobUrl]);

    useEffect(() => {
        if (waveSurferRef.current) {
            waveSurferRef.current.on('seeking', () => {
                const currentTime = waveSurferRef.current.getCurrentTime();
                plyrRef.current.plyr.currentTime = currentTime;
                updateCursorPosition(currentTime);
            })
        }
    }, [waveSurferRef.current]);

    useEffect(() => {
        if (duration && plyrRef.current?.plyr) {
            // Force a reload of the player with new duration
            const currentTime = plyrRef.current.plyr.currentTime;
            plyrRef.current.plyr.source = {
                ...videoSource,
                duration: duration
            };
            plyrRef.current.plyr.currentTime = currentTime;
        }
    }, [duration, videoSource]);

    const handleClick = () => {
        if (plyrRef.current && plyrRef.current.plyr && isEditMode) {

            plyrRef.current.plyr.on("timeupdate", () => {
                updateCursorPosition(plyrRef.current.plyr.currentTime)
            });
            plyrRef.current.plyr.on("ended", () => {
                setTrimState(prev => ({ ...prev, duration: plyrRef.current.plyr.currentTime, endTime: plyrRef.current.plyr.currentTime }))
                setDuration(plyrRef.current.plyr.currentTime)
                updateCursorPosition(plyrRef.current.plyr.currentTime)
            });
        }
    };

    const options = {
        controls: [
            "play",
            "mute",
            "progress",
            "current-time",
            "duration",
        ],
        urls: {
            blankVideo: chrome?.runtime ? chrome.runtime.getURL('/blank.mp4') : "/blank.mp4",
        },
        ratio: "16:9",
        keyboard: {
            global: true,
        },
        crossorigin: 'anonymous',
        duration: duration || undefined
    }

    if (!videoSource) {
        return <div>Loading video...</div>;
    }

    return (
        <div onClick={handleClick} className={style["react-player-wrapper-video"]}>
            <Plyr
                ref={plyrRef}
                source={videoSource}
                options={options}
            />
            <style>
                {`
                    .plyr {
                    left: 0px !important;
                    right: 0px !important;
                    margin: 0px !important;
                    top: 0px !important;
                    bottom: 0px !important;
                    position: relative !important;
                    border-radius: 6px !important;
                    }
                    .plyr__progress--played {
                    background-color: #ff5733 !important;
                    }
                    .plyr__controls {
                        background-color: rgba(35, 153, 219, 0.8) !important;
                        padding: 16px 10px! important;
                    }
                `}
            </style>
        </div>
    )
}

export default memo(VideoPreview)
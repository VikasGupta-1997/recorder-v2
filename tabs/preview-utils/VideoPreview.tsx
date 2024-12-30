import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useState, useEffect, memo } from "react"
import ReactPlayer from 'react-player'
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

    const playerRef = useRef(null);

    const bl = async (url) => {
        const video = document.createElement('video');
        video.src = blobUrl;

        video.onloadedmetadata = () => {
            const newDuration = video.duration;
            setDuration(newDuration);
            video.remove();
        };
    }

    useEffect(() => {
        if (blobUrl) {
            bl(blobUrl)
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
                if (playerRef.current) {
                    playerRef.current.seekTo(currentTime);
                }
                updateCursorPosition(currentTime);
            })
        }
    }, [waveSurferRef.current]);

    const handleProgress = (state) => {
        if (isEditMode) {
            updateCursorPosition(state.playedSeconds);
        }
    };

    const handleEnded = () => {
        if (isEditMode && playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            setTrimState(prev => ({ ...prev, duration: currentTime, endTime: currentTime }));
            setDuration(currentTime);
            updateCursorPosition(currentTime);
        }
    };

    const handleDuration = (duration) => {
        setDuration(duration);
    };

    if (!videoSource?.sources?.[0]?.src) {
        return <div>Loading video...</div>;
    }

    return (
        <div className={style["react-player-wrapper-video"]}>
            <ReactPlayer
                ref={playerRef}
                url={videoSource.sources[0].src}
                width="100%"
                height="100%"
                controls={true}
                playing={false}
                onProgress={handleProgress}
                onEnded={handleEnded}
                onDuration={handleDuration}
                progressInterval={100}
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'anonymous'
                        }
                    }
                }}
            />
            <style>
                {`
                    .react-player-wrapper-video {
                        position: relative;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .react-player-wrapper-video video {
                        border-radius: 6px;
                    }
                    .react-player-wrapper-video > div {
                        position: relative !important;
                    }
                `}
            </style>
        </div>
    )
}

export default memo(VideoPreview)
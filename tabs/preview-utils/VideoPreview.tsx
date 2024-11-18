
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useState } from "react"
import { HiOutlineVolumeUp, HiOutlineVolumeOff } from "react-icons/hi";
import { FaPlay, FaPause } from "react-icons/fa";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

export default function VideoPreview({
    videoRef,
    blobUrl
}) {
    const [playing, setPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const plyrRef = useRef(null);

    const handlePlayPause = () => {
        console.log("handlePlayPause Called", playing)
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
        setPlaying(prev => !prev);
    };

    const handleVolumeChange = (event) => {
        const newVolume = event.target.value;
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume; // Update video volume
        }
    };

    const options = {
        controls: [
            "play",
            "mute",
            // "volume",
            "progress",
            "current-time",
            "duration",
        ],
        urls: null,
        ratio: "16:9",
        blankVideo:
            "chrome-extension://" +
            chrome.i18n.getMessage("@@extension_id") +
            "/assets/blank.mp4",
        keyboard: {
            global: true,
        },
    }

    // Plyr configuration
    const videoSource = blobUrl
        ? {
            type: "video",
            sources: [
                {
                    src: blobUrl,
                    type: "video/mp4", // Adjust type if your video format is different
                },
            ],
        }
        : null as any;


    return (
        <div className={style["react-player-wrapper-video "]}>
            {blobUrl ? (
                <Plyr
                    ref={plyrRef}
                    source={videoSource}
                    options={options}
                />
            ) : (
                <p>Loading video preview...</p>
            )}
            <style>
                {`
                    .plyr {
                    max-width: 900px !important;
                    left: 0px !important;
                    right: 0px !important;
                    margin: 0px !important;
                    top: 0px !important;
                    bottom: 0px !important;
                    position: relative !important;
                    border-radius: 6px !important;
                    }
                    .plyr__progress--played {
                    background-color: #ff5733 !important; /* Your custom color */
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
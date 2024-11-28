import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useState, useEffect } from "react"
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

export default function VideoPreview({
    blobUrl,
    blob
}) {
    const plyrRef = useRef(null);
    const [videoSource, setVideoSource] = useState(null);

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
        keyboard: {
            global: true,
        },
    }

    if (!videoSource) {
        return <div>Loading video...</div>;
    }

    return (
        <div className={style["react-player-wrapper-video "]}>
            <Plyr
                ref={plyrRef}
                source={videoSource}
                options={options}
            />
            <style>
                {`
                    .plyr {
                    // max-width: 900px !important;
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
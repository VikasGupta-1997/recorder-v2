import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useRef, useState, useEffect, memo } from "react"
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

function VideoPreview({
    blobUrl,
    setTimeS,
    plyrRef
}) {
    const [videoSource, setVideoSource] = useState(null);
    const [isSet, setIsSet] = useState(false);

    const bl = async (url) => {
        let blob = await fetch(url).then(r => r.blob());
        console.log("blobblob Preivew", blob)
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

    const handleClick = () => {
        setIsSet(true);
        // if (isSet) return;
        if (plyrRef.current && plyrRef.current.plyr) {
            // 
            plyrRef.current.plyr.on("timeupdate", () => {
                console.log("Videow time update:", plyrRef.current.plyr.currentTime);
                setTimeS(plyrRef.current.plyr.currentTime)
            });
        }
    };

    // useEffect(() => {
    //     if (isSet) return;
    //     const handleKeyPress = () => {
    //         if (plyrRef.current && plyrRef.current.plyr) {
    //             setIsSet(true);
    //             plyrRef.current.plyr.on("timeupdate", () => {
    //                 console.log("Video time update from key press:", plyrRef.current.plyr.currentTime);
    //                 setContentState(prev => ({
    //                     ...prev,
    //                     timeData: {
    //                         time: plyrRef.current.plyr.currentTime,
    //                         updatePlayerTime: false
    //                     }
    //                 }));
    //             });
    //         }
    //     };
    //     window.addEventListener("keydown", handleKeyPress);
    //     return () => {
    //         window.removeEventListener("keydown", handleKeyPress);
    //     };
    // }, [isSet]);

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
        crossorigin: 'anonymous'
    }

    if (!videoSource) {
        return <div>Loading video...</div>;
    }

    return (
        <div className={style["react-player-wrapper-video"]}>
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

export default  memo(VideoPreview)
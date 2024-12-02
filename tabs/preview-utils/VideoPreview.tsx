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
    setContentState
}) {
    const plyrRef = useRef(null);
    const [videoSource, setVideoSource] = useState(null);
    console.log("blobUrl22121 Vidoe Preview", blobUrl)

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

    useEffect(() => {
        if (plyrRef.current && plyrRef.current.plyr) {
          // Check when the video is playing, update the time in real time
          plyrRef.current.plyr.on("timeupdate", () => {
            setContentState(prev => ({
                ...prev,
                timeData: {
                    time: plyrRef.current.plyr.currentTime,
                    updatePlayerTime: false
                }
            }))
            // setTimeData({
            //     time: plyrRef.current.plyr.currentTime,
            //     updatePlayerTime: false
            // })
            // setContentState((prevContentState) => ({
            //   ...prevContentState,
            //   time: plyrRef.current.plyr.currentTime,
            //   updatePlayerTime: false,
            // }));
          });
        }
    
        return () => {
          if (plyrRef.current && plyrRef.current.plyr) {
            plyrRef.current.plyr.off("timeupdate");
          }
        };
      }, [plyrRef]);

    const options = {
        controls: [
            "play",
            "mute",
            "progress",
            "current-time",
            "duration",
        ],
        urls: {
            // Use local blank video instead of CDN
            blankVideo: chrome?.runtime ? chrome.runtime.getURL('/blank.mp4') : "/blank.mp4",
        },
        ratio: "16:9",
        keyboard: {
            global: true,
        },
        crossorigin: 'anonymous' // Add CORS support
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
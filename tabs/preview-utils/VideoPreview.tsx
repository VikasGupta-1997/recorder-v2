
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'
import { useState } from "react"
import { HiOutlineVolumeUp, HiOutlineVolumeOff } from "react-icons/hi";
import { FaPlay, FaPause } from "react-icons/fa";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

export default function VideoPreview({
    videoRef
}) {
    const [playing, setPlaying] = useState(true);
    const [volume, setVolume] = useState(1);

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

    return (
        <div className={style["react-player-wrapper-video "]}>
            <video preload="metadata" ref={videoRef} className={style["video"]} id="ext-vid-previewVideo" autoPlay ></video>
            <div className={style["video-controls"]}>
                <button onClick={handlePlayPause}>
                    {playing ? <FaPause size={14} color="white" /> : <FaPlay size={14} color="white" />}
                </button>
                <span className={style["volume-span"]} >
                    {volume === 0 ? <HiOutlineVolumeOff size={18} color="white" /> : <HiOutlineVolumeUp size={18} color="white" />}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        className={style["volume-slider"]}
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{ width: '100px', marginLeft: 12 }}
                    />
                </span>
                <div style={{ color: 'white', marginLeft: 'auto', marginRight: 12 }}>
                    {/* {formatTime(currentTime)} / {formatTime(duration)} */}
                </div>
            </div>
        </div>
    )
}
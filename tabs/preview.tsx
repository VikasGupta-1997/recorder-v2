import { useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import VideoPreview from "./preview-utils/VideoPreview";
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";
import { PreviewProvider, usePreview } from "./previewContext";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

function PreviewPage() {
    const {
        loadingVideo,
        blob,
        blobUrl,
        isAudio,
        audioRef,
        handleCancelEditing,
        changeMode,
        isEditMode,
        isFfmpegLoaded,
        ffmpegLoadError,
        ffmpegRunning,
        isPublishing
    } = usePreview();
    const [showGhost, setShowGhost] = useState(false);
    const containerRef = useRef(null)

    if (loadingVideo) {
        return (
            <div className={style["loading-container"]} >
                <div className={style["loader"]}></div>
            </div>
        )
    }

    return (
        <div className={style["container"]}>
            <span className={style["span-wrapper"]} style={{
                pointerEvents: isPublishing ? 'none' : 'initial'
            }} >
                <h1 className={style["heading-title"]}>
                    <span className={style["title"]} >
                        {`Rec-11122024-desktop.${isAudio === 'video' ? 'mp4' : 'mp3'}`}
                        {" "}
                        <span className={style["edit-icon"]} >
                            <FaRegEdit color={'white'} size={10} />
                        </span>
                    </span>
                    {isEditMode && <span>
                        <button onClick={handleCancelEditing} disabled={ffmpegRunning || isPublishing} className={style["rounded-btn"]}>cancel</button>
                    </span>}
                </h1>
                <div className={style["ref-wrapper"]}>
                    {(isAudio === 'video') && <VideoPreview blobUrl={blobUrl} />
                    }
                    {(isAudio === 'audio') && <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={audioRef} containerRef={containerRef} />}
                </div>
                {(!isEditMode) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={!isFfmpegLoaded || ffmpegRunning || isPublishing} onClick={changeMode} >Edit Video</button></div>}
                {isPublishing && <p className={style["publishing-load-text"]} >Publishing content please wait and do not close the window till upload is not complete.</p>}
                {!isFfmpegLoaded && <p>Please wait editing tool is loading...</p>}
                {ffmpegLoadError && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                {(isEditMode) && <div className={style["editing-control-wrapper"]} >
                    <EditingControls
                        setShowGhost={setShowGhost}
                        showGhost={showGhost}
                    />
                </div>}
            </span>
            {isPublishing && <><div className={style["full-screen-loader"]}>
            </div>
                <div className={style['overlay']} ></div></>}
        </div>
    );
}

const ContextWrappedPreview = () => {
    return (
        <PreviewProvider>
            <PreviewPage />
        </PreviewProvider>
    )
}

export default ContextWrappedPreview;
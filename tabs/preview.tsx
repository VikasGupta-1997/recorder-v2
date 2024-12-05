import { useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import VideoPreview from "./preview-utils/VideoPreview";
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";
import { PreviewProvider, usePreview } from "./previewContext";
import AsyncSelect from 'react-select/async';

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const AsyncPresetsDropDown = ({getPresets}) => {
    const loadOptions = async () => {
        try {
            const presets = await getPresets();
            return presets.map(preset => ({
                label: preset.preset_name, // adjust according to your preset object structure
                value: preset.uuid   // adjust according to your preset object structure
            }));
        } catch (error) {
            return [];
        }
    };

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            placeholder="Select a preset"
            className={style["preset-select"]}
            onChange={(selectedOption) => {
                console.log("Selected:", selectedOption);
            }}
            isSearchable={false}
        />
    )
}

function PreviewPage() {
    const {
        loadingVideo,
        blob,
        blobUrl,
        // isAudio,
        audioRef,
        handleCancelEditing,
        changeMode,
        isEditMode,
        isFfmpegLoaded,
        ffmpegLoadError,
        ffmpegRunning,
        isPublishing,
        getPresets
    } = usePreview();
    const [showGhost, setShowGhost] = useState(false);
    const [isAudio, setIsAudio] = useState('ideal')
    const containerRef = useRef(null)

    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
            console.log("resultresult", result)
            if (result?.isAudioOnly) {
                setIsAudio('audio');
            } else {
                setIsAudio('video');
            }
        });
    }, [blobUrl]);


    if (loadingVideo) {
        return (
            <div className={style["loading-container"]} >
                <div className={style["loader"]}></div>
            </div>
        )
    }
    console.log("isAudio1212", isAudio)
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
            {isPublishing && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
            {/* <AsyncPresetsDropDown getPresets={getPresets} /> */}
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
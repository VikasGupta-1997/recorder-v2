import { useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";
import { AudioOnlyPreviewProvider, useAudioOnlyPreview } from "./audioOnlyPreviewContext";
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
        getPresets,
        getDynamicTimestamp,
        isStreamLoading,
        auphonicAudioRef,
        wrapAuphonicAudioRef,
        normalAudioWrap,
        showAuphonicWrap,
        getAuphonicData
    } = useAudioOnlyPreview();
    const [showGhost, setShowGhost] = useState(false);
    const containerRef = useRef(null)

    useEffect(() => {
        chrome.storage.local.get(["isAudioOnly", "saving_in_indexdb"], async (result) => {
            console.log("resultresult", result)
            if (result?.isAudioOnly) {
            } else {
                // setIsAudio('video');
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
    // console.log("isAudio1212", isAudio)
    return (
        <div className={style["container"]}>
            <span className={style["span-wrapper"]} style={{
                pointerEvents: isPublishing ? 'none' : 'initial'
            }} >
                <h1 className={style["heading-title"]}>
                    <span className={style["title"]} >
                        {`Rec-${getDynamicTimestamp()}-desktop.mp3`}
                        {" "}
                        <span className={style["edit-icon"]} >
                            <FaRegEdit color={'white'} size={10} />
                        </span>
                    </span>
                    {isEditMode && <span>
                        <button onClick={handleCancelEditing} disabled={ffmpegRunning || isPublishing} className={style["rounded-btn"]}>cancel</button>
                    </span>}
                </h1>
                <div className={style["audio-main-wrap"]} >
                    <div ref={normalAudioWrap} className={style["ref-wrapper"]}>
                        <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={audioRef} containerRef={containerRef} />
                    </div>
                    <div ref={wrapAuphonicAudioRef} className={`${style["ref-wrapper"]} ${style["auphonic-wrap"]}`}>
                        <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={auphonicAudioRef} containerRef={containerRef} />
                    </div>
                </div>
                {(!isEditMode && !showAuphonicWrap) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={!isFfmpegLoaded || ffmpegRunning || isPublishing} onClick={changeMode} >Edit Video</button></div>}
                {(isPublishing && !showAuphonicWrap) && <p className={style["publishing-load-text"]} >Publishing content please wait and do not close the window till upload is not complete.</p>}
                {!isFfmpegLoaded && <p>Please wait editing tool is loading...</p>}
                {ffmpegLoadError && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                {(isEditMode && !showAuphonicWrap) && <div className={style["editing-control-wrapper"]} >
                    <EditingControls
                        getAuphonicData={getAuphonicData}
                        isAudio={true}
                        usePreview={useAudioOnlyPreview}
                        setShowGhost={setShowGhost}
                        showGhost={showGhost}
                    />
                </div>}
            </span>
            {(isPublishing || isStreamLoading) && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
            {/* <AsyncPresetsDropDown getPresets={getPresets} /> */}
        </div>
    );
}

const ContextWrappedPreview = () => {
    return (
        <AudioOnlyPreviewProvider>
            <PreviewPage />
        </AudioOnlyPreviewProvider>
    )
}

export default ContextWrappedPreview;
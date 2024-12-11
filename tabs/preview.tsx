import { useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import VideoPreview from "./preview-utils/VideoPreview";
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";
import { PreviewProvider, usePreview } from "./previewContext";
import AsyncSelect from 'react-select/async';
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const AsyncPresetsDropDown = ({ getPresets }) => {
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
        auphonicPlyrRef,
        auphonicVideoUrlPreview,
        showAuphonicPreview
    } = usePreview();
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
                        {`Rec-${getDynamicTimestamp()}-desktop.mp4`}
                        {" "}
                        <span className={style["edit-icon"]} >
                            <FaRegEdit color={'white'} size={10} />
                        </span>
                    </span>
                    {isEditMode && <span>
                        <button onClick={handleCancelEditing} disabled={ffmpegRunning || isPublishing} className={style["rounded-btn"]}>cancel</button>
                    </span>}
                </h1>
                <div className={style["video-wrapper"]} >
                    <div className={style["editing-video-wrapper"]}>
                        <div className={`${style["ref-wrapper"]} ${auphonicVideoUrlPreview ? style['auphonic-video'] : ''}`}>
                            <VideoPreview blobUrl={blobUrl} />
                        </div>
                        {(!isEditMode && !auphonicVideoUrlPreview) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={!isFfmpegLoaded || ffmpegRunning || isPublishing} onClick={changeMode} >Edit Video</button></div>}
                        {(isPublishing && !auphonicVideoUrlPreview) && <p className={style["publishing-load-text"]} >Publishing content please wait and do not close the window till upload is not complete.</p>}
                        {(!isFfmpegLoaded && !auphonicVideoUrlPreview) && <p>Please wait editing tool is loading...</p>}
                        {(ffmpegLoadError) && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                        {(isEditMode && !auphonicVideoUrlPreview) && <div className={style["editing-control-wrapper"]} >
                            <EditingControls
                                getAuphonicData={() => {
                                    console.log("Calle!!!")
                                    showAuphonicPreview('http://localhost:8080/stream?url=https://auphonic.com/api/download/audio-result/NUYfWXQdYdZoAAnVxzhsGf/video_1733317538274_zkkh0nln.mp4')
                                }}
                                isAudio={false}
                                usePreview={usePreview}
                                setShowGhost={setShowGhost}
                                showGhost={showGhost}
                            />
                        </div>}
                    </div>
                    {auphonicVideoUrlPreview && <div className={`${style["ref-wrapper"]} ${auphonicVideoUrlPreview ? style['auphonic-video'] : ''}`}>
                        <AuphonicVideoPreview auphonicVideoUrlPreview={auphonicVideoUrlPreview} auphonicPlyrRef={auphonicPlyrRef} />
                    </div>}
                </div>

            </span>
            {isPublishing && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
            {/* <AsyncPresetsDropDown getPresets={getPresets} /> */}
        </div>
    );
}

const AuphonicVideoPreview = ({ auphonicPlyrRef, auphonicVideoUrlPreview }) => {
    return <>
        <div className={style["react-player-wrapper-video"]}>
            <Plyr
                ref={auphonicPlyrRef}
                crossOrigin="anonymous"
                source={{
                    type: "video",
                    sources: [
                        {
                            src: auphonicVideoUrlPreview,
                            type: "video/mp4",
                        },
                    ],
                }}
                options={{
                    controls: [
                        "play",
                        "mute",
                        "progress",
                        "current-time",
                        "duration",
                    ],
                    ratio: "16:9",
                    keyboard: {
                        global: true,
                    },
                }}
            />
            {/* <video
                style={{ 
                    height: "200px",
                    width: '500px'
                 }}
                controls
                crossOrigin="anonymous"
                src="http://localhost:8080/video?url=https://auphonic.com/api/download/audio-result/NUYfWXQdYdZoAAnVxzhsGf/video_1733317538274_zkkh0nln.mp4"
            /> */}
            {/* <button onClick={async () => {
                console.log("Called")
                const response = await fetch('http://localhost:8080/test?url="https://adilo.com"')
                const jsonResponse = await response.json();
                console.log("jsonResponse", jsonResponse)
            }} >
                CLick
            </button> */}
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
    </>
}

const ContextWrappedPreview = () => {
    return (
        <PreviewProvider>
            <PreviewPage />
        </PreviewProvider>
    )
}

export default ContextWrappedPreview;
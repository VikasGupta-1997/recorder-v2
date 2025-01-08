import { useEffect, useMemo, useRef, useState } from "react";
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
import AdvanceAuphonicForm from "./preview-utils/AdvanceAuphonicForm";
import ConfirmationModal from "./preview-utils/AuphonicConfirmation";

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
        auphonicVideoUrlPreview,
        showAuphonicPreview,
        auphonicPlyrRef,
        isVideoEndcoding,
        audioF,
        showAuphonicAdvanceForm,
        setShowAuphonicAdvanceForm,
        confirmSendToAuphonic,
        setConfirmSendToAuphonic,
        startAuphonicAudioProcessing,
        uuidState,
        history,
        redoHistory,
        showConfirmation,
        auphonicProcessingError,
        setAuphonicProcessingError,
        cutDataState,
        auphonicAlgorithm
    } = usePreview();
    const [showGhost, setShowGhost] = useState(false);

    const recordingName = useMemo(() => {
        return `Rec-${getDynamicTimestamp()}-desktop.mp4`
    }, [])


    if (loadingVideo) {
        return (
            <div className={style["loading-container"]} >
                <div className={style["loader"]}></div>
            </div>
        )
    }

    const lastHistoryData = history[history.length - 1];
    // console.log("Check Historyyyy", history)
    // console.log(cutDataState,"lastHistoryDatalastHistoryData", lastHistoryData)
    const reprocessState = cutDataState?.find(cut => cut.id === lastHistoryData?.uniqid)
    // console.log("reprocessStatereprocessState", reprocessState)

    // console.log(showConfirmation.current, "history", history)
    // console.log("Redo History", redoHistory)
    return (
        <div id="container" className={style["container"]}>
            <span className={style["span-wrapper"]} style={{
                pointerEvents: isPublishing ? 'none' : 'initial'
            }} >
                <h1 className={style["heading-title"]}>
                    <span className={style["title"]} >
                        {recordingName}
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
                        <div className={`${style["ref-wrapper-video"]} ${auphonicVideoUrlPreview ? style['auphonic-video'] : ''}`}>
                            <VideoPreview blobUrl={blobUrl} />
                        </div>
                        {(!isEditMode && !auphonicVideoUrlPreview) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={
                            // isVideoEndcoding || 
                            !isFfmpegLoaded ||
                            ffmpegRunning || isPublishing} onClick={changeMode} >Edit Video</button></div>}
                        {(isPublishing && !auphonicVideoUrlPreview) && <p className={style["publishing-load-text"]} >Publishing content please wait and do not close the window till upload is not complete.</p>}
                        {(!isFfmpegLoaded && !auphonicVideoUrlPreview) && <p>Please wait editing tool is loading...</p>}
                        {(ffmpegLoadError) && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                        {(isEditMode && !auphonicVideoUrlPreview) && <div className={style["editing-control-wrapper"]} >
                            <EditingControls
                                getAuphonicData={() => {}}
                                isAudio={false}
                                usePreview={usePreview}
                                setShowGhost={setShowGhost}
                                showGhost={showGhost}
                            />
                        </div>}
                    </div>
                    {auphonicVideoUrlPreview && <div className={`${style["ref-wrapper-video"]} ${auphonicVideoUrlPreview ? style['auphonic-video'] : ''}`}>
                        <AuphonicVideoPreview auphonicVideoUrlPreview={auphonicVideoUrlPreview} auphonicPlyrRef={auphonicPlyrRef} />
                    </div>}
                </div>
            </span>
            {auphonicProcessingError &&  <ConfirmationModal
                body={<div>
                    <p>
                        Audio Enhancement Failed , Please contact support!!
                    </p>
                </div>}
                showActions={false}
                onSubmit={() => {}}
                title="Audio Enhancement Failed."
                onClose={() => setAuphonicProcessingError(null)} />}
            {(confirmSendToAuphonic && showConfirmation.current) && <ConfirmationModal
                body={<div>
                    <p>Enhancing the audio of this recording wil consume 15 minutes from you AI credits.</p>
                    <p>Do you want to continue ?</p>
                </div>}
                onSubmit={startAuphonicAudioProcessing}
                title="Audio Enhancement"
                onClose={() => setConfirmSendToAuphonic(false)} />}
            {showAuphonicAdvanceForm && <AdvanceAuphonicForm auphonicAlgorithm={auphonicAlgorithm} startAuphonicAudioProcessing={startAuphonicAudioProcessing} uuidState={uuidState} setConfirmSendToAuphonic={setConfirmSendToAuphonic} onClose={() => setShowAuphonicAdvanceForm(false)} />}
            {isPublishing && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
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
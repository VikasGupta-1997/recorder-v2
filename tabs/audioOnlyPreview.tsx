import { useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import AudioPreview from "./preview-utils/AudioPreview";
import EditingControls from "./preview-utils/EditingControls";
import { AudioOnlyPreviewProvider, useAudioOnlyPreview } from "./audioOnlyPreviewContext";
import AdvanceAuphonicForm from "./preview-utils/AdvanceAuphonicForm";
import ConfirmationModal from "./preview-utils/AuphonicConfirmation";
import { toast, ToastContainer } from 'react-toastify';
import { CircularProgress } from "./preview";
import { UploadFailRainIcon } from "~utils/Icons";
import { FiLink2 } from "react-icons/fi";
import { calculateTimeFromSize } from "~utils/fileSizeToTimeConversion";

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
        // isAudio,
        audioRef,
        handleCancelEditing,
        changeMode,
        isEditMode,
        isFfmpegLoaded,
        ffmpegLoadError,
        ffmpegRunning,
        isPublishing,
        normalAudioWrap,
        showAuphonicWrap,
        setShowAuphonicAdvanceForm,
        showAuphonicAdvanceForm,
        confirmSendToAuphonic,
        isVideoEndcoding,
        setConfirmSendToAuphonic,
        startAuphonicAudioProcessing,
        auphonicProcessingError,
        setAuphonicProcessingError,
        auphonicAlgorithm,
        recordingName,
        handlePublish,
        confirmPublish,
        setConfirmPublish,
        uploadProgressRef,
        uploadStatus,
        setUploadStatus,
        progressStrokeWidth,
        uploadError,
        setUploadError,
        downloadBlob,
        publishedData,
        publishingUpload,
        duration,
        latestAuphonicDataRef,
        isModalOpened
    } = useAudioOnlyPreview();

    const [showGhost, setShowGhost] = useState(false);
    const containerRef = useRef(null)

    const confirmPublishing = () => {
        setConfirmPublish(true)
    }

    if (loadingVideo) {
        return (
            <div className={style["loading-container"]} >
                <div className={style["loader"]}></div>
            </div>
        )
    }
    
    return (
        <div id="container" className={style["container"]}>
            <span className={style["span-wrapper"]} style={{
                pointerEvents: isPublishing ? 'none' : 'initial'
            }} >
                <h1 style={{ width: '50%' }} className={style["heading-title"]}>
                    <span className={style["title"]} >
                        {recordingName}
                        {" "}
                        <span className={style["edit-icon"]} >
                            <FaRegEdit color={'white'} size={10} />
                        </span>
                    </span>
                    {(isEditMode && !publishedData) && <span>
                        <button onClick={handleCancelEditing} disabled={ffmpegRunning || isPublishing} className={style["rounded-btn"]}>cancel</button>
                    </span>}
                </h1>
                <div className={style["audio-main-wrap"]} >
                    <div ref={normalAudioWrap} className={style["ref-wrapper"]}>
                        <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={audioRef} containerRef={containerRef} />
                    </div>
                </div>
                {/* <input type={"file"} onChange={e => {
                     const file = e.target.files[0];
                     const blob = new Blob([file], { type: file.type });
                     handlePublish(file)
                }} /> */}
                {(!isEditMode && !showAuphonicWrap && !publishedData) && <div className={`${style['edit-mode-btn-audio']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={!isFfmpegLoaded || ffmpegRunning || isPublishing || isVideoEndcoding} onClick={changeMode} >Edit Video</button></div>}
                {(isPublishing && !showAuphonicWrap) && <p className={style["publishing-load-text"]} >{
                 publishingUpload ? "Publishing content , please wait and do not close the window till upload is not complete." 
                            : "Enhancing your audio for crystal sound, please do not close this window till the process is complete."
                }</p>}
                {!isFfmpegLoaded && <p>Please wait editing tool is loading...</p>}
                {ffmpegLoadError && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                {(isEditMode && !showAuphonicWrap && !publishedData) && <div className={style["editing-control-wrapper"]} >
                    <EditingControls
                        isModalOpened={isModalOpened}
                        publishBlob={confirmPublishing}
                        isAudio={true}
                        usePreview={useAudioOnlyPreview}
                        setShowGhost={setShowGhost}
                        showGhost={showGhost}
                    />
                </div>}
                {
                    publishedData && <div className={style["copy-link-div"]} >
                        <input type="text" disabled value={publishedData.video.location} />
                        <button onClick={e => {
                            const linkValue = publishedData.video.location;
                            if (linkValue) {
                                navigator.clipboard.writeText(linkValue).then(() => {
                                    toast.success("copied to clipboard!")
                                }).catch((err) => {
                                    console.error("Failed to copy text: ", err);
                                });
                            }
                        }} type="button" >
                            <FiLink2 /> Copy link
                        </button>
                    </div>
                }
            </span>
            {auphonicProcessingError && <ConfirmationModal
                body={<div>
                    <p>
                    You don't have enough AI credits to enhance this audio, login to your Adilo account and top up your AI credits to continue.
                    </p>
                </div>}
                showActions={false}
                onSubmit={() => { }}
                title="Audio Enhancement Failed."
                onClose={() => setAuphonicProcessingError(null)} />}
            {(confirmSendToAuphonic || confirmPublish) && <ConfirmationModal
                isPublishMode={confirmPublish}
                onSubmit={confirmPublish ? handlePublish : startAuphonicAudioProcessing}
                body={confirmPublish ? <p>Are you sure you want to publish this audio ?</p> : <div>
                    <p>{latestAuphonicDataRef.current?.uuid ? 'Enhancing the audio of this recording will be free as you are editing existing record.' : `Enhancing the audio of this recording wil consume ${calculateTimeFromSize(duration || 0)} from you AI credits.`}</p>
                    <p>Do you want to continue ?</p>
                </div>}
                title={confirmPublish ? "Save to Adilo" : "Audio Enhancement"}
                onClose={() => {
                    setConfirmPublish(false)
                    setConfirmSendToAuphonic(false)
                }} />}
            {
                uploadStatus && <ConfirmationModal
                    centeredHeading={true}
                    body={<div className={style["progress-body"]}>
                        <div className={style["progress-container"]} >
                            <CircularProgress uploadProgressRef={uploadProgressRef} progressStrokeWidth={progressStrokeWidth} />
                        </div>
                        <p className="" >Do not disconnect your internet or close this page.</p>
                    </div>}
                    showActions={false}
                    onSubmit={() => { }}
                    title={"Upload in Progress"}
                    onClose={() => {
                        setUploadStatus(null)
                    }}
                />
            }
            {
                uploadError && <ConfirmationModal
                    centeredHeading={true}
                    body={<div className={style["progress-body"]}>
                        <div className={style["progress-container"]}>
                            <UploadFailRainIcon />
                        </div>
                        <div className={style["upload-fail-controls"]} style={{}} >
                            <p onClick={() => {
                                handlePublish()
                                setUploadError(false)
                            }} style={{ cursor: 'pointer' }} >Try again</p>
                            <button onClick={downloadBlob} className={`${style["rounded-btn"]} ${style['publish-btn']}`}>Download Recording</button>
                        </div>
                    </div>}
                    showActions={false}
                    onSubmit={() => { }}
                    title={"Upload Failed"}
                    onClose={() => {
                        setUploadStatus(null)
                    }}
                />
            }
            {showAuphonicAdvanceForm && <AdvanceAuphonicForm auphonicAlgorithm={auphonicAlgorithm} startAuphonicAudioProcessing={startAuphonicAudioProcessing} uuidState={null} setConfirmSendToAuphonic={setConfirmSendToAuphonic} onClose={() => setShowAuphonicAdvanceForm(false)} />}
            {(isPublishing) && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
            <ToastContainer />
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
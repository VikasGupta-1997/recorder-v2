import { useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import VideoPreview from "./preview-utils/VideoPreview";
import EditingControls from "./preview-utils/EditingControls";
import { PreviewProvider, usePreview } from "./previewContext";
import "plyr-react/plyr.css";
import AdvanceAuphonicForm from "./preview-utils/AdvanceAuphonicForm";
import ConfirmationModal from "./preview-utils/AuphonicConfirmation";
import { toast, ToastContainer } from 'react-toastify';
import { UploadFailRainIcon } from "~utils/Icons";
import { FiLink2 } from "react-icons/fi";
import { calculateTimeFromSize } from "~utils/fileSizeToTimeConversion";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

export const CircularProgress = ({ uploadProgressRef, progressStrokeWidth }) => {
    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <div ref={progressStrokeWidth} >
                <svg
                    height={5 * 2}
                    width={5 * 2}
                    style={{
                        transform: "rotate(-90deg)"
                    }}
                >
                    <circle
                        stroke="#CEEFFC"
                        fill="transparent"
                        strokeWidth={5}
                        r={42.5}
                        cx={45}
                        cy={45}
                    />
                </svg>
            </div>
            <p
                ref={uploadProgressRef}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    margin: 0,
                    fontSize: "14px",
                    color: "#0DABD8",
                    fontWeight: 'bold'
                }}
            >
                {""}
            </p>
        </div>
    );
};


function PreviewPage() {
    const {
        loadingVideo,
        blobUrl,
        handleCancelEditing,
        changeMode,
        isEditMode,
        isFfmpegLoaded,
        ffmpegLoadError,
        ffmpegRunning,
        isPublishing,
        auphonicVideoUrlPreview,
        showAuphonicAdvanceForm,
        setShowAuphonicAdvanceForm,
        confirmSendToAuphonic,
        setConfirmSendToAuphonic,
        startAuphonicAudioProcessing,
        uuidState,
        history,
        auphonicProcessingError,
        setAuphonicProcessingError,
        cutDataState,
        auphonicAlgorithm,
        handlePublish,
        recordingName,
        confirmPublish,
        setConfirmPublish,
        uploadStatus,
        setUploadStatus,
        uploadProgressRef,
        progressStrokeWidth,
        uploadError,
        setUploadError,
        downloadBlob,
        publishedData,
        publishingUpload,
        duration,
        latestAuphonicDataRef,
        isModalOpened,
        isVideoEndcoding
    } = usePreview();
    const [showGhost, setShowGhost] = useState(false);

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

    const getVideoKeyFromUrl = (url) => {
        const splittedUrl = url.split("/")
        return splittedUrl[splittedUrl.length - 1].split('.')[0]
    }

    return (
        <div id="container" className={style["container"]}>
            <span className={style["span-wrapper"]} style={{
                pointerEvents: isPublishing ? 'none' : 'initial'
            }} >
                {publishedData ? <h1 style={{
                    color: '#0DABD8',
                    fontSize: '32px',
                    fontWeight: 500
                }} >
                    Success! Recording Uploaded
                </h1> : <h1 className={style["heading-title"]}>
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
                </h1>}
                <div className={style["video-wrapper"]} >
                    <div className={style["editing-video-wrapper"]}>
                        <div className={`${style["ref-wrapper-video"]} ${auphonicVideoUrlPreview ? style['auphonic-video'] : ''}`}>
                            <VideoPreview blobUrl={blobUrl} />
                        </div>
                        {(!isEditMode && !auphonicVideoUrlPreview && !publishedData) && <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} disabled={!isFfmpegLoaded || ffmpegRunning || isPublishing || isVideoEndcoding} onClick={changeMode} >Edit Video</button></div>}
                        {(isPublishing && !auphonicVideoUrlPreview) && <p className={style["publishing-load-text"]} >{
                            publishingUpload ? "Publishing content , please wait and do not close the window till upload is not complete."
                                : "Enhancing your audio for crystal sound, please do not close this window till the process is complete."
                        }</p>}
                        {(!isFfmpegLoaded && !auphonicVideoUrlPreview) && <p>Please wait editing tool is loading...</p>}
                        {(ffmpegLoadError) && <p className={`${style['error']}`}>Cannot edit video, editing tool not supported for your browser !!</p>}
                        {(isEditMode && !auphonicVideoUrlPreview && !publishedData) && <div className={style["editing-control-wrapper"]} >
                            <EditingControls
                                publishBlob={confirmPublishing}
                                isAudio={false}
                                usePreview={usePreview}
                                setShowGhost={setShowGhost}
                                showGhost={showGhost}
                                isModalOpened={isModalOpened}
                            />
                        </div>}
                        {/* <input type="file" onChange={e => {
                            handlePublish(e.target.files[0])
                        }} /> */}
                        {
                            publishedData && <div className={style["copy-link-div"]} >
                                <input type="text" disabled value={`https://adilo.bigcommand.com/watch/${getVideoKeyFromUrl(publishedData.video.location)}`} />
                                <button onClick={() => {
                                    const linkValue = `https://adilo.bigcommand.com/watch/${getVideoKeyFromUrl(publishedData.video.location)}`;
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
                                <button className={style['publish-btn']} onClick={downloadBlob}>Download</button>
                            </div>
                        }
                    </div>
                </div>
            </span>
            {/* <div>
                <input type="file" onChange={e => {
                    const file = e.target.files[0];
                    handlePublish(file)
                }} />
            </div>
            <div style={{
                display: 'flex',
                gap: '1rem'
            }} >
                <button type="button" style={{cursor: 'pointer'}} onClick={handlePauseUpload}>Pause</button>
                <button type="button" style={{cursor: 'pointer'}} onClick={handleResumeUpload}>Resume</button>
            </div> */}
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
            {((confirmSendToAuphonic) || confirmPublish) && <ConfirmationModal
                body={confirmPublish ? <p>Are you sure you want to publish this video ?</p> : <div>
                    <p>{latestAuphonicDataRef.current?.uuid ? 'Enhancing the audio of this recording will be free as you are editing existing record.' : `Enhancing the audio of this recording wil consume ${calculateTimeFromSize(duration || 0)} from you AI credits.`}</p>
                    <p>Do you want to continue ?</p>
                </div>}
                isPublishMode={confirmPublish}
                onSubmit={confirmPublish ? handlePublish : startAuphonicAudioProcessing}
                title={confirmPublish ? "Save to Adilo" : "Audio Enhancement"}
                onClose={() => {
                    setConfirmPublish(false)
                    setConfirmSendToAuphonic(false)
                }} />}
            {/* <input type={"file"} onChange={e => {
                     const file = e.target.files[0];
                     const blob = new Blob([file], { type: file.type });
                     handlePublish(file)
                }} /> */}
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
            {showAuphonicAdvanceForm && <AdvanceAuphonicForm auphonicAlgorithm={auphonicAlgorithm} startAuphonicAudioProcessing={startAuphonicAudioProcessing} uuidState={uuidState} setConfirmSendToAuphonic={setConfirmSendToAuphonic} onClose={() => setShowAuphonicAdvanceForm(false)} />}
            {(isPublishing && !uploadStatus) && <>
                <div className={style["full-screen-loader"]} />
                <div className={style['overlay']} />
            </>}
            <ToastContainer />
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
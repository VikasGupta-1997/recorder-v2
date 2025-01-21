import React from 'react'
import UserInfo from "./UserInfo"
import { HiDotsHorizontal } from "react-icons/hi";
import './list.css'
import CustomMenu from "~components/Menu";
import { FaLink } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { CiEdit, CiGlobe } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import fetchImageAsBase64 from "~utils/fetchImageAsBase64";
import { processingImage } from '~utils/mediaProcessing'
import { FaPause, FaPlay } from "react-icons/fa6";
import formatBlobSize from '~utils/formatBlobSize';
import convertTime from '~utils/convertTime';

const UploadStatus = ({
    uploadData,
    handlePause,
    handleResume,
    tabId,
    pausePlay,
    handleDeleteUpload
}) => {
    const progressBarRef = useRef(null);
    const progressPercentRef = useRef(null);
    const progressUploadSizeRef = useRef(null);
    const progressTimeLeftRef = useRef(null);
    const fileNameRef = useRef(null);

    React.useEffect(() => {
        if (uploadData) {
            if (progressBarRef.current) {
                progressBarRef.current.style.width = `${uploadData.progress}%`;
            }
            if (progressPercentRef.current) {
                progressPercentRef.current.innerText = `Uploading ${uploadData.progress}%`;
            }
            if (progressUploadSizeRef.current) {
                progressUploadSizeRef.current.innerText = `${formatBlobSize(uploadData?.uploadSize)} of ${formatBlobSize(uploadData?.totalSize)}`;
            }
            if (progressTimeLeftRef.current) {
                progressTimeLeftRef.current.innerText = `${convertTime(uploadData?.timeLeft)} left`;
            }
            if (fileNameRef.current) {
                fileNameRef.current.innerText = uploadData.recordingName;
            }
        }
    }, [uploadData]);

    return <div className="upload-status" >
        <div className="flex justify-between" >
            <p className={"name"} ref={fileNameRef} >{""}</p>
            <HiDotsHorizontal size={24} />
        </div>
        <div className="flex gap-2 items-center" >
            <div
                style={{
                    width: "100%",
                    height: "10px",
                    backgroundColor: "#CEEFFC", // Background color of the progress bar
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
            >
                <div
                    // ref={refs?.progressBarRef}
                    style={{
                        height: "100%",
                        backgroundColor: "#0DABD8", // Color of the progress
                        transition: "width 0.2s", // Smooth transition for width change
                        width: `${uploadData?.progress}%`
                    }}
                ></div>
            </div>
            <div className="flex gap-2 items-center" >
                {
                    pausePlay?.[tabId] === 'resume' ? <FaPlay onClick={async () => {
                        handleResume(uploadData, tabId)
                    }} cursor={'pointer'} size={18} /> : <FaPause onClick={() => {
                        handlePause(uploadData, tabId)
                    }} cursor={'pointer'} size={18} />
                }
                <FaRegTrashAlt onClick={() => handleDeleteUpload(uploadData, tabId)} cursor={'pointer'} size={15} color="red" />
            </div>
        </div>
        <div className="data-info flex gap-4" >
            <p ref={progressPercentRef} >{""}</p>
            <p ref={progressUploadSizeRef} >{""}</p>
            <p ref={progressTimeLeftRef} >{""}</p>
        </div>
    </div>
}

const ListComponent = ({
    projectList,
    // mediaFiles,
    setInRecordingMode,
    userDetails,
    selectedProjected,
    projectListLoading,
    mediaListLoading,
    handleProjectChange,
}) => {
    // const refs = useRef({});
    // const [refs, setRefs] = useState({});
    const [thumbnails, setThumbnails] = useState({})
    const [uploadKeys, setUploadKeys] = useState([]);
    const [pausePlay, setPausePlay] = useState({})
    const [mediaFilesRef, setMediaFilesRef] = useState([])
    const handleMenuClick = async (item) => {
        console.log("Item==>", item)
    }
    const uploadDataRef = useRef({});
    useEffect(() => {
        const loadThumbnails = async (mediaFiles) => {
            const promises = mediaFiles.map(async (l) => {
                const base64 = l.thumbnail.includes("sunshine.website") ? processingImage : await fetchImageAsBase64(l.thumbnail);
                return { id: l.id, base64 };
            });

            const results = await Promise.all(promises);
            const thumbnailMap = results.reduce((acc, item) => {
                acc[item.id] = item.base64;
                return acc;
            }, {});
            setThumbnails(thumbnailMap);
        };
        chrome.storage.onChanged.addListener((changes, areaName) => {
            // Check if the storage area is 'local'
            if (areaName === 'local') {
                // Check if the 'mediaFiles' key has been changed
                if (changes.mediaFiles) {
                    const { oldValue, newValue } = changes.mediaFiles;
                    // console.log(`"mediaFiles" key changed in storage.local.`);
                    // console.log(`Old value:`, oldValue);
                    // console.log(`New value:`, newValue);
                    // mediaFilesRef.current = newValue
                    setMediaFilesRef(newValue)
                    loadThumbnails(newValue);
                    // Perform additional actions if needed
                }
            }
        });

        chrome.storage.local.get(["mediaFiles", "uploadsData", "playResumeUpload"], result => {
            const mediaFiles = result.mediaFiles
            const uploadData = result.uploadsData
            console.log(result?.playResumeUpload ,uploadData, "In Lisrt Pagw!!", mediaFiles)
            setMediaFilesRef(mediaFiles)
            loadThumbnails(mediaFiles);
            if(Object.keys((result?.playResumeUpload || {}))?.length > 0) {
                setPausePlay(result?.playResumeUpload)
            }
            if (Object.keys(uploadData)?.length > 0) {
                uploadDataRef.current = uploadData;
                const keys = Object.keys(uploadData)
                setUploadKeys(keys)
            }
        })

        chrome.runtime.onMessage.addListener(
            async function (message) {
                switch (message.type) {
                    case "upload-status": {
                        const { uploadStatus, recordingName, tabId } = message;
                        const newUploadData = {
                            ...uploadDataRef.current, // Copy current data
                            [tabId]: {
                                ...uploadStatus,
                                recordingName,
                                tabId
                            },
                        };
                        uploadDataRef.current = newUploadData;
                        if (uploadStatus.progress === 100) {
                            delete newUploadData[tabId]
                        }
                        setUploadKeys(Object.keys(newUploadData)); //
                        await chrome.storage.local.set({ "uploadsData": newUploadData })
                    }
                        break;
                }
            })
    }, []);

    const handlePause = async (data, tabId) => {
        console.log("Pause data", data, tabId)
        const playPause = { ...pausePlay, [tabId]: 'resume' }
        setPausePlay(playPause)
        chrome.runtime.sendMessage({ type: "PAUSE_UPLOAD_BG", data: tabId })
        await chrome.storage.local.set({ "playResumeUpload": playPause })
    }

    const handleResume = async (data, tabId) => {
        console.log("Resume data", data, tabId)
        const playPause = { ...pausePlay, [tabId]: 'pause' }
        setPausePlay(playPause)
        chrome.runtime.sendMessage({ type: "RESUME_UPLOAD_BG", data: tabId })
        await chrome.storage.local.set({ "playResumeUpload": playPause })
    }

    const handleDeleteUpload = async (data,tabId) => {
        const newUploadData = {
            ...uploadDataRef.current, // Copy current data
        };
        uploadDataRef.current = newUploadData;
        delete newUploadData[tabId]
        setUploadKeys(Object.keys(newUploadData)); //
        chrome.runtime.sendMessage({ type: "DELETE_UPLOAD_BG", data: tabId })
        await chrome.storage.local.set({ "uploadsData": newUploadData })
    }

    return (
        <div className="" >
            <UserInfo
                selectedProjected={selectedProjected}
                projectList={projectList}
                loading={projectListLoading}
                setInRecordingMode={setInRecordingMode}
                handleProjectChange={handleProjectChange}
                userDetails={userDetails} />
            <hr />
            <div className='py-2 px-6' >
                <p className='font-bold' >Recent Files</p>
                <div className='max-h-[160px] overflow-auto' >
                    {uploadKeys.map((id) => (
                        <UploadStatus
                            key={id}
                            tabId={id}
                            pausePlay={pausePlay}
                            handlePause={handlePause}
                            handleResume={handleResume}
                            handleDeleteUpload={handleDeleteUpload}
                            uploadData={uploadDataRef.current[id]} // Pass current ref data
                        />
                    ))}
                </div>
                {/* {uploadStatus && <UploadStatus fileNameref={fileNameref} progressTimeLeft={progressTimeLeft} progressUploadSize={progressUploadSize} progressPercent={progressPercent} progressBarRef={progressBarRef} />} */}
                <div className="min-h-[100px] max-h-[250px] overflow-auto" >
                    {mediaListLoading ? <div className="flex items-center justify-center" ><div className="loader" ></div></div> : !mediaFilesRef?.length ? <p className="text-center" > No items to show !</p> :
                        mediaFilesRef?.map(l => {
                            return (
                                <div className=" flex justify-between items-center" key={l.id} >
                                    <div className="flex items-center gap-2" >
                                        <div className="cursor-pointer w-[60px] h-[60px] flex items-center " >
                                            <a target="_blank" href={l.embed_url} ><img className="rounded-md" src={thumbnails[l.id]} /></a>
                                        </div>
                                        <p title={l.title} className="text-base truncate-text" >{l.title.length > 40
                                            ? `${l.title.substring(0, 24)}...${l.title.slice(-6)}`
                                            : l.title}</p>
                                    </div>
                                    <div>
                                        <CustomMenu
                                            menuButton={<HiDotsHorizontal
                                                className="cursor-pointer"
                                                size={20}
                                            />}
                                            direction={mediaFilesRef?.length < 3 ? "top" : "bottom"}
                                            menuList={[{ id: 1, icon: <FaLink />, label: 'Copy link', item: l },
                                            { id: 2, icon: <MdAlternateEmail />, label: 'Share Via email', item: l },
                                            { id: 3, icon: <CiEdit />, label: 'Open in editor', item: l },
                                            { id: 4, icon: <CiGlobe />, label: 'Open in browser', item: l },
                                            { id: 5, icon: <FaRegTrashAlt color="red" />, label: 'Delete file', item: l }]} onMenuClick={handleMenuClick} />
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}

export default ListComponent
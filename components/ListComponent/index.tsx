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

const UploadStatus = ({ progressBarRef, progressPercent, progressUploadSize, progressTimeLeft, fileNameref }) => {
    return <div className="upload-status" >
        <div className="flex justify-between" >
            <p className={"name"} ref={fileNameref} >{""}</p>
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
                    ref={progressBarRef}
                    style={{
                        height: "100%",
                        backgroundColor: "#0DABD8", // Color of the progress
                        transition: "width 0.2s", // Smooth transition for width change
                    }}
                ></div>
            </div>
            <div className="flex gap-2 items-center" >
                <FaPause onClick={() => {
                    chrome.runtime.sendMessage({type: "PAUSE_UPLOAD"})
                }} cursor={'pointer'} size={18} />
                <FaRegTrashAlt cursor={'pointer'} size={15} color="red" />
            </div>
        </div>
        <div className="data-info flex gap-4" >
            <p ref={progressPercent} >{""}</p>
            <p ref={progressUploadSize} >{""}</p>
            <p ref={progressTimeLeft}>{""}</p>
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
    progressBarRef,
    progressPercent,
    progressTimeLeft,
    fileNameref,
    uploadStatus,
    progressUploadSize
}) => {
    const [thumbnails, setThumbnails] = useState({})
    const [mediaFilesRef, setMediaFilesRef] = useState([])
    const handleMenuClick = async (item) => {
        console.log("Item==>", item)
    }

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
                    console.log(`"mediaFiles" key changed in storage.local.`);
                    console.log(`Old value:`, oldValue);
                    console.log(`New value:`, newValue);
                    // mediaFilesRef.current = newValue
                    setMediaFilesRef(newValue)
                    loadThumbnails(newValue);
                    // Perform additional actions if needed
                }
            }
        });
    
        chrome.storage.local.get(["mediaFiles"], result => {
            const mediaFiles = result.mediaFiles
            console.log("In Lisrt Pagw!!", mediaFiles)
            // mediaFilesRef.current = mediaFiles
            setMediaFilesRef(mediaFiles)
            loadThumbnails(mediaFiles);
        })
       

    }, []);

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
                {true && <UploadStatus fileNameref={fileNameref} progressTimeLeft={progressTimeLeft} progressUploadSize={progressUploadSize} progressPercent={progressPercent} progressBarRef={progressBarRef} />}
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
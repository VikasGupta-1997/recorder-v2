import UserInfo from "./UserInfo"
import { HiDotsHorizontal } from "react-icons/hi";
import './list.css'
import CustomMenu from "~components/Menu";
import { FaLink } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { CiEdit, CiGlobe } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import fetchImageAsBase64 from "~utils/fetchImageAsBase64";

const ListComponent = ({
    projectList,
    mediaFiles,
    setInRecordingMode,
    userDetails,
    selectedProjected,
    projectListLoading,
    mediaListLoading,
    handleProjectChange
}) => {
    const [thumbnails, setThumbnails] = useState({})
    const handleMenuClick = (item) => {
        console.log("Item==>", item)
    }
    
    useEffect(() => {
        const loadThumbnails = async () => {
            const promises = mediaFiles.map(async (l) => {
                const base64 = await fetchImageAsBase64(l.thumbnail);
                return { id: l.id, base64 };
            });

            const results = await Promise.all(promises);
            const thumbnailMap = results.reduce((acc, item) => {
                acc[item.id] = item.base64;
                return acc;
            }, {});
            setThumbnails(thumbnailMap);
        };

        loadThumbnails();
    }, [mediaFiles]);
    
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
                <div className="min-h-[100px] max-h-[260px] overflow-auto" >
                    {mediaListLoading ? <div className="flex items-center justify-center" ><div className="loader" ></div></div> : !mediaFiles?.length ? <p className="text-center" > No items to show !</p> :
                        mediaFiles?.map(l => {
                            return (
                                <div className=" flex justify-between items-center" key={l.id} >
                                    <div className="flex items-center gap-2" >
                                        <div className="cursor-pointer w-[60px] h-[60px] flex items-center " >
                                            <img className="rounded-md" src={thumbnails[l.id]} />
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
                                            direction={mediaFiles?.length < 3 ? "top" : "bottom"}
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
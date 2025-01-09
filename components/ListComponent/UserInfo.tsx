
import { dummyImage } from '~utils/dummyAvtar'
import CustomMenu from '~components/Menu'
import { SwitchLogo } from '~utils/Icons'
import fetchImageAsBase64 from '~utils/fetchImageAsBase64'
import { useEffect, useState } from 'react'

const UserInfo = ({ 
    handleProjectChange, 
    userDetails, 
    setInRecordingMode, 
    projectList, 
    loading, 
    selectedProjected
 }) => {
    const [base64Image, setBase64Image] = useState(null);
    const handleMenuClick = item => {
        handleProjectChange(item)
    }

    const fetchGravatarAsBase64 = async (url) => {
        try {
            const base64 = await fetchImageAsBase64(url); // Reuse the existing function
            return base64;
        } catch (error) {
            console.error("Error fetching Gravatar image:", error);
            return null;
        }
    };

    useEffect(() => {
        const loadGravatar = async () => {
            const base64 = await fetchGravatarAsBase64(userDetails?.avtar);
            setBase64Image(base64);
        };

        loadGravatar();
    }, []);
    

    return (
        <div>
            <div className="info-img-box gap-2 flex py-2 px-6" >
                <div className='w-12 h-12 rounded-md' >
                    <img
                        className='rounded-md'
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = dummyImage; // Fallback image if the provided URL is invalid
                        }}
                        alt={userDetails?.name || "User"} src={base64Image} />
                </div>
                <div className='' >
                    <p className='font-bold text-sm' >{userDetails?.name}</p>
                    <div>
                        {
                            loading ? <div className='loader' ></div> : <CustomMenu
                                menuButton={<div className='text-gray-500 flex gap-2 items-center' >{selectedProjected?.label || projectList?.[0]?.label || "No projects!"} <SwitchLogo /> </div>}
                                menuList={projectList}
                                onMenuClick={handleMenuClick} />
                        }
                    </div>
                </div>
            </div>
            <div className='pt-3 pb-4 py-2 px-6' >
                <button onClick={() => setInRecordingMode(true)} type="button" className={`tab rounded-[48px] w-full text-base font-semibold active text-white bg-[#0DABD8] text-black"}`}>
                    {"Go to recording session"}
                </button>
            </div>
        </div>
    )
}

export default UserInfo
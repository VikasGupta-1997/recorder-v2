
import { dummyImage } from '~utils/dummyAvtar'

const UserInfo = ({ userInfo, setInRecordingMode }) => {

    console.log("AvtarImageAvtarImage", dummyImage)

    return (
        <div>
            <div className="info-img-box gap-2 flex py-2 px-6" >
                <div className='w-12 h-12 rounded-md' >
                    <img
                        className='rounded-md'
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = dummyImage; // Fallback image if the provided URL is invalid
                        }}
                        alt={userInfo?.nickname || userInfo?.name || "User"} src={userInfo?.picture} />
                </div>
                <p className='font-bold' >{userInfo?.nickname || userInfo?.name}</p>
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

import { VscChromeMinimize } from "react-icons/vsc";
import { IoMdClose } from "react-icons/io";

import './header.css'
import { callBackConstants } from "~utils/constants";
import { AdiloLogo, Home, LogoutSvg, OpenOptions } from "~utils/Icons";
import { useEffect, useRef, useState } from "react";
import CustomMenu from "~components/Menu";

function Header({ inRecordingMode, setInRecordingMode, userDetails }) {
    const closePopUp = () => {
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.POPUP_CLOSED }, function(){})
        // })
        window.close()
    }

    const handleLogout = async () => {
        try {
            await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/logout`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userDetails.access_token}`
                },
            })
        } catch(error){
            console.log("Error", error)
        }
        await chrome.storage.local.clear()
        await chrome.storage.sync.clear()
    }


    const handleMenuClick = async option => {
        switch (option.id) {
            case 5: {
                handleLogout()
               
            }
                break;
        }
    }

    return (
        <header className="header">
            <div className="flex gap-4">
                <div>
                    <AdiloLogo />
                </div>
                <div>
                    <p className="text-xl font-bold tracking-wide" >ADILO</p>
                    <p className="text-sm" >by BigCommand</p>
                </div>
            </div>
            {userDetails?.user_id ?
                <div className="flex gap-7 items-center" >
                    <span className="cursor-pointer" >
                        {inRecordingMode ? <span onClick={() => setInRecordingMode(false)} ><VscChromeMinimize color="#637C8E" fontSize={30} /> </span> : <a href="https://adilo.bigcommand.com" target="_blank" ><Home /></a>}
                    </span>
                    <span className="cursor-pointer" >
                        {inRecordingMode ? <IoMdClose onClick={closePopUp} color="#637C8E" fontSize={30} /> :
                            <CustomMenu menuButton={<OpenOptions />} menuList={[{ id: 1, label: 'Prefrences' },
                            { id: 2, label: 'Check for updates' },
                            { id: 3, label: 'Get Help' },
                            { id: 4, label: 'Quit Recorder' },
                            { id: 5, label: 'Sign out' }]} onMenuClick={handleMenuClick} />
                        }
                    </span>
                </div> : null
            }
        </header>
    )
}

export default Header

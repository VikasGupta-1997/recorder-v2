
import { VscChromeMinimize } from "react-icons/vsc";
import { IoMdClose } from "react-icons/io";

import './header.css'
import { callBackConstants } from "~utils/constants";
import { AdiloLogo, Home, LogoutSvg, OpenOptions } from "~utils/Icons";
import { useEffect, useRef, useState } from "react";
import CustomMenu from "~components/Menu";

function Header({ inRecordingMode, isLoggedIn, setInRecordingMode }) {
    const closePopUp = () => {
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.POPUP_CLOSED }, function(){})
        // })
        window.close()
    }


    const handleMenuClick = async option => {
        switch (option.id) {
            case 5: {
                console.log("Call Logout!")
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
            {isLoggedIn ?
                <div className="flex gap-7 items-center" >
                    <span className="cursor-pointer" >
                        {inRecordingMode ? <span onClick={() => setInRecordingMode(false)} ><VscChromeMinimize color="#637C8E" fontSize={30} /> </span> : <Home />}
                    </span>
                    <span className="cursor-pointer" >
                        {inRecordingMode ? <IoMdClose onClick={closePopUp} color="#637C8E" fontSize={30} /> :
                            <CustomMenu menuButton={<OpenOptions />} menuList={[{ id: 1, label: 'Prefrences' },
                            { id: 2, label: 'Check for updates' },
                            { id: 3, label: 'Get Help' },
                            { id: 4, label: 'Quick SnapByte' },
                            { id: 5, label: 'Sign out' }]} onMenuClick={handleMenuClick} />
                        }
                    </span>
                </div> : null
            }
        </header>
    )
}

export default Header

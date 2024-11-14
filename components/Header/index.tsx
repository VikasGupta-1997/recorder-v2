
import { VscChromeMinimize } from "react-icons/vsc";
import { IoMdClose } from "react-icons/io";

import './header.css'
import { callBackConstants } from "~utils/constants";
import { AdiloLogo } from "~utils/Icons";

function Header() {
    const closePopUp = () => {
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.POPUP_CLOSED }, function(){})
        // })
        window.close()
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
            <div className="flex gap-7 items-center" >
                <span className="cursor-pointer" >
                    <VscChromeMinimize color="#637C8E" fontSize={30} />
                </span>
                <span className="cursor-pointer" >
                    <IoMdClose onClick={closePopUp} color="#637C8E" fontSize={30} />
                </span>
            </div>
        </header>
    )
}

export default Header

import { BsRecordCircle } from "react-icons/bs";
import { FaPlay, FaPause } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import { FaRegTrashAlt } from "react-icons/fa";
import styleText from "data-text:./toolbar.module.css"
import * as style from './toolbar.module.css'

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const ToolBarBox = ({
    isRecordingPaused,
    handleIconClick,
    formattedTimeRef,
    hasDrag
}: any) => {
    return (
        <div className={hasDrag ? style["hasDrag"] : `${style["toolbar-container"]} ${style["toolbar-container-nodrag"]}`} >
            <span className='draggable-span' >
                <div className={style['toolbar-box']}>
                    <div className={style['toolbar-container-left']} >
                        <span className={`${style["svg-container"]} ${isRecordingPaused ? '' : style['pulse-effect']}`} >
                            <BsRecordCircle onClick={() => handleIconClick("record")} fontSize={24} color='rgb(5 170 218)' />
                        </span>
                        <span ref={formattedTimeRef}>
                            {"00:00"}
                        </span>
                    </div>
                    <div className={style['separator']} ></div>
                    <div className={style['toolbar-container-right']} >
                        <div onClick={() => handleIconClick("stop")} className={style['stop-btn']} >
                        </div>
                        <span className={style['svg-container']}>
                            <span>
                                {isRecordingPaused ? <FaPlay onClick={() => handleIconClick("play")} fontSize={19} color='#f0f0f0' /> : <FaPause onClick={() => handleIconClick("pause")} fontSize={19} color='#f0f0f0' />}
                            </span>
                            <span data-modal-target="default-modal" data-modal-toggle="default-modal">
                                <VscDebugRestart onClick={() => handleIconClick("restart")} fontSize={22} color='#f0f0f0' />
                            </span>
                            <span><FaRegTrashAlt onClick={() => handleIconClick("delete")} fontSize={19} color='#f0f0f0' /></span>
                        </span>
                    </div>
                </div>
            </span>
        </div>
    )
}
export default ToolBarBox
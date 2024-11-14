import { LiaRedoAltSolid, LiaUndoAltSolid } from "react-icons/lia"
import { BsScissors } from "react-icons/bs"
import { MdOutlineCrop } from "react-icons/md"
import styleText from "data-text:../preview.module.css"
import * as style from '../preview.module.css'

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const EditingControls = () => {
    return (
        <div className={style["editing-container"]} >
            <div className={style["redo-undo"]} >
                <div className="undo" > <LiaUndoAltSolid color="10abd9" fontSize={24} /> </div>
                <div className="redo" > <LiaRedoAltSolid color="10abd9" fontSize={24} /> </div>
            </div>
            <div className={style["editing-actions"]} >
                {
                    ["cut", "trim", "delete recording", "publish"].map(action => (
                        <button key={action} className={action === 'publish' ? style["publish-btn"] : ""} >
                            {["cut", "trim"].includes(action) && <span  >
                                {action === 'cut' ? <BsScissors fontSize={14} color="10abd9" /> : <MdOutlineCrop fontSize={14} color="10abd9" />}
                            </span>}
                            <p>
                                {action}
                            </p>
                        </button>
                    ))
                }
            </div>
        </div>
    )
}

export default EditingControls
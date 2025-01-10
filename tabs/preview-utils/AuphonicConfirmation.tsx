import React, { useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import styleText from "data-text:../../components/modal.module.css"
import * as style from '../../components/modal.module.css'
import { LabelCheckBox } from "./AdvanceAuphonicForm";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}


const ConfirmationModal = ({ onClose, title, body, onSubmit, showActions=true, isPublishMode=false }) => {
    const [checked, setChecked] = useState(false)
    return (
        <>
            <div className={style["darkBG"]} />
            <div className={style["centered"]}>
                <div className={`${style["modal"]} ${style["sm-modal"]}`}>
                    <div className={style["modalHeader"]}>
                        <h5 className={style["heading"]}>{title}</h5>
                        <RiCloseLine color="black" cursor={'pointer'} onClick={onClose} fontSize={32} style={{ marginBottom: "-3px" }} />
                    </div>
                    <div className={style['modal-body']} >
                        <div>
                            {body}
                        </div>
                    </div>
                    {showActions && <div className={style["sm-modalaction"]}>
                        <div className={`${style["actionsContainer"]} ${style['sm-actions']}`}>
                            <button className={style["deleteBtn"]} onClick={onSubmit}>
                                Yes, Continue
                            </button>
                            <button
                                className={style["cancelBtn"]}
                                onClick={onClose}
                            >
                                No, Cancel
                            </button>
                        </div>
                        {isPublishMode ? null : <div>
                            <LabelCheckBox checked={checked} onChange={async e => {
                                setChecked(e.target.checked)
                                await chrome.storage.local.set({ "doNotShowConfiramtion": e.target.checked })
                            }} label={"Don't ask me again"} id="confirm-enhance-dont-ask-again" />
                        </div>}
                    </div>}
                </div>
            </div>
        </>
    );
};

export default ConfirmationModal;
import React from "react";
import { RiCloseLine } from "react-icons/ri";
import styleText from "data-text:./modal.module.css"
import * as style from './modal.module.css'

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}


const Modal = ({ onClose, isPopupConfirmation }) => {
    return (
        <>
            <div className={style["darkBG"]}
            // onClick={() => setIsPopupConfirmation('')}
            />
            <div className={style["centered"]}>
                <div className={style["modal"]}>
                    <div className={style["modalHeader"]}>
                        <h5 className={style["heading"]}>{isPopupConfirmation} Recording</h5>
                        <RiCloseLine color="black" cursor={'pointer'} onClick={onClose} fontSize={32} style={{ marginBottom: "-3px" }} />
                    </div>
                    <div className={style["modalActions"]}>
                        <div className={style["actionsContainer"]}>
                            <button className={style["deleteBtn"]} onClick={() => onClose(`confirmation-${isPopupConfirmation}`)}>
                                Yes, {isPopupConfirmation}
                            </button>
                            <button
                                className={style["cancelBtn"]}
                                onClick={onClose}
                            >
                                No, Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;
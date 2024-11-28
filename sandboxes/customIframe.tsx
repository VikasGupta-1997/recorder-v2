import { useContext, useEffect, useRef } from "react";

const CustomIframe = () => {
    console.log("value12112##2", window.addEventListener)
    useEffect(() => {
        window.addEventListener("message", (event) => {
            console.log("Evnet!!", event)
        })
    }, [])
    return (
        <div>
            HEllo from Iframe!!
        </div>
    )
}

export default CustomIframe
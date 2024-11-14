import styleText from "data-text:./preview.module.css"
import * as style from './preview.module.css'
import { useEffect, useRef } from "react"

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}



function NewPreviewPage() {
    const videoRef = useRef(null)

    useEffect(() => {
        console.log("CALLL EFFECT")
        chrome.runtime.onMessage.addListener(
            function async(message) {
                console.log("CALLL112", message)
                switch (message.type) {
                    case "OPEN_NEW_PREVIEW":{
                        console.log("VIDE REF", videoRef.current)
                        if(videoRef.current){
                            console.log("message1212", message)
                            videoRef.current.src = message.blobUrl;
                        }
                    }
                }
            }
        )
    }, [])

    return <div style={{
        width: '800px',
        height: '800px'
    }}>
        <video
          ref={videoRef}
          style={{
            height: "100%",
            width: "100%",
            objectFit: 'cover',
            overflow: 'hidden',
            borderRadius: '8px'
          }}
          id="ext-vid-previewVideo" controls autoPlay ></video>
    </div>
}

export default NewPreviewPage

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styleText from "data-text:./preview.module.css";
import * as style from './preview.module.css';

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

function WebCamP() {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [closeStream, setCloseStream] = useState(false)

    useEffect(() => {
        // Listen for messages from the extension
        const messageListener = (message) => {
            if (message.type === "STOP_CAM_RECORD_IN_IFRAME") {
                setCloseStream(true)
               
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Clean up message listener on unmount
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []); // Dependency array includes stream so the latest stream is used

    useEffect(() => { 
        if(closeStream){
            console.log("STREAMM", stream)
            if (stream) {
                console.log("STOPPING STREAMA!!")
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null; // Clear the video source
                setStream(null); // Clear stream state
            }
        }
     }, [closeStream])

    useLayoutEffect(() => {
        if (videoRef.current) {
            chrome.storage.local.get(["selectedCameraRecording"], result => {
                startStreaming(result?.selectedCameraRecording?.value);
            })
        }
    }, []); // Also depend on stream here to stop it if needed

    // Function to start streaming without audio
    async function startStreaming(selectedCameraRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedCameraRecording }, audio: false });
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error("Error accessing media devices.", error);
        }
    }

    return (
        <div style={{ 
            width: "222px", 
            height: "222px",
            overflow: "hidden",
            userSelect: "none",
            border: "0px"
            
            }}>
            <video
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                }}
                ref={videoRef}
                autoPlay
                muted // This ensures no audio is played
            />
        </div>
    );
}

export default WebCamP;

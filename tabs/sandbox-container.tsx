import { useEffect, useRef } from "react";

export default function SandBoxContainer() {
    const iframeRef = useRef(null);

    // const sendMessage = (message) => {
    //     iframeRef.current.contentWindow.postMessage(message, "*");
    // };

    // const onMessage = async (message) => {
    //     console.log("onMessage Sandbox.jsx", message)
    //     if (message.type === "load-ffmpeg") {
    //     }
    // }

    useEffect(() => {

        console.log("Chrome", chrome.runtime)

        // setTimeout(() => {
        //     sendMessage({ type: "updated-blob", base64: "base64" });
        // }, 2000)

        // window.addEventListener("message", (event) => {
        //   onMessage(event.data);
        // });
    
        return () => {
        //   window.removeEventListener("message", (event) => {
        //     onMessage(event.data);
        //   });
        };
      }, []);

    console.log("Bind SandBox")
    return (
        <>
            It is sandobox child but normal
        </>
    )
}
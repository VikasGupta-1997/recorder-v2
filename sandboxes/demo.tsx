import { useContext, useEffect, useRef, useState } from "react";
import { ContentStateContext } from "~context";
import styleText from "data-text:../tabs/preview.module.css"
import * as style from '../tabs/preview.module.css'

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const DemoSand = () => {
  const iframeRef = useRef(null);
  const ffmpegInstance = useRef<any>(null);
  const [videoData, setVideoData] = useState(null)
  const [editMode ,  setEditMode] = useState(false)
  const [isAudio, setIsAudio] = useState('ideal')

  const sendMessage = (message) => {
    iframeRef.current.contentWindow.postMessage(message, "*");
  };

  useEffect(() => {
    const handleIframeMessage = (event) => {
      
  
      const message = event.data;
      console.log("Message received in sandbox from iframe:", message);
      if(message.type === "SEND_FROM_PREVIEW"){
        console.log("YEAH CALLED!!", message.blob)
        setEditMode(true)
        setVideoData( message.blob)
        const newBlobUrl = URL.createObjectURL(message.blob);
        console.log("newBlobUrlnewBlobUrl", newBlobUrl)
        const vid = document.getElementById('vid-sand') as HTMLVideoElement
        console.log("vidvid", vid)
        vid.src = newBlobUrl;
        vid.play()
        // bl(message.data)
      }

      if(message.type === "GO_TO_PREVIEW"){
        setEditMode(false)
      }
      // setTimeout(() => {
      //   console.log("No SandBox Send Data To child preview")
      //   sendMessage("YEAH DATA SENT!!!")
      // }, 3000)

      // Handle the message from the iframe
    };
  
    window.addEventListener("message", handleIframeMessage);
  
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, []);


  const loadFfmpeg = async () => {
    try {
      const { createFFmpeg } = (window as any)?.FFmpeg;

      if (!createFFmpeg) {
        console.error("FFmpeg is not available");
        return;
      }

      ffmpegInstance.current = createFFmpeg({
        // log: true, // Enable logs for debugging
        progress: (progress) => {
          console.log("Progress:", progress);
        },
        corePath: "/vendor/ffmpeg-core.js", // Ensure this path is correct
      });

      console.log("Loading FFmpeg...");
      await ffmpegInstance.current.load();
      console.log("FFmpeg Loaded!", ffmpegInstance.current?.isLoaded());

      // Notify the parent (background or popup script) that FFmpeg is ready
      // window.parent.postMessage({ type: "ready" }, "*");
    } catch (error) {
      console.error("Error loading FFmpeg:", error);
    }
  };
  const goToPreview = () => {
    console.log("goToPreview")
    setEditMode(false)
  }

  const handleChildData = () => {
    console.log("videoDatavideoData", videoData)
    sendMessage({type: "EDITED_VIDEO", blob: videoData})
  }

  useEffect(() => {
    console.log(" chrome.runtime112", chrome.runtime)
    //   Load FFmpeg script dynamically
    const script = document.createElement("script");
    script.src = "/vendor/ffmpeg.min.js";
    script.async = true;

    script.onload = loadFfmpeg;

    document.body.appendChild(script);


    return () => {
      // Cleanup
      // document.body.removeChild(script);
      // window.removeEventListener('message', handleMessage);
    };
  }, []);

  console.log("editModeeditMode", editMode)
  return <>
    <>
    <div style={{ display: editMode ? 'none' : 'block'  }} >
      <iframe
        ref={iframeRef}
        src="/tabs/preview.html"
        allowFullScreen={true}
        // sandbox="allow-scripts allow-same-origin allow-file-access-from-files allow-storage-access-by-user-activation"
        style={{
          width: "100%",
          border: "none",
          height: "70vh",
          // position: "absolute",
          top: 0,
          left: 0,
        }}
      ></iframe>
      </div>
      <div style={{ display: editMode ? 'block' : 'none'  }}>
        <div className={style["container"]}>
        <h1 className={style["heading-title"]}>
                {/* <span className={style["title"]} >
                    {`Rec-11122024-desktop.${isAudio === 'video' ? 'mp4' : 'mp3'}`}
                    {" "}
                    <span className={style["edit-icon"]} >
                        <FaRegEdit color={'white'} size={10} />
                    </span>
                </span>
                {isEditMode && <span>
                    <button onClick={handleCancelEditing} className={style["rounded-btn"]}>cancel</button>
                </span>} */}
            </h1>
        </div>
      </div>
    </>

  </>;
};

export default DemoSand;

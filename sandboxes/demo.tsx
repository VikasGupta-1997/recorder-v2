import { useContext, useEffect, useRef, useState } from "react";
import { ContentStateContext } from "~context";
import styleText from "data-text:../tabs/preview.module.css"
import * as style from '../tabs/preview.module.css'
import { FaRegEdit } from "react-icons/fa";
import VideoPreview from "~tabs/preview-utils/VideoPreview";
import AudioPreview from "~tabs/preview-utils/AudioPreview";
import EditingControls from "~tabs/preview-utils/EditingControls";

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const DemoSand = () => {
  const iframeRef = useRef(null);
  const ffmpegInstance = useRef<any>(null);
  const [videoData, setVideoData] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [isAudio, setIsAudio] = useState('ideal')
  const [isEditMode, setIsEditMode] = useState(false)
  const [blob, setBlob] = useState(null)
  const [blobUrl, setBlobUrl] = useState(null)
  const url = useRef('')
  const containerRef = useRef(null)

  const audioRef = useRef(null);

  const sendMessage = (message) => {
    iframeRef.current.contentWindow.postMessage(message, "*");
  };

  useEffect(() => {
    const handleIframeMessage = (event) => {


      const message = event.data;
      console.log("Message received in sandbox from iframe:", message);
      if (message.type === "SEND_FROM_PREVIEW") {
        console.log("YEAH CALLED!!", message.blob)
        setEditMode(true)
        setVideoData(message.blob)
        const newBlobUrl = URL.createObjectURL(message.blob);
        console.log("newBlobUrlnewBlobUrl", newBlobUrl)
        setBlobUrl(newBlobUrl)
        // const vid = document.getElementById('vid-sand') as HTMLVideoElement
        // console.log("vidvid", vid)
        // vid.src = newBlobUrl;
        // vid.play()
        // bl(message.data)
      }

      if (message.type === "IS_CONTENT_TYPE") {
        if (message.isAudioOnly) {
          setIsAudio('audio')
        } else {
          setIsAudio('video')
        }
      }

      if (message.type === "GO_TO_PREVIEW") {
        setEditMode(false)
      }
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
    sendMessage({ type: "EDITED_VIDEO", blob: videoData })
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


  const changeMode = () => {
    console.log("MODE")
    setIsEditMode(prev => !prev)
  }

  const handleCancelEditing = () => {
    setIsEditMode(false)
  }

  return <>
    <>
      <div style={{ display: editMode ? 'none' : 'block' }} >
        <iframe
          ref={iframeRef}
          src="/tabs/preview.html"
          allowFullScreen={true}
          // sandbox="allow-scripts allow-same-origin allow-file-access-from-files allow-storage-access-by-user-activation"
          style={{
            width: "100%",
            border: "none",
            height: "100vh",
            // position: "absolute",
            top: 0,
            left: 0,
          }}
        ></iframe>
      </div>
      {/* <div style={{ display: editMode ? 'block' : 'none' }}>
        <div className={style["container"]}>
          <h1 className={style["heading-title"]}>
            <span className={style["title"]} >
              {`Rec-11122024-desktop.${isAudio === 'video' ? 'mp4' : 'mp3'}`}
              {" "}
              <span className={style["edit-icon"]} >
                <FaRegEdit color={'white'} size={10} />
              </span>
            </span>
            {isEditMode && <span>
              <button onClick={handleCancelEditing} className={style["rounded-btn"]}>cancel</button>
            </span>}
          </h1>
          <div className={style["ref-wrapper"]}>
            {(isAudio === 'video' && editMode) && <VideoPreview blob={blob} blobUrl={blobUrl} />
            }
            {(isAudio === 'audio' && editMode) && <AudioPreview blobUrl={blobUrl} blob={blob} audioRef={audioRef} containerRef={containerRef} />}
          </div>
          {(isEditMode && editMode) ? null : <div className={`${style['edit-mode-btn']}`} > <button className={`${style["rounded-btn"]} ${style['publish-btn']}`} onClick={changeMode} >Edit Video</button></div>}
          {<div className={style["editing-control-wrapper"]} >
            <EditingControls blobUrl={blobUrl} />
          </div>}
        </div>
      </div> */}
    </>
  </>;
};

export default DemoSand;

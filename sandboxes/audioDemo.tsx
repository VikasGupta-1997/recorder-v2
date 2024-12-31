import { useEffect, useRef, useState } from "react";
import styleText from "data-text:../tabs/preview.module.css"
import cutVideo, { extractAudio, fixMetadata, replaceVideoAudio, toBase64 } from "~utils/cutVideo";

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const DemoSand = () => {
  const iframeRef = useRef(null);
  const scriptLoaded = useRef(false);
  const ffmpegInstance = useRef<any>(null);
  const [editMode, setEditMode] = useState(false)
  const triggerLoad = useRef(false)

  const sendMessage = (message) => {
    iframeRef.current.contentWindow.postMessage(message, "*");
  };

  const returnRandomUniqId = () =>  (String.fromCharCode(65 + Math.floor(Math.random() * 26)) +  Date.now());

  useEffect(() => {
    const handleIframeMessage = async (event) => {
      const message = event.data;
      console.log("Message received in sandbox from iframe:", message);
      if (message.type === "SEND_FROM_PREVIEW") {
        setEditMode(true)
      }

      if (message.type === "GO_TO_PREVIEW") {
        setEditMode(false)
      }

      if (message.type === 'fixMetadata') {
        console.log(message, " ffmpegInstance.current",   ffmpegInstance.current)
        const fixedBlob = await fixMetadata(
          ffmpegInstance.current,
          message.blob
        );
        console.log("fixedBlob121", fixedBlob)
        sendMessage({
          type: "updated-blob",
          // base64: base64,
          addToHistory: false,
          blob: fixedBlob,
          fixMetadata: true
        });
      }

      if (message.type === 'replace-videos-audio') {
        console.log("REah replace-videos-audio", message)
        console.log("blob112", message.blob)
        const sendMessageData = {
            type: "updated-blob",
            // base64: base64,
            // addToHistory: message?.isFromSwitch ? false : true,
            addToHistory: message.isFromSwitch,
            // blob: message?.isFromSwitch ? message.audioBlob : message.auphonicBlob,
            blob: message.audioBlob,
            isMergedTrack: true,
            auphonicMode: message?.auphonicMode,
            uniqid: message?.uniqid || returnRandomUniqId(),
            fileName: message?.fileName,
            uuid: message?.uuid
        }
        if(message.auphonicBlob){
          sendMessageData['auphonicBlob'] = message.auphonicBlob
          sendMessageData['originalAudioBlob'] = message.originalAudioBlob
        }
        sendMessage(sendMessageData);
        // sendMessage({
        //   type: "auphonic-merged-video",
        //   // base64: base64,
        //   addToHistory: true,
        //   blob: blob
        // });
      }

      if (message.type === 'extract-audio') {
        // const blob = await extractAudio(
        //   ffmpegInstance.current,
        //   message.blob,
        // )
        console.log("blob", message.blob)
        sendMessage({
          type: "extracted-audio-blob",
          blob: message.blob
        });
      }

      if (message.type === "cut-video") {
        try {
          const blob = await cutVideo(
            ffmpegInstance.current,
            message.blob,
            message.startTime,
            message.endTime,
            message.cut,
            message.duration,
            message.encode
          );
          console.log("blob11312", blob)
         
          const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-blob",
            base64: base64,
            addToHistory: true,
            blob: blob,
            isEdit: true,
            uniqid: returnRandomUniqId()
          });
        } catch (error) {
          sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
        }
      }

      if(message.type === "load-ffmpeg") {
        triggerLoad.current = true;
        loadFfmpeg()
      }
    };

    window.addEventListener("message", handleIframeMessage);

    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, []);


  const loadFfmpeg = async () => {
    if (!scriptLoaded.current) return;
    if (!triggerLoad.current) return;
    if (ffmpegInstance.current) return;
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
      sendMessage({ type: "ffmpeg-loaded" });
      // Notify the parent (background or popup script) that FFmpeg is ready
      // window.parent.postMessage({ type: "ready" }, "*");
    } catch (error) {
      sendMessage({
        type: "ffmpeg-load-error",
        error: JSON.stringify(error),
      });
      console.error("Error loading FFmpeg:", error);
    }
  };

  useEffect(() => {
    //   Load FFmpeg script dynamically
    document.body.style.margin = "0px";
    document.body.style.padding = "0px";
    const script = document.createElement("script");
    script.src = "/vendor/ffmpeg.min.js";
    script.async = true;

    script.onload = () => {
      scriptLoaded.current = true;
      loadFfmpeg();
    } 

    document.body.appendChild(script);
  }, []);

  return <>
    <>
      <div style={{ display: editMode ? 'none' : 'block' }} >
        <iframe
          ref={iframeRef}
          src="/tabs/audioOnlyPreview.html"
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
    </>
  </>;
};

export default DemoSand;

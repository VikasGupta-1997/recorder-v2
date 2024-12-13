import { useEffect, useRef, useState } from "react";
import styleText from "data-text:../tabs/preview.module.css"
import cutVideo, { toBase64, reencodeVideo, fixMetadata } from "~utils/cutVideo";

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

      if (message.type === "cut-video") {
        try {
          console.log("cut-video-message", message)
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
            blob: blob
          });
          console.log("NEW BVLOBBB", blob)
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = async () => {
              console.log("video.durationvideo.duration", video.duration)
            URL.revokeObjectURL(video.src);
            video.remove();
          };
          video.src = URL.createObjectURL(blob);
        } catch (error) {
          sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
        }
      }

      if(message.type === 'fixMetadata'){
        console.log("fixMetadata", message)
        const blob = await fixMetadata(
          ffmpegInstance.current,
          message.blob
        );
        console.log("NOW FIXED AND SENDING DATAAA")
        sendMessage({
          type: "updated-blob",
          // base64: base64,
          addToHistory: false,
          blob: blob
        });
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

//   async function fixMetadata(blob) {
//     await ffmpeg.load();
//     const data = new Uint8Array(await blob.arrayBuffer());
//     ffmpeg.FS('writeFile', 'input.mp4', data);
//     await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', '-movflags', 'faststart', 'output.mp4');
//     const output = ffmpeg.FS('readFile', 'output.mp4');
//     return new Blob([output.buffer], { type: 'video/mp4' });
// }


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
    </>
  </>;
};

export default DemoSand;

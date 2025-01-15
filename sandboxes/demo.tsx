import { useEffect, useRef, useState } from "react";
import styleText from "data-text:../tabs/preview.module.css"
import cutVideo, { toBase64, reencodeVideo, replaceVideoAudio, fixMetadata, extractAudio, fixVideoAudioCompatibility } from "~utils/cutVideo";
import cutVideoWindow10, { toBase64Window10, reencodeVideoWindow10, replaceVideoAudioWindow10, fixMetadataWindow10, extractAudioWindow10 } from "~utils/cutVideoWindow10";

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
  const urlParams = new URLSearchParams(window.location.search);
  const hasAudio = urlParams.get('hasAudio');
  const sendMessage = (message) => {
    iframeRef.current.contentWindow.postMessage(message, "*");
  };

  const returnRandomUniqId = () => (String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now());

  useEffect(() => {
    const handleIframeMessage = async (event) => {
      const window10 = navigator.userAgent.match(/Windows NT 10.0/)
      const message = event.data;
      console.log("Message received in sandbox from iframe:", message);
      if (message.type === "SEND_FROM_PREVIEW") {
        setEditMode(true)
      }

      if (message.type === "GO_TO_PREVIEW") {
        setEditMode(false)
      }

      if (message.type === 'extract-audio') {
        let blob;
        if (window10) {
          blob = await extractAudioWindow10(
            ffmpegInstance.current,
            message.blob,
          )
        } else {
          blob = await extractAudio(
            ffmpegInstance.current,
            message.blob,
          )
        }

        console.log("blob", blob)
        sendMessage({
          type: "extracted-audio-blob",
          blob
        });
      }

      if(message.type === 'download-playable-file'){
        const blob = await fixVideoAudioCompatibility(ffmpegInstance.current, message.blob)
        console.log("downloadAbleBlob", blob)
        const sendMessageData = {
          type: "download-blob-file",
          blob: blob
        } 
        sendMessage(sendMessageData);
      }

      if (message.type === 'replace-videos-audio') {
        console.log("REah replace-videos-audio", message)
        let blob;
        if (window10) {
          blob = await replaceVideoAudioWindow10(
            ffmpegInstance.current,
            message.videoBlob,
            message.audioBlob
          )
        } else {
          blob = await replaceVideoAudio(
            ffmpegInstance.current,
            message.videoBlob,
            message.audioBlob
          )
        }
        console.log("blob112", blob)
        console.log("updated-blob-check", message)
        const sendMessageData = {
          type: "updated-blob",
          // base64: base64,
          addToHistory: message.isFromSwitch,
          blob: blob,
          isMergedTrack: true,
          auphonicMode: message?.auphonicMode,
          uniqid: message?.uniqid || returnRandomUniqId(),
          fileName: message?.fileName,
          uuid: message?.uuid
        }
        if (message.auphonicBlob) {
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

      if (message.type === "cut-original-audio") {
        let blob;
        try {
          console.log("cut-original-audio", message)
          if (window10) {
            blob = await cutVideoWindow10(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          } else {
            blob = await cutVideo(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          }
          let fixedBlob;
          if (window10) {
            fixedBlob = await fixMetadataWindow10(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          } else {
            fixedBlob = await fixMetadata(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          }

          console.log("blob11312 original", blob)

          // const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-original-blob",
            // base64: base64,
            addToHistory: true,
            blob: fixedBlob,
            cut: message.cut
          });
          // console.log(fixedBlob, "original NEW BVLOBBB", blob)
          // const video = document.createElement("audio");
          // video.preload = "metadata";
          // video.onloadedmetadata = async () => {
          //   console.log("original video.durationvideo.duration", video.duration)
          //   URL.revokeObjectURL(video.src);
          //   video.remove();
          // };
          // video.src = URL.createObjectURL(fixedBlob);
        } catch (error) {
          console.log("Error In original", error)
          sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
        }
      }

      if (message.type === "cut-auphonic-audio") {
        let blob;
        try {
          console.log("cut-auphonic-audio", message)
          if (window10) {
            blob = await cutVideoWindow10(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          } else {
            blob = await cutVideo(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          }
          let fixedBlob;
          if (window10) {
            fixedBlob = await fixMetadataWindow10(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          } else {
            fixedBlob = await fixMetadata(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          }


          console.log("blob11312 auphonic", blob)

          // const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-auphonic-blob",
            // base64: base64,
            addToHistory: true,
            blob: fixedBlob,
            cut: message.cut
          });
          console.log(fixedBlob, "NEW auphonic BVLOBBB", blob)
          // const video = document.createElement("audio");
          // video.preload = "metadata";
          // video.onloadedmetadata = async () => {
          //   console.log("auphonic video.durationvideo.duration", video.duration)
          //   URL.revokeObjectURL(video.src);
          //   video.remove();
          // };
          // video.src = URL.createObjectURL(fixedBlob);
        } catch (error) {
          console.log("Error In auphonic", error)
          sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
        }
      }

      if (message.type === "cut-video") {
        let blob;
        try {
          console.log("cut-video-message", message)
          if (window10) {
            console.log("IN Window")
            blob = await cutVideoWindow10(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          } else {
            console.log("IN Mac")
            blob = await cutVideo(
              ffmpegInstance.current,
              message.blob,
              message.startTime,
              message.endTime,
              message.cut,
              message.duration,
              message.encode
            );
          }

          let fixedBlob;
          if (window10) {
          console.log("IN Window")
            fixedBlob = await fixMetadataWindow10(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          } else {
            console.log("IN Mac")
            fixedBlob = await fixMetadata(
              ffmpegInstance.current,
              blob,
              hasAudio
            );
          }

          console.log("blob11312", blob)

          // const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-blob",
            // base64: base64,
            addToHistory: true,
            blob: fixedBlob,
            cut: message.cut,
            isEdit: true,
            uniqid: returnRandomUniqId()
          });
          // console.log(fixedBlob, "NEW BVLOBBB", blob)
          // const video = document.createElement("video");
          // video.preload = "metadata";
          // video.onloadedmetadata = async () => {
          //   console.log("video.durationvideo.duration", video.duration)
          //   URL.revokeObjectURL(video.src);
          //   video.remove();
          // };
          // video.src = URL.createObjectURL(fixedBlob);
        } catch (error) {
          sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
        }
      }

      if (message.type === 'fixMetadata') {
        console.log(hasAudio, message, " ffmpegInstance.current", ffmpegInstance.current)
        let fixedBlob;
        if (window10) {
          console.log("IN Window")
          fixedBlob = await fixMetadataWindow10(
            ffmpegInstance.current,
            message.blob,
            hasAudio
          );
        } else {
          console.log("IN MAC")
          fixedBlob = await fixMetadata(
            ffmpegInstance.current,
            message.blob,
            hasAudio
          );
        }

        console.log("fixedBlob121", fixedBlob)
        sendMessage({
          type: "updated-blob",
          // base64: base64,
          addToHistory: false,
          blob: fixedBlob,
          fixMetadata: true
        });
      }

      if (message.type === "load-ffmpeg") {
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
      sendMessage({ type: "ffmpeg-loaded", hasAudio });
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
          src="/tabs/preview.html"
          allowFullScreen={true}
          allow="clipboard-read; clipboard-write"
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

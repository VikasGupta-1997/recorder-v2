import { useEffect, useRef, useState } from "react";
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile, toBlobURL } from '@ffmpeg/util';

async function fetchFile(url) {
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  }
  
//   export default fetchFile;
  

const DemoSand = () => {
    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const ffmpegInstance = useRef(null);

    const loadFfmpeg = async (from) => {
        console.log("WINDOWWWWw", window)
        console.log("FFmpeg", window)
        try {
          const { createFFmpeg } = (window as any)?.FFmpeg;
          // Initialize ffmpeg.js
          ffmpegInstance.current = createFFmpeg({
            log: false,
            progress: (params) => {},
            corePath: '/vendor/ffmpeg-core.js',
          });
          console.log("LOADING!!")
          await ffmpegInstance.current.load();
          console.log("LOADED!!")
        //   sendMessage({ type: "ffmpeg-loaded" });
        } catch (error) {
            console.log("Error", error)
        }
      };
    
    useEffect(() => {
        const script = document.createElement("script");
    
        script.src = "/vendor/ffmpeg.min.js";
        script.async = true;
    
        // On load, set scriptLoaded to true
        script.onload = () => {
            console.log("ON LOAD!!")
        //   scriptLoaded.current = true;
          loadFfmpeg("script load!");
        };
    
        document.body.appendChild(script);
    
        return () => {
          document.body.removeChild(script);
        };
      }, []);

      const transcode = async () => {
        const videoURL = "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi";
        const ffmpeg = ffmpegInstance.current;
        console.log("ffmpegInstance.current", ffmpegInstance.current)
        // await ffmpeg.writeFile("input.avi", await fetchFile(videoURL));
        ffmpeg.FS("writeFile", "input.avi", await fetchFile(videoURL));
        // await ffmpeg.exec(["-i", "input.avi", "output.mp4"]);
        await ffmpeg.run("-i", "input.avi", "output.mp4");
        // const fileData = await ffmpeg.readFile('output.mp4');
        const fileData = await ffmpeg.FS("readFile",'output.mp4');
        const data = new Uint8Array(fileData as ArrayBuffer);
        console.log("DATATTA", data)
        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(
            new Blob([data.buffer], { type: 'video/mp4' })
          )
        }
      };

    return (
        <>
            <p onClick={transcode} > This is sandBox</p>
            <video ref={videoRef} controls></video>
        </>
    )
}

export default DemoSand
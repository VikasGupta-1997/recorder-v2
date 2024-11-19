import { useEffect, useRef, useState } from "react"
import { saveRecordingToIndexedDB } from "~utils/saveRecordingToIndexedDB";

let isRecordingStarted = false;
let isRecordingDiscarded = false;
let recorder;
let recordingChunks = []
let chunks = [];
let userMediaStream;
let windowOnlyAudioRecord = null
let camOnlyRecorder = null;
let camOnlyChunks = [];
let isCamOnlyRecordingDiscarded = false
let isMicOnlyRecordingDiscarded = false

let micOnlyRecorder = null;
let micOnlyChunks = []


const OffScreen = () => {
  const [audioVideoStreams, setAudioVideoStreams] = useState({ audioTrack: null, videoTrack: null })
  const [newStream, setNewStream] = useState(null)
  const [recordSelections, recordSetSelections] = useState(null)
  const [showVideo, setShowVideo] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [startToRecord, setStartToRecord] = useState(false)
  const [recorderState, setRecorderState] = useState('ideal')
  const [camOnlyStream, setCamOnlyStream] = useState(null)
  const [isDiscardRecording, setIsDiscardRecording] = useState(false)
  const [isWindowOnlyRecording, setIsWindowOnlyRecording] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (startToRecord) {
      if (isWindowOnlyRecording) {
        chunks = []
        isRecordingDiscarded = false
        // resetAll()
        recorder = null
        windowOnlyOption(newStream, "./giphy.gif")
        chrome.runtime.sendMessage({ type: "SCREEN_SHARE_WINDOW_SELECTED", selections: recordSelections })
      } else {
        recordStream()
      }
    }
  }, [audioVideoStreams, startToRecord, isWindowOnlyRecording])

  const resetAll = (showVideo?: any) => {
    if(showVideo !== "restart_camonly"){
      isCamOnlyRecordingDiscarded = false
      isMicOnlyRecordingDiscarded = false
    }
    if (recorder && !showVideo) {
      recorder.stop();
      const mediaStream = recorder?.stream;
      mediaStream?.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      recorder = null
    }
    if(camOnlyRecorder) {
      camOnlyRecorder?.stop()
      camOnlyRecorder?.stream?.getTracks()?.forEach(track => track?.stop());
      setCamOnlyStream(null)
      camOnlyRecorder = null
    }
    if(micOnlyRecorder){
      console.log("SEtIfg Off", micOnlyRecorder)
      micOnlyRecorder?.stop()
      micOnlyRecorder?.stream?.getTracks()?.forEach(track => track?.stop());
      // setCamOnlyStream(null)
      micOnlyRecorder = null
    }
    if (userMediaStream) {
      userMediaStream?.getTracks().forEach(track => track.stop());
    }
    camOnlyChunks = []
    micOnlyChunks = []
    setIsWindowOnlyRecording(false)
    setRecorderState('ideal')
    setIsDiscardRecording(false)
    setStartToRecord(false)
    if (!showVideo) {
      setShowVideo(false)
      setAudioVideoStreams(prev => ({
        videoTrack: prev?.videoTrack?.stop(),
        audioTrack: prev?.audioTrack?.stop()
      }))
    }
    recordSetSelections(null)
    setNewStream(prev => prev?.getTracks()?.forEach(track => track.stop()))
    recordingChunks = []
    chunks = []
    setMediaRecorder(null)
    chrome.runtime.sendMessage({ type: "OFFSCREEN_RECORDING_END" })
    if (!showVideo) {
      recorder = null
    }
    isRecordingStarted = false
    if (!showVideo) {
      setTimeout(() => {
        setNewStream(null)
        streamRef.current = {
          videoTrack: null,
          audioTrack: null
        }
      }, 1000)
    }
  }

  const mergeAudioWithStream = async (isAudioDeviceSelected, audioDevice) => {
    let audioTrack = null
    if (isAudioDeviceSelected) {
      let audStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioDevice }
      });
      audioTrack = audStream.getAudioTracks()[0];
    } else {
      console.log("NOT! AUDIO SELECTED")
    }
    return audioTrack
  }

  const windowOnlyOption = async (screenStream, backgroundUrl) => {
    // Get the webcam stream
    userMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: recordSelections?.cameraRecording?.value
      }, audio: false
    });
    const audioDevice = recordSelections?.micRecording?.value;
    const isAudioDeviceSelected = recordSelections?.micRecording && audioDevice !== "mic_off";
    windowOnlyAudioRecord = await mergeAudioWithStream(isAudioDeviceSelected, audioDevice);

    // Create video elements for screen and webcam
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;

    const webcamVideo = document.createElement("video");
    webcamVideo.srcObject = userMediaStream;

    // Function to ensure both videos are playing
    await Promise.all([
      screenVideo.play(),
      webcamVideo.play()
    ]);

    // Create a parent canvas for the combined view
    const recordingCanvas = document.createElement("canvas");
    recordingCanvas.width = 1280; // Set width (or use screenVideo.videoWidth if known)
    recordingCanvas.height = 720; // Set height (or use screenVideo.videoHeight if known)
    const recordingContext = recordingCanvas.getContext("2d");

    // Load the background image
    // const backgroundImage = new Image();
    // backgroundImage.src = backgroundUrl; // URL of the GIF or image
    // await new Promise((resolve) => {
    //     backgroundImage.onload = resolve; // Wait for the image to load
    // });

    // Create OffscreenCanvas for webcam
    const offscreenCanvas = new OffscreenCanvas(180, 180); // Adjusted size for the circular webcam view
    const offscreenContext = offscreenCanvas.getContext("2d");

    // Function to draw frames on the recording canvas
    

    // const drawFrame = () => {
    //   // Draw the background
    //   recordingContext.fillStyle = "black";
    //   recordingContext.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
    
    //   // Define position for the circular webcam display
    //   const webcamX = 4; // 4 pixels padding from the left
    //   const webcamY = recordingCanvas.height - offscreenCanvas.height - 8; // Position at the bottom with 8 pixels padding
    
    //   // Clear the OffscreenCanvas (for the webcam) with transparency
    //   offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    //   // Draw the webcam video on the OffscreenCanvas (before clipping)
    //   offscreenContext.drawImage(webcamVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    //   // Define the circular area for the webcam view
    //   const radius = offscreenCanvas.width / 2; // Use half the width/height for the radius
    //   const centerX = offscreenCanvas.width / 2; // Center horizontally
    //   const centerY = offscreenCanvas.height / 2; // Center vertically
    
    //   // Clip to a circular path
    //   offscreenContext.beginPath();
    //   offscreenContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    //   offscreenContext.clip();
    
    //   // Clear the OffscreenCanvas again to keep the area outside the circle transparent
    //   offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    //   // Draw the webcam image again within the circular area
    //   offscreenContext.drawImage(webcamVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    //   // Draw the circular webcam view onto the recording canvas
    //   recordingContext.drawImage(offscreenCanvas, webcamX, webcamY);
    
    //   // Calculate the dimensions for the screen video
    //   const screenAspectRatio = screenVideo.videoWidth / screenVideo.videoHeight;
    //   const canvasWidth = recordingCanvas.width * 0.85 - 8; // 85% of canvas width with 8 pixels padding
    //   const canvasHeight = recordingCanvas.height;
    
    //   let screenWidth = canvasWidth;
    //   let screenHeight = screenWidth / screenAspectRatio;
    
    //   // Adjust dimensions to ensure the screen video fits within the canvas
    //   if (screenHeight > canvasHeight) {
    //     screenHeight = canvasHeight;
    //     screenWidth = screenHeight * screenAspectRatio;
    //   }
    
    //   // Center the screen video vertically
    //   const screenX = offscreenCanvas.width + 8; // 8 pixels gap after the webcam
    //   const screenY = (recordingCanvas.height - screenHeight) / 2;
    
    //   // Draw the screen video
    //   recordingContext.drawImage(screenVideo, screenX, screenY, screenWidth, screenHeight);
    // };

    const drawFrame = () => {
      // Fill the background with black
      recordingContext.fillStyle = "black";
      recordingContext.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
  
      // Define the circular area for the webcam display
      const radius = offscreenCanvas.width / 2; // Use half the width/height for the radius
      const centerX = offscreenCanvas.width / 2; // Center horizontally
      const centerY = offscreenCanvas.height / 2; // Center vertically
  
      // Clear the offscreen canvas before drawing
      offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
      // Clip the offscreen context to a circular path
      offscreenContext.beginPath();
      offscreenContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
      offscreenContext.closePath();
      offscreenContext.clip();
  
      // Draw the webcam video within the clipped circular area
      offscreenContext.drawImage(webcamVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
      // Calculate dimensions and position for screen recording
      const screenX = offscreenCanvas.width + 8; // Align with 8 pixels padding from the webcam
      const screenWidth = recordingCanvas.width - screenX; // Calculate remaining width
      const screenHeight = screenVideo.videoHeight * (screenWidth / screenVideo.videoWidth); // Maintain aspect ratio
      const screenY = (recordingCanvas.height - screenHeight) / 2; // Center vertically
  
      // Calculate the webcam position to align with the bottom of the screen recording view
      const webcamX = 4; // 4 pixels padding from the left
      const webcamY = screenY + screenHeight - offscreenCanvas.height; // Align webcam to the bottom of screen recording
  
      // Draw the circular webcam view onto the recording canvas
      recordingContext.drawImage(offscreenCanvas, webcamX, webcamY);
  
      // Draw the screen video
      recordingContext.drawImage(screenVideo, screenX, screenY, screenWidth, screenHeight);
  };
  
  

    // const drawFrame = () => {
    //   // Fill the background with black
    //   recordingContext.fillStyle = "black";
    //   recordingContext.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
  
    //   // Define the circular area for the webcam display
    //   const radius = offscreenCanvas.width / 2; // Use half the width/height for the radius
    //   const centerX = offscreenCanvas.width / 2; // Center horizontally
    //   const centerY = offscreenCanvas.height / 2; // Center vertically
  
    //   // Clear the offscreen canvas before drawing
    //   offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
    //   // Clip the offscreen context to a circular path
    //   offscreenContext.beginPath();
    //   offscreenContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    //   offscreenContext.closePath();
    //   offscreenContext.clip();
  
    //   // Draw the webcam video within the clipped circular area
    //   offscreenContext.drawImage(webcamVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
    //   // Draw the circular webcam view onto the recording canvas
    //   const webcamX = 8; // 8 pixels padding from the left
    //   const webcamY = recordingCanvas.height - offscreenCanvas.height - 8; // Align at the bottom with 8 pixels padding
    //   recordingContext.drawImage(offscreenCanvas, webcamX, webcamY);
  
    //   // Draw the screen video on the remaining canvas
    //   const screenX = offscreenCanvas.width + 16; // Place next to the webcam with padding
    //   const screenWidth = recordingCanvas.width - screenX - 8; // Remaining width after webcam and padding
    //   const screenHeight = screenVideo.videoHeight * (screenWidth / screenVideo.videoWidth); // Maintain aspect ratio
  
    //   // Align the screen video baseline with the webcam baseline
    //   const screenY = recordingCanvas.height - screenHeight - 8; // Align at the bottom with 8 pixels padding
  
    //   // Draw the screen video
    //   recordingContext.drawImage(screenVideo, screenX, screenY, screenWidth, screenHeight);
    // };
  
    const drawInterval = setInterval(drawFrame, 1000 / 30); // 30 fps

    const combinedStream = new MediaStream([
      ...recordingCanvas.captureStream(30).getTracks(), // Capture video from the canvas
      ...(windowOnlyAudioRecord ? [windowOnlyAudioRecord] : []) // Only add audio track if it exists
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.start();

    mediaRecorder.onstop = async () => {
      setRecorderState('ideal');
      if (!isRecordingDiscarded) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        // const videoUrl = URL.createObjectURL(blob);
        // const downloadLink = document.createElement('a');
        // downloadLink.href = videoUrl;
        // downloadLink.download = 'recorded-video.webm'; // Default name for the file
        // document.body.appendChild(downloadLink); // Append it to the DOM

        // // Trigger the download
        // downloadLink.click();

        // // Clean up the temporary <a> element and Blob URL
        // document.body.removeChild(downloadLink);
        // URL.revokeObjectURL(videoUrl); // Free up memory
        function onComplete() {
          const url = URL.createObjectURL(blob);
          clearInterval(drawInterval);
          chrome.runtime.sendMessage({
            type: 'CLEAR_RECORDING_UI',
          });
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url
          });
        }
        onComplete()
        saveRecordingToIndexedDB(blob)
      } else {
        chrome.runtime.sendMessage({ type: "OFFSCREEN_RECORDING_END" });
        chunks = [];
        setStartToRecord(true);
      }
      if (userMediaStream) {
        userMediaStream.getTracks().forEach(track => track.stop());
      }

      if (windowOnlyAudioRecord) {
        windowOnlyAudioRecord?.audioTrack?.stop()
      }

      chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" });
    }
    recorder = mediaRecorder;
  }

  const recordingScreens = async (selections) => {
    try {
      const audioDevice = selections?.micRecording?.value;
      const isAudioDeviceSelected = selections?.micRecording && audioDevice !== "mic_off";
      const videoDevice = selections?.cameraRecording?.value;
      let videoTrack;
      let displayStream;
      const makeCamDisabled = ["screenOnly", "audioOnly"].includes(selections?.screenRecording?.value)
      const isVidDisable = selections?.cameraRecording?.disable || makeCamDisabled
      displayStream = await navigator.mediaDevices.getDisplayMedia(
        isVidDisable ? {
          video: { displaySurface: 'monitor' },
        } : {
          video: { displaySurface: 'monitor', deviceId: videoDevice },
        });
      videoTrack = displayStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const injectVideo = settings?.displaySurface === 'browser'
      const isWindowVideo = settings?.displaySurface === "window"
      if (isVidDisable) {
        setShowVideo(false)
      } else {
        if (injectVideo) {
          chrome.runtime.sendMessage({ type: "INJECT_VIDEOCAM" })
        } else if (isWindowVideo) {
          //Add Webcam in bottom corner of screen recorded
          setIsWindowOnlyRecording(true)
        } else {
          setShowVideo(true)
        }
      }
      videoTrack.addEventListener('ended', () => {
        if (isRecordingStarted) {
          handleRemoveVideo()
        } else {
          chrome.runtime.sendMessage({ type: "CLEAR_RECORDING_UI" })
          handleRemoveVideo()
        }
      });

      const audioTrack = await mergeAudioWithStream(isAudioDeviceSelected, audioDevice)
      setAudioVideoStreams({ audioTrack: audioTrack, videoTrack: videoTrack })
      setNewStream(displayStream)
      chrome.runtime.sendMessage({ type: "CHECK_FOR_SYSTEM_SCREEN", screenShareSelection: settings?.displaySurface })
      chrome.runtime.sendMessage({ type: "START_COUNTDOWN" })
    } catch (error) {
      console.log("error", error)
      handleRemoveVideo()
    }
  }

  const handleRemoveVideo = (isFromDiscard = false) => {
    if (recorder) {
      recorder?.stop();
    }
    if (videoRef?.current) {
      if (document.pictureInPictureElement === videoRef.current) {
        document.exitPictureInPicture()
          .then(() => {
            console.log("Exited Picture-in-Picture mode.");
            stopAndRemoveVideo();
          })
          .catch((error) => {
            console.error("Failed to exit Picture-in-Picture mode:", error);
          });
      } else {
        stopAndRemoveVideo();
      }
    } else {
      resetAll()
    }
  };

  const stopAndRemoveVideo = () => {
    const stream = videoRef?.current?.srcObject;
    if (stream) {
      const tracks = stream?.getTracks();
      tracks.forEach(track => track?.stop());
    }

    videoRef.current.srcObject = null;

    videoRef?.current?.parentNode?.removeChild(videoRef?.current);
    resetAll()
  };

  function trigger_in() {
    videoRef.current.requestPictureInPicture().catch(console.error);
  };

  const appendVideoOrNot = async () => {
    if (recordSelections?.cameraRecording?.value && !recordSelections?.cameraRecording?.disable) {
      const vidStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: recordSelections?.cameraRecording?.value } });
      videoRef.current.srcObject = vidStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        trigger_in()
      }
    }
  }

  useEffect(() => {
    if (showVideo) {
      appendVideoOrNot()
    }
  }, [showVideo])
  const streamRef = useRef({ videoTrack: null, audioTrack: null })
  const recordStream = () => {
    const { videoTrack, audioTrack } = audioVideoStreams
    const tracks = [];
    if (videoTrack instanceof MediaStreamTrack) {
      tracks.push(videoTrack);
      // Listen for the track ending, such as when screen sharing is stopped by the user.
      videoTrack.onended = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop(); // This triggers the `onstop` event handler.
        }
      };
    }
    if (audioTrack instanceof MediaStreamTrack) {
      tracks.push(audioTrack);
    }
    let mediaRecorder
    if (tracks.length > 0) {
      const mediaStream = new MediaStream(tracks);
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.push(event.data)
        }
      };

      mediaRecorder.onstop = async () => {
        setRecorderState('ideal')
        if (!isRecordingDiscarded) {
          const blob = new Blob(recordingChunks, { type: 'video/webm' });
          function onComplete() {
            const url = (URL as any).createObjectURL(blob);
            chrome.runtime.sendMessage({
              type: 'CLEAR_RECORDING_UI',
            });
            chrome.runtime.sendMessage({
              type: 'OPEN_PREVIEW_TAB',
              videoUrl: url
            });
          }
          onComplete()
          saveRecordingToIndexedDB(blob)
        }
        chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
      };
      mediaRecorder.onended = () => {
        mediaRecorder.onstop()
      }
      mediaRecorder.onstart = () => {
        chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" })
        recordingChunks = []
        isRecordingStarted = true
      }
      mediaRecorder.start();
      recorder = mediaRecorder
      setMediaRecorder(mediaRecorder)
    } else {
      console.error('No valid MediaStreamTrack objects provided for recording.');
    }
  };

  useEffect(() => {
    if (recorderState === 'pause') {
      mediaRecorder?.pause()
    }
    if (recorderState === 'play') {
      mediaRecorder?.resume()
    }
  }, [recorderState, mediaRecorder])

  const restartRecording = () => {
    chrome.runtime.sendMessage({ type: "stopTimer" })
    isRecordingStarted = true
    isRecordingDiscarded = true
    recorder?.stop()
  }

  const saveMicRecording = () => {
    console.log("saveMicRecording called!!")
    const blob = new Blob(micOnlyChunks, {
        type: 'audio/webm; codecs=opus'
    });
    function onComplete(){
        const url = (URL as any).createObjectURL(blob);
         console.log("url1122", url)
         if(!isMicOnlyRecordingDiscarded){
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url,
            isAudioOnly: true
        });
        chrome.runtime.sendMessage({type: "RECORDING_IN_PROGRESS_END"})
         }
       
        // Create a download link
        //  const url = URL.createObjectURL(blob);
        //  const downloadLink = document.createElement("a");
        //  downloadLink.href = url;
        //  downloadLink.download = "recording12Mic.webm"; // Set the filename for download
        //  downloadLink.style.display = "none";
 
        //  // Append link to the body and click to start download
        //  document.body.appendChild(downloadLink);
        //  downloadLink.click();
 
        //  // Clean up after download
        //  document.body.removeChild(downloadLink);
        //  URL.revokeObjectURL(url); // Release the URL object
         resetAll()
         micOnlyChunks = []
        // console.log("url1122", url)
        // chrome.runtime.sendMessage({
        //     type: 'OPEN_PREVIEW_TAB',
        //     videoUrl: url,
        //     isAudioOnly: true
        // });
        // chrome.runtime.sendMessage({type: "RECORDING_IN_PROGRESS_END"})
    }
    onComplete()
    if(!isMicOnlyRecordingDiscarded){
      saveRecordingToIndexedDB(blob)
    }
};

  const recordMicOnly = async selections => {
    console.log("recordMicOnly121", selections)
    const stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: selections?.micRecording?.value}});
    micOnlyRecorder = new MediaRecorder(stream);
    micOnlyRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            micOnlyChunks.push(event.data);
        }
    };
    micOnlyRecorder.onstop = saveMicRecording;
    micOnlyRecorder.start();
    micOnlyRecorder.onstart = () => {
        console.log("YES STYARTED")
        micOnlyChunks = []
        chrome.runtime.sendMessage({ type: 'startTimer' })
        isRecordingStarted = true
        chrome.runtime.sendMessage({type: "RECORDING_IN_PROGRESS"})
    }
    // setIsRecordingStartedS(true)
    console.log('Recording started...');
    // setMediaRecorder(recorder)
  }

  const recordCameraOnly = async (selections) => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: selections?.micRecording.value !== "mic_off" ? { deviceId: selections?.micRecording?.value } : false,
      video: { deviceId: selections?.cameraRecording?.value }
    });
    camOnlyRecorder = new MediaRecorder(mediaStream);
    camOnlyRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        camOnlyChunks.push(event.data)
        // Handle recorded data (e.g., save it or upload it)
        console.log('Recorded data available:', event.data);
      }
    };
    camOnlyRecorder.start();

    camOnlyRecorder.onstop = async () => {

      const blob = new Blob(camOnlyChunks, { type: 'video/webm' });
      // Convert Blob to Base64
      console.log(isCamOnlyRecordingDiscarded,"onstop", blob)
      function onComplete() {
        console.log("Recording saved to IndexedDB", isCamOnlyRecordingDiscarded)
        const url = (URL as any).createObjectURL(blob);
        // Create a download link
        //  const url = URL.createObjectURL(blob);
        //  const downloadLink = document.createElement("a");
        //  downloadLink.href = url;
        //  downloadLink.download = "recording.webm"; // Set the filename for download
        //  downloadLink.style.display = "none";
 
        //  // Append link to the body and click to start download
        //  document.body.appendChild(downloadLink);
        //  downloadLink.click();
 
        //  // Clean up after download
        //  document.body.removeChild(downloadLink);
        //  URL.revokeObjectURL(url); // Release the URL object
 
        // console.log("BLOB URL", url, chrome?.storage)
        if(!isCamOnlyRecordingDiscarded){
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url
          });
          chrome.runtime.sendMessage({type: "CLOSE_CAM_ONLY_WINDOW"})
          chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
        }
        camOnlyChunks = []
        resetAll()
      }
      console.log("SHould Not call",isCamOnlyRecordingDiscarded)
      onComplete()
      if(!isCamOnlyRecordingDiscarded) {
        saveRecordingToIndexedDB(blob)
      }
    };

    camOnlyRecorder.onended = () => {
      camOnlyRecorder.onstop()
    }

    camOnlyRecorder.onstart = () => {
      console.log("STARTED HERE!!")
      // setIsRecordingPaused(false);
      chrome.runtime.sendMessage({ type: 'startTimer' })
      chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" })
      isRecordingStarted = true
    }
    // setCamOnlyStream(mediaStream)
  }

  const onMountListners = () => {
    chrome.runtime.onMessage.addListener(
      function async(message,sender, sendResponse) {
        switch (message.type) {
          case "END_CAM_ONLY_RECORDING": {
            console.log("END_CAM_ONLY_RECORDING", camOnlyRecorder)
            camOnlyRecorder?.stop()
          }
          break;
          case "END_MIC_ONLY_RECORDING": {
            isMicOnlyRecordingDiscarded = false
            console.log("END_CAM_ONLY_RECORDING", micOnlyRecorder)
            micOnlyRecorder?.stop()
          }
          break;
          case "START_CAM_ONLY_RECORDING": {
            console.log("START_CAM_ONLY_RECORDING", message)
            camOnlyChunks = []
            recordCameraOnly(message?.data)
          }
            break;
          case "START_MIC_ONLY_RECORDING": {
            console.log("START_MIC_ONLY_RECORDING", message)
            recordMicOnly(message?.data)
          }
          break;
          case "PAUSE_CAMONLY_TIMER": {
            camOnlyRecorder?.pause()
            chrome.runtime.sendMessage({ type: 'pauseTimer' })
          }
          break;
          case "AUDIOONLY_RECORDING_DELETE": {
            isMicOnlyRecordingDiscarded = true
            chrome.runtime.sendMessage({ type: 'stopTimer' })
            micOnlyRecorder?.stop()
          }
          break;
          case "AUDIOONLY_RECORDING_RESTART": {
            isMicOnlyRecordingDiscarded = true
            chrome.runtime.sendMessage({ type: 'stopTimer' })
            micOnlyChunks = []
          }
          break;
          case "DELETE_CAMONLY_RECORDING": {
            console.log("DELETE!!!CALLLEDDD")
            isCamOnlyRecordingDiscarded = true
            chrome.runtime.sendMessage({ type: 'stopTimer' })
            camOnlyRecorder?.stop()

          }
          break;
          case "RESTART_CAMONLY_RECORDING": {
            // camOnlyChunks = []
            isCamOnlyRecordingDiscarded = true
            resetAll("restart_camonly")
            sendResponse("close")
          }
          break;
          case "RESTART_MICONLY_RECORDING": {
            // camOnlyChunks = []
            isMicOnlyRecordingDiscarded = true
            resetAll("restart_camonly")
            sendResponse("close")
          }
          break;
          case "PLAY_CAMONLY_TIMER": {
            camOnlyRecorder?.resume()
            chrome.runtime.sendMessage({ type: 'resumeTimer' })
          }
          break;
          case "START_RECORDING_OFFSCREEN": {
            console.log("MESS OFF", message)
            if (message?.isCamOnly) {
              chrome.runtime.sendMessage({ type: "OPEN_CAM_ONLY_RECORDING", selections: message?.data })
            } else if(message?.isAudioOnly){
              console.log("Audio Only Recording!!", message)
              chrome.runtime.sendMessage({ type: "OPEN_MIC_ONLY_RECORDING", selections: message?.data })
            } else {
              recordSetSelections(message?.data)
              recordingScreens(message?.data)
            }
          }
            break;
          case "NEW_RECORDING_STARTED_OFFSCREEN": {
            isRecordingDiscarded = false
            setStartToRecord(true)
          }
            break;
          case "RECORDING_END_OFFSCREEN": {
            // resetAll()
            // if(recorder){
            //   recorder?.start()
            // }
            setIsDiscardRecording(true)
            // isDiscardRecording = true
            handleRemoveVideo()
          }
            break;
          case "RECORDING_PAUSE_OFFSCREEN": {
            console.log("Recording pause")
            recorder?.pause()
            // setRecorderState('pause')
            // mediaRecorder?.pause();
            // console.log("RECORDING_PAUSE_OFFSCREEN FROM OFFSCREEN!")
          }
            break;
          case "AUDIOONLY_RECORDING_PAUSE": {
            console.log("PAUSE OFFSCREEN MIC ONLY", micOnlyRecorder)
            micOnlyRecorder?.pause()
          }
          break;
          case "AUDIOONLY_RECORDING_PLAY": {
            console.log("PLAY OFFSCREEN MIC ONLY", micOnlyRecorder)
            chrome.runtime.sendMessage({ type: 'resumeTimer' })
            micOnlyRecorder?.resume()
          }
          break;
          case "RECORDING_PLAY_OFFSCREEN": {
            recorder?.resume()
            // setRecorderState('play')
            // mediaRecorder?.play();
            // console.log("RECORDING_PLAY_OFFSCREEN FROM OFFSCREEN!")
          }
            break;
          case "RECORDING_DELETE_OFFSCREEN": {
            console.log("RECORDING_DELETE_OFFSCREEN FROM OFFSCREEN!")
          }
            break;
          case "RECORDING_RESTART_OFFSCREEN": {
            chrome.runtime.sendMessage({ type: "PreviewShow" })
            setIsDiscardRecording(true)
            setStartToRecord(false)
            restartRecording()
          }
            break;
          case "CHECK_VID_BLOB_OFFSCREEN": {
          }
            break;
        }
      })
  }

  useEffect(() => {
    onMountListners()
  }, [])

  return <div className="videoRef" >
    {
      showVideo && <div id="floating-video">
        <video id="recording-output" ref={videoRef} width="200" height="150" muted></video>
      </div>
    }
  </div>
}

export default OffScreen
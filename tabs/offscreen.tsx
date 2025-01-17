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
let recordedStreamBase64 = null
let audioBitsPerSecond = 128000;
let videoBitsPerSecond = 5000000;

let micOnlyRecorder = null;
let micOnlyChunks = []
let vidStream;
const mimeTypes = [
  "video/webm;codecs=avc1",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm;codecs=h264",
  "video/webm",
];

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
  const [uploadChunksCall, setUploadChunksCall] = useState(false)
  const videoRef = useRef(null)
  const [base64Data, setBase64Data] = useState(null)
  const [isPreviewOpened, setIsPreviewOpened] = useState(false)
  const window10 = navigator.userAgent.match(/Windows NT 10.0/)
  // const [base64, setBase64] = useState<string>('');

  // console.log("base641122121",base64 )
  // console.log("1121", base64)
  useEffect(() => {
    if (startToRecord) {
      if (isWindowOnlyRecording) {
        chunks = []
        isRecordingDiscarded = false
        // resetAll()
        recorder = null
        // if(window10){
        //   console.log("Is window 10 call")
        //   windowOnlyOptionWindow10(newStream, "./giphy.gif")
        // }else {
        console.log("Is normal  call")
        windowOnlyOption(newStream, "./giphy.gif")
        // }
        chrome.runtime.sendMessage({ type: "SCREEN_SHARE_WINDOW_SELECTED", selections: recordSelections })
      } else {
        recordStream()
      }
    }
  }, [audioVideoStreams, startToRecord, isWindowOnlyRecording])

  const uploadChunks = () => {
    console.log("uploadChunks started!!")
    const chunkSize = 1024 * 1024; // 1 MB per chunk
    let chunkIndex = 0;

    while (chunkIndex * chunkSize < base64Data.length) {
      const chunk = base64Data.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize); // No more type error
      chrome.runtime.sendMessage({
        type: "RECORDING_CHUNK",
        data: chunk,
        index: chunkIndex,
        isLastChunk: (chunkIndex + 1) * chunkSize >= base64Data.length
      });
      console.log(`Sent chunk ${chunkIndex}`);
      chunkIndex++;
    }
    chrome.runtime.sendMessage({
      type: "RECORDING_CHUNK_UPLOAD_COMPLETE",
      index: chunkIndex,
      isLastChunk: (chunkIndex + 1) * chunkSize >= base64Data.length
    });
    console.log("All chunks sent.");
  }

  useEffect(() => {
    if (isPreviewOpened) {
      if (base64Data) {
        console.log("base64Data1121", base64Data)
        if (uploadChunksCall) {
          uploadChunks()
          setIsPreviewOpened(false)
          setUploadChunksCall(false)
        }
      }
    }
  }, [isPreviewOpened, base64Data, uploadChunksCall])

  const resetAll = async (showVideo?: any) => {
    if (showVideo !== "restart_camonly") {
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

    if (vidStream) {
      // Stop all tracks in the MediaStream
      vidStream.getTracks().forEach((track) => track.stop());

      // Optional: Clear the video container or remove the video element
      const container = document.getElementById('video-container');
      if (container) {
        container.innerHTML = ''; // Clear all children (removes the video element)
      }

      // Exit Picture-in-Picture if active
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
          console.log("Exited Picture-in-Picture mode.");
        } catch (error) {
          console.error("Error exiting Picture-in-Picture:", error);
        }
      }

      console.log("Video stream stopped, and resources released.");
    } else {
      console.warn("No active video stream to stop.");
    }

    if (camOnlyRecorder) {
      camOnlyRecorder?.stop()
      camOnlyRecorder?.stream?.getTracks()?.forEach(track => track?.stop());
      setCamOnlyStream(null)
      camOnlyRecorder = null
    }
    if (micOnlyRecorder) {
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
    let audioTrack = null;

    const context = new AudioContext(); // Create an audio context
    const destination = context.createMediaStreamDestination(); // Create a destination

    if (isAudioDeviceSelected) {
      let audStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioDevice },
      });

      if (audStream.getAudioTracks().length > 0) {
        const audioInputSource = context.createMediaStreamSource(audStream);
        const audioInputGain = context.createGain();

        // Connect source to gain node and then to destination
        audioInputSource.connect(audioInputGain).connect(destination);

        // Set gain to 1 for normal volume
        audioInputGain.gain.value = 1;

        audioTrack = destination.stream.getAudioTracks()[0];
      }
    } else {
      console.log("No audio selected, muting the audio track");

      // Create a silent stream and set its volume to 0
      const oscillator = context.createOscillator(); // Generate a constant tone
      const audioInputGain = context.createGain();
      oscillator.connect(audioInputGain).connect(destination);

      // Mute the silent track by setting gain to 0
      audioInputGain.gain.value = 0;
      oscillator.start();

      audioTrack = destination.stream.getAudioTracks()[0];
    }

    return audioTrack;
  };

  // const mergeAudioWithStream = async (isAudioDeviceSelected, audioDevice) => {
  //   let audioTrack = null
  //   if (isAudioDeviceSelected) {
  //     let audStream = await navigator.mediaDevices.getUserMedia({
  //       audio: { deviceId: audioDevice }
  //     });
  //     audioTrack = audStream.getAudioTracks()[0];
  //   } else {
  //     console.log("NOT! AUDIO SELECTED")
  //   }
  //   return audioTrack
  // }

  const windowOnlyOptionWindow10 = async (screenStream, backgroundUrl) => {
    // Get the webcam stream
    userMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: recordSelections?.cameraRecording?.value
      },
      audio: false
    });

    const audioDevice = recordSelections?.micRecording?.value;
    const isAudioDeviceSelected = recordSelections?.micRecording && audioDevice !== "mic_off";

    // Create audio track based on mic selection (use silent audio if no mic)
    let windowOnlyAudioRecord;
    if (isAudioDeviceSelected) {
      windowOnlyAudioRecord = await mergeAudioWithStream(true, audioDevice);
    } else {
      console.log('No audio track found. Adding a silent small wave audio track...');
      const audioContext = new AudioContext();
      const silentSource = audioContext.createBufferSource(); // Create a silent audio source
      const emptyBuffer = audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate); // Stereo buffer
      silentSource.buffer = emptyBuffer; // Assign the empty buffer to the source
      const destination = audioContext.createMediaStreamDestination();
      silentSource.connect(destination); // Connect the source to the destination
      silentSource.start(); // Start the silent source
      const silentAudioTrack = destination.stream.getAudioTracks()[0];
      // tracks.push(silentAudioTrack); // Add the silent audio track
      // const audioContext = new AudioContext();
      // const oscillator = audioContext.createOscillator();
      // const destination = audioContext.createMediaStreamDestination();
      // oscillator.connect(destination);
      // oscillator.start();
      // oscillator.stop(audioContext.currentTime + 1); // Create a short silent sound
      // const silentAudioTrack = destination.stream.getAudioTracks()[0];

      // Merge the silent audio with the webcam stream (we don't want to capture actual audio if mic is off)
      windowOnlyAudioRecord = silentAudioTrack;
    }

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
    const offscreenCanvas = new OffscreenCanvas(180, 180); // Adjusted size for the circular webcam view
    const offscreenContext = offscreenCanvas.getContext("2d");

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

    setTimeout(() => {
      mediaRecorder.start();
    }, 250)

    mediaRecorder.onstop = async () => {
      setRecorderState('ideal');
      if (!isRecordingDiscarded) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        function onComplete() {
          const url = URL.createObjectURL(blob);
          clearInterval(drawInterval);
          chrome.runtime.sendMessage({
            type: 'CLEAR_RECORDING_UI',
          });
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url,
            hasAudio: isAudioDeviceSelected
          });
        }
        onComplete();
        const base64Data = await saveRecordingToIndexedDB(blob);
        recordedStreamBase64 = base64Data;
        setBase64Data(base64Data);
      } else {
        chrome.runtime.sendMessage({ type: "OFFSCREEN_RECORDING_END" });
        chunks = [];
        setStartToRecord(true);
      }
      if (userMediaStream) {
        userMediaStream.getTracks().forEach(track => track.stop());
      }

      if (windowOnlyAudioRecord) {
        windowOnlyAudioRecord?.stop();
      }

      chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" });
    };
    recorder = mediaRecorder;
  };


  const windowOnlyOption = async (screenStream, backgroundUrl) => {
    // Get the webcam stream
    navigator.storage.persist();
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
    const offscreenCanvas = new OffscreenCanvas(180, 180); // Adjusted size for the circular webcam view
    const offscreenContext = offscreenCanvas.getContext("2d");

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

    const drawInterval = setInterval(drawFrame, 1000 / 30); // 30 fps

    const combinedStream = new MediaStream([
      ...recordingCanvas.captureStream(30).getTracks(), // Capture video from the canvas
      ...(windowOnlyAudioRecord ? [windowOnlyAudioRecord] : []) // Only add audio track if it exists
    ]);

    let mimeType = mimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    );
    console.log("mimeType", mimeType)

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: mimeType,
      audioBitsPerSecond: audioBitsPerSecond,
      videoBitsPerSecond: videoBitsPerSecond,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    setTimeout(() => {
      mediaRecorder.start();
    }, 250)

    mediaRecorder.onstop = async () => {
      setRecorderState('ideal');
      if (!isRecordingDiscarded) {
        const blob = new Blob(chunks, { type: 'video/mp4' });
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
            videoUrl: url,
            hasAudio: isAudioDeviceSelected
          });
        }
        onComplete()
        const base64Data = await saveRecordingToIndexedDB(blob)
        recordedStreamBase64 = base64Data
        setBase64Data(base64Data)
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
          console.log("NOW APPEND VIDEO@!!!")
          appendVideoOrNot(selections?.cameraRecording)
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
    console.log("TriggeerCalled!!")
    videoRef.current.requestPictureInPicture().catch(console.error);
  };

  const appendVideoOrNot = async (cameraRecording) => {
    if (cameraRecording?.value && !cameraRecording?.disable) {
      const vidStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: cameraRecording?.value } });
      videoRef.current.srcObject = vidStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        trigger_in()
      }
    }
  };

  const streamRef = useRef({ videoTrack: null, audioTrack: null })
  const recordStream = async () => {
    navigator.storage.persist();
    const { videoTrack, audioTrack } = audioVideoStreams
    console.log("videoTrack==>", videoTrack)
    console.log("audioTrack==>", audioTrack)
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
    } else {

    }
    let mediaRecorder
    if (tracks.length > 0) {
      // const { qualityValue } = await chrome.storage.local.get(["qualityValue"]);


      // if (qualityValue === "4k") {
      //   audioBitsPerSecond = 192000;
      //   videoBitsPerSecond = 40000000;
      // } else if (qualityValue === "1080p") {
      //   audioBitsPerSecond = 192000;
      //   videoBitsPerSecond = 8000000;
      // } else if (qualityValue === "720p") {
      //   audioBitsPerSecond = 128000;
      //   videoBitsPerSecond = 5000000;
      // } else if (qualityValue === "480p") {
      //   audioBitsPerSecond = 96000;
      //   videoBitsPerSecond = 2500000;
      // } else if (qualityValue === "360p") {
      //   audioBitsPerSecond = 96000;
      //   videoBitsPerSecond = 1000000;
      // } else if (qualityValue === "240p") {
      //   audioBitsPerSecond = 64000;
      //   videoBitsPerSecond = 500000;
      // }
      // List all mimeTypes

      // Check if the browser supports any of the mimeTypes, make sure to select the first one that is supported from the list
      let mimeType = mimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType)
      );
      console.log("mimeType", mimeType)
      const mediaStream = new MediaStream(tracks);
      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: mimeType,
        audioBitsPerSecond: audioBitsPerSecond,
        videoBitsPerSecond: videoBitsPerSecond,
      });
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
              videoUrl: url,
              hasAudio: !!audioTrack
            });
          }
          onComplete()
          const base64Data = await saveRecordingToIndexedDB(blob)
          recordedStreamBase64 = base64Data
          setBase64Data(base64Data)
        }
        chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
      };
      mediaRecorder.onended = () => {
        mediaRecorder.onstop()
      }
      setTimeout(() => {
        mediaRecorder.start();
      }, 300)
      mediaRecorder.onstart = () => {
        chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" })
        recordingChunks = []
        isRecordingStarted = true
      }
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

  const saveMicRecording = async () => {
    console.log("saveMicRecording called!!")
    const blob = new Blob(micOnlyChunks, {
      type: 'audio/webm; codecs=opus'
    });
    function onComplete() {
      const url = (URL as any).createObjectURL(blob);
      console.log("url1122", url)
      if (!isMicOnlyRecordingDiscarded) {
        chrome.runtime.sendMessage({
          type: 'OPEN_PREVIEW_TAB',
          videoUrl: url,
          isAudioOnly: true,
        });
        chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
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
    if (!isMicOnlyRecordingDiscarded) {
      const base64Data = await saveRecordingToIndexedDB(blob)
      recordedStreamBase64 = base64Data
      setBase64Data(base64Data)

    }
  };

  const recordMicOnly = async selections => {
    navigator.storage.persist();
    console.log("recordMicOnly121", selections)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selections?.micRecording?.value } });
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
      chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" })
    }
    // setIsRecordingStartedS(true)
    console.log('Recording started...');
    // setMediaRecorder(recorder)
  }

  const recordCameraOnly = async (selections) => {
    navigator.storage.persist();
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: selections?.micRecording?.value },
      video: { deviceId: selections?.cameraRecording?.value }
    });
    let finalStream = mediaStream;
    let mimeType = mimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    );
    console.log("selections?.micRecording==>", selections?.micRecording)
    if (selections?.micRecording?.value === "mic_off") {
      console.log("Yes is there No sound!")
      console.log("No audio Track==>")
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(mediaStream);
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      // Set volume to 0
      gainNode.gain.value = 0;

      // Connect the source, gain node, and destination
      audioSource.connect(gainNode).connect(destination);

      // Replace the original audio track with the processed track
      const newAudioTrack = destination.stream.getAudioTracks()[0];
      finalStream = new MediaStream([
        ...mediaStream.getVideoTracks(),
        newAudioTrack,
      ]);
    }
    console.log("mimeType", mimeType)
    if (!mimeType) {
      console.error("No supported MIME type found");
      return;
    }
    camOnlyRecorder = new MediaRecorder(finalStream, {
      mimeType: mimeType,
      audioBitsPerSecond: audioBitsPerSecond,
      videoBitsPerSecond: videoBitsPerSecond,
    });
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
      console.log(isCamOnlyRecordingDiscarded, "onstop", blob)
      function onComplete() {
        console.log("Recording saved to IndexedDB", isCamOnlyRecordingDiscarded)
        const url = (URL as any).createObjectURL(blob);

        if (!isCamOnlyRecordingDiscarded) {
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url,
            hasAudio: selections?.micRecording.value !== "mic_off"
          });
          chrome.runtime.sendMessage({ type: "CLOSE_CAM_ONLY_WINDOW" })
          chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" })
        }
        camOnlyChunks = []
        resetAll()
      }
      console.log("SHould Not call", isCamOnlyRecordingDiscarded)
      onComplete()
      if (!isCamOnlyRecordingDiscarded) {
        console.log("CAM RECORDIGN ENDEDDD!!!!")
        const base64Data = await saveRecordingToIndexedDB(blob)
        recordedStreamBase64 = base64Data
        setBase64Data(base64Data)
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

  const recordCameraOnlyWindow10 = async (selections) => {
    navigator.storage.persist();
    // Create the media stream with or without audio based on microphone selection
    let mediaStream;
    let mimeType = mimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    );
    console.log("mimeType", mimeType)
    if (!mimeType) {
      console.error("No supported MIME type found");
      return;
    }
    if (selections?.micRecording?.value !== "mic_off") {
      // If mic is selected, get audio from the selected mic device
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selections?.micRecording?.value },
        video: { deviceId: selections?.cameraRecording?.value }
      });
    } else {

      console.log('No audio track found. Adding a silent small wave audio track...');
      const audioContext = new AudioContext();
      const silentSource = audioContext.createBufferSource(); // Create a silent audio source
      const emptyBuffer = audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate); // Stereo buffer
      silentSource.buffer = emptyBuffer; // Assign the empty buffer to the source
      const destination = audioContext.createMediaStreamDestination();
      silentSource.connect(destination); // Connect the source to the destination
      silentSource.start(); // Start the silent source
      const silentAudioTrack = destination.stream.getAudioTracks()[0];
      // tracks.push(silentAudioTrack); // Add the silent audio track

      // If no mic is selected, create a silent audio track
      // const audioContext = new AudioContext();
      // const oscillator = audioContext.createOscillator();
      // const destination = audioContext.createMediaStreamDestination();
      // oscillator.connect(destination);
      // oscillator.start();
      // oscillator.stop(audioContext.currentTime + 1); // Create a short silent sound
      // const silentAudioTrack = destination.stream.getAudioTracks()[0];

      // Get video stream as usual
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selections?.cameraRecording?.value }
      });

      // Combine the silent audio track with the video stream
      mediaStream = new MediaStream([silentAudioTrack, ...videoStream.getTracks()]);
    }

    // Initialize the MediaRecorder with the combined stream
    camOnlyRecorder = new MediaRecorder(mediaStream, {
      mimeType: mimeType,
      audioBitsPerSecond: audioBitsPerSecond,
      videoBitsPerSecond: videoBitsPerSecond,
    });
    camOnlyRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        camOnlyChunks.push(event.data);
        // Handle recorded data (e.g., save it or upload it)
        console.log('Recorded data available:', event.data);
      }
    };

    camOnlyRecorder.start();

    camOnlyRecorder.onstop = async () => {
      const blob = new Blob(camOnlyChunks, { type: 'video/webm' });
      // Convert Blob to Base64
      console.log(isCamOnlyRecordingDiscarded, "onstop", blob);
      function onComplete() {
        console.log("Recording saved to IndexedDB", isCamOnlyRecordingDiscarded);
        const url = (URL as any).createObjectURL(blob);

        if (!isCamOnlyRecordingDiscarded) {
          chrome.runtime.sendMessage({
            type: 'OPEN_PREVIEW_TAB',
            videoUrl: url,
            hasAudio: selections?.micRecording.value !== "mic_off"
          });
          chrome.runtime.sendMessage({ type: "CLOSE_CAM_ONLY_WINDOW" });
          chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS_END" });
        }
        camOnlyChunks = [];
        resetAll();
      }

      console.log("SHould Not call", isCamOnlyRecordingDiscarded);
      onComplete();

      if (!isCamOnlyRecordingDiscarded) {
        console.log("CAM RECORDING ENDED!!!!");
        const base64Data = await saveRecordingToIndexedDB(blob);
        recordedStreamBase64 = base64Data;
        setBase64Data(base64Data);
      }
    };

    camOnlyRecorder.onended = () => {
      camOnlyRecorder.onstop();
    };

    camOnlyRecorder.onstart = () => {
      console.log("STARTED HERE!!");
      chrome.runtime.sendMessage({ type: 'startTimer' });
      chrome.runtime.sendMessage({ type: "RECORDING_IN_PROGRESS" });
      isRecordingStarted = true;
    };
  };


  const onMountListners = () => {
    chrome.runtime.onMessage.addListener(
      function async(message, sender, sendResponse) {
        switch (message.type) {
          case "END_CAM_ONLY_RECORDING": {
            console.log("END_CAM_ONLY_RECORDING", camOnlyRecorder)
            camOnlyRecorder?.stop()
          }
            break;
          case "PREVIEW_OPENED_SUCCESSFULY": {
            console.log("OPned preview")
            setIsPreviewOpened(true)
          }
            break;
          case "OPEN_SANDBOX": {
            console.log("OFFSCREEN OPEN_SANDBOX!!!")
            // use window.open to create a popup
            const sandboxWin = window.open(chrome.runtime.getURL('sandboxes/demo.html'), "SANDBOXED!", "height=800,width=500");
            // fire a postMessage event to the sandbox. Inspect the sandbox and see the 
            // message in the console.
            setTimeout(() => {
              console.log("SENDING!!!!")
              sandboxWin.postMessage({ "message": "It works!!" }, "*");
            }, 4000)
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
            // if (window10) {
            //   console.log("YEAH WINDOW 10")
            //   recordCameraOnlyWindow10(message?.data)
            // } else {
              console.log("YEAH Mormal callww")
              recordCameraOnly(message?.data)
            // }
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
          case "START_UPLOAD_CHUNKS": {
            setUploadChunksCall(true)
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
            } else if (message?.isAudioOnly) {
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
    <div id="floating-video">
      <video id="recording-output" ref={videoRef} width="200" height="150" muted></video>
    </div>
    {/* {showVideo && <div id="floating-video">
      <video id="recording-output" ref={videoRef} width="200" height="150" muted></video>
    </div>} */}
  </div>
}

export default OffScreen
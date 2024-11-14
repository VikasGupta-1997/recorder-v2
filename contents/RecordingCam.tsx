import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { callBackConstants } from '~utils/constants'
const { START_RECORDING, DEVICE_CHANGE, HIDE_CSUI } = callBackConstants;
// import { useStorage } from "@plasmohq/storage/hook";
import useStorage from "../useStorageCustom";
import ToolBarBox from '~components/ToolBar';
import Modal from '~components/Modal';
import cssText from "data-text:./recording-cam.module.css"
import toolBarCssText from "data-text:~components/toolbar.module.css"
import modalCssText from "data-text:~components/modal.module.css"
import * as style from "./recording-cam.module.css"
import formatTime from '~utils/formatTime';
import countDown from '~utils/countDown';
import Draggable from 'react-draggable';

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `${cssText}\n${toolBarCssText}\n${modalCssText}`
  return style
}


const CustomButton = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [isRestarted, setIsRestarted] = useState(false)
  const [showToolBar, setShowToolBar] = useStorage("showToolBar", false)
  const [isRecordingPaused, setIsRecordingPaused] = useStorage("isRecordingPaused", false)
  const formattedTimeRef = useRef(null)
  const [intervalId, setIntervalId] = useState(null);
  const [isPopupConfirmation, setIsPopupConfirmation] = useState('')
  const [count, setCount] = useState<any>(5);
  const [startRecordingNow, setStartRecordingNow] = useState(false);
  const [injectCam, setInjectCam] = useState(false)
  const videoRef = useRef(null)
  const [currentRotate, setCurrentRotate] = useState(0);
  const isDraggingRef = useRef(false);
  const initialPosition = { x: 0, y: 0 };
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const onDrag = (e, data) => {
    isDraggingRef.current = true;
    setPosition({ x: data.x, y: data.y });
  };

  const onStop = () => {
    if (!isDraggingRef.current) {
      setCurrentRotate(currentRotate + 90);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const resetAllNew = () => {
    setPosition(initialPosition);
    setIsDragging(false)
    videoRef.current = null
    setIsRestarted(false)
    isDraggingRef.current = false
    setCurrentRotate(0)
    setCount(5)
    setIsRecordingPaused(false)
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setMediaRecorder(null)
    setStartRecordingNow(false)
    chrome.runtime.sendMessage({ type: "RESET_TIMER" })
  }

  const sendDevices = () => {
    chrome.storage.local.get(['accessGranted', 'devices'], async result => {
      appendPermissionsIframe()
    })
  }

  const resetScreen = async () => {
    setIsRestarted(false)
    setShowStartOverlay(false)

    setShowToolBar(false)
    setIsRecordingPaused(false)
    clearInterval(intervalId)
    // await chrome.storage.local.set({ "isCamInjected": false })
    try {
      chrome.storage.local.set({ isCamInjected: false }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
          }
        } else {
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
    setInjectCam(false)
    chrome.runtime.sendMessage({ type: "STOP_WEBCAM_STREAM" })
    setIntervalId(null)
    chrome.runtime.sendMessage({ type: "RESET_TIMER" })
  }

  const deviceChange = async (
    data,
  ) => {
    const type = data.type;
    switch (type) {
      case "cameraRecording": {
        // chrome.storage.local.set({ "selectedCameraRecording": data })
        try {
          chrome.storage.local.set({ selectedCameraRecording: data }, function () {
            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
              } else {
              }
            } else {
            }
          });
        } catch (error) {
          console.error("Caught exception: ", error);
        }
      }
        break;
      case "micRecording": {
        try {
          chrome.storage.local.set({ selectedMicRecording: data }, function () {
            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
              } else {
              }
            } else {
            }
          });
        } catch (error) {
          console.error("Caught exception: ", error);
        }
      }
        break;
      case "screenRecording": {
        // chrome.storage.local.set({ "selectedScreenRecordings": data })
        try {
          chrome.storage.local.set({ selectedScreenRecordings: data }, function () {
            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
              } else {
              }
            } else {
            }
          });
        } catch (error) {
          console.error("Caught exception: ", error);
        }
      }
        break;
      default:
        null
    }
  }

  const onMountListners =
    () => {
      chrome.runtime.onMessage.addListener(
        function async(message) {
          switch (message.type) {
            case "CLEAR_RECORDING_UI_CONTENT": {
              resetScreen()
              resetAllNew()
            }
              break;
            case "FETCH_DEVICES":
              sendDevices()
              break;
            case DEVICE_CHANGE:
              deviceChange(message?.data)
              break;
            case "SHOW_TOOLBAR": {
            }
              break;
            case "RECORDING_COMPLETED": {
              resetScreen()
            }
              break;
            case "START_COUNTDOWN_CONTENT": {
              setShowStartOverlay(true)
            }
              break;
            case "updateTimer": {
              formatTime(message.time, formattedTimeRef)
            }
              break;
            case "INJECT_CAM": {
              setInjectCam(true)
              setShowToolBar(true)
              injectWebCamIframe()
            }
              break
            case START_RECORDING:
              break;
            case HIDE_CSUI:
              resetAllNew()
            case callBackConstants.POPUP_CLOSED:
              resetAllNew()
              break;
            case "WINDOW_SELECTION_RESTART_CONTENT": {
              setShowStartOverlay(false)
              setIsRestarted(true)
            }
              return;
          }
        }
      );
    }

  useEffect(() => {
    onMountListners();
  }, [showToolBar])

  useEffect(() => {
    const handleError = (message, source, lineno, colno, error) => {
      console.log("ERROR OCcured", message)
      if (message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
        // Handle the quota error
        console.log("Quota exceeded error caught.");
        // Perform the desired feature here
      }
      return false; // Prevents the browser from logging the error in the console
    }
    window.onerror = handleError
  }, [])

  // useEffect(() => countDown(showStartOverlay, count, setCount, setShowStartOverlay, setStartRecordingNow), [showStartOverlay, count]);
  useEffect(() => {
    if (showStartOverlay) {
      if (count > 1) {
        const timer = setTimeout(() => {
          setCount(count - 1);
        }, 1000); // Decrease the count every second

        return () => clearTimeout(timer); // Clear the timer on cleanup
      } else if (count === 1) {
        const timer = setTimeout(() => {
          setShowStartOverlay(false)
          setStartRecordingNow(true)
          setCount("!"); // Change to "Start!" when countdown reaches 1
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [showStartOverlay, count]);


  const startRecordingEffect = async () => {
    setCount(5)
    setStartRecordingNow(false)
    chrome.storage.local.get(['screenShareSelection'], result => {
      if (result?.screenShareSelection) {
        if (result.screenShareSelection !== 'window') {
          setShowToolBar(true)
        }
      }
    })
    setIsRecordingPaused(false)
    chrome.runtime.sendMessage({ type: "NEW_RECORDING_STARTED" })
    chrome.runtime.sendMessage({ type: "startTimer" })
  }

  useEffect(() => {
    if (startRecordingNow) {
      startRecordingEffect()
    }
  }, [startRecordingNow])

  const iframeRef = useRef(null)
  const webcamRef = useRef(null)
  const appendPermissionsIframe = () => {
    const iframe = iframeRef.current
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.allow = 'camera; microphone';
    iframe.name = 'permissionsCheck';
    iframe.src = chrome.runtime.getURL('tabs/permissionsPage.html');
  }

  useEffect(() => {
    if (!!isPopupConfirmation) {
      setIsDragging(false)
      setIsRecordingPaused(true)
      if (isPopupConfirmation === 'restart') {
        chrome.runtime.sendMessage({ type: "RECORDING_PAUSE" })
      }
      if (isPopupConfirmation === 'delete') {
        chrome.runtime.sendMessage({ type: "RECORDING_PAUSE" })
      }
      const isConfirmed = isPopupConfirmation.split('-')[1]
      if (isConfirmed) {
        if (isConfirmed === 'delete') {
          chrome.runtime.sendMessage({ type: "RECORDING_END", isToOpenPreview: 'setToFalse' })
          resetScreen()
          resetAllNew()
        } else {
          resetScreen()
          resetAllNew()
          chrome.runtime.sendMessage({ type: "stopTimer" })
          chrome.runtime.sendMessage({ type: "RECORDING_RESTART", isToOpenPreview: 'setToFalse' })
          setShowStartOverlay(false)
          setIsRestarted(true)
        }
        setIsPopupConfirmation('')
      }
    }
  }, [isPopupConfirmation])

  useEffect(() => {
    if (isRestarted) {
      if (!showStartOverlay && count) {
        setShowStartOverlay(true)
        setCount(5)
      }
      setIsRestarted(false)
    }
  }, [isRestarted, showStartOverlay, count])


  const handleIconClick = (type) => {
    switch (type) {
      case "record": {
      }
        break
      case "play": {
        setIsRecordingPaused(false)
        chrome.runtime.sendMessage({ type: "RECORDING_PLAY" })
      }
        break;
      case "pause": {
        setIsRecordingPaused(true)
        chrome.runtime.sendMessage({ type: "RECORDING_PAUSE" })
      }
        break
      case "stop": {
        resetScreen()
        chrome.runtime.sendMessage({ type: "stopTimer" })
        chrome.runtime.sendMessage({ type: "RECORDING_END" })
      }
        break;
      case "restart": {
        setIsPopupConfirmation('restart')
      }
        break;
      case "delete": {
        setIsPopupConfirmation('delete')
      }
        break;
      case "check-video-blob": {
        chrome.runtime.sendMessage({ type: "CHECK_VID_BLOB" })
      }
        break;
    }
  }

  const modalClose = (type) => {
    setIsDragging(false)
    const isValidValue = typeof type === 'string'
    const setVal = isValidValue ? type : ''
    if (!isValidValue) {
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: "RECORDING_PLAY" })
      }, 100)
      setIsRecordingPaused(false)
    }
    setIsPopupConfirmation(setVal)
  }

  const injectWebCamIframe = async () => {
    const iframe = webcamRef.current;
    iframe.name = 'webcamView';
    iframe.src = chrome.runtime.getURL('tabs/tabWebcam.html');
  }

  useLayoutEffect(() => {
    chrome.storage.local.get(["isCamInjected"], result => {
      setInjectCam(result?.isCamInjected)
      if (result?.isCamInjected) {
        injectWebCamIframe()
        setShowToolBar(true)
      }
    })
  }, [])

  return <div>
    <iframe className={style['permissions-iframe']} ref={iframeRef} />
    {showStartOverlay && (
      <div className={style["recording-start-overlay"]}>
        <div className={style["countdown-text"]}>{count}</div>
      </div>
    )}
    {
      !!isPopupConfirmation && <Modal
        onClose={modalClose}
        isPopupConfirmation={isPopupConfirmation}
      />
    }
    <div className={style["draggable-container"]} >
      <Draggable
        position={position}
        bounds="parent"
        onStart={() => {
          setTimeout(() => {
            setIsDragging(true)
          }, 100)
        }}
        onStop={onStop} onDrag={onDrag}
      >
        <div className={style["draggable-child"]} style={{
          transform: "rotate(" + currentRotate + "deg)",
        }} >
          {showToolBar && <div style={{ marginBottom: 8 }} >
            <ToolBarBox
              isPopupConfirmation={isPopupConfirmation}
              formattedTimeRef={formattedTimeRef}
              isRecordingPaused={isRecordingPaused}
              handleIconClick={handleIconClick}
              hasDrag
            /></div>
          }
          {<div style={{ display: (injectCam) ? 'block' : 'none' }}
            className={style['cam-injector-iframe']}>
            <iframe className={style['webcam-iframe']} ref={webcamRef} allow='camera' />
          </div>
          }
          {/* {injectCam && isDragging && (
            <div className={style["spinner-container"]}>
              <div className={style['loader-spinner']} ></div>
            </div>
          )} */}
        </div>
      </Draggable>
    </div>
  </div>
}

export default CustomButton
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "~components/Modal";
import ToolBarBox from "~components/ToolBar";
import useStorage from "~useStorageCustom";
import formatTime from "~utils/formatTime";

let stream;
const WindowSelected = () => {
    const cameraRef = useRef(null)
    const formattedTimeRef = useRef(null)
    const [isPopupConfirmation, setIsPopupConfirmation] = useState('')
    // const [isRecordingPaused, setIsRecordingPaused] = useStorage("isRecordingPaused", false);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const onMountListners = () => {
        chrome.runtime.onMessage.addListener(
            function async(message) {
                switch (message.type) {
                    case "startWindowSelected": {
                        openWebcam(message?.selections?.cameraRecording)
                    }
                        break;
                    case "updateTimer": {
                        formatTime(message.time, formattedTimeRef)
                    }
                         break;
                    case "OFFSCREEN_RECORDING_END": {
                        window.close()
                    }
                    break;
                }
            }
        )
    }

    const openWebcam = async (camera) => {
        setIsRecordingPaused(false)
        stream = await navigator.mediaDevices.getUserMedia({video: { deviceId: camera.value }, audio: false})
        cameraRef.current.srcObject = stream
        cameraRef.current?.play()
    }

    useLayoutEffect(() => {
        onMountListners()
    }, [])

    useEffect(() => {
        if (!!isPopupConfirmation) {
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
              setTimeout(() => {
                window.close()
              }, 250)
            } else {
                console.log("RESTART CALED NO RESTART!!!")
              chrome.runtime.sendMessage({ type: "stopTimer" })
              chrome.runtime.sendMessage({ type: "RECORDING_RESTART", isToOpenPreview: 'setToFalse' })
              chrome.runtime.sendMessage({ type: "WINDOW_SELECTION_RESTART" })
            }
            setIsPopupConfirmation('')
          }
        }
      }, [isPopupConfirmation])

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
            chrome.runtime.sendMessage({ type: "stopTimer" })
            chrome.runtime.sendMessage({ type: "RECORDING_END" })
            setTimeout(() => {
                window.close()
            }, 250)
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

    return (
        <div>
            <video style={{
                width: "100%"
            }} ref={cameraRef} ></video>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 8
            }} >
                <ToolBarBox
                    isPopupConfirmation={isPopupConfirmation}
                    formattedTimeRef={formattedTimeRef}
                    isRecordingPaused={isRecordingPaused}
                    handleIconClick={handleIconClick}
                    isNonDraggable
                />
            </div>
            {
            !!isPopupConfirmation && <Modal
                onClose={modalClose}
                isPopupConfirmation={isPopupConfirmation}
            />
            }
        </div>
    )
}

export default WindowSelected

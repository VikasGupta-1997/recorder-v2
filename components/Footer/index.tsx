import { callBackConstants } from '~utils/constants'

import './footer.css'
import { BsRecordCircle } from 'react-icons/bs'
import { useEffect } from 'react'

let showTimer = false

const Footer = ({ selections, isRecordingInProgress, formattedTimeRef }) => {
  const isDisabled = Object.values(selections)?.every((selection: selectOption) => !!selection?.disable)

  const handleRecording = () => {
    if (isRecordingInProgress) {
      // console.log("HANDLE STOP RECORDING")
      chrome.runtime.sendMessage({ type: "stopTimer" })
      chrome.runtime.sendMessage({ type: "RECORDING_END" })
      chrome.runtime.sendMessage({ type: "CLEAR_RECORDING_UI" })
      chrome.runtime.sendMessage({ type: "END_CAM_ONLY_RECORDING" })
      chrome.runtime.sendMessage({ type: "END_MIC_ONLY_RECORDING" })
      // chrome.storage.local.set({ "isRecordingInProgress": false })
      try {
        chrome.storage.local.set({ isRecordingInProgress: false }, function() {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
            } else {
              console.error("Other error: ", chrome.runtime.lastError.message);
            }
          } else {
          }
        });
      } catch (error) {
        console.error("Caught exception: ", error);
      }
      setTimeout(() => {
        window?.close()
      }, 250)
      return;
    }
    // return;
    if (selections?.screenRecording?.value === 'camOnly') {
      chrome.runtime.sendMessage({ type: "OPEN_CAM_ONLY_RECORDING", selections: selections })
    } else if (selections?.screenRecording?.value === 'audioOnly') {
      chrome.runtime.sendMessage({ type: "OPEN_MIC_ONLY_RECORDING", selections: selections })
    }
    else {
      chrome.runtime.sendMessage({ type: "START_TO_RECORD", data: selections })
    }
    window.close();
  }

  useEffect(() => {
    if (isRecordingInProgress) {
      chrome.runtime.sendMessage({ type: "GET_SYSTEM_SCREEN_RECORDING" }, res => {
        showTimer = res
      })
    }
  }, [isRecordingInProgress])

  return (
    <footer className="footer" >
      <span className='px-8 w-full' >
        <button onClick={handleRecording} type='button' disabled={isDisabled}>
          {
            isRecordingInProgress && <span className={`svg-container pulse-effect`} >
              <BsRecordCircle fontSize={24} color='rgb(255 37 0)' />
            </span>
          }
          <span>
            {(isRecordingInProgress && showTimer) && <span className='mr-3' ref={formattedTimeRef}>
              {"00:00"}
            </span>}
            {isRecordingInProgress ? "Stop" : "Start"} Recording
          </span>
        </button>
      </span>
    </footer>
  )
}

export default Footer

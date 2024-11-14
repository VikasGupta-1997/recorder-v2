import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import Header from '~components/Header'
import RecordingSection from '~components/RecordingSection'
import Footer from '~components/Footer'

import './styles.css'
import { defaultRecordingOptions, callBackConstants, storageKeys, screenRecordingOptions } from '~utils/constants'
import formatTime from '~utils/formatTime'

let tabId;
function IndexPopup() {
  const formattedTimeRef = useRef(null)

  const [recordingOptions, setRecordingOptions] = useState<recordingOptions>({
    screenOptions: screenRecordingOptions,
    micOptions: [defaultRecordingOptions.micOptions],
    cameraOptions: [defaultRecordingOptions.cameraOptions]
  })
  const [selections, setSelections] = useState<selectionsType>({
    screenRecording: defaultRecordingOptions.screenOptions,
    micRecording: defaultRecordingOptions.micOptions,
    cameraRecording: defaultRecordingOptions.cameraOptions
  })
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false)

  const setCurrentSelection = (selections, micOptions, cameraOptions, newDevices) => {
    let micRecording;
    let cameraRecording;
    let screenRecording;
    if (selections?.selectedMicRecording) {
      micRecording = selections?.selectedMicRecording
      const existingMic = newDevices?.filter(item => item?.kind === 'audioinput' && item?.label?.replace(/^Default - /, "") === selections?.selectedMicRecording?.label?.replace(/^Default - /, ""))
      if (!existingMic?.length && selections?.selectedMicRecording?.value !== 'mic_off') {
        micRecording = micOptions?.find(mic => mic?.label?.startsWith("Default"))
      }
    } else {
      micRecording = micOptions?.find(mic => mic?.label?.startsWith("Default"))
    }

    if (selections?.selectedCameraRecording) {
      cameraRecording = selections?.selectedCameraRecording
      const existingCam = newDevices?.filter(item => item?.kind === 'videoinput' && item.label === selections?.selectedCameraRecording.label);
      if (!existingCam?.length) {
        cameraRecording = defaultRecordingOptions.cameraOptions
      }
    } else {
      cameraRecording = defaultRecordingOptions.cameraOptions
    }

    if (selections?.selectedScreenRecordings) {
      screenRecording = selections?.selectedScreenRecordings
    } else {
      screenRecording = defaultRecordingOptions.screenOptions
    }
    // console.log("SELECTIONS ARE SET HERE")
    setSelections({
      screenRecording,
      micRecording,
      cameraRecording
    })
  }

  const getDeviceLists = async () => {
    chrome.storage.local.get(["selectedCameraRecording", "selectedMicRecording", "selectedScreenRecordings", "devices", "accessGranted", "isRecordingInProgress"], async (result) => {
      setIsRecordingInProgress(result?.isRecordingInProgress)
      chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        tabId = tabId
        chrome.tabs.sendMessage(tabs[0].id, { type: "FETCH_DEVICES" })
      })
      const devices = await navigator.mediaDevices.enumerateDevices() as any;
      let micOptions = devices?.filter(device => !!device.label && device.kind === 'audioinput')
      let cameraOptions = devices?.filter(device => !!device.label && device.kind === 'videoinput')
      micOptions = micOptions.map(d => ({ kind: d.kind, label: d.label, value: d.deviceId, type: 'micRecording' }))
      cameraOptions = cameraOptions.map(d => ({ kind: d.kind, label: d.label, value: d.deviceId, type: 'cameraRecording' }))
      const isMicOffAndAudioOnlyRecording = result?.selectedScreenRecordings?.value === 'audioOnly'
      const isCamOffAndCamOnlyRecording = result?.selectedScreenRecordings?.value === 'camOnly'
      setRecordingOptions({
        ...recordingOptions,
        micOptions: [defaultRecordingOptions.micOptions, ...micOptions].map(mic => {
          if(isMicOffAndAudioOnlyRecording && mic.value === 'mic_off'){
            return {
              ...mic,
              isDisabled: true
            }
          } else {
            return {...mic}
          }
        }),
        cameraOptions: [
          {
            ...defaultRecordingOptions.cameraOptions,
            ...((result?.selectedScreenRecordings?.value === "camera_only" || isCamOffAndCamOnlyRecording)? { isDisabled: true } : { isDisabled: false })
          },
          ...cameraOptions]
      });
      setCurrentSelection(result, micOptions, cameraOptions, devices)
    })
  }

  const onMountListners = () => {
    chrome.runtime.onMessage.addListener(
      async function (message) {
        switch (message.type) {
          case 'CLOSE_POPUP_CALL': {
            window.close();
          }
            break;
          case "START_RECORDING": {
            console.log("DRTT", message)
          }
            break;
          case "START_RECORDING": {
            console.log("DRTT", message)
          }
            break;
          
          case "updateTimer": {
            formatTime(message.time, formattedTimeRef)
          }
            break;
        }
      })
  }

  useEffect(() => {
    onMountListners()
    getDeviceLists()
    return () => {
    };
  }, [])

  return (
    <main className="main">
      <Header />
      <RecordingSection isRecordingInProgress={isRecordingInProgress} setRecordingOptions={setRecordingOptions} recordingOptions={recordingOptions} selections={selections} setSelections={setSelections} />
      <Footer formattedTimeRef={formattedTimeRef} isRecordingInProgress={isRecordingInProgress} selections={selections} />
    </main>
  )
}

export default IndexPopup

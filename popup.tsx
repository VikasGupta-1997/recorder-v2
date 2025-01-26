import { useEffect, useRef, useState } from 'react'

import Header from '~components/Header'
import RecordingSection from '~components/RecordingSection'
import Footer from '~components/Footer'
import LoginForm from '~components/Login'

import './styles.css'
import { defaultRecordingOptions, screenRecordingOptions } from '~utils/constants'
import formatTime from '~utils/formatTime'
import useStorage from '~useStorageCustom'
import ListComponent from '~components/ListComponent'

let tabId;

function IndexPopup() {
  const formattedTimeRef = useRef(null)
  const mainDivRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const [userDetails, setUserDetails] = useState(null)
  const [selectedProjected, setSelectedProject] = useState(null)

  const [inRecordingMode, setInRecordingMode] = useState(false)
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
  const [projectList, setProjectList] = useState([])
  const projectListRef = useRef([])
  const [projectListLoading] = useState(false)
  const [mediaListLoading, setMediaListLoading] = useState(false)
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
      chrome.storage.local.get(["firstMicSet"], async result => {
        if (!result.firstMicSet) {
          await chrome.storage.local.set({ "firstMicSet": micRecording })
        }
      })
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
    chrome.storage.local.get(["selectedProject","userInfo","selectedCameraRecording", "selectedMicRecording", "selectedScreenRecordings", "devices", "accessGranted", "isRecordingInProgress"], async (result) => {
      const userInfo = result?.userInfo || null
      console.log(result,"userInfo===>", userInfo)
      setUserDetails(userInfo)
      setLoading(false)
      const selectedProject = result?.selectedProject || null
      setSelectedProject(selectedProject)
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
          if (isMicOffAndAudioOnlyRecording && mic.value === 'mic_off') {
            return {
              ...mic,
              isDisabled: true
            }
          } else {
            return { ...mic }
          }
        }),
        cameraOptions: [
          {
            ...defaultRecordingOptions.cameraOptions,
            ...((result?.selectedScreenRecordings?.value === "camera_only" || isCamOffAndCamOnlyRecording) ? { isDisabled: true } : { isDisabled: false })
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
          case 'LOGIN_SUCCESS': {
            setUserDetails(message.userDetails)
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
          case "REFETCH_MEDIA_LIST": {
            const project = message.project
            const userDetails = message.userDetails
            chrome.runtime.sendMessage({type: "GET_MEDIA_FILES", projectList: projectListRef.current, project, userDetails})
          }
          break;
          case "updateTimer": {
            formatTime(message.time, formattedTimeRef)
          }
            break;
          case "SET_PROJECT_LIST":{
            setProjectList([...message.list])
            projectListRef.current = [...message.list]
          }
          break;
          case "media_loading": {
            setMediaListLoading(message.state)
          }
          break;
        }
      })
  }

  useEffect(() => {
    // Detect OS and add class to body
    if (navigator.platform.indexOf('Mac') !== -1) {
      document.body.classList.add('mac');
    } else {
      document.body.classList.add('windows');
    }
    onMountListners()
    getDeviceLists()
    return () => {
    };
  }, [])

  const handleProjectChange = async (project) => {
    chrome.runtime.sendMessage({type: "GET_MEDIA_FILES", projectList, project, userDetails})
  }

  useEffect(() => {
    if (userDetails?.user_id) {
      chrome.runtime.sendMessage({type: "GET_PROJECT_LIST", userDetails})
    }
  }, [userDetails])

  if(loading){
    return (
      <div className="flex items-center justify-center" ><div className="loader" ></div></div>
    )
  }

  return (
    <main ref={mainDivRef} className="main">
      <Header
        setInRecordingMode={setInRecordingMode}
        userDetails={userDetails}
        inRecordingMode={inRecordingMode} />
      {
        userDetails?.user_id ? <>
          {
            inRecordingMode ? <>
              <RecordingSection
                isRecordingInProgress={isRecordingInProgress}
                setRecordingOptions={setRecordingOptions}
                recordingOptions={recordingOptions}
                selections={selections}
                setSelections={setSelections} />
              <Footer
                formattedTimeRef={formattedTimeRef}
                isRecordingInProgress={isRecordingInProgress}
                selections={selections} />
            </> :
              <>
                <ListComponent
                  mediaListLoading={mediaListLoading}
                  handleProjectChange={handleProjectChange}
                  projectList={projectList}
                  // mediaFiles={mediaFiles}
                  projectListLoading={projectListLoading}
                  selectedProjected={selectedProjected}
                  userDetails={userDetails}
                  setInRecordingMode={setInRecordingMode} />
              </>
          }
        </> : <>
          <LoginForm />
        </>
      }
    </main>
  )
}

export default IndexPopup

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

  const [userDetails, setUserDetails] = useStorage("userInfo", null)
  const [selectedProjected, setSelectedProject] = useStorage("selectedProject", null)
  const [uploadStatus] = useStorage("showUploadStatus", false)


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
  const [mediaFiles, setMediaFiles] = useState([])
  const [projectListLoading, setProjectListLoading] = useState(false)
  const [mediaListLoading, setMediaListLoading] = useState(false)
  const progressBarRef = useRef(null);
  const progressPercent = useRef(null)
  const progressUploadSize = useRef(null)
  const fileNameref =  useRef(null)
  const progressTimeLeft = useRef(null)

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

  const formatBlobSize = (sizeInBytes) => {
    if (sizeInBytes >= 1073741824) { // 1 GB = 1024 * 1024 * 1024 bytes
      return (sizeInBytes / 1073741824).toFixed(2) + ' GB'; // Convert to GB
    } else if (sizeInBytes >= 1048576) { // 1 MB = 1024 * 1024 bytes
      return (sizeInBytes / 1048576).toFixed(2) + ' MB'; // Convert to MB
    } else if (sizeInBytes >= 1024) { // 1 KB = 1024 bytes
      return (sizeInBytes / 1024).toFixed(2) + ' KB'; // Convert to KB
    } else {
      return sizeInBytes + ' bytes'; // If less than 1 KB, show in bytes
    }
  };

  function convertTime(seconds) {
    if (seconds < 60) {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
  
    let timeString = '';
  
    if (hours > 0) {
      timeString += `${hours}h${hours > 1 ? 's' : ''}`;
    }
  
    if (minutes > 0) {
      if (timeString) timeString += ' ';
      timeString += `${minutes}min${minutes > 1 ? 's' : ''}`;
    }
  
    return timeString || '0min';
  }

  const onMountListners = () => {
    chrome.runtime.onMessage.addListener(
      async function (message) {
        switch (message.type) {
          case 'CLOSE_POPUP_CALL': {
            window.close();
          }
            break;
          case "upload-status": {
            const uploadStatus = message.uploadStatus
            progressBarRef.current.style.width = `${uploadStatus.progress}%`;
            console.log("progressPercent==>", uploadStatus)
            if(progressPercent.current){
              progressPercent.current.innerText = `Uploading ${uploadStatus.progress}%`
            }
            if(progressUploadSize.current){
              progressUploadSize.current.innerText = `${formatBlobSize(uploadStatus.uploadSize)} of ${formatBlobSize(uploadStatus.totalSize)}`
            }
            if(progressTimeLeft.current){
              progressTimeLeft.current.innerText = `${convertTime(uploadStatus.timeLeft)} left`
            }
            if(fileNameref.current){
              fileNameref.current.innerText = message.recordingName
            }
            // progressInfo.current.percent.innerText = `Uploading ${uploadStatus.progress}%`
            // progressInfo.current.uploadSize.innerText = `${formatBlobSize(uploadStatus.uploadSize)} of ${formatBlobSize(uploadStatus.totalSize)}`
            // progressInfo.current.timeLeft.innerText = `${convertTime(uploadStatus.timeLeft)} left`
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

  const handleProjectChange = async (project) => {
    setSelectedProject({ label: project.label, id: project.id, project_id: project.project_id })
    getMediaFile(projectList, project)
  }

  const getMediaFile = async (projectList, selectedProjected) => {
    const findIfExistsOrNot = projectList.find(project => project.id === selectedProjected?.id)
    let tobeQueryProject;
    if (findIfExistsOrNot) {
      tobeQueryProject = findIfExistsOrNot
    } else {
      tobeQueryProject = projectList?.[0]
      setSelectedProject({ label: projectList?.[0]?.label, id: projectList?.[0]?.id, project_id: projectList?.[0]?.project_id })
    }
    setMediaListLoading(true)
    try {
      const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/projects/show?id=${tobeQueryProject.id}&v2=true`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userDetails.access_token}`
        },
      })
      const mediaFiles = await response.json();
      setMediaFiles(mediaFiles?.videos || [])
      setMediaListLoading(false)
    } catch (error) {
      setMediaListLoading(false)
      console.log("Error", error)
    }
  }

  const getProjectList = async () => {
    setProjectListLoading(true)
    setMediaListLoading(true)
    try {
      const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/projects`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userDetails.access_token}`
        },
      })
      const projectlist = await response.json();
      const listItems = projectlist.map(item => ({ ...item, label: item?.title }))
      setProjectList([...listItems])
      setProjectListLoading(false)
      await getMediaFile([...listItems], selectedProjected)
    } catch (error) {
      setProjectListLoading(false)
      console.log("Error", error)
    }
  }

  useEffect(() => {
    if (userDetails?.user_id) {
      getProjectList()
    }
  }, [userDetails])

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
                  uploadStatus={uploadStatus}
                  progressBarRef={progressBarRef}
                  progressPercent={progressPercent}
                  progressUploadSize={progressUploadSize}
                  progressTimeLeft={progressTimeLeft}
                  fileNameref={fileNameref}
                  mediaListLoading={mediaListLoading}
                  handleProjectChange={handleProjectChange}
                  projectList={projectList}
                  mediaFiles={mediaFiles}
                  projectListLoading={projectListLoading}
                  selectedProjected={selectedProjected}
                  userDetails={userDetails}
                  setInRecordingMode={setInRecordingMode} />
              </>
          }
        </> : <>
          <LoginForm setUserDetails={setUserDetails} />
        </>
      }
    </main>
  )
}

export default IndexPopup

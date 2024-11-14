import Select from "~components/Select";

import './recording.css'
import { callBackConstants, screenRecordingOptions } from "~utils/constants";
import { AudioOnly, CameraOnly, ScreenAndCam, ScreenOnly } from "~utils/Icons";
interface IRecordingRow {
  label: string,
  options: selectOption[],
  setSelections: setSelectionsType,
  value: selectOption,
  videoOptionIfCameraOffScreenShare?: selectOption
  setRecordingOptions?: setRecordingOptions
  isCamDisabled?: boolean,
  selections: any,
  recordingOptions?: any,
}


const handleChange = (value, setSelections, setRecordingOptions, recordingOptions) => {
  let isCamOffAndCamOnlyRecording = false
  let isMicOffAndAudioOnlyRecording = false
  if (value?.type === "screenRecording") {
    if (value?.value === "camOnly") {
      isCamOffAndCamOnlyRecording = true
    }
    if (value.value === 'audioOnly') {
      isMicOffAndAudioOnlyRecording = true
    }
  }
  // return;
  let valueTosend = value
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.DEVICE_CHANGE, data: valueTosend }, function () { })
  })

  const fSelections = (prev) => {
    if (isCamOffAndCamOnlyRecording) {
      const camValueToSend = recordingOptions?.cameraOptions?.filter(cam => cam.value !== 'camera_off')[0]
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.DEVICE_CHANGE, data: camValueToSend }, function () { })
      })
      return {
        ...prev,
        [value?.type]: value,
        cameraRecording: camValueToSend
      }
    } else if (isMicOffAndAudioOnlyRecording) {
      const micValueToSend = recordingOptions?.micOptions?.filter(mic => mic.value !== 'mic_off')[0]
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.DEVICE_CHANGE, data: micValueToSend }, function () { })
      })
      return {
        ...prev,
        [value?.type]: value,
        micRecording: micValueToSend
      }
    }
    else {
      return {
        ...prev,
        [value?.type]: value
      }
    }
  }

  const fSetRecordingOptions = (prev) => {
    if (isCamOffAndCamOnlyRecording) {
      return {
        ...prev,
        cameraOptions: prev.cameraOptions.map(cam => {
          if (cam.value === 'camera_off') {
            return { ...cam, isDisabled: true }
          }
          return { ...cam }
        }),
        micOptions: prev.micOptions.map(mic => {
          if (mic.value === 'mic_off') {
            return { ...mic, isDisabled: false }
          }
          return { ...mic }
        })
      }
    }
    else if (isMicOffAndAudioOnlyRecording) {
      return {
        ...prev,
        micOptions: prev.micOptions.map(mic => {
          if (mic.value === 'mic_off') {
            return { ...mic, isDisabled: true }
          }
          return { ...mic }
        })
      }
    }
    else {
      return {
        ...prev,
        cameraOptions: prev.cameraOptions.map(cam => {
          if (cam.value === 'camera_off') {
            return { ...cam, isDisabled: false }
          }
          return { ...cam }
        }),
        micOptions: prev.micOptions.map(mic => {
          if (mic.value === 'mic_off') {
            return { ...mic, isDisabled: false }
          }
          return { ...mic }
        })
      }
    }
  }

  setSelections(prev => fSelections(prev))
  setRecordingOptions(prev => fSetRecordingOptions(prev))
}

const RecordingRow = ({
  recordingOptions,
  label,
  options,
  setSelections,
  value,
  isCamDisabled,
  setRecordingOptions }: IRecordingRow) => {


  return (
    <div className="grid grid-cols-[1fr_2fr] mt-5 items-center" >
      <label className="text-base" htmlFor={label}>{label}</label>
      <div id={label} >
        <Select
          isDisabled={isCamDisabled}
          value={value}
          isSearchable={false}
          onChange={(value) => handleChange(value, setSelections, setRecordingOptions, recordingOptions)}
          options={options} />
      </div>
    </div>
  )
}


const CommonRow = ({ Icon, label, item, setSelections, setRecordingOptions, recordingOptions, isActive }) => {
  return <div onClick={() => handleChange(item, setSelections, setRecordingOptions, recordingOptions)} className={`icon-wrap ${isActive ? 'is-active' : ''}`} >
    <Icon />
    <label>{label}</label>
  </div>
}

const RenderIcon = ({ item, setSelections, setRecordingOptions, recordingOptions, selections }) => {
  switch (item.value) {
    case "screenCam":
      return <CommonRow
        isActive={item.value === selections?.screenRecording?.value}
        recordingOptions={recordingOptions}
        setRecordingOptions={setRecordingOptions}
        setSelections={setSelections}
        item={item}
        Icon={ScreenAndCam}
        label={"Screen + Cam"} />
    case "screenOnly":
      return <CommonRow
        isActive={item.value === selections?.screenRecording?.value}
        recordingOptions={recordingOptions}
        setRecordingOptions={setRecordingOptions}
        setSelections={setSelections}
        item={item}
        Icon={ScreenOnly}
        label={"Screen Only"} />
    case "camOnly":
      return <CommonRow
        isActive={item.value === selections?.screenRecording?.value}
        recordingOptions={recordingOptions}
        setRecordingOptions={setRecordingOptions}
        setSelections={setSelections}
        item={item}
        Icon={CameraOnly}
        label={"Cam Only"} />
    case "audioOnly":
      return <CommonRow
        isActive={item.value === selections?.screenRecording?.value}
        recordingOptions={recordingOptions}
        setRecordingOptions={setRecordingOptions}
        setSelections={setSelections}
        item={item}
        Icon={AudioOnly}
        label={"Audio Only"} />
  }
}

const RecordingSection = ({ isRecordingInProgress, selections, setSelections, recordingOptions, setRecordingOptions }) => {
  const isCamDisabled = ["screenOnly", "audioOnly"].includes(selections?.screenRecording?.value)
  return (
    <section className={`container ${isRecordingInProgress ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto' } `} >
      <h3 className='text-lg font-bold' >
        Recording mode
      </h3>
      <div className='screen-recording' >
        {screenRecordingOptions?.map(options => <RenderIcon
          selections={selections}
          recordingOptions={recordingOptions}
          setRecordingOptions={setRecordingOptions}
          setSelections={setSelections}
          item={options} />)}
      </div>
      <div className='mic-recording' >
        <RecordingRow
          selections={selections}
          setRecordingOptions={setRecordingOptions}
          value={selections.micRecording}
          setSelections={setSelections}
          options={recordingOptions.micOptions}
          label="Mic" />
      </div>
      <div className={`camera-recording`} >
        <RecordingRow
          selections={selections}
          setRecordingOptions={setRecordingOptions}
          isCamDisabled={isCamDisabled}
          value={selections.cameraRecording}
          setSelections={setSelections}
          options={recordingOptions.cameraOptions}
          label="Camera" />
      </div>
    </section>
  )
}

export default RecordingSection
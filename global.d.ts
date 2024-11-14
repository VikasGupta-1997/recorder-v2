type selectOption = { label: string, value: string, type?: string, disable?: boolean, kind?: string, isDisabled?: boolean }

type selectionsType = {
    screenRecording: selectOption | null,
    micRecording: selectOption | null,
    cameraRecording: selectOption | null
}
type recordingOptions = {
    screenOptions: selectOption[],
    micOptions: selectOption[],
    cameraOptions: selectOption[]
}
type setSelectionsType = React.Dispatch<React.SetStateAction<selections>>;
type setRecordingOptions = React.Dispatch<React.SetStateAction<recordingOptions>>;
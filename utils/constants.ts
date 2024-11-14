const defaultRecordingOptions = {
    screenOptions: {
        label: 'Screen & Cam',
        value: 'screenCam',
        type: 'screenRecording'
    },
    micOptions: {
        label: 'Mic off',
        value: 'mic_off',
        type: 'micRecording',
        disable: true
    },
    cameraOptions: {
        label: 'Camera off',
        value: 'camera_off',
        type: 'cameraRecording',
        disable: true
    }
}

const screenRecordingOptions = [
    {
        label: 'Screen Only',
        value: 'screenOnly',
        type: 'screenRecording',
    },
    defaultRecordingOptions.screenOptions,
    {
        label: 'Cam Only',
        value: 'camOnly',
        type: 'screenRecording',
    },
    {
        label: 'Audio Only',
        value: 'audioOnly',
        type: 'screenRecording',
    }
]

const callBackConstants = {
    GET_DEVICES: 'GET_DEVICES',
    START_RECORDING: 'START_RECORDING',
    POPUP_CLOSED: 'POPUP_CLOSED',
    POPUP_OPENED: 'POPUP_OPENED',
    DEVICE_CHANGE: 'DEVICE_CHANGE',
    SHOW_CSUI: 'SHOW_CSUI',
    HIDE_CSUI: 'HIDE_CSUI'
}

const storageKeys = {
    DEVICES: 'devices',
    HAS_NO_PERMISSIONS: 'hasNoPermissions',
    cameraRecording: defaultRecordingOptions.cameraOptions,
    screenRecordings: defaultRecordingOptions.screenOptions,
    micRecording: defaultRecordingOptions.micOptions
}

export {
    defaultRecordingOptions,
    callBackConstants,
    storageKeys,
    screenRecordingOptions,
}
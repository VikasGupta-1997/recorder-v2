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


const cutModeOptions = [
    { label: 'Apply Cuts', value: 'apply_cuts' },
    { label: 'Export Uncut Audio', value: 'exportUncutAudio' },
    { label: 'Set Cuts To Silence', value: 'setCutToSilence' }
]

const denoiseMethodOptions = [
    { label: 'Static: remove constant noise only', value: 'staticRemoveContantNoise' },
    { label: 'Dynamic: keep speech and music, remove everything else', value: 'dynamicKeepMusicOnly' },
    { label: 'Speech Isolation: keep speech  , remove everything else', value: 'speechIsolation' }
]

const removeNoiseOptions = [
    { label: '100 db (full)', value: '100DB' },
    { label: '0ff', value: 'off' },
    { label: '3db', value: '3DB' },
    { label: '6db (low) ', value: '6DB' },
    { label: '9db', value: '9DB' },
    { label: '12db (medium)', value: '12DB' },
    { label: '15db', value: '15DB' },
    { label: '18db', value: '18DB' },
    { label: '30db', value: '30DB' },
]

const removeNoiseOptionsStatic = [
    { label: 'Auto', value: 'auto' },
    { label: '0ff', value: 'off' },
    { label: '3db', value: '3DB' },
    { label: '6db (low) ', value: '6DB' },
    { label: '9db', value: '9DB' },
    { label: '12db (medium)', value: '12DB' },
    { label: '15db', value: '15DB' },
    { label: '18db', value: '18DB' },
    { label: '30db', value: '30DB' },
    { label: '100 db (full)', value: '100DB' },
]
const humReductionAmount = [
    { label: 'Auto', value: 'auto' },
    { label: 'Disable Dehum (Denoise Only)', value: 'off' },
    { label: '3db', value: '3DB' },
    { label: '6db (low) ', value: '6DB' },
    { label: '9db', value: '9DB' },
    { label: '12db (medium)', value: '12DB' },
    { label: '15db', value: '15DB' },
    { label: '18db', value: '18DB' },
    { label: '30db', value: '30DB' },
    { label: '100 db (full)', value: '100DB' },
]

const humBaseFrequencyOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '50Hz', value: '50Hz' },
    { label: '60Hz', value: '60Hz' }
]

const loudnessTagetOptions = [
    { label: '-13 LUFS (very loud)', value: '-13' },
    { label: '-14 LUFS', value: '-14' },
    { label: '-15 LUFS', value: '-15' },
    { label: '-16 LUFS (Podcasts and Mobile)', value: '-16' },
    { label: '-18 LUFS (Audible/ACX specs)', value: '-18' },
    { label: '-19 LUFS', value: '-19' },
    { label: '-20 LUFS', value: '-20' },
    { label: '-23 LUFS EBU R128 (TV Europe)', value: '-23' },
    { label: '-24 LUFS EBU ATSC A/85 (TV US)', value: '-24' },
    { label: '-26 LUFS', value: '-26' },
    { label: '-27 LUFS (Netflix)', value: '-27' },
    { label: '-31 LUFS (very quiet)', value: '-31' },

]

const maximumPeakLevelOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '0 dBTP', value: '0' },
    { label: '-0.5 dBTP', value: '-0.5' },
    { label: '-1 dBTP (EBU R128)', value: '-1' },
    { label: '-1.5 dBTP', value: '-1.5' },
    { label: '-2 dBTP (ATSC A/85)', value: '-2' },
    { label: '-3 dBTP', value: '-3' },
    { label: '-4 dBTP', value: '-4' },
    { label: '-5 dBTP', value: '-5' },
    { label: '-6 dBTP', value: '-6' },
    { label: '-9 dBTP (Analog radio only)', value: '-9' },
]

const normalizationMethodOptions = [
    { label: 'Program Loudness', value: 'programLoudness' },
    { label: 'Dialog Loudness', value: 'dialogLoudness' }
]

const filteringModeOptions = [
    { label: 'Adaptive high-pass filtering', value: 'adaptiveHighPassFiltering' },
    { label: 'Voice AutoEQ', value: 'voiceEq' }
]

const levelerModeOptions = [
    { label: 'Default Leveler', value: 'default' },
    { label: 'Seprate MusicSpeech Params', value: 'musicSpeech' },
    { label: 'Broadcase Mode', value: 'broadcast' },
]

const levelerStrengthOptions = [
    { label: '120% (Amplify everything)', value: '120' },
    { label: '110% (Fast Leveler)', value: '110' },
    { label: '100% (Default)', value: '100' },
    { label: '90%', value: '90' },
    { label: '80%', value: '80' },
    { label: '70% (DynRange +3dB)', value: '70' },
    { label: '60%', value: '60' },
    { label: '50% (DynRange +6dB)', value: '50' },
    { label: '40%', value: '40' },
    { label: '30% (DynRange +10.5dB)', value: '30' },
    { label: '20%', value: '20' },
    { label: '10% (DynRange +20dB)', value: '10' },
    { label: '0% (no leveling)', value: '0' },
]

const compressorOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Off', value: 'off' },
    { label: 'Soft', value: 'soft' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
]

const maxLoudnessRangeOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '3LU', value: '3' },
    { label: '4LU', value: '4' },
    { label: '5LU', value: '5' },
    { label: '6LU', value: '6' },
    { label: '8LU', value: '8' },
    { label: '9LU', value: '9' },
    { label: '10LU', value: '10' },
    { label: '12LU', value: '12' },
    { label: '15LU', value: '15' },
    { label: '18LU', value: '18' },
    { label: '20LU', value: '20' },
]

const maxShortTermLoudnessOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '+3 LU rel', value: '3' },
    { label: '+4 LU rel', value: '4' },
    { label: '+5 LU rel', value: '5' },
    { label: '+6 LU rel', value: '6' },
    { label: '+8 LU rel', value: '8' },
    { label: '+9 LU rel', value: '9' },
    { label: '+10 LU rel', value: '10' },
    { label: '+12 LU rel', value: '12' },
]

const maxMomentaryLoudnessOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '+8 LU rel', value: '8' },
    { label: '+9 LU rel', value: '9' },
    { label: '+10 LU rel', value: '10' },
    { label: '+11 LU rel', value: '11' },
    { label: '+12 LU rel', value: '12' },
    { label: '+15 LU rel', value: '15' },
    { label: '+18 LU rel', value: '18' },
    { label: '+20 LU rel', value: '20' },
]

const musicGainOptions = [
    { label: '-6 dB (Music Softner)', value: '-6' },
    { label: '-5 dB', value: '-5' },
    { label: '-4 dB', value: '-4' },
    { label: '-3 dB', value: '-3' },
    { label: '-2 dB', value: '-2' },
    { label: '0 dB', value: '0' },
    { label: '+2 dB', value: '2' },
    { label: '+3 dB', value: '3' },
    { label: '+4 dB', value: '4' },
    { label: '+5 dB', value: '5' },
    { label: '+6 dB (Music Louder)', value: '6' },
]

const musicSpeechClassifierOptions = [
    { label: 'On', value: 'on' },
    { label: 'All Speech', value: 'allSpeech' },
    { label: 'All Music', value: 'allMusic' },
]

const musicLevelerStrengthOptions = [
    {label: 'Same', value: 'same'},
    ...levelerStrengthOptions
]

const musicCompressorOptions = [
    {label: 'Same', value: 'same'},
    ...compressorOptions   
]


export {
    defaultRecordingOptions,
    callBackConstants,
    storageKeys,
    screenRecordingOptions,
    cutModeOptions,
    denoiseMethodOptions,
    removeNoiseOptions,
    removeNoiseOptionsStatic,
    humReductionAmount,
    humBaseFrequencyOptions,
    loudnessTagetOptions,
    maximumPeakLevelOptions,
    normalizationMethodOptions,
    filteringModeOptions,
    levelerModeOptions,
    levelerStrengthOptions,
    compressorOptions,
    maxLoudnessRangeOptions,
    maxShortTermLoudnessOptions,
    maxMomentaryLoudnessOptions,
    musicGainOptions,
    musicSpeechClassifierOptions,
    musicLevelerStrengthOptions,
    musicCompressorOptions
}
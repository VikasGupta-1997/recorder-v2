import React, { useEffect, useRef, useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import styleText from "data-text:../../components/modal.module.css"
import * as style from '../../components/modal.module.css'
import Select from 'react-select'
import {
    compressorOptions,
    cutModeOptions,
    defaultAdvanceAuphonicState,
    denoiseMethodOptions,
    filteringModeOptions,
    humBaseFrequencyOptions,
    humReductionAmount,
    levelerModeOptions,
    levelerStrengthOptions,
    loudnessTagetOptions,
    maximumPeakLevelOptions,
    maxLoudnessRangeOptions,
    maxMomentaryLoudnessOptions,
    maxShortTermLoudnessOptions,
    musicCompressorOptions,
    musicGainOptions,
    musicLevelerStrengthOptions,
    musicSpeechClassifierOptions,
    normalizationMethodOptions,
    removeBreathingOptions,
    removeNoiseOptions,
    removeNoiseOptionsStatic,

} from "~utils/constants";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const LabelSwitch = ({ label, onChange, checked }) => {
    return (
        <div className={style["label-switch-wrap"]} >
            <label className={style["switch"]}>
                <input checked={checked} onChange={onChange} className="checkbox-input" type="checkbox" />
                <span className={`${style["slider"]} ${style["round"]} `}></span>
            </label>
            <p>{label}</p>
        </div>
    )
}

export const LabelCheckBox = ({ label, id, onChange, checked }) => {
    return (
        <div className={style["label-checkbox-wrap"]} >
            <input checked={checked} onChange={onChange} id={id} type="checkbox" />
            <label htmlFor={id}>{label}</label>
        </div>
    )
}

const LabelSelect = ({ label, options, id, defaultValue, onChange, isDisable = false, value }) => {
    return (
        <div className={style["label-select-wrap"]} >
            <label htmlFor={id} >{label}</label>
            <div className={style['select-container']} >
                <Select
                    id={id}
                    onChange={onChange}
                    defaultValue={options[defaultValue]}
                    value={value}
                    options={options}
                    isSearchable={false}
                    isClearable={false}
                    isDisabled={isDisable}
                    menuPlacement="auto"
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: base => ({ ...base, zIndex: 9999 }) // Ensure it appears above other elements
                    }}
                />
            </div>
        </div>
    )
}


const AdvanceAuphonicForm = ({ onClose, setConfirmSendToAuphonic, uuidState, startAuphonicAudioProcessing }) => {
    const [defaultSettings, setAsDefaultSettings] = useState(false)
    const [state, setState] = useState(defaultAdvanceAuphonicState)
    const setStateFromLocalStorage = async () => {
        console.log("Called!!")
        chrome.storage.local.get(["advanceAuphonicSettings"], async result => {
            console.log("resultresult", result)
            if (result.advanceAuphonicSettings) {
                console.log("Setted!!")
                setState(JSON.parse(JSON.stringify(result.advanceAuphonicSettings)))
            }
        })
    }


    useEffect(() => {
        const containerRef = document.getElementById('container');
        if (containerRef) {
            containerRef.style.marginTop = "0"
        }
        setStateFromLocalStorage()
        return () => {
            if (containerRef) {
                containerRef.style.marginTop = "1.5rem"
            }
        }
    }, [])

    const saveSettingsAndOpenConfirmation = async () => {
        if (defaultSettings) {
            await chrome.storage.local.set({ "advanceAuphonicSettings": JSON.parse(JSON.stringify(state)) })
        }
        chrome.storage.local.get(['doNotShowConfiramtion'], async result => {
            if (result?.doNotShowConfiramtion) { 
                startAuphonicAudioProcessing()
            } else {
                setConfirmSendToAuphonic(true)
            }
        })
       
        onClose()
    }

    return (
        <>
            <div className={style["darkBG"]} />
            <div className={style["centered"]}>
                <div className={`${style["modal"]} ${style["lg-modal"]}`}>
                    <div className={style["modalHeader"]}>
                        <h5 className={style["heading"]}>{uuidState ? "Reprocess Enhanced Audio" : "Advanced Enhanced Audio"}</h5>
                        <RiCloseLine color="black" cursor={'pointer'} onClick={onClose} fontSize={32} style={{ marginBottom: "-3px" }} />
                    </div>
                    <div className={style["modal-body"]} >
                        <p className="">
                            {uuidState ? "Reprocessing of already-enhanced audio does not consume extra AI credits." :
                                "This settings is reserved for only professionals & audio engineers who knew their way around."}
                        </p>
                        <div className={style["main"]} >
                            <div className={style["row-wrap"]} >
                                <LabelSwitch checked={state.trackCuttingToggle} onChange={e => setState(prev => ({ ...prev, trackCuttingToggle: e.target.checked }))
                                } label={"Track cutting (beta)"} />
                                <div style={{
                                    display: state?.trackCuttingToggle ? 'flex' : 'none',
                                    justifyContent: 'space-between'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelCheckBox checked={state.trackCutting.removeSilence} onChange={e => setState(prev => ({ ...prev, trackCutting: { ...prev.trackCutting, removeSilence: e.target.checked } }))} id="remove_silence" label={"Remove silences"} />
                                    <LabelCheckBox checked={state.trackCutting.removeFiller} onChange={e => setState(prev => ({ ...prev, trackCutting: { ...prev.trackCutting, removeFiller: e.target.checked } }))} id="remove_filter_words" label={"Remove filter words"} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            trackCutting: {
                                                ...prev.trackCutting,
                                                cutMode: e
                                            }
                                        }))
                                    } value={state.trackCutting.cutMode} defaultValue={0} id="cut_mode" label={"Cut mode"} options={cutModeOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]}>
                                <LabelSwitch checked={state.noiseReductionToggle} onChange={e => {
                                    setState(prev => ({ ...prev, noiseReductionToggle: e.target.checked }))
                                }} label={"Noice Reduction"} />
                                <div style={{
                                    display: state?.noiseReductionToggle ? 'flex' : 'none',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            noiseReduction: {
                                                ...prev.noiseReduction,
                                                denoiseMethod: e
                                            }
                                        }))
                                    } value={state.noiseReduction.denoiseMethod} defaultValue={1} id="denoise_method" label={"Denoise Method"} options={denoiseMethodOptions} />
                                    <div className={style["dymanic-noise-row"]} style={{ display: ['dynamic', 'speech_isolation'].includes(state?.noiseReduction?.denoiseMethod?.value) ? 'flex' : 'none' }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeNoise: e
                                                }
                                            }))
                                        } value={state.noiseReduction.removeNoise} defaultValue={0} id="remove_noise" label={"Remove Noise"} options={removeNoiseOptions} />
                                        <LabelSelect
                                            onChange={(e) =>
                                                setState(prev => ({
                                                    ...prev,
                                                    noiseReduction: {
                                                        ...prev.noiseReduction,
                                                        removereverb: e
                                                    }
                                                }))
                                            } value={state.noiseReduction.removereverb} defaultValue={0} id="remove_reverb" label={"Remove Reverb"} options={removeNoiseOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeBreathing: e
                                                }
                                            }))
                                        } value={state.noiseReduction.removeBreathing} defaultValue={0} id="remove_breathing" label={"Remove Breathing"} options={removeBreathingOptions} />
                                    </div>
                                    <div className={style["dymanic-noise-row"]} style={{ display: state?.noiseReduction?.denoiseMethod?.value === 'static' ? 'flex' : 'none' }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeNoiseStatic: e
                                                }
                                            }))
                                        } value={state.noiseReduction.removeNoiseStatic} defaultValue={0} id="remove_noise_static" label={"Remove Noise"} options={removeNoiseOptionsStatic} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    humBaseFrequency: e
                                                }
                                            }))
                                        } value={state.noiseReduction.humBaseFrequency} defaultValue={0} id="hum_base_frequency" label={"Hum Base Frequency"} options={humBaseFrequencyOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    humReductionAmount: e
                                                }
                                            }))
                                        } value={state.noiseReduction.humReductionAmount} defaultValue={0} id="hum_reduction_amount" label={"Hum Reduction Amount"} options={humReductionAmount} />
                                    </div>
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch checked={state.loudnessCorrectionToggle} onChange={e => {
                                    setState(prev => ({ ...prev, loudnessCorrectionToggle: e.target.checked }))
                                }} label={"Loudness Correction"} />
                                <div style={{
                                    display: state?.loudnessCorrectionToggle ? 'flex' : 'none',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                loudnessTarget: e
                                            }
                                        }))
                                    } value={state.loudnessCorrection.loudnessTarget} defaultValue={3} id="loudness_target" label={"Loudness Target"} options={loudnessTagetOptions} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                maximumPeakLevel: e
                                            }
                                        }))
                                    } value={state.loudnessCorrection.maximumPeakLevel} defaultValue={0} id="maximum_peak_level" label={"Maximum Peak Level"} options={maximumPeakLevelOptions} />
                                    <LabelCheckBox checked={state.loudnessCorrection.dualMono} onChange={e => setState(prev => ({ ...prev, loudnessCorrection: { ...prev.loudnessCorrection, dualMono: e.target.checked } }))} id="dual_mono" label={"Dual Mono"} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                normializationMethod: e
                                            }
                                        }))
                                    } value={state.loudnessCorrection.normializationMethod} defaultValue={0} id="normalization_method" label={"Normalization Method"} options={normalizationMethodOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch checked={state.filteringToggle} onChange={e => {
                                    setState(prev => ({ ...prev, filteringToggle: e.target.checked }))
                                }} label={"Filtering"} />
                                <div style={{
                                    display: state?.filteringToggle ? 'flex' : 'none',
                                    justifyContent: 'space-between'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            filtering: {
                                                ...prev.filtering,
                                                filterMode: e
                                            }
                                        }))
                                    } value={state.filtering.filterMode} defaultValue={1} id="filtering_mode" label={"Filtering Mode"} options={filteringModeOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch checked={state.adaptiveLevelerToggle} onChange={e => {
                                    setState(prev => ({ ...prev, adaptiveLevelerToggle: e.target.checked }))
                                }} label={"Adaptive Leveler"} />
                                <div style={{
                                    display: state?.adaptiveLevelerToggle ? 'block' : 'none',
                                    marginBottom: '16px',
                                    justifyContent: 'space-between'
                                }} className={style["track-cut-row-wrap"]} >
                                    <div style={{ marginBottom: '16px' }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    mode: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.mode} defaultValue={0} id="leveler_mode" label={"Leveler Mode"} options={levelerModeOptions} />
                                    </div>
                                    <div style={{
                                        display: state?.adaptiveLeveler.mode.value === 'default' ? 'flex' : 'none',
                                        gap: '16px',
                                        flexWrap: 'wrap'
                                    }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    levelerStrength: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.levelerStrength} defaultValue={0} id="leveler_strength" label={"Speech Leveler Strength"} options={levelerModeOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    compressor: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.compressor} defaultValue={0} id="compressor" label={"Compressor"} options={compressorOptions} />
                                    </div>
                                    <div style={{
                                        display: state?.adaptiveLeveler.mode.value === 'musicSpeech' ? 'flex' : 'none',
                                        gap: '16px',
                                        flexWrap: 'wrap'
                                    }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    speechLevelerStrength: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.speechLevelerStrength} isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'music'} defaultValue={2} id="speech_leveler_strength" label={"Speech Leveler Strength"} options={levelerStrengthOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    speechCompressor: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.speechCompressor} isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'music'} defaultValue={0} id="speech_compressor" label={"Speech Compressor"} options={compressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicSpeechClassifier: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.musicSpeechClassifier} defaultValue={0} id="music_speech_classifier" label={"MusicSpeech Classifier"} options={musicSpeechClassifierOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicLevelerStrength: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.musicLevelerStrength} isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'speech'} defaultValue={0} id="music_leveler_strength" label={"Music Leveler Strength"} options={musicLevelerStrengthOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicCompressor: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.musicCompressor} isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'speech'} defaultValue={0} id="music_compressor" label={"Music Compressor"} options={musicCompressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicGainSeprate: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.musicGainSeprate} isDisable={['speech', 'music'].includes(state.adaptiveLeveler.musicSpeechClassifier.value)} defaultValue={5} id="music_gain_seprate" label={"Music Gain"} options={musicGainOptions} />
                                    </div>
                                    <div style={{
                                        display: state?.adaptiveLeveler.mode.value === 'broadcast' ? 'flex' : 'none',
                                        gap: '16px',
                                        flexWrap: 'wrap'
                                    }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    maxLoudnessRange: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.maxLoudnessRange} defaultValue={0} id="max_loudness_range" label={"Max Loudness Range"} options={maxLoudnessRangeOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    maxShortTermLoudness: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.maxShortTermLoudness} defaultValue={0} id="max_short_term_loudness" label={"Max Short-term Loudness"} options={maxShortTermLoudnessOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    maxMomentaryLoudness: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.maxMomentaryLoudness} defaultValue={0} id="max_momentary_loudness" label={"Max Momentary Loudness"} options={maxMomentaryLoudnessOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    compressorBroadcast: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.compressorBroadcast} defaultValue={0} id="compressor_broadcast" label={"Compressor"} options={compressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicGain: e
                                                }
                                            }))
                                        } value={state.adaptiveLeveler.musicGain} defaultValue={5} id="music_gain" label={"Music Gain"} options={musicGainOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={style["enhance-modalActions"]}>
                        <div>
                            <LabelCheckBox checked={defaultSettings} onChange={e => setAsDefaultSettings(e.target.checked)} id="saveAsDefault" label={"Save this as my default audio profile"} />
                        </div>
                        <div className={style["actionsContainer"]}>
                            <button className={style["deleteBtn"]} onClick={saveSettingsAndOpenConfirmation}>
                                Yes, {uuidState ? "Reprocess" : "Enhance"}
                            </button>
                            <button
                                className={style["cancelBtn"]}
                                onClick={onClose}
                            >
                                No, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdvanceAuphonicForm;
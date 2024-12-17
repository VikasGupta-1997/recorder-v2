import React, { useEffect, useRef, useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import styleText from "data-text:../../components/modal.module.css"
import * as style from '../../components/modal.module.css'
import Select from 'react-select'
import {
    compressorOptions,
    cutModeOptions,
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
    removeNoiseOptions,
    removeNoiseOptionsStatic,

} from "~utils/constants";

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const LabelSwitch = ({ label, onChange }) => {
    return (
        <div className={style["label-switch-wrap"]} >
            <label className={style["switch"]}>
                <input onChange={onChange} className="checkbox-input" type="checkbox" />
                <span className={`${style["slider"]} ${style["round"]} `}></span>
            </label>
            <p>{label}</p>
        </div>
    )
}

const LabelCheckBox = ({ label, id, onChange }) => {
    return (
        <div className={style["label-checkbox-wrap"]} >
            <input onChange={onChange} id={id} type="checkbox" />
            <label htmlFor={id}>{label}</label>
        </div>
    )
}

const LabelSelect = ({ label, options, id, defaultValue, onChange, isDisable = false }) => {
    return (
        <div className={style["label-select-wrap"]} >
            <label htmlFor={id} >{label}</label>
            <div className={style['select-container']} >
                <Select
                    id={id}
                    onChange={onChange}
                    defaultValue={options[defaultValue]}
                    options={options}
                    isSearchable={false}
                    isClearable={false}
                    isDisabled={isDisable}
                />
            </div>
        </div>
    )
}


const AdvanceAuphonicForm = ({ onClose }) => {
    const [state, setState] = useState({
        trackCuttingToggle: false,
        noiseReductionToggle: false,
        loudnessCorrectionToggle: false,
        filteringToggle: false,
        adaptiveLevelerToggle: false,
        trackCutting: {
            removeSilence: false,
            removeFilterWords: false,
            cutMode: cutModeOptions[0]
        },
        noiseReduction: {
            denoiseMethod: denoiseMethodOptions[1],
            removeNoise: removeNoiseOptions[0],
            removereverb: removeNoiseOptions[0],
            removeBreathing: removeNoiseOptions[0],
            removeNoiseStatic: removeNoiseOptionsStatic[0],
            humBaseFrequency: humBaseFrequencyOptions[0],
            humReductionAmount: humReductionAmount[0]
        },
        loudnessCorrection: {
            loudnessTarget: loudnessTagetOptions[3],
            maximumPeakLevel: maximumPeakLevelOptions[0],
            dualMono: false,
            normializationMethod: normalizationMethodOptions[0]
        },
        filtering: {
            filterMode: filteringModeOptions[1]
        },
        adaptiveLeveler: {
            mode: levelerModeOptions[0],
            levelerStrength: levelerStrengthOptions[2],
            compressor: compressorOptions[0],
            maxLoudnessRange: maxLoudnessRangeOptions[0],
            maxShortTermLoudness: maxShortTermLoudnessOptions[0],
            maxMomentaryLoudness: maxMomentaryLoudnessOptions[0],
            compressorBroadcast: compressorOptions[0],
            musicGain: musicGainOptions[5],
            speechLevelerStrength: levelerStrengthOptions[2],
            speechCompressor: compressorOptions[0],
            musicSpeechClassifier: musicSpeechClassifierOptions[0],
            musicLevelerStrength: musicLevelerStrengthOptions[0],
            musicCompressor: musicCompressorOptions[0],
            musicGainSeprate: musicGainOptions[5],
        },
        setAsDefaultSettings: false
    })


    useEffect(() => {
        const containerRef = document.getElementById('container');
        if (containerRef) {
            containerRef.style.marginTop = "0"
        }
        return () => {
            if(containerRef){
                containerRef.style.marginTop = "1.5rem"
            }
        }
    }, [])
    console.log("STATE", state)
    return (
        <>
            <div className={style["darkBG"]} />
            <div className={style["centered"]}>
                <div className={`${style["modal"]} ${style["lg-modal"]}`}>
                    <div className={style["modalHeader"]}>
                        <h5 className={style["heading"]}>Advanced Enhanced Audio</h5>
                        <RiCloseLine color="black" cursor={'pointer'} onClick={onClose} fontSize={32} style={{ marginBottom: "-3px" }} />
                    </div>
                    <div className={style["modal-body"]} >
                        <p className="">This settings is reserved for only professionals & audio engineers who knew their way around.</p>
                        <div className={style["main"]} >
                            <div className={style["row-wrap"]} >
                                <LabelSwitch onChange={e => setState(prev => ({ ...prev, trackCuttingToggle: e.target.checked }))
                                } label={"Track cutting (beta)"} />
                                <div style={{
                                    display: state?.trackCuttingToggle ? 'flex' : 'none'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelCheckBox onChange={e => setState(prev => ({ ...prev, trackCutting: { ...prev.trackCutting, removeSilence: e.target.checked } }))} id="remove_silence" label={"Remove silences"} />
                                    <LabelCheckBox onChange={e => setState(prev => ({ ...prev, trackCutting: { ...prev.trackCutting, removeFilterWords: e.target.checked } }))} id="remove_filter_words" label={"Remove filter words"} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            trackCutting: {
                                                ...prev.trackCutting,
                                                cutMode: e
                                            }
                                        }))
                                    } defaultValue={0} id="cut_mode" label={"Cut mode"} options={cutModeOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]}>
                                <LabelSwitch onChange={e => {
                                    setState(prev => ({ ...prev, noiseReductionToggle: e.target.checked }))
                                }} label={"Noice Reduction"} />
                                <div style={{
                                    display: state?.noiseReductionToggle ? 'flex' : 'none'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            noiseReduction: {
                                                ...prev.noiseReduction,
                                                denoiseMethod: e
                                            }
                                        }))
                                    } defaultValue={1} id="denoise_method" label={"Denoise Method"} options={denoiseMethodOptions} />
                                    <div className={style["dymanic-noise-row"]} style={{ display: ['dynamicKeepMusicOnly', 'speechIsolation'].includes(state?.noiseReduction?.denoiseMethod?.value) ? 'flex' : 'none' }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeNoise: e
                                                }
                                            }))
                                        } defaultValue={0} id="remove_noise" label={"Remove Noise"} options={removeNoiseOptions} />
                                        <LabelSelect
                                            onChange={(e) =>
                                                setState(prev => ({
                                                    ...prev,
                                                    noiseReduction: {
                                                        ...prev.noiseReduction,
                                                        removereverb: e
                                                    }
                                                }))
                                            } defaultValue={0} id="remove_reverb" label={"Remove Reverb"} options={removeNoiseOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeBreathing: e
                                                }
                                            }))
                                        } defaultValue={0} id="remove_breathing" label={"Remove Breathing"} options={removeNoiseOptions} />
                                    </div>
                                    <div className={style["dymanic-noise-row"]} style={{ display: state?.noiseReduction?.denoiseMethod?.value === 'staticRemoveContantNoise' ? 'flex' : 'none' }} >
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    removeNoiseStatic: e
                                                }
                                            }))
                                        } defaultValue={0} id="remove_noise_static" label={"Remove Noise"} options={removeNoiseOptionsStatic} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    humBaseFrequency: e
                                                }
                                            }))
                                        } defaultValue={0} id="hum_base_frequency" label={"Hum Base Frequency"} options={humBaseFrequencyOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                noiseReduction: {
                                                    ...prev.noiseReduction,
                                                    humReductionAmount: e
                                                }
                                            }))
                                        } defaultValue={0} id="hum_reduction_amount" label={"Hum Reduction Amount"} options={humReductionAmount} />
                                    </div>
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch onChange={e => {
                                    setState(prev => ({ ...prev, loudnessCorrectionToggle: e.target.checked }))
                                }} label={"Loudness Correction"} />
                                <div style={{
                                    display: state?.loudnessCorrectionToggle ? 'flex' : 'none'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                loudnessTarget: e
                                            }
                                        }))
                                    } defaultValue={3} id="loudness_target" label={"Loudness Target"} options={loudnessTagetOptions} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                maximumPeakLevel: e
                                            }
                                        }))
                                    } defaultValue={0} id="maximum_peak_level" label={"Maximum Peak Level"} options={maximumPeakLevelOptions} />
                                    <LabelCheckBox onChange={e => setState(prev => ({ ...prev, loudnessCorrection: { ...prev.loudnessCorrection, dualMono: e.target.checked } }))} id="dual_mono" label={"Dual Mono"} />
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            loudnessCorrection: {
                                                ...prev.loudnessCorrection,
                                                normializationMethod: e
                                            }
                                        }))
                                    } defaultValue={0} id="normalization_method" label={"Normalization Method"} options={normalizationMethodOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch onChange={e => {
                                    setState(prev => ({ ...prev, filteringToggle: e.target.checked }))
                                }} label={"Filtering"} />
                                <div style={{
                                    display: state?.filteringToggle ? 'flex' : 'none'
                                }} className={style["track-cut-row-wrap"]} >
                                    <LabelSelect onChange={(e) =>
                                        setState(prev => ({
                                            ...prev,
                                            filtering: {
                                                ...prev.filtering,
                                                filterMode: e
                                            }
                                        }))
                                    } defaultValue={1} id="filtering_mode" label={"Filtering Mode"} options={filteringModeOptions} />
                                </div>
                            </div>
                            <div className={style["row-wrap"]} >
                                <LabelSwitch onChange={e => {
                                    setState(prev => ({ ...prev, adaptiveLevelerToggle: e.target.checked }))
                                }} label={"Adaptive Leveler"} />
                                <div style={{
                                    display: state?.adaptiveLevelerToggle ? 'block' : 'none',
                                    marginBottom: '16px'
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
                                        } defaultValue={0} id="leveler_mode" label={"Leveler Mode"} options={levelerModeOptions} />
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
                                        } defaultValue={0} id="leveler_strength" label={"Speech Leveler Strength"} options={levelerModeOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    compressor: e
                                                }
                                            }))
                                        } defaultValue={0} id="compressor" label={"Compressor"} options={compressorOptions} />
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
                                        } isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'allMusic'} defaultValue={2} id="speech_leveler_strength" label={"Speech Leveler Strength"} options={levelerStrengthOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    speechCompressor: e
                                                }
                                            }))
                                        } isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'allMusic'} defaultValue={0} id="speech_compressor" label={"Speech Compressor"} options={compressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicSpeechClassifier: e
                                                }
                                            }))
                                        } defaultValue={0} id="music_speech_classifier" label={"MusicSpeech Classifier"} options={musicSpeechClassifierOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicLevelerStrength: e
                                                }
                                            }))
                                        } isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'allSpeech'} defaultValue={0} id="music_leveler_strength" label={"Music Leveler Strength"} options={musicLevelerStrengthOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicCompressor: e
                                                }
                                            }))
                                        } isDisable={state.adaptiveLeveler.musicSpeechClassifier.value === 'allSpeech'} defaultValue={0} id="music_compressor" label={"Music Compressor"} options={musicCompressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicGainSeprate: e
                                                }
                                            }))
                                        } isDisable={['allSpeech', 'allMusic'].includes(state.adaptiveLeveler.musicSpeechClassifier.value)} defaultValue={5} id="music_gain_seprate" label={"Music Gain"} options={musicGainOptions} />
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
                                        } defaultValue={0} id="max_loudness_range" label={"Max Loudness Range"} options={maxLoudnessRangeOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    maxShortTermLoudness: e
                                                }
                                            }))
                                        } defaultValue={0} id="max_short_term_loudness" label={"Max Short-term Loudness"} options={maxShortTermLoudnessOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    maxMomentaryLoudness: e
                                                }
                                            }))
                                        } defaultValue={0} id="max_momentary_loudness" label={"Max Momentary Loudness"} options={maxMomentaryLoudnessOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    compressorBroadcast: e
                                                }
                                            }))
                                        } defaultValue={0} id="compressor_broadcast" label={"Compressor"} options={compressorOptions} />
                                        <LabelSelect onChange={(e) =>
                                            setState(prev => ({
                                                ...prev,
                                                adaptiveLeveler: {
                                                    ...prev.adaptiveLeveler,
                                                    musicGain: e
                                                }
                                            }))
                                        } defaultValue={5} id="music_gain" label={"Music Gain"} options={musicGainOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={style["enhance-modalActions"]}>
                        <div>
                            <LabelCheckBox onChange={e => setState(prev => ({ ...prev, setAsDefaultSettings: e.target.checked }))} id="saveAsDefault" label={"Save this as my default audio profile"} />
                        </div>
                        <div className={style["actionsContainer"]}>
                            <button className={style["deleteBtn"]} onClick={onClose}>
                                Yes, Enhance
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
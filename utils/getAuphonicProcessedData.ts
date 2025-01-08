export default function getAuphonicProcessedData(data){
    console.log("DATA", data)
    // Data not in here but in algo api -
    //  cutter , denoise, leveler , levelermode, normloudness
    let processedData = {};
    if(data.trackCuttingToggle){
        processedData['silence_cutter'] = data.trackCutting.removeSilence
        processedData['filler_cutter'] = data.trackCutting.removeFiller
        processedData['cut_mode'] = data.trackCutting.cutMode.value
    }

    if(data.noiseReductionToggle){
        if(['dynamic', 'speech_isolation'].includes(data.noiseReduction.denoiseMethod.value)){
            if(data.noiseReduction.denoiseMethod.value === 'dynamic'){
                processedData['denoisemethod'] = data.noiseReduction.denoiseMethod.value;
            }
            if(data.noiseReduction.denoiseMethod.value === 'speech_isolation') {
                processedData['denoisemethod'] = data.noiseReduction.denoiseMethod.value;
            }
            processedData['denoiseamount'] = data.noiseReduction.removeNoise.value;
            processedData['deverbamount'] = data.noiseReduction.removereverb.value;
            processedData['debreathamount'] = data.noiseReduction.removeBreathing.value;
        } else {
            processedData['denoisemethod'] = data.noiseReduction.denoiseMethod.value;
            processedData['denoiseamount'] = data.noiseReduction.removeNoiseStatic.value;
            processedData['dehum'] = data.noiseReduction.humBaseFrequency.value;
            processedData['dehumamount'] = data.noiseReduction.humReductionAmount.value;

        }
    }


    if(data.loudnessCorrectionToggle){
        processedData['loudnesstarget'] = data.loudnessCorrection.loudnessTarget.value
        processedData['maxpeak'] = data.loudnessCorrection.maximumPeakLevel.value
        processedData['dualmono'] = data.loudnessCorrection.dualMono
        processedData['loudnessmethod'] = data.loudnessCorrection.normializationMethod.value
    }

    if(data.filtering) {
        processedData['filtering'] = true
        processedData['filtermethod'] = data.filtering.filterMode.value
    } else {
        processedData['filtering'] = false
    }

    if(data.adaptiveLevelerToggle){
        processedData['levelermode'] = data.adaptiveLeveler.mode.value
        if(data.adaptiveLeveler.mode.value === 'default'){
            processedData['levelerstrength'] = data.adaptiveLeveler.levelerStrength.value;
            processedData['compressor'] = data.adaptiveLeveler.compressor.value;
        }
        if(data.adaptiveLeveler.mode.value === 'musicSpeech'){
            processedData['levelerstrength_speech'] = data.adaptiveLeveler.speechLevelerStrength.value;
            processedData['compressor_speech'] = data.adaptiveLeveler.speechCompressor.value;
            processedData['msclassifier'] = data.adaptiveLeveler.musicSpeechClassifier.value;
            processedData['levelerstrength_music'] = data.adaptiveLeveler.musicLevelerStrength.value === 'same' ? data.adaptiveLeveler.speechLevelerStrength.value : data.adaptiveLeveler.musicLevelerStrength.value;
            processedData['compressor_music'] = data.adaptiveLeveler.musicCompressor.value === 'same' ? data.adaptiveLeveler.speechCompressor.value : data.adaptiveLeveler.musicCompressor.value;
            processedData['musicgain'] = data.adaptiveLeveler.musicGainSeprate.value;

        }
        if(data.adaptiveLeveler.mode.value === 'broadcast'){
            processedData['maxlra'] = data.adaptiveLeveler.maxLoudnessRange.value;
            processedData['maxs'] = data.adaptiveLeveler.maxShortTermLoudness.value;
            processedData['maxm'] = data.adaptiveLeveler.maxMomentaryLoudness.value;
            processedData['musicgain'] = data.adaptiveLeveler.musicGain.value;
            processedData['compressor'] = data.adaptiveLeveler.compressorBroadcast.value; //Not sure to add as not added in api docs
        }
    }

    console.log("processedDataprocessedData", processedData)
    return processedData
    
}
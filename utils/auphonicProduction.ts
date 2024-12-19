import getAuphonicProcessedData from '~utils/getAuphonicProcessedData';

const AUTH_HEADER = {
    'Authorization': 'Basic ' + btoa(`${process.env.PLASMO_PUBLIC_AUPHONIC_USERNAME}:${process.env.PLASMO_PUBLIC_AUPHONIC_PASSWORD}`)
};

export const fetchMp3File = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch the MP3 file");
        }
        const blob = await response.blob()
        return blob;
    } catch (error) {
        console.error("Error fetching MP3 file:", error);
        return null;
    }
};

export default async function onSubmitAdvanceAuphonic(data, blob, setIspublishing, uuidRef, setUuid, fileNameRef) {
    // console.log(uuidRef,blob, "Data=======>", data, fileNameRef)
    const generatedData = getAuphonicProcessedData(data)
    const sendData = { algorithms: { ...generatedData } }
    console.log("generatedData", sendData)
    let downloadUrl;
    let uuidResp;
    let fileName;
    setIspublishing(true)
    try {
        if (!uuidRef.current) {
            console.log("processAudioWithAuphonic called with Blob:", blob);
            // Step 1: Create a new production
            const formData = new FormData();
            const timestamp = Date.now(); // Get current timestamp in milliseconds
            const randomString = Math.random().toString(36).substring(2, 10);
            // Step 1: Create a new production
            fileName = `audio_${timestamp}_${randomString}`
            fileNameRef.current = fileName
            formData.append('input_file', blob, fileName + '.mp3');
            // formData.append('input_file', new File([blob], fileName + '.mp3' , { type: blob.type }));
            // formData.append('preset', presetUuid);
            const productionResponse = await fetch(`${process.env.PLASMO_PUBLIC_AUPHONICURL}/simple/productions.json`, {
                method: 'POST',
                headers: AUTH_HEADER,
                body: formData
            });

            if (!productionResponse.ok) {
                const errorText = await productionResponse.text();
                console.error("Failed to create Auphonic production:", errorText);
                throw new Error(`Production creation failed: ${productionResponse.statusText}`);
            }

            const productionData = await productionResponse.json();
            uuidResp = productionData?.data?.uuid;
            uuidRef.current = productionData?.data?.uuid
            if (!uuidResp) {
                console.error("UUID not found in production response:", productionData);
                throw new Error("Failed to retrieve production UUID");
            }
            console.log("Production created with UUID:", uuidResp);
        }
        //Extra step to add configs
        const uuid = uuidResp || uuidRef.current
        const sendConfigRespose = await fetch(`${process.env.PLASMO_PUBLIC_AUPHONICURL}/production/${uuid}.json`, {
            method: 'POST',
            headers: {
                ...AUTH_HEADER,
                'Content-Type': "application/json"
            },
            body: JSON.stringify(sendData)
        });
        console.log("sendConfigRespose1212", sendConfigRespose)

        if (!sendConfigRespose.ok) {
            const errorText = await sendConfigRespose.text();
            console.error("Failed to set Auphonic configuration:", errorText);
            throw new Error(`Auphonic Config setting failed: ${sendConfigRespose.statusText}`);
        }
        const sendConfigResposeData = await sendConfigRespose.json();
        console.log("sendConfigResposeDatasendConfigResposeData", sendConfigResposeData)
        // Step 2: Start the production
        const startResponse = await fetch(`${process.env.PLASMO_PUBLIC_AUPHONICURL}/production/${uuid}/start.json`, {
            method: 'POST',
            headers: AUTH_HEADER,
        });

        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error("Failed to start Auphonic production:", errorText);
            throw new Error(`Production start failed: ${startResponse.statusText}`);
        }
        console.log("Production started successfully.");

        // Step 3: Poll for completion
        const checkStatus = async () => {
            try {
                const statusResponse = await fetch(`${process.env.PLASMO_PUBLIC_AUPHONICURL}/production/${uuid}/status.json`, {
                    headers: AUTH_HEADER
                });

                if (!statusResponse.ok) {
                    const errorText = await statusResponse.text();
                    console.error("Error fetching production status:", errorText);
                    throw new Error(`Failed to fetch production status: ${statusResponse.statusText}`);
                }

                const statusData = await statusResponse.json();
                console.log("Current production status:", statusData.data.status_string);
                // return statusData?.data?.status_string; // when checking for status_string
                return statusData?.data?.status; // when checking for status 
            } catch (error) {
                console.error("Error during status check:", error);
                throw error;
            }
        };

        let status;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
            status = await checkStatus();
        } while ([1, 4, 5].includes(status)); // when checking for status 
        // } while ( ["Audio Encoding",  "Audio Processing", "Waiting"].includes(status)); // when checking for status_string

        console.log("Final production status:", status);

        // Step 4: Handle completion
        // if (status === 'Done') { // when checking for status_string
        if (status === 3) { // when checking for status 
            console.log("STAUOS ")
            const urlTobeSent = `${process.env.PLASMO_PUBLIC_PROXY_SERVER}/fetch-file?url=${process.env.PLASMO_PUBLIC_AUPHONICURL}/download/audio-result/${uuid}/${fileName || fileNameRef.current}.mp3`
            console.log("urlTobeSent", urlTobeSent)
            downloadUrl = urlTobeSent
            const file = await fetchMp3File(downloadUrl)
            setIspublishing(false)
            setUuid(uuid)
            console.log("Production completed. Downloading the processed file...");
            return file
        } else {
            setIspublishing(false)
            console.error("Production did not complete successfully:", status);
            throw new Error(`Processing failed with status: ${status}`);
        }

    } catch (error) {
        setIspublishing(false)
        console.error("Error processing audio with Auphonic:", error);
        throw error; // Re-throw the error for further handling if needed
    }
    // processAudioWithAuphonic(blob, isAudio, presetUuid,sendData )
    // setShowAuphonicAdvanceForm(false)
    // setConfirmSendToAuphonic(true)
}
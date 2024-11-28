function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string); // Explicitly cast to string
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function saveRecordingToIndexedDB(blob: Blob) {
    const base64Data: string = await blobToBase64(blob); // Ensure `base64Data` is typed as string
    return base64Data
    // setBase64(base64Data)
    // const chunkSize = 1024 * 1024; // 1 MB per chunk
    // let chunkIndex = 0;
    

    
    // while (chunkIndex * chunkSize < base64Data.length) {
    //     const chunk = base64Data.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize); // No more type error
    //     chrome.runtime.sendMessage({
    //         type: "RECORDING_CHUNK",
    //         data: chunk,
    //         index: chunkIndex,
    //         isLastChunk: (chunkIndex + 1) * chunkSize >= base64Data.length
    //     });
    //     console.log(`Sent chunk ${chunkIndex}`);
    //     chunkIndex++;
    // }
    // chrome.runtime.sendMessage({
    //     type: "RECORDING_CHUNK_UPLOAD_COMPLETE",
    //     index: chunkIndex,
    //     isLastChunk: (chunkIndex + 1) * chunkSize >= base64Data.length
    // });
    // console.log("All chunks sent.");
}

export { saveRecordingToIndexedDB };

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function saveRecordingToIndexedDB(blob, onComplete) {
    console.log(indexedDB, "saveRecordingToIndexedDB Calledddd", blob, onComplete)
    const base64Data = await blobToBase64(blob);
    console.log("NEW BASE 64", base64Data)
    // Open IndexedDB and save Base64 data
    const request = indexedDB.open("videoDatabase", 1);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("videos")) {
            db.createObjectStore("videos", { keyPath: "id" });
        }
    };

    request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("videos", "readwrite");
        const store = transaction.objectStore("videos");

        // Save the base64 data with a unique ID
        store.put({ id: "recording", data: base64Data });

        transaction.oncomplete = () => {
            console.log("onComplete Call!!")
            // onComplete()
            chrome.runtime.sendMessage({type: "GET_INDEXDB_RECORDING"})
        };
        transaction.onerror = (event) => console.error("Error saving recording:", event);
    };
}

export { saveRecordingToIndexedDB }
const fetchImageAsBase64 = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Base64 string
        reader.onerror = reject;
        reader.readAsDataURL(blob); // Converts Blob to Base64
    });
};

export default fetchImageAsBase64
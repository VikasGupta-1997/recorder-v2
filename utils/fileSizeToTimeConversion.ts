export function calculateTimeFromSize(blobSizeBytes) {
    const sizeInMB = blobSizeBytes / (1024 * 1024); // Convert bytes to MB
    if (sizeInMB < 1) {
        return "1 minute"; // Minimum size is 1MB
    } else if (sizeInMB < 60) {
        return `${Math.ceil(sizeInMB)} minutes`; // Show size in minutes, rounded up
    } else {
        const hours = Math.floor(sizeInMB / 60); // Calculate whole hours
        const minutes = Math.ceil(sizeInMB % 60); // Calculate remaining minutes, rounded up
        return `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minute` : ""}`; // Return in hours and minutes
    }
}
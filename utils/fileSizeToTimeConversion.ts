export function calculateTimeFromSize(duration) {
    // Minimum minutes threshold
    const minMinutes = 3;

    // Convert seconds to total minutes
    let totalMinutes = Math.round(duration / 60);

    // If less than 3 minutes, set totalMinutes to 3
    if (totalMinutes < minMinutes) {
        totalMinutes = minMinutes;
    }

    // Calculate hours and remaining minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Construct the result string
    let result = "";
    if (hours > 0) {
        result += `${hours} hr${hours > 1 ? "s" : ""}`; // Pluralize 'hr' if needed
    }
    if (minutes > 0) {
        if (result) result += " "; // Add space if hours are present
        result += `${minutes} min${minutes > 1 ? "s" : ""}`; // Pluralize 'min' if needed
    }

    return result || "3 mins";
}
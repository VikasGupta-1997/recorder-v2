export default  function formatTime(seconds, formattedTimeRef) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // If seconds are less than 3600 (i.e., less than 1 hour), show mm:ss format
    let time;
    if (seconds < 3600) {
        time = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        // Otherwise, show hh:mm:ss format
        time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Update the span with the formatted time
    if (formattedTimeRef.current) {
        formattedTimeRef.current.innerText = time;
    }

    return time;
}
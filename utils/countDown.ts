const countDown = (
    showStartOverlay, 
    count,
    setCount,
    setShowStartOverlay,
    setStartRecordingNow
) => {
    if (showStartOverlay) {
        if (count > 1) {
            const timer = setTimeout(() => {
                setCount(count - 1);
            }, 1000); // Decrease the count every second

            return () => clearTimeout(timer); // Clear the timer on cleanup
        } else if (count === 1) {
            const timer = setTimeout(() => {
                setShowStartOverlay(false)
                setStartRecordingNow(true)
                setCount("!"); // Change to "Start!" when countdown reaches 1
            }, 1000);

            return () => clearTimeout(timer);
        }
    }
}

export default countDown
function convertTime(seconds) {
    if (seconds < 60) {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
  
    let timeString = '';
  
    if (hours > 0) {
      timeString += `${hours}h${hours > 1 ? 's' : ''}`;
    }
  
    if (minutes > 0) {
      if (timeString) timeString += ' ';
      timeString += `${minutes}min${minutes > 1 ? 's' : ''}`;
    }
  
    return timeString || '0min';
  }

export default convertTime
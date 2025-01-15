const formatBlobSize = (sizeInBytes) => {
    if (sizeInBytes >= 1073741824) { // 1 GB = 1024 * 1024 * 1024 bytes
      return (sizeInBytes / 1073741824).toFixed(2) + ' GB'; // Convert to GB
    } else if (sizeInBytes >= 1048576) { // 1 MB = 1024 * 1024 bytes
      return (sizeInBytes / 1048576).toFixed(2) + ' MB'; // Convert to MB
    } else if (sizeInBytes >= 1024) { // 1 KB = 1024 bytes
      return (sizeInBytes / 1024).toFixed(2) + ' KB'; // Convert to KB
    } else {
      return sizeInBytes + ' bytes'; // If less than 1 KB, show in bytes
    }
  };

  export default formatBlobSize
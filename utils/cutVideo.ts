async function cutVideo(ffmpeg, videoBlob, start, end, cut, duration, encode) {
  const videoData = new Uint8Array(await videoBlob.arrayBuffer());

  // Set the input video file name
  ffmpeg.FS("writeFile", "input.mp4", videoData);

  // Set the output video file name
  const outputFileName = cut ? "output-cut.mp4" : "output-trimmed.mp4";
  let encodeOptions = [
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-reset_timestamps",
    "1",
  ];
  if (encode) {
    encodeOptions = [
      "-preset",
      "superfast",
      "-threads",
      "0",
      "-r",
      "30",
      "-tune",
      "fastdecode",
    ];
  }

  if (cut) {
    if (start > 0 && end < duration) {
      await ffmpeg.run(
        "-ss",
        "0",
        "-i",
        "input.mp4",
        "-to",
        start.toString(),
        ...encodeOptions,
        "part1.mp4"
      );

      // Then, cut the video from the end time to the end
      await ffmpeg.run(
        "-ss",
        end.toString(),
        "-i",
        "input.mp4",
        "-to",
        duration.toString(),
        ...encodeOptions,
        "part2.mp4"
      );

      // Create a text file with the list of input videos
      ffmpeg.FS("writeFile", "input.txt", "file 'part1.mp4'\nfile 'part2.mp4'");

      // Concatenate the two remaining parts
      await ffmpeg.run(
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "input.txt",
        "-c",
        "copy",
        outputFileName
      );

      // Get the edited video data
      const data = ffmpeg.FS("readFile", outputFileName);

      // Create a Blob from the edited video data
      const editedVideoBlob = new Blob([data.buffer], { type: "video/mp4" });

      // Return the edited video Blob
      return editedVideoBlob;
    } else if (start == 0 && end < duration) {
      await ffmpeg.run(
        "-ss",
        end.toString(),
        "-i",
        "input.mp4",
        "-to",
        duration.toString(),
        ...encodeOptions,
        outputFileName
      );

      // Get the edited video data
      const data = ffmpeg.FS("readFile", outputFileName);

      // Create a Blob from the edited video data
      const editedVideoBlob = new Blob([data.buffer], { type: "video/mp4" });

      // Return the edited video Blob
      return editedVideoBlob;
    } else if (start > 0 && end == duration) {
      await ffmpeg.run(
        "-ss",
        "0",
        "-i",
        "input.mp4",
        "-to",
        start.toString(),
        ...encodeOptions,
        outputFileName
      );

      // Get the edited video data
      const data = ffmpeg.FS("readFile", outputFileName);

      // Create a Blob from the edited video data
      const editedVideoBlob = new Blob([data.buffer], { type: "video/mp4" });

      // Return the edited video Blob
      return editedVideoBlob;
    }
  } else {
    await ffmpeg.run(
      "-ss",
      start.toString(),
      "-i",
      "input.mp4",
      "-t",
      (end - start).toString(),
      ...encodeOptions,
      outputFileName
    );

    // Get the edited video data
    const data = ffmpeg.FS("readFile", outputFileName);

    // Create a Blob from the edited video data
    const editedVideoBlob = new Blob([data.buffer], { type: "video/mp4" });

    // Return the edited video Blob
    return editedVideoBlob;
  }
}

export function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
};

export async function fixMetadata(ffmpeg, blob, hasAudio) {
  const data = new Uint8Array(await blob.arrayBuffer());
  ffmpeg.FS('writeFile', 'input.mp4', data);

  if (hasAudio === 'false') {
      console.log('Adding silent audio track to the video...');
      await ffmpeg.run(
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-i', 'input.mp4',
          '-shortest',
          '-c:v', 'copy',
          '-c:a', 'aac',
          'output.mp4'
      );
  } else {
      console.log('Video already has audio. Fixing metadata...');
      await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', '-movflags', 'faststart', 'output.mp4');
  }

  const output = ffmpeg.FS('readFile', 'output.mp4');
  const fixedBlob = new Blob([output.buffer], { type: 'video/mp4' });

  // Return the processed blob
  return fixedBlob;
}



// export async function fixMetadata(ffmpeg, blob) {
//   const data = new Uint8Array(await blob.arrayBuffer());
//   ffmpeg.FS('writeFile', 'input.mp4', data);
//   await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', '-movflags', 'faststart', 'output.mp4');
//   const output = ffmpeg.FS('readFile', 'output.mp4');
//   return new Blob([output.buffer], { type: 'video/mp4' });
// }

export async function reencodeVideo(ffmpeg, blob) {
  const videoData = new Uint8Array(await blob.arrayBuffer());
  const outputFileName = "output.mp4";
  ffmpeg.FS("writeFile", "input.mp4", videoData);
  await ffmpeg.run(
    "-i",
    "input.mp4",
    "-preset",
    "superfast",
    "-threads",
    "0",
    "-r",
    "30",
    "-tune",
    "fastdecode",
    outputFileName
  );

  const data = ffmpeg.FS("readFile", outputFileName);
  const editedVideoBlob = new Blob([data.buffer], {
    type: "video/mp4",
  });
  return editedVideoBlob;
}

export default cutVideo;

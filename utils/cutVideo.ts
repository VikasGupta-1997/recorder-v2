async function cutVideo(ffmpeg, videoBlob, start, end, cut, duration, encode) {
  const videoData = new Uint8Array(await videoBlob.arrayBuffer());

  // Set the input video file name
  ffmpeg.FS("writeFile", "input.webm", videoData);

  // Set the output video file name
  const outputFileName = cut ? "output-cut.webm" : "output-trimmed.webm";
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
        "input.webm",
        "-to",
        start.toString(),
        ...encodeOptions,
        "part1.webm"
      );

      // Then, cut the video from the end time to the end
      await ffmpeg.run(
        "-ss",
        end.toString(),
        "-i",
        "input.webm",
        "-to",
        duration.toString(),
        ...encodeOptions,
        "part2.webm"
      );

      // Create a text file with the list of input videos
      ffmpeg.FS("writeFile", "input.txt", "file 'part1.webm'\nfile 'part2.webm'");

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
        "input.webm",
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
        "input.webm",
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
      "input.webm",
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
  console.log("UNit8ArrData mm", data)
  ffmpeg.FS('writeFile', 'input.webm', data);

  if (hasAudio === 'false') {
      console.log('Adding silent audio track to the video...');
     
      try {
        await ffmpeg.run(
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-i', 'input.webm',
          '-shortest',
          '-c:v', 'copy',
          '-c:a', 'aac',
          'output.webm'
      );
        const output = ffmpeg.FS('readFile', 'output.webm');
        console.log("outputoutput", output)
        const fixedBlob = new Blob([output.buffer], { type: 'video/webm' });
  
        // Return the processed blob
        return fixedBlob;
      } catch (err) {
          console.error('FFmpeg run error:', err);
      }
  } else {
      console.log('Video already has audio. Fixing metadata...');
      console.log('Writing input.webm to FS...');
    ffmpeg.FS('writeFile', 'input.webm', data);
    console.log('Reading input.wesbm from FS...');
    const inputExists = ffmpeg.FS('readdir', '/').includes('input.webm');
    console.log('Input exists in FS:', inputExists);
    try {
      await ffmpeg.run('-i', 'input.webm', '-c', 'copy', '-movflags', 'faststart', 'output.webm');
      const output = ffmpeg.FS('readFile', 'output.webm');
      console.log("outputoutput", output)
      const fixedBlob = new Blob([output.buffer], { type: 'video/webm' });

      // Return the processed blob
      return fixedBlob;
    } catch (err) {
        console.error('FFmpeg run error:', err);
    }
  }

  
}



// export async function fixMetadata(ffmpeg, blob) {
//   const data = new Uint8Array(await blob.arrayBuffer());
//   ffmpeg.FS('writeFile', 'input.webm', data);
//   await ffmpeg.run('-i', 'input.webm', '-c', 'copy', '-movflags', 'faststart', 'output.webm');
//   const output = ffmpeg.FS('readFile', 'output.webm');
//   return new Blob([output.buffer], { type: 'video/mp4' });
// }

export async function extractAudio(ffmpeg, videoBlob, outputFormat = "mp3") {
  // Convert the video Blob into a Uint8Array
  const videoData = new Uint8Array(await videoBlob.arrayBuffer());

  // Write the video data to the FFmpeg virtual filesystem
  ffmpeg.FS("writeFile", "input.webm", videoData);

  // Run the FFmpeg command to extract audio
  const outputFileName = `output.${outputFormat}`;
  await ffmpeg.run(
    "-i", "input.webm",   // Input file
    "-q:a", "0",         // High audio quality
    "-map", "a",         // Extract only the audio stream
    outputFileName       // Output file
  );

  // Read the output audio file from the FFmpeg filesystem
  const audioData = ffmpeg.FS("readFile", outputFileName);

  // Create a Blob from the extracted audio data
  const audioBlob = new Blob([audioData.buffer], { type: `audio/${outputFormat}` });

  // Return the audio Blob
  return audioBlob;
}

export async function reencodeVideo(ffmpeg, blob) {
  const videoData = new Uint8Array(await blob.arrayBuffer());
  const outputFileName = "output.webm";
  ffmpeg.FS("writeFile", "input.webm", videoData);
  await ffmpeg.run(
    "-i",
    "input.webm",
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

export async function replaceVideoAudio(ffmpeg, videoBlob, audioBlob) {
  // Step 1: Validate inputs
  console.log(videoBlob instanceof Blob, "LETS CHCK FOR CALL!!!", videoBlob)
  console.log(audioBlob instanceof Blob, "LETS CHCK FOR Audio CALL!!!", audioBlob)
  if (!videoBlob) {
    throw new Error("Invalid videoBlob. It must be a valid Blob object.");
  }

  if (!audioBlob || !(audioBlob instanceof Blob)) {
    throw new Error("Invalid audioBlob. It must be a valid Blob object.");
  }

  console.log(ffmpeg, "replaceVideoAudio Function", videoBlob, audioBlob);

  // Step 2: Convert Blobs into Uint8Array
  const videoData = new Uint8Array(await videoBlob.arrayBuffer());
  console.log("videoData", videoData);
  const audioData = new Uint8Array(await audioBlob.arrayBuffer());
  console.log("audioData", audioData);

  // Step 3: Write files to FFmpeg's virtual file system
  ffmpeg.FS("writeFile", "input-video.webm", videoData);
  ffmpeg.FS("writeFile", "input-audio.mp3", audioData);

  // Step 4: Replace audio in the video
  const outputFileName = "output-video-with-new-audio.webm";
  try {
    await ffmpeg.run(
      "-i", "input-video.webm",  // Input video file
      "-i", "input-audio.mp3",  // Input audio file
      "-c:v", "copy",           // Copy video without re-encoding
      "-map", "0:v:0",          // Map video stream
      "-map", "1:a:0",          // Map audio stream
      "-shortest",              // Trim to shortest input
      outputFileName            // Output file name
    );
  } catch (err) {
    console.error("FFmpeg run failed:", err);
    throw new Error("FFmpeg command failed. Ensure no concurrent operations are running.");
  }

  // Step 5: Retrieve the output video file
  const outputData = ffmpeg.FS("readFile", outputFileName);

  // Step 6: Convert Uint8Array to Blob
  const outputBlob = new Blob([outputData.buffer], { type: "video/mp4" });

  console.log("Replacement video created successfully.");
  return outputBlob;
}

export default cutVideo;

// trimVideo.js
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from "@ffmpeg/util";

const ffmpeg = createFFmpeg({ log: true });

export const trimVideo = async (blobUrl, startTime, endTime) => {
    console.log(ffmpeg,"trimVideo", blobUrl)
  await ffmpeg.load();

  // Fetch the video file from the blob URL
  const videoFile = await fetch(blobUrl);
  console.log("fetchFile===>", videoFile)
  const videoBuffer = await videoFile.arrayBuffer();
  await ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoBuffer));

  // Trim the video
  await ffmpeg.run('-i', 'input.mp4', '-ss', startTime, '-to', endTime, 'output.mp4');

  // Get the result
  const data = ffmpeg.FS('readFile', 'output.mp4');

  // Convert to blob URL
  const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
  const videoUrl = URL.createObjectURL(videoBlob);

  return videoUrl;
};

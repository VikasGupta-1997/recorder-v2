import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

window.onerror = function(message: any, source, lineno, colno, error) {
  console.log("ERROR OCCURED CONTENT!!!!", message)
  if (message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
      // Handle the quota error
      console.log("Quota exceeded error caught.");
      // Perform the desired feature here
  }
  return false; // Prevents the browser from logging the error in the console
};
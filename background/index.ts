
const OFFSCREEN_URL = chrome.runtime.getURL('tabs/offscreen.html');
const createOffscreenDocument = async () => {
  try {
    // Check if an offscreen document already exists
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['USER_MEDIA'] as any,
      justification: 'Recording from chrome.tabCapture API'
    });
    console.log("Offscreen document created.");
  } catch (error) {
    console.error("Error creating offscreen document:", error);
  }
};

// chrome.runtime.setUninstallURL(
//   "https://tally.so/r/3Ex6kX?version=" +
//     chrome.runtime.getManifest().version
// );


chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log("INSTALEDDD FIRST TIME!!!")
    // This is the first time the extension is installed
    await createOffscreenDocument()
    await chrome.storage.local.set({ firstTimeLaunch: true });
    // chrome.tabs.query({}, function(tabs) {
    //   // Reload each tab
    //   tabs.forEach(tab => {
    //       if (tab.id) {
    //           chrome.tabs.reload(tab.id)
    //       }
    //   });
    // });
  }
});

let timer = 0
let isRecordingInProgress = false
let interValId = null
let isToOpenPreview = true
let isRecordingFromSystemTab = false
let navigatedTabs = []
const startInterval = () => {
  interValId = setInterval(() => {
    timer = timer + 1
  }, 1000);
}

// let timerInterval;
// let elapsedTime = 0; // Counter for elapsed time in seconds
// let isRunning = false;
// let isPaused = false;

const openNewWindow = (url, sendMessageAction, selections, isWindowSelected) => {
  chrome.system.display.getInfo((displays) => {
    const screenWidth = displays[0].workArea.width;
    const screenHeight = displays[0].workArea.height;

    // Set desired window size
    const windowWidth = !isWindowSelected ? 900 : 600;
    const windowHeight = !isWindowSelected ? 680 : 560;

    // Calculate the position to center the window
    const left = Math.round((screenWidth - windowWidth) / 2);
    const top = Math.round((screenHeight - windowHeight) / 2);
    chrome.windows.create({
      url: chrome.runtime.getURL(url), // The HTML file for the camera feed
      type: 'popup',
      width: windowWidth,
      height: windowHeight,
      left: !isWindowSelected ? left : left - 250,
      top: top,
      focused: true,

    }, async (window) => {
      const cameraWindowId = window.id;
      const checkTabLoaded = (tabId, changeInfo) => {
        if (changeInfo.status === 'complete' && tabId === window.tabs[0].id) {
          if (sendMessageAction === "startWindowSelected") {
            startTimer()
          }
          chrome.tabs.onUpdated.removeListener(checkTabLoaded);
          chrome.runtime.sendMessage({
            type: sendMessageAction,
            selections: selections,
            cameraWindowId: cameraWindowId
          });
        }
      };
      chrome.tabs.onUpdated.addListener(checkTabLoaded);
      chrome.windows.onRemoved.addListener((closedWindowId) => {
        if (closedWindowId === cameraWindowId) {
          stopTimer()
          // chrome.storage.local.set({ "isRecordingInProgress": false })
          try {
            chrome.storage.local.set({ isRecordingInProgress: false }, function () {
              if (chrome.runtime.lastError) {
                if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
                } else {
                  console.error("Other error: ", chrome.runtime.lastError.message);
                }
              } else {
              }
            });
          } catch (error) {
            console.error("Caught exception: ", error);
          }
        }
      });
    });
  })
}

// IndexedDB utility to open DB connection
function openIndexedDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("TimerDB", 1);

    request.onerror = (event) => {
      console.error("Error opening IndexedDB", event);
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      const db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("timerStore")) {
        db.createObjectStore("timerStore", { keyPath: "id" });
      }
    };
  });
}

function saveElapsedTime(elapsedTime: number) {
  openIndexedDB().then((db) => {
    const transaction = db.transaction("timerStore", "readwrite");
    const store = transaction.objectStore("timerStore");
    store.put({ id: 1, elapsedTime });
  }).catch((error) => {
    console.error("Error saving elapsed time to IndexedDB", error);
  });
}

// Function to get elapsed time from IndexedDB
function getElapsedTime() {
  return new Promise<number>((resolve, reject) => {
    openIndexedDB().then((db) => {
      const transaction = db.transaction("timerStore", "readonly");
      const store = transaction.objectStore("timerStore");
      const request = store.get(1);

      request.onsuccess = (event) => {
        resolve(request.result?.elapsedTime || 0); // Default to 0 if no result found
      };

      request.onerror = (event) => {
        console.error("Error retrieving elapsed time from IndexedDB", event);
        reject("Error retrieving elapsed time");
      };
    }).catch((error) => {
      console.error("Error opening IndexedDB", error);
      reject(error);
    });
  });
}

// Timer state variables
let isRunning = false;
let isPaused = false;
let elapsedTime = 0;
let timerInterval: NodeJS.Timeout | null = null;
let saveInterval = 10; // Save to IndexedDB every 10 seconds
let saveCounter = 0;
let isCamInjection = false

// Start timer function

function startTimer(tabType?: string | undefined) {
  function broadCastUpdateTimer(){
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "updateTimer", time: elapsedTime });
      });
    });
  }
  if (!isRunning && !isPaused) {
    isRunning = true;

    timerInterval = setInterval(() => {
      elapsedTime++;
      saveCounter++;
      // Save to IndexedDB instead of chrome.storage.local
      // saveElapsedTime(elapsedTime);
      // Only save to IndexedDB every 'saveInterval' seconds
      if (saveCounter >= saveInterval) {
        saveElapsedTime(elapsedTime); // Save to IndexedDB less frequently
        saveCounter = 0; // Reset the save counter
      }

      if (isRecordingFromSystemTab) {
        if (tabType === 'browser') {
          broadCastUpdateTimer()
        } else {
          chrome.runtime.sendMessage({ type: "updateTimer", time: elapsedTime })
        }
      } else {
        broadCastUpdateTimer()
      }
    }, 1000);
  }
}

// Stop timer function
function stopTimer() {
  console.log("TIMER STOPPED!");
  isRecordingFromSystemTab = false
  clearInterval(timerInterval!); // Clear the interval
  isRunning = false; // Reset running flag
  isPaused = false; // Reset paused flag
  console.log("elapsedTime1212", elapsedTime)
  chrome.storage.local.set({"totalElapsedTime": elapsedTime})
  elapsedTime = 0; // Reset the elapsed time

  // Save reset time to IndexedDB
  saveElapsedTime(0);

  // Broadcast the reset time to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: "updateTimer", time: elapsedTime });
    });
  });
}

// Pause timer function
function pauseTimer() {
  if (isRunning) {
    console.log("TIMER PAUSED!");
    clearInterval(timerInterval!); // Stop the timer
    isRunning = false; // Set running flag to false
    isPaused = true; // Set paused flag to true
    saveElapsedTime(elapsedTime);
  }
}

function resumeTimer() {
  if (isPaused && !isRunning) {
    console.log("TIMER RESUMED!");
    isRunning = true; // Set running flag to true
    isPaused = false; // Reset paused flag

    // Start interval again, continuing from the current elapsedTime
    timerInterval = setInterval(() => {
      elapsedTime++;
      // Save to IndexedDB instead of chrome.storage.local
      saveElapsedTime(elapsedTime);

      // Broadcast the updated time to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: "updateTimer", time: elapsedTime });
        });
      });
    }, 1000);
  }
}

// Reset timer function
function resetTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null; // Reset the intervalId
  }
  elapsedTime = 0; // Reset the elapsed time to 0

  // Save reset time to IndexedDB
  saveElapsedTime(0);

  // Broadcast the reset time to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: "updateTimer", time: 0 });
    });
  });
}

function startBadgeCountdown() {
  let countdown = 5;
  chrome.storage.local.get(["screenShareSelection"], result => {
    const intervalId = setInterval(() => {
      if (countdown > 0) {
        chrome.action.setBadgeText({ text: countdown.toString() })
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        countdown--;
      } else {
        isRecordingFromSystemTab = true
        chrome.action.setBadgeText({ text: '' });
        clearInterval(intervalId);
        startTimer(result?.screenShareSelection)
        chrome.runtime.sendMessage({ type: "NEW_RECORDING_STARTED_OFFSCREEN" }, () => {
        });
      }
    }, 1000)
  })

}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'CHECK_FOR_SYSTEM_SCREEN') {
    chrome.storage.local.set({ "screenShareSelection": message.screenShareSelection })
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTab = tabs[0];
        const isNewTab = activeTab.url === "chrome://newtab/" || activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("chrome-extension://");

        if (isNewTab) {
          startBadgeCountdown()
          // sendResponse({isNew: true})
        } else {
          // sendResponse({isNew: false})
        }
      }
    });
  }

  if (message.type === 'RECORDING_IN_PROGRESS') {
    isRecordingInProgress = true
    // chrome.storage.local.set({ "isRecordingInProgress": true })
    try {
      chrome.storage.local.set({ isRecordingInProgress: true }, function () {
        if (chrome.runtime.lastError) {
          console.log("chrome.runtime.onInstalled Error");
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
            console.error("Other error: ", chrome.runtime.lastError.message);
          }
        } else {
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
  }

  if (message.type === 'RECORDING_IN_PROGRESS_END') {
    isRecordingInProgress = false
    // chrome.storage.local.set({ "isRecordingInProgress": false })
    try {
      chrome.storage.local.set({ isRecordingInProgress: false }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
            console.error("Other error: ", chrome.runtime.lastError.message);
          }
        } else {
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
  }

  if (message.type === "startTimer") {
    startTimer();
  }
  if (message.type === "stopTimer") {
    stopTimer()
  }

  if (message.type === "getCurrentTime") {
    sendResponse({ time: elapsedTime });
  }

  if (message.type === "pauseTimer") {
    pauseTimer()
  }

  if (message.type === "resumeTimer") {
    resumeTimer()
  }

  if (message.type === 'RESET_TIMER') {
    resetTimer()
    if (interValId !== null) {
      clearInterval(interValId);
      interValId = null; // Reset the intervalId
    }
    timer = 0;
  }

  if (message.type === "CHECK_VID_BLOB") {
    chrome.runtime.sendMessage({ type: "CHECK_VID_BLOB_OFFSCREEN" })
  }

  if (message.type === 'STOP_WEBCAM_STREAM') {
    chrome.runtime.sendMessage({ type: "STOP_CAM_RECORD_IN_IFRAME" })
  }

  if (message.type === "OFFSCREEN_RECORDING_END") {
    isRecordingFromSystemTab = false
  }

  if (message.type === 'INJECT_VIDEOCAM') {
    // await chrome.storage.local.set({"isCamInjected": true})
    try {
      chrome.storage.local.set({ isCamInjected: true }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
          }
        } else {
          isCamInjection = true
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs?.[0] && tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0]?.id, { type: "INJECT_CAM" }, function () { })
            }
          })
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
    // isCamInjection = true
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //   if (tabs?.[0] && tabs[0]?.id) {
    //     chrome.tabs.sendMessage(tabs[0]?.id, { type: "INJECT_CAM" }, function () { })
    //   }
    // })
  }

  if (message.type === 'CHECK_CURRENT_TIMER') {
    sendResponse({ timer, interValId })
  }

  if (message.type === 'OPEN_CAM_ONLY_RECORDING') {
    openNewWindow('tabs/camera.html', "startCamOnlyRecording", message.selections, false)
  }

  if (message.type === 'OPEN_MIC_ONLY_RECORDING') {
    openNewWindow("tabs/audioRecording.html", "startMicOnlyRecording", message.selections, false)
  }

  if (message.type === 'RECORDING_STARTED') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SHOW_TOOLBAR" })
      }
    })
    // chrome.runtime.sendMessage({type: "SHOW_TOOLBAR"})
  }

  if (message.type === 'END_CAM_ONLY_RECORDING') {
    chrome.runtime.sendMessage({ type: "END_CAM_ONLY_RECORDING_CAMERA" })
  }

  if (message.type === 'END_MIC_ONLY_RECORDING') {
    chrome.runtime.sendMessage({ type: "END_MIC_ONLY_RECORDING_AUDIO" })
  }

  if (message.type === 'GET_SYSTEM_SCREEN_RECORDING') {
    sendResponse(isRecordingFromSystemTab)
  }

  if (message.type === 'RENDER_NEW_RECORDING') {
    chrome.tabs.create({ url: chrome.runtime.getURL('tabs/NewPreview.html') }, async (tab) => {
      // chrome.tabs.sendMessage(tab.id, { type: "RECORDING_COMPLETED" }, function () { })
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => {
            chrome.runtime.sendMessage({ type: "OPEN_NEW_PREVIEW", blobUrl: message.blobUrl })
          }, 100)
        }
      });
    });
  }

  if (message.type === 'RECORDING_END') {
    if (message?.isToOpenPreview === 'setToFalse') {
      isToOpenPreview = false
    }
    stopTimer()
    chrome.runtime.sendMessage({ type: "RECORDING_END_OFFSCREEN" })
    // chrome.storage.local.set({ "isRecordingInProgress": false })
    try {
      chrome.storage.local.set({ isRecordingInProgress: false }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
          }
        } else {
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
  }

  if (message.type === 'RECORDING_PAUSE') {
    pauseTimer()
    chrome.runtime.sendMessage({ type: "RECORDING_PAUSE_OFFSCREEN" })
  }

  if (message.type === 'RECORDING_PLAY') {
    resumeTimer()
    chrome.runtime.sendMessage({ type: "RECORDING_PLAY_OFFSCREEN" })
  }

  if (message.type === 'RECORDING_DELETE') {
    chrome.runtime.sendMessage({ type: "RECORDING_DELETE_OFFSCREEN" })
  }

  if (message.type === 'NoPreviewShow') {
    isToOpenPreview = false
  }

  if (message.type === 'PreviewShow') {
    isToOpenPreview = true
  }

  if (message.type === 'RECORDING_RESTART') {
    if (message?.isToOpenPreview === 'setToFalse') {
      isToOpenPreview = false
    }
    startTimer()
    chrome.runtime.sendMessage({ type: "RECORDING_RESTART_OFFSCREEN" })
  }

  if (message.type === 'WINDOW_SELECTION_RESTART') {
    isToOpenPreview = false
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "WINDOW_SELECTION_RESTART_CONTENT" })
      }
    })
  }

  if (message.type === 'START_COUNTDOWN') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "START_COUNTDOWN_CONTENT" })
      }
    })
  }

  if (message.type === 'SCREEN_SHARE_WINDOW_SELECTED') {
    openNewWindow('tabs/windowSelection.html', "startWindowSelected", message.selections, true)
  }

  if (message.type === 'NEW_RECORDING_STARTED') {
    chrome.runtime.sendMessage({ type: "NEW_RECORDING_STARTED_OFFSCREEN" });
  }

  if (message.type === 'CLOSE_POPUP') {
    chrome.runtime.sendMessage({ type: "CLOSE_POPUP_CALL" });
  }

  if (message.type === 'START_TO_RECORD') {
    const offscreenExists = await chrome.offscreen.hasDocument();
    if (!offscreenExists) {
      await createOffscreenDocument()
    }
    // console.log("offscreenExists121212", offscreenExists)
    // chrome.storage.local.set({
    //   'selectedCameraRecording': message.data?.cameraRecording,
    //   'selectedMicRecording': message.data?.micRecording,
    //   'selectedScreenRecordings': message.data?.screenRecording,
    // })
    try {
      chrome.storage.local.set({
        'selectedCameraRecording': message.data?.cameraRecording,
        'selectedMicRecording': message.data?.micRecording,
        'selectedScreenRecordings': message.data?.screenRecording,
      }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
          }
        } else {
          chrome.runtime.sendMessage({ type: "START_RECORDING_OFFSCREEN", data: message.data });
          return;
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }

  }

  if (message.type === "SCREEN_SELECTION") {

  }
  if (message.type === 'NAVIGATE_TO_TAB') {
    const originalTabId = message.originalTabId;
    chrome.tabs.update(originalTabId, { active: true });
  }
  if (message.type === 'CLEAR_RECORDING_UI') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        // Send message to each tab
        chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_RECORDING_UI_CONTENT' }, (response) => {
          // if (chrome.runtime.lastError) {
          //   console.error("Error sending message:", chrome.runtime.lastError);
          // } else {
          //   console.log("Response from tab:", response);
          // }
        });
      });
    });
  }

  if (message.type === 'OPEN_PREVIEW_TAB') {
    stopTimer()
    navigatedTabs = []
    isCamInjection = false
    // await chrome.storage.local.set({ "blobUrl": message.videoUrl, "isAudioOnly": message?.isAudioOnly || false })

    try {
      chrome.storage.local.set({
        "blobUrl": message.videoUrl,
        "isAudioOnly": message?.isAudioOnly || false
      }, function () {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          } else {
          }
        } else {
          chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_CAMERA" })
          chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_MIC" })
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs?.[0] && tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0]?.id, { type: "RECORDING_COMPLETED" }, function () { })
            }
          })

          if (isToOpenPreview) {
            chrome.tabs.create({ url: chrome.runtime.getURL('tabs/preview.html') }, async (tab) => {
              chrome.tabs.sendMessage(tab.id, { type: "RECORDING_COMPLETED" }, function () { })
              chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                }
              });
            });
          } else {
            isToOpenPreview = true
          }
        }
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }

    // chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_CAMERA" })
    // chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_MIC" })
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //   console.log("COMPLETED RECORRDING NOO!!!", tabs)
    //   if (tabs?.[0] && tabs[0]?.id) {
    //     chrome.tabs.sendMessage(tabs[0]?.id, { type: "RECORDING_COMPLETED" }, function () { })
    //   }
    // })

    // if (isToOpenPreview) {
    //   chrome.tabs.create({ url: chrome.runtime.getURL('tabs/preview.html') }, async (tab) => {
    //     console.log("tab1212", tab)
    //     chrome.tabs.sendMessage(tab.id, { type: "RECORDING_COMPLETED" }, function () { })
    //     chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    //       if (tabId === tab.id && info.status === 'complete') {
    //         chrome.tabs.onUpdated.removeListener(listener);
    //       }
    //     });
    //   });
    // } else {
    //   isToOpenPreview = true
    // }
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (isCamInjection) {
    const selectedTabId = (await chrome.storage.local.get('selectedTabId')).selectedTabId;
    // Check if the activated tab is the one selected for screen sharing
    if (!navigatedTabs.includes(activeInfo.tabId)) {
      navigatedTabs.push(activeInfo.tabId)
      // Inject the iframe when the user navigates to the selected tab
      chrome.tabs.sendMessage(activeInfo.tabId, { type: "INJECT_CAM" });
    }
  }
});

// chrome.runtime.onConnect.addListener(function (externalPort) {
// chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//   chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.POPUP_OPENED }, function () { })
// })
// externalPort.onDisconnect.addListener(function () {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, { type: callBackConstants.POPUP_CLOSED }, function(){})
//   })
//   // Do stuff that should happen when popup window closes here
// })
// })
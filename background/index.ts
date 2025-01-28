
import { sendToContentScript } from '@plasmohq/messaging'

const OFFSCREEN_URL = chrome.runtime.getURL('tabs/offscreen.html');
let creating;

async function setupOffscreenDocument() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = OFFSCREEN_URL;
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'] as any,
    documentUrls: [offscreenUrl]
  });
  console.log(existingContexts.length > 0,"existingContexts==>", existingContexts )
  if (existingContexts.length > 0) {
    console.log("I am here!!!")
    return;
  }
  console.log("Create!!", creating)
  // create offscreen document
  if (creating) {
    console.log("GHere!!")
    await creating;
  } else {
    console.log("Creating Here!!!!!")
    creating = chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["USER_MEDIA"] as any,
      justification: "screen recording using getUserMedia apis",
    });
    await creating;
    creating = null;
  }
}

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
    // await createOffscreenDocument()
    await setupOffscreenDocument()
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
      chrome.windows.onRemoved.addListener(async (closedWindowId) => {
        if (closedWindowId === cameraWindowId) {
          await setupOffscreenDocument()
          if (url === "tabs/camera.html") {
            chrome.runtime.sendMessage({ type: "END_CAM_ONLY_RECORDING" })
          }
          if (url === "tabs/audioRecording.html") {
            chrome.runtime.sendMessage({ type: "END_MIC_ONLY_RECORDING" })
          }
          stopTimer()
          // chrome.storage.local.set({ "isRecordingInProgress": false })
          try {
            chrome.storage.local.set({ isRecordingInProgress: false }, function () {
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
  console.log("saveElapsedTime", elapsedTime)
  openIndexedDB().then((db) => {
    console.log("OPMNED!!! DB")
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
let isCamInjection = false;
let previewTabId = null;
let previewTabsIds = []
// Start timer function

function startTimer(tabType?: string | undefined) {
  function broadCastUpdateTimer() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "updateTimer", time: elapsedTime });
      });
    });
  }
  console.log(elapsedTime, saveCounter, "Broadcast!!", isRunning, isPaused)
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
          broadCastUpdateTimer()
          chrome.runtime.sendMessage({ type: "updateTimer", time: elapsedTime })
        }
      } else {
        broadCastUpdateTimer()
      }
    }, 1000);
  }
}

let tillDuration;

// Stop timer function
function stopTimer() {
  console.log("TIMER STOPPED!");
  isRecordingFromSystemTab = false
  clearInterval(timerInterval!); // Clear the interval
  isRunning = false; // Reset running flag
  isPaused = false; // Reset paused flag
  console.log("elapsedTime1212", elapsedTime)
  tillDuration = elapsedTime
  chrome.storage.local.set({ "totalElapsedTime": elapsedTime })
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
    const intervalId = setInterval(async () => {
      if (countdown > 0) {
        chrome.action.setBadgeText({ text: countdown.toString() })
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        countdown--;
      } else {
        isRecordingFromSystemTab = true
        chrome.action.setBadgeText({ text: '' });
        clearInterval(intervalId);
        console.log("resultresult", result)
        // startTimer(result?.screenShareSelection)
        console.log("STARTED RECORDING!!!!")
        await setupOffscreenDocument()
        await chrome.storage.local.set({ "showToolBar": true })
        chrome.runtime.sendMessage({ type: "NEW_RECORDING_STARTED_OFFSCREEN" }, () => {
          startTimer();
        });
      }
    }, 1000)
  })

}

const authenticateEmail = async (email) => {
  try {
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/check-email`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email })
    })
    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(error)
  }
}

const fetchUser = async user => {
  try {
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/user`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.access_token}`
      }
    })
    const data = await response.json()
    console.log("data user", data)
    return data
  } catch (error) {
    throw new Error(error.message || "User is invalid")
  }
}

const handleLogin = async (state) => {
  chrome.runtime.sendMessage({ type: 'login_loading', state: true })
  try {
    if(state.rememberMe){
      await chrome.storage.local.set({ "emailRememberMe": state.userName })
    } else {
      await chrome.storage.local.set({ "emailRememberMe": null })
    }
    const data = await authenticateEmail(state.userName)
    if (data.result === 'success') {
      try {
        const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/login`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: state.userName, password: state.password })
        })
        const data = await response.json()
        if (data.user_id) {
          const userData = await fetchUser(data)
          const userDetails = {
            access_token: data.access_token,
            current_plan: data.current_plan,
            user_id: data.user_id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            plan_name: userData.plan_name,
            name: userData.name,
            email: userData.email,
            billing_status: userData.billing_status,
            avtar: userData.photo_url
          }
          await chrome.storage.local.set({ "userInfo": userDetails })
          chrome.runtime.sendMessage({type: "LOGIN_SUCCESS", userDetails})
          chrome.runtime.sendMessage({ type: 'login_loading', state: false })
        } else {
          chrome.runtime.sendMessage({ type: 'login_loading', state: false })
          chrome.runtime.sendMessage({ type: 'login_error', error: data?.message || "Invalid username Or password" })
        }
      } catch (error) {
        chrome.runtime.sendMessage({ type: 'login_loading', state: false })
        throw new Error(error)
      }
    } else {
      chrome.runtime.sendMessage({ type: 'login_loading', state: false })
      throw new Error(data?.message || "Invalid username Or password")
    }
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'login_loading', state: false })
    chrome.runtime.sendMessage({ type: 'login_error', error: error?.message || "Invalid username Or password" })
    console.log("Error", error)
  }
}

const getMediaFile = async (projectList, selectedProjected, hasLoading, userDetails) => {
  if (hasLoading) {
    await chrome.storage.local.set({ "selectedProject": { label: selectedProjected?.label, id: selectedProjected?.id, project_id: selectedProjected?.project_id } })
  }
  const findIfExistsOrNot = projectList.find(project => project.id === selectedProjected?.id)
  let tobeQueryProject;
  if (findIfExistsOrNot) {
    tobeQueryProject = findIfExistsOrNot
  } else {
    tobeQueryProject = projectList?.[0]
    await chrome.storage.local.set({ "selectedProject": { label: projectList?.[0]?.label, id: projectList?.[0]?.id, project_id: projectList?.[0]?.project_id } })
    // setSelectedProject({ label: projectList?.[0]?.label, id: projectList?.[0]?.id, project_id: projectList?.[0]?.project_id })
  }
  if (hasLoading) {
    console.log("STARTED LOADING")
    chrome.runtime.sendMessage({ type: "media_loading", state: true })
    // setMediaListLoading(true)
  }
  try {
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/projects/videos?begin=0&limit=20&page=1&project_id=${tobeQueryProject.id}&view=20&sort_by=date`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userDetails.access_token}`
      },
    })
    const mediaFiles = await response.json();
    const procesedMediaFiles = mediaFiles.map(file => ({
      id: file.id,
      thumbnail: file.thumbnail,
      title: file.title,
      embed_url: file.embed_url
    }))
    await chrome.storage.local.set({ "mediaFiles": procesedMediaFiles })
    if (hasLoading) {
      // setMediaListLoading(false)
      chrome.runtime.sendMessage({ type: "media_loading", state: false })
    }
  } catch (error) {
    if (hasLoading) {
      // setMediaListLoading(false)
      chrome.runtime.sendMessage({ type: "media_loading", state: false })
    }
    console.log("Error", error)
  }
}

const getProjectList = async (userDetails) => {
  // setProjectListLoading(true)
  // setMediaListLoading(true)
  try {
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/projects`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userDetails.access_token}`
      },
    })
    const projectlist = await response.json();
    const listItems = projectlist.map(item => ({ ...item, label: item?.title }))
    // setProjectList([...listItems])
    chrome.runtime.sendMessage({ type: 'SET_PROJECT_LIST', list: listItems })
    // setProjectListLoading(false)
    chrome.storage.local.get(['selectedProject'], async result => {
      const selectedProjected = result?.selectedProject
      await getMediaFile([...listItems], selectedProjected, false, userDetails)
    })
  } catch (error) {
    // setProjectListLoading(false)
    console.log("Error", error)
  }
}

const deleteMedia = async (item, userDetails) => {
  try {
    const breakedEmbedUrl = item.embed_url.split('/')
    const url = breakedEmbedUrl[breakedEmbedUrl.length - 1];
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/editor/delete-video`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userDetails.access_token}`
      },
      body: JSON.stringify({
        "video_id": url,
        "bulkVideoIds": []
      }),
    })
    const deleteResponse = await response.json();
    if(deleteResponse.success){
      chrome.storage.local.get(['selectedProject'], async result => {
        const selectedProjected = result?.selectedProject;
        refreshMediaList(userDetails,selectedProjected)
      })
    } else {
      throw new Error("Failed to delete!")
    }
  } catch(error){
    console.log("error", error)
  }
}

const refreshMediaList = async(userDetails, project) => {
  chrome.runtime.sendMessage({ type: "media_loading", state: true })
  try {
    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/projects/videos?begin=0&limit=20&page=1&project_id=${project.id}&view=20&sort_by=date`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userDetails.access_token}`
      },
    })
    const mediaFiles = await response.json();
    const procesedMediaFiles = mediaFiles.map(file => ({
      id: file.id,
      thumbnail: file.thumbnail,
      title: file.title,
      embed_url: file.embed_url
    }))
    chrome.runtime.sendMessage({ type: "media_loading", state: false })
    await chrome.storage.local.set({ "mediaFiles": procesedMediaFiles })
  } catch(error){
    chrome.runtime.sendMessage({ type: "media_loading", state: false })
  }
}

const handleLogout = async (userDetails) => {
  const storageData = await chrome.storage.local.get("emailRememberMe");
  const emailRememberMe = storageData.emailRememberMe;
  await chrome.storage.local.clear()
  await chrome.storage.sync.clear()
  if (emailRememberMe !== undefined) {
      await chrome.storage.local.set({ emailRememberMe });
  }
  chrome.runtime.sendMessage({ type: "LOGOUT_SUCCESS" })
  try {
      await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/logout`, {
          method: 'GET',
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${userDetails.access_token}`
          },
      })
  } catch(error){
      console.log("Error", error)
  }
}

const chunksStorage = {}; 
let chunks = [];
let receivedChunks = []
// Function to send the full blob to the preview tab in chunks

async function sendBlobToPreviewTab(blob) {
  const chunkSize = 5 * 1024 * 1024; // 10MB per chunk
  let offset = 0;
  let chunkIndex = 0;

  while (offset < blob.size) {
    const chunk = blob.slice(offset, offset + chunkSize);
    offset += chunkSize;

    // Convert chunk to ArrayBuffer and send to the preview tab
    const arrayBuffer = await chunk.arrayBuffer();
    chrome.tabs.sendMessage(previewTabId, {
      type: "RECORDING_CHUNK_PREVIEW",
      data: Array.from(new Uint8Array(arrayBuffer)), // Convert to array for serialization
      index: chunkIndex,
      isLastChunk: offset >= blob.size,
    });

    chunkIndex++;

    // Optional: Introduce a small delay to avoid overwhelming the preview tab
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "chunk") {
    // Convert the array back to Uint8Array
    console.log("Chunk", message)
    const uint8Array = new Uint8Array(message.data);
    receivedChunks.push(uint8Array);
  }
  if (message.type === "complete") {
    // Combine all chunks into a single Blob when done
    const completeBlob = new Blob(receivedChunks, { type: "video/webm" });
    receivedChunks = []; // Clear chunks to free memory

    // Do something with the complete Blob (e.g., send to preview tab)
    console.log("Complete Blob received", completeBlob);
    sendBlobToPreviewTab(completeBlob)
  }
  if (message.type === 'RECORDING_CHUNK') {
    setTimeout(() => {
      chrome.tabs.sendMessage(previewTabId, {
        type: "RECORDING_CHUNK_PREVIEW",
        data: message.data,
        index: message.index,
        isLastChunk: message.isLastChunk,
      }, function () { })
    }, 2000)
  }
  if (message.type === 'START_LOGIN') {
    handleLogin(message.state)
  }
  if(message.type === 'INITIATE_LOGOUT'){
    handleLogout(message.userDetails)
  }
  if (message.type === 'GET_PROJECT_LIST') {
    getProjectList(message.userDetails)
  }
  if (message.type === 'GET_MEDIA_FILES') {
    getMediaFile(message.projectList, message.project, true, message.userDetails)
  }
  if (message.type === 'PAUSE_UPLOAD_BG') {
    chrome.tabs.sendMessage(+message.data, { type: "PAUSE_UPLOAD" })
  }
  if (message.type === 'RESUME_UPLOAD_BG') {
    chrome.tabs.sendMessage(+message.data, { type: "RESUME_UPLOAD" })
  }
  if(message.type === 'DELETE_UPLOAD_BG'){
    chrome.tabs.sendMessage(+message.data, { type: "DELETE_UPLOAD" })
  }

  if(message.type === 'DELETE_MEDIA'){
    deleteMedia(message.item, message.userDetails)
  }

  if(message.type === 'RECORDING_CHUNK_TO_BG') {
    console.log("Message==>", message)
  }

  if(message.type === 'TAKE_USER_INPUT'){
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTab = tabs[0];
        console.log("activeTab", activeTab)
        chrome.tabs.sendMessage(tabs[0]?.id, {type: 'SHOW_TAKE_USER_INPUT'} )
      }
    })
  }
  

  if(message.type === 'RECORDING_CHUNK_UPLOAD_COMPLETE_TO_BG') {
    console.log("CompletedTransfer==>", message)
  }
  
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
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }
  }

  if(message.type === 'PREVIEW_TAB_INFO'){
    setTimeout(() => {
      chrome.tabs.sendMessage(previewTabId, {
        type: "PREVIEW_TAB_INFO_PREVIEW",
        tabId: previewTabId,
        tabIds: previewTabsIds
      }, function () { })
    }, 1000)
  }

  if (message.type === 'RECORDING_CHUNK_UPLOAD_COMPLETE') {
    console.log("RECORDING_CHUNK_UPLOAD_COMPLETE", message)
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

  if (message.type === 'STOP_WEBCAM_STREAM') {
    chrome.runtime.sendMessage({ type: "STOP_CAM_RECORD_IN_IFRAME" })
  }

  if (message.type === "OFFSCREEN_RECORDING_END") {
    isRecordingFromSystemTab = false
  }

  if (message.type === 'SET_SAVING_IN_INDEXDB') {
    chrome.storage.local.set({ "saving_in_indexdb": message.data })
  }

  if (message.type === 'INJECT_VIDEOCAM') {
    try {
      chrome.storage.local.set({ isCamInjected: true }, function () {
          isCamInjection = true
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs?.[0] && tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0]?.id, { type: "INJECT_CAM" }, function () { })
            }
          })
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

  // if (message.type === 'END_CAM_ONLY_RECORDING') {
  // chrome.runtime.sendMessage({ type: "END_CAM_ONLY_RECORDING_CAMERA" })
  // }

  // if (message.type === 'END_MIC_ONLY_RECORDING') {
  // chrome.runtime.sendMessage({ type: "END_MIC_ONLY_RECORDING_CAMERA" })
  // }

  if (message.type === 'END_MIC_ONLY_RECORDING') {
    await setupOffscreenDocument()
    chrome.runtime.sendMessage({ type: "END_MIC_ONLY_RECORDING_AUDIO" })
  }

  if(message.type === 'START_CAM_ONLY_RECORDING_BG'){
    await setupOffscreenDocument()
    chrome.runtime.sendMessage({ type: "START_CAM_ONLY_RECORDING" , data: message.data})
  }

  if(message.type === 'START_MIC_ONLY_RECORDING_BG'){
    await setupOffscreenDocument()
    chrome.runtime.sendMessage({ type: "START_MIC_ONLY_RECORDING" , data: message.data})
  }

  if (message.type === 'GET_SYSTEM_SCREEN_RECORDING') {
    sendResponse(isRecordingFromSystemTab)
  }

  if (message.type === 'RECORDING_END') {
    if (message?.isToOpenPreview === 'setToFalse') {
      isToOpenPreview = false
    }
    stopTimer()
    await setupOffscreenDocument()
    chrome.runtime.sendMessage({ type: "RECORDING_END_OFFSCREEN" })
    // chrome.storage.local.set({ "isRecordingInProgress": false })
    try {
      chrome.storage.local.set({ isRecordingInProgress: false }, function () {
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

  if (message.type === 'NoPreviewShow') {
    isToOpenPreview = false
  }

  if (message.type === 'PreviewShow') {
    isToOpenPreview = true
  }

  if (message.type === 'RECORDING_RESTART') {
    await setupOffscreenDocument()
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
    console.log("Now I am in start count down!")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Check for tab query !!!", tabs)
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "START_COUNTDOWN_CONTENT" })
      }
    })
  }

  if (message.type === 'OPEN_CAM_ONLY') {
    await setupOffscreenDocument();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "START_RECORDING_OFFSCREEN", data: message.data, isCamOnly: message?.isCamOnly, isAudioOnly: message?.isAudioOnly });
    }, 250)
  }

  if (message.type === 'OPEN_MIC_ONLY') {
    await setupOffscreenDocument();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "START_RECORDING_OFFSCREEN", data: message.data, isCamOnly: message?.isCamOnly, isAudioOnly: message?.isAudioOnly });
    }, 250)
  }

  if (message.type === 'SCREEN_SHARE_WINDOW_SELECTED') {
    openNewWindow('tabs/windowSelection.html', "startWindowSelected", message.selections, true)
  }

  if (message.type === 'NEW_RECORDING_STARTED') {
    await setupOffscreenDocument()
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "NEW_RECORDING_STARTED_OFFSCREEN" });
    }, 250)
  }

  if (message.type === 'CLOSE_POPUP') {
    chrome.runtime.sendMessage({ type: "CLOSE_POPUP_CALL" });
  }

  if (message.type === 'START_TO_RECORD') {
    console.log("START_TO_RECORD Check Called!!!", message)
    const offscreenExists = await chrome.offscreen.hasDocument();
    await setupOffscreenDocument();
    // if (!offscreenExists) {
    //   await createOffscreenDocument()
    // }
    console.log(message.data,"offscreenExists121212", offscreenExists)
    try {
      chrome.storage.local.set({
        'selectedCameraRecording': message.data?.cameraRecording,
        'selectedMicRecording': message.data?.micRecording,
        'selectedScreenRecordings': message.data?.screenRecording,
      }, function () {
          console.log("isCamOnlyisCamOnly", message)
          chrome.storage.local.get(["firstTimeLaunch"], async result => {
            await setupOffscreenDocument();
            const firstTimeLaunch = result?.firstTimeLaunch
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: "START_RECORDING_OFFSCREEN", data: message.data, isCamOnly: message?.isCamOnly, isAudioOnly: message?.isAudioOnly, firstTimeLaunch });
            }, 250)
            return;
          })
      });
    } catch (error) {
      console.error("Caught exception: ", error);
    }

  }

  if (message.type === "FIRST_RECORDING_CANCELED") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "FIRST_RECORDING_CANCELED_BG" })
      }
    })
  }
  if(message.type === 'FIRST_TIME_RECORDING') {
    chrome.storage.local.get(['selectedCameraRecording'], async result => {
      await setupOffscreenDocument()
      const selectedCameraRecording = result?.selectedCameraRecording;
      chrome.runtime.sendMessage({type: 'FIRST_TIME_RECORDING_OFFSCREEN' , camera: selectedCameraRecording})
      setTimeout(async() => {
        await chrome.storage.local.set({ "firstTimeLaunch": false })
      }, 1000)
    })
  }
  if(message.type === 'START_UPLOAD_CHUNKS_BG') {
    await setupOffscreenDocument();
    chrome.runtime.sendMessage({type: "START_UPLOAD_CHUNKS"})
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
        });
      });
    });
  }

  if (message.type === 'FROM_SADBOX') {
    console.log("FROM_SADBOX Background!!")
  }

  if (message.type === 'OPEN_PREVIEW_TAB') {
    stopTimer()
    navigatedTabs = []
    isCamInjection = false
    try {
      chrome.storage.local.set({
        "blobUrl": message.videoUrl,
        "isAudioOnly": message?.isAudioOnly || false
      }, function () {
          chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_CAMERA" })
          chrome.runtime.sendMessage({ type: "CLOSE_WINDOW_MIC" })
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
            if (tabs?.[0] && tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0]?.id, { type: "RECORDING_COMPLETED" }, function () { })
            }
          })
          if (isToOpenPreview) {
            chrome.tabs.create({ url: chrome.runtime.getURL(message?.isAudioOnly ? 'sandboxes/audioDemo.html' : `sandboxes/demo.html?hasAudio=${message?.hasAudio}&duration=${tillDuration}`) }, async (tab) => {
              previewTabId = tab.id
              previewTabsIds.push(tab.id)
              chrome.tabs.sendMessage(tab.id, { type: "RECORDING_COMPLETED" }, function () { })
              chrome.tabs.onUpdated.addListener(async function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  await setupOffscreenDocument()
                  chrome.runtime.sendMessage({ type: "PREVIEW_OPENED_SUCCESSFULY" , tabId: previewTabId, tabList: previewTabsIds})
                }
              });
              // Listener for when the tab is closed
              chrome.tabs.onRemoved.addListener(function (closedTabId, removeInfo) {
                if (closedTabId === tab.id) {
                  console.log(`Tab with ID ${closedTabId} has been closed.`);
                  previewTabsIds = previewTabsIds.filter(id => id !== closedTabId)
                  chrome.storage.local.get(['uploadsData'], async result => {
                    if(result.uploadsData) {
                        const newUp = {...result.uploadsData}
                        delete newUp[closedTabId]
                        await chrome.storage.local.set({"uploadsData": newUp})                                    
                    }
                  })
                  chrome.runtime.sendMessage({ type: "PREVIEW_TAB_CLOSED", tabId: closedTabId, tabList: previewTabsIds });
                  // Optional: Perform cleanup or other actions here
                }
              });
            });
          } else {
            isToOpenPreview = true
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

chrome.commands.onCommand.addListener(async (command) => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    switch (command) {
      case "start-stop-recording":
        // Send message to content script to toggle recording
        await sendToContentScript({
          type: "start-or-stop-recording",
          tabId: tab.id
        } as any)
        break

      case "toggle-pause":
        // Send message to content script to toggle pause
        // await sendToContentScript({
        //   name: "toggle-pause",
        //   tabId: tab.id
        // })
        break
    }
  } catch (error) {
    console.error("Error handling keyboard shortcut:", error)
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
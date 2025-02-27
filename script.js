// Global settings object and state variables
var userSettings = {
  pitch: 1,
  rate: 1,
  selectedVoice: "No Voice",
  webSearchEnabled: false,
  interruptEnabled: true,
  model: ""
};

var recognition;
var isListening = false;
var currentUtterance = null;
var isTTSActive = false;
var lastErrorWasNoSpeech = false;

// DOM element references
var startBtn = document.getElementById("startBtn");
var stopBtn = document.getElementById("stopBtn");
var stopTTSBtn = document.getElementById("stopTTSBtn");
var clearBtn = document.getElementById("clearBtn");
var resetStorageBtn = document.getElementById("resetStorageBtn");
var statusDiv = document.getElementById("status");
var errorMsgDiv = document.getElementById("errorMsg");
var chatHistory = document.getElementById("chatHistory");
var voiceSelect = document.getElementById("voiceSelect");
var modelSelect = document.getElementById("modelSelect");
var pitchRange = document.getElementById("pitchRange");
var rateRange = document.getElementById("rateRange");
var pitchValue = document.getElementById("pitchValue");
var rateValue = document.getElementById("rateValue");
var webSearchToggle = document.getElementById("webSearchToggle");
var interruptToggle = document.getElementById("interruptToggle");
var textInput = document.getElementById("textInput");
var sendBtn = document.getElementById("sendBtn");

// Save settings to localStorage
function saveSettings() {
  userSettings.pitch = pitchRange.value;
  userSettings.rate = rateRange.value;
  userSettings.selectedVoice = voiceSelect.value;
  userSettings.webSearchEnabled = webSearchToggle.checked;
  userSettings.interruptEnabled = interruptToggle.checked;
  userSettings.model = modelSelect.value;
  localStorage.setItem("userSettings", JSON.stringify(userSettings));
  console.log("Settings saved:", userSettings);
}

// Load settings from localStorage
function loadSettings() {
  var saved = localStorage.getItem("userSettings");
  if (saved) {
    userSettings = JSON.parse(saved);
    pitchRange.value = userSettings.pitch;
    pitchValue.innerText = userSettings.pitch;
    rateRange.value = userSettings.rate;
    rateValue.innerText = userSettings.rate;
    webSearchToggle.checked = userSettings.webSearchEnabled;
    interruptToggle.checked = userSettings.interruptEnabled;
  }
  console.log("Settings loaded:", userSettings);
}

// Reset settings and update UI
function resetSettings() {
  localStorage.removeItem("userSettings");
  pitchRange.value = 1;
  pitchValue.innerText = 1;
  rateRange.value = 1;
  rateValue.innerText = 1;
  webSearchToggle.checked = false;
  interruptToggle.checked = true;
  voiceSelect.value = "No Voice";
  if (modelSelect.options.length > 0) {
    modelSelect.selectedIndex = 0;
  }
  saveSettings();
  statusDiv.innerText = "Settings have been reset.";
}

// Event listeners for settings updates
pitchRange.addEventListener("input", function() {
  pitchValue.innerText = pitchRange.value;
  saveSettings();
});
rateRange.addEventListener("input", function() {
  rateValue.innerText = rateRange.value;
  saveSettings();
});
voiceSelect.addEventListener("change", saveSettings);
webSearchToggle.addEventListener("change", saveSettings);
interruptToggle.addEventListener("change", saveSettings);
modelSelect.addEventListener("change", saveSettings);
resetStorageBtn.addEventListener("click", resetSettings);

// Append a message to the chat history
function appendMessage(text, sender) {
  var div = document.createElement("div");
  div.className = "message " + sender;
  div.innerText = text;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Load available models and populate the model dropdown
function loadModels() {
  fetch("https://text.pollinations.ai/models")
    .then(function(response) { return response.json(); })
    .then(function(models) {
      modelSelect.innerHTML = "";
      models.forEach(function(model) {
        var option = document.createElement("option");
        var text = model.description;
        if (model.censored === false) { text += " (uncensored)"; }
        option.value = model.name;
        option.innerText = text;
        modelSelect.appendChild(option);
      });
      if (userSettings.model) {
        modelSelect.value = userSettings.model;
      }
      console.log("Models loaded:", models);
    })
    .catch(function(error) {
      console.error("Error loading models:", error);
      statusDiv.innerText = "Failed to load models.";
    });
}

// Populate voice list and restore selection
function populateVoiceList() {
  var voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  var noVoiceOption = document.createElement("option");
  noVoiceOption.value = "No Voice";
  noVoiceOption.innerText = "No Voice";
  voiceSelect.appendChild(noVoiceOption);
  voices.forEach(function(voice) {
    var option = document.createElement("option");
    option.value = voice.name;
    option.innerText = voice.name + " (" + voice.lang + ")";
    voiceSelect.appendChild(option);
  });
  if (userSettings.selectedVoice) {
    voiceSelect.value = userSettings.selectedVoice;
  } else if (voices.length > 0) {
    var defaultVoice = voices.find(function(v) {
      return v.name.indexOf("Microsoft Zira") !== -1;
    }) || voices[0];
    if (defaultVoice) { voiceSelect.value = defaultVoice.name; }
  }
  console.log("Available voices:", voices.map(function(v) { return v.name; }));
}

// Speak the given text using the current settings
function speak(text) {
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = parseFloat(pitchRange.value);
  utterance.rate = parseFloat(rateRange.value);
  var voices = speechSynthesis.getVoices();
  if (voiceSelect.value !== "No Voice") {
    var voice = voices.find(function(v) { return v.name === voiceSelect.value; });
    if (voice) { utterance.voice = voice; }
  }
  isTTSActive = true;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  utterance.onend = function() {
    isTTSActive = false;
    currentUtterance = null;
    stopTTSBtn.disabled = true;
    statusDiv.innerText = "Speech synthesis ended.";
  };
  stopTTSBtn.disabled = false;
  statusDiv.innerText = "Speaking...";
}

// Set up speech recognition if supported
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.onstart = function() {
    statusDiv.innerText = "Speech Recognition Started.";
  };
  recognition.onerror = function(event) {
    if (event.error !== "no-speech") {
      errorMsgDiv.innerText = "Speech Recognition Error: " + event.error;
      if (currentUtterance) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
        isTTSActive = false;
        stopTTSBtn.disabled = true;
      }
    }
  };
  recognition.onend = function() {
    statusDiv.innerText = "Speech Recognition Ended.";
    if (isListening) { recognition.start(); }
    else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  };
  recognition.onresult = function(event) {
    for (var i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        var sentence = event.results[i][0].transcript.trim();
        if (sentence) {
          appendMessage("You: " + sentence, "user");
          statusDiv.innerText = "Processing your input...";
          getAIResponse(sentence)
            .then(function(aiResponse) {
              appendMessage("AI: " + aiResponse, "ai");
              speak(aiResponse);
            })
            .catch(function(error) {
              errorMsgDiv.innerText = "Error fetching AI response.";
            });
        }
      }
    }
  };
  startBtn.addEventListener("click", function() {
    isListening = true;
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });
  stopBtn.addEventListener("click", function() {
    isListening = false;
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.innerText = "Speech Recognition stopped.";
  });
  stopTTSBtn.addEventListener("click", function() {
    if (currentUtterance) {
      currentUtterance.onend = null;
      window.speechSynthesis.cancel();
      currentUtterance = null;
      isTTSActive = false;
      stopTTSBtn.disabled = true;
      statusDiv.innerText = "TTS stopped.";
    }
  });
} else {
  alert("Your browser does not support webkitSpeechRecognition.");
}

// Retrieve AI response from the service
function getAIResponse(prompt) {
  var model = modelSelect.value;
  var webSearchEnabled = webSearchToggle.checked;
  var finalPrompt = prompt;
  if (webSearchEnabled) {
    return fetch("https://api.duckduckgo.com/?q=" + encodeURIComponent(prompt) + "&format=json&no_html=1&skip_disambig=1")
      .then(function(response) { return response.json(); })
      .then(function(searchData) {
        var searchResults = searchData.AbstractText;
        if (!searchResults || searchResults.trim() === "") {
          if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
            searchResults = searchData.RelatedTopics.slice(0, 3)
              .map(function(rt) { return rt.Text; })
              .join("\n");
          }
        }
        if (!searchResults || searchResults.trim() === "") {
          searchResults = "No additional information found.";
        }
        finalPrompt = prompt + "\n\nUse the following web search summary to answer the question:\n" + searchResults;
        statusDiv.innerText = "Web search completed and combined with your prompt.";
        return fetch("https://text.pollinations.ai/" + model + "/" + encodeURIComponent(finalPrompt));
      })
      .then(function(response) { return response.text(); });
  } else {
    return fetch("https://text.pollinations.ai/" + model + "/" + encodeURIComponent(finalPrompt))
      .then(function(response) { return response.text(); });
  }
}

// Set up text input send functionality
sendBtn.addEventListener("click", function() {
  var text = textInput.value.trim();
  if (text) {
    appendMessage("You: " + text, "user");
    statusDiv.innerText = "Processing your input...";
    getAIResponse(text)
      .then(function(aiResponse) {
        appendMessage("AI: " + aiResponse, "ai");
        speak(aiResponse);
      })
      .catch(function(error) {
        errorMsgDiv.innerText = "Error fetching AI response.";
      });
    textInput.value = "";
  }
});
textInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") { sendBtn.click(); }
});

// Initialize settings, voice list, and models on window load
window.onload = function() {
  loadSettings();
  populateVoiceList();
  loadModels();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
  startBtn.disabled = false;
  statusDiv.innerText = "Ready for conversation.";
};

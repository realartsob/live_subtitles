// Define a settings object to hold all user settings.
let userSettings = {
  pitch: 1,
  rate: 1,
  selectedVoice: null,
  webSearchEnabled: false,
  interruptEnabled: true,
  model: null
};

// Save the settings object to localStorage
function saveSettings() {
  // Update the settings object with current values.
  userSettings.pitch = pitchRange.value;
  userSettings.rate = rateRange.value;
  userSettings.selectedVoice = voiceSelect.value;
  userSettings.webSearchEnabled = document.getElementById('webSearchToggle').checked;
  userSettings.interruptEnabled = document.getElementById('interruptToggle').checked;
  userSettings.model = modelSelect.value;
  
  localStorage.setItem('userSettings', JSON.stringify(userSettings));
  console.log("Settings saved:", userSettings);
}

// Load settings from localStorage and apply them
function loadSettings() {
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    userSettings = JSON.parse(savedSettings);
    console.log("Settings loaded:", userSettings);
    
    // Apply loaded settings to UI elements
    pitchRange.value = userSettings.pitch;
    pitchValue.innerText = userSettings.pitch;
    rateRange.value = userSettings.rate;
    rateValue.innerText = userSettings.rate;
    document.getElementById('webSearchToggle').checked = userSettings.webSearchEnabled;
    document.getElementById('interruptToggle').checked = userSettings.interruptEnabled;
    // Note: voiceSelect and modelSelect are set later after options are loaded.
  }
}

// Update pitch and rate display and save to localStorage
pitchRange.addEventListener('input', () => {
  pitchValue.innerText = pitchRange.value;
  saveSettings();
});
rateRange.addEventListener('input', () => {
  rateValue.innerText = rateRange.value;
  saveSettings();
});
voiceSelect.addEventListener('change', saveSettings);
document.getElementById('webSearchToggle').addEventListener('change', saveSettings);
document.getElementById('interruptToggle').addEventListener('change', saveSettings);
modelSelect.addEventListener('change', saveSettings);

// Reset localStorage and reload settings
resetStorageBtn.addEventListener('click', () => {
  localStorage.removeItem('userSettings');
  // Reset UI elements to defaults
  pitchRange.value = 1;
  pitchValue.innerText = 1;
  rateRange.value = 1;
  rateValue.innerText = 1;
  document.getElementById('webSearchToggle').checked = false;
  document.getElementById('interruptToggle').checked = true;
  // For voice and model selections, you might want to reset them as well:
  voiceSelect.value = 'No Voice';
  modelSelect.selectedIndex = 0;
  saveSettings();
  statusDiv.innerText = 'Settings have been reset.';
});

// Append a message to the chat history
function appendMessage(text, sender) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message');
  messageElem.classList.add(sender); // "user" or "ai"
  messageElem.innerText = text;
  chatHistory.appendChild(messageElem);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Function to dynamically load models from Pollinations and populate the modelSelect dropdown.
async function loadModels() {
  try {
    const response = await fetch("https://text.pollinations.ai/models");
    const models = await response.json();
    let optionsHtml = "";
    models.forEach(model => {
      // Use the description as the display text.
      let optionText = model.description;
      // Append "(uncensored)" if the model is uncensored.
      if (model.censored === false) {
        optionText += " (uncensored)";
      }
      optionsHtml += `<option value="${model.name}">${optionText}</option>`;
    });
    modelSelect.innerHTML = optionsHtml;
    // If a saved model exists, apply it
    if (userSettings.model) {
      modelSelect.value = userSettings.model;
    }
    console.log("Models loaded:", models);
  } catch (error) {
    console.error("Error loading models:", error);
    statusDiv.innerText = "Failed to load models.";
  }
}

// Populate voice options in the dropdown and restore saved voice if available.
function populateVoiceList() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';
  const noVoiceOption = document.createElement('option');
  noVoiceOption.textContent = 'No Voice';
  noVoiceOption.value = 'No Voice';
  voiceSelect.appendChild(noVoiceOption);
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = voice.name;
    voiceSelect.appendChild(option);
  });
  // Restore saved voice selection if it exists
  if (userSettings.selectedVoice) {
    voiceSelect.value = userSettings.selectedVoice;
  } else {
    const defaultVoice = voices.find(voice => voice.name.includes('Microsoft Zira')) || voices[0];
    if (defaultVoice) {
      voiceSelect.value = defaultVoice.name;
    }
  }
  console.log("Available voices:", voices.map(voice => voice.name));
}

// --- The rest of your existing code (speech recognition, getAIResponse, speak, etc.) remains unchanged ---

// Initialize Speech Recognition if supported
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusDiv.innerText = "Speech Recognition Started.";
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    if (event.error !== "no-speech") {
      lastErrorWasNoSpeech = false;
      errorMsgDiv.innerText = "Speech Recognition Error: " + event.error;
      if (currentUtterance) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
        isTTSActive = false;
        stopTTSBtn.disabled = true;
      }
    } else {
      lastErrorWasNoSpeech = true;
      console.log("No-speech error; TTS will continue.");
    }
  };

  recognition.onend = () => {
    statusDiv.innerText = "Speech Recognition Ended.";
    if (!isListening && currentUtterance) {
      window.speechSynthesis.cancel();
      currentUtterance = null;
      isTTSActive = false;
      stopTTSBtn.disabled = true;
    }
    if (isListening) {
      recognition.start();
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  };

  recognition.onresult = async (event) => {
    lastErrorWasNoSpeech = false;
    if (interruptToggle.checked && isTTSActive) {
      window.speechSynthesis.cancel();
      isTTSActive = false;
      currentUtterance = null;
      stopTTSBtn.disabled = true;
      statusDiv.innerText = "TTS interrupted by user speech.";
    }
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        let sentence = event.results[i][0].transcript.trim();
        if (sentence) {
          appendMessage("You: " + sentence, "user");
          statusDiv.innerText = "Processing your input...";
          console.log(`Finalized Sentence: ${sentence}`);
          try {
            const aiResponse = await getAIResponse(sentence);
            appendMessage("AI: " + aiResponse, "ai");
            speak(aiResponse);
          } catch (error) {
            errorMsgDiv.innerText = "Error fetching AI response.";
          }
        }
      }
    }
  };

  startBtn.addEventListener("click", () => {
    isListening = true;
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener("click", () => {
    isListening = false;
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.innerText = "Speech Recognition stopped.";
  });

  stopTTSBtn.addEventListener("click", () => {
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

// Function to get AI response from Pollinations using the selected model,
// enhanced with web search results if the toggle is enabled.
async function getAIResponse(prompt) {
  console.log("Received prompt:", prompt);
  const model = modelSelect.value;
  const webSearchEnabled = document.getElementById('webSearchToggle').checked;
  let finalPrompt = prompt;
  
  if (webSearchEnabled) {
    try {
      let searchQuery = prompt;
      const searchResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`);
      const searchData = await searchResponse.json();
      console.log("DuckDuckGo API response:", searchData);

      let searchResults = searchData.AbstractText;
      if (!searchResults || searchResults.trim() === "") {
        if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
          searchResults = searchData.RelatedTopics.slice(0, 3)
            .map(rt => rt.Text)
            .join("\n");
        }
      }
      if (!searchResults || searchResults.trim() === "") {
        searchResults = "No additional information found.";
      }
      
      console.log("searchResults:", searchResults);
      finalPrompt = prompt + "\n\nUse the following web search summary to answer the question:\n" + searchResults;
      statusDiv.innerText = "Web search completed and combined with your prompt.";
    } catch (error) {
      console.error("Web search error:", error);
      statusDiv.innerText = "Web search failed; proceeding with original prompt.";
    }
  }

  console.log("Final prompt being sent to AI:", finalPrompt);
  
  const response = await fetch(`https://text.pollinations.ai/${model}/${encodeURIComponent(finalPrompt)}`);
  const data = await response.text();
  
  console.log("AI response data:", data);
  
  return data;
}

// Function to speak the AI response
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = parseFloat(pitchRange.value);
  utterance.rate = parseFloat(rateRange.value);
  const selectedVoiceName = voiceSelect.value;
  const voices = speechSynthesis.getVoices();

  if (!voices.length) {
    console.error('No voices available. Retrying...');
    setTimeout(() => speak(text), 100);
    return;
  }

  console.log("Selected voice:", selectedVoiceName);
  console.log("Available voices:", voices.map(voice => voice.name));

  if (selectedVoiceName !== 'No Voice') {
    const voice = voices.find(voice => voice.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
    } else {
      console.error('Selected voice not found, using default voice.');
      utterance.voice = voices.find(voice => voice.name.includes('Microsoft Zira')) || voices[0];
    }
    console.log(`Using voice: ${utterance.voice ? utterance.voice.name : 'default voice'}`);
    isTTSActive = true;
    window.speechSynthesis.speak(utterance);
    currentUtterance = utterance;
    stopTTSBtn.disabled = false;
    statusDiv.innerText = "Speaking...";

    utterance.onend = () => {
      isTTSActive = false;
      currentUtterance = null;
      stopTTSBtn.disabled = true;
      statusDiv.innerText = "Speech synthesis ended.";
    };
  } else {
    console.log("TTS is turned off.");
    statusDiv.innerText = "TTS is turned off.";
  }
}

// Initialize settings, voice list, and load models on page load.
window.onload = () => {
  loadSettings();
  populateVoiceList();  // Restores voice selection from userSettings if available.
  loadModels();         // Restores model selection from userSettings if available.
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
  startBtn.disabled = false;
  statusDiv.innerText = "Ready for conversation.";
};

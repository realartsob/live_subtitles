let recognition;
let isListening = false;
let currentUtterance = null;
let isTTSActive = false; // Flag for TTS activity
let lastErrorWasNoSpeech = false; // Flag for no-speech error

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const stopTTSBtn = document.getElementById('stopTTSBtn');
const clearBtn = document.getElementById('clearBtn');
const resetStorageBtn = document.getElementById('resetStorageBtn');
const statusDiv = document.getElementById('status');
const errorMsgDiv = document.getElementById('errorMsg');
const chatHistory = document.getElementById('chatHistory');
const voiceSelect = document.getElementById('voiceSelect');
const modelSelect = document.getElementById('modelSelect');
const interruptToggle = document.getElementById('interruptToggle');
const pitchRange = document.getElementById('pitchRange');
const rateRange = document.getElementById('rateRange');
const pitchValue = document.getElementById('pitchValue');
const rateValue = document.getElementById('rateValue');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');

// Update pitch and rate display and save to localStorage
pitchRange.addEventListener('input', () => {
  pitchValue.innerText = pitchRange.value;
  localStorage.setItem('pitch', pitchRange.value);
});
rateRange.addEventListener('input', () => {
  rateValue.innerText = rateRange.value;
  localStorage.setItem('rate', rateRange.value);
});

// Initialize saved settings
function loadSettings() {
  const savedPitch = localStorage.getItem('pitch');
  if (savedPitch) {
    pitchRange.value = savedPitch;
    pitchValue.innerText = savedPitch;
  }
  const savedRate = localStorage.getItem('rate');
  if (savedRate) {
    rateRange.value = savedRate;
    rateValue.innerText = savedRate;
  }
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
    console.log("Models loaded:", models);
  } catch (error) {
    console.error("Error loading models:", error);
    statusDiv.innerText = "Failed to load models.";
  }
}

// Append a message to the chat history
function appendMessage(text, sender) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message');
  messageElem.classList.add(sender); // "user" or "ai"
  messageElem.innerText = text;
  chatHistory.appendChild(messageElem);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Clear conversation history
clearBtn.addEventListener('click', () => {
  chatHistory.innerHTML = '';
  statusDiv.innerText = 'Conversation cleared.';
});

// Reset localStorage and reload settings
resetStorageBtn.addEventListener('click', () => {
  localStorage.clear();
  loadSettings();
  loadModels();
  statusDiv.innerText = 'Settings have been reset.';
});

// Process text input (from typing)
async function processTextInput() {
  const text = textInput.value.trim();
  if (text) {
    appendMessage("You: " + text, "user");
    statusDiv.innerText = "Processing your input...";
    console.log("Text input:", text);
    try {
      const aiResponse = await getAIResponse(text);
      appendMessage("AI: " + aiResponse, "ai");
      speak(aiResponse);
    } catch (error) {
      errorMsgDiv.innerText = "Error fetching AI response.";
    }
    textInput.value = ""; // Clear the input field
  }
}

// Add event listener for the Send button and Enter key on the text input
sendBtn.addEventListener('click', processTextInput);
textInput.addEventListener('keyup', (event) => {
  if (event.key === "Enter") {
    processTextInput();
  }
});

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

// Populate voice options in the dropdown
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
  console.log("Available voices:", voices.map(voice => voice.name));
  const savedVoice = localStorage.getItem('selectedVoice');
  if (savedVoice) {
    voiceSelect.value = savedVoice;
  } else {
    const defaultVoice = voices.find(voice => voice.name.includes('Microsoft Zira')) || voices[0];
    if (defaultVoice) {
      voiceSelect.value = defaultVoice.name;
    }
  }
}

// Save the selected voice to localStorage when the user changes selection
voiceSelect.addEventListener('change', () => {
  const selectedVoice = voiceSelect.value;
  localStorage.setItem('selectedVoice', selectedVoice);
  console.log("Voice selection changed to:", selectedVoice);
});

// Initialize settings, voice list, and load models on page load
window.onload = () => {
  loadSettings();
  populateVoiceList();
  loadModels();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
  startBtn.disabled = false;
  statusDiv.innerText = "Ready for conversation.";
};

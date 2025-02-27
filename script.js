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
    
    // Apply loaded settings to UI elements
    pitchRange.value = userSettings.pitch;
    pitchValue.innerText = userSettings.pitch;
    rateRange.value = userSettings.rate;
    rateValue.innerText = userSettings.rate;
    document.getElementById('webSearchToggle').checked = userSettings.webSearchEnabled;
    document.getElementById('interruptToggle').checked = userSettings.interruptEnabled;
    
    // For voice selection, we'll set it after voices are populated.
    // For model selection, if applicable:
    if(userSettings.model) {
      modelSelect.value = userSettings.model;
    }
    
    console.log("Settings loaded:", userSettings);
  }
}

// Event listeners to update and save settings when they change.
pitchRange.addEventListener('input', () => {
  pitchValue.innerText = pitchRange.value;
  saveSettings();
});
rateRange.addEventListener('input', () => {
  rateValue.innerText = rateRange.value;
  saveSettings();
});
voiceSelect.addEventListener('change', () => {
  saveSettings();
});
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
  // Optionally reset voiceSelect and modelSelect if needed
  saveSettings();
  statusDiv.innerText = 'Settings have been reset.';
});

// In your window.onload, load settings first then populate voice list and models.
window.onload = () => {
  loadSettings();
  populateVoiceList();  // Make sure to check and set voiceSelect based on userSettings.selectedVoice
  loadModels();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
  startBtn.disabled = false;
  statusDiv.innerText = "Ready for conversation.";
};

// Modify populateVoiceList to set the saved voice after populating voices.
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
  // Set the voice if it was saved previously
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

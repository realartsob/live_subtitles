import { loadSettings } from './settings.js';
import { populateVoiceList, initVoiceSelection } from './voiceModel.js';
import { initSpeechRecognition, initChat, processTextInput } from './speech.js'; // Moved initChat and processTextInput imports here
import { loadModels } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  populateVoiceList();
  initVoiceSelection();
  initSpeechRecognition();
  initChat(); // Initialize chat here
  loadModels();

  document.getElementById('sendBtn').addEventListener('click', processTextInput);
  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('chatHistory').innerHTML = '';
    document.getElementById('status').innerText = 'Conversation cleared.';
  });
  document.getElementById('resetStorageBtn').addEventListener('click', () => {
    localStorage.clear();
    loadSettings();
    loadModels();
    document.getElementById('status').innerText = 'Settings have been reset.';
  });
});

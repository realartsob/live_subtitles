import { getAIResponse } from './api.js';
import { speak } from './speech.js';

export function initChat() {
  // Expose this function so speech recognition can call it
  window.processUserInput = async function(userText) {
    await processChatMessage(userText);
  };
}

export async function processTextInput() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value.trim();
  if (text) {
    appendMessage("You: " + text, "user");
    document.getElementById('status').innerText = "Processing your input...";
    try {
      const aiResponse = await getAIResponse(text);
      appendMessage("AI: " + aiResponse, "ai");
      speak(aiResponse);
    } catch (error) {
      document.getElementById('errorMsg').innerText = "Error fetching AI response.";
    }
    textInput.value = "";
  }
}

export async function processChatMessage(userText) {
  appendMessage("You: " + userText, "user");
  document.getElementById('status').innerText = "Processing your input...";
  try {
    const aiResponse = await getAIResponse(userText);
    appendMessage("AI: " + aiResponse, "ai");
    speak(aiResponse);
  } catch (error) {
    document.getElementById('errorMsg').innerText = "Error fetching AI response.";
  }
}

function appendMessage(text, sender) {
  const chatHistory = document.getElementById('chatHistory');
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);
  messageElem.innerText = text;
  chatHistory.appendChild(messageElem);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

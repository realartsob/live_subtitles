export let currentUtterance = null;
export let isTTSActive = false;
let recognition = null;
export let isListening = false;

export function initSpeechRecognition() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      document.getElementById('status').innerText = "Speech Recognition Started.";
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        document.getElementById('errorMsg').innerText = "Speech Recognition Error: " + event.error;
        if (currentUtterance) {
          window.speechSynthesis.cancel();
          currentUtterance = null;
          isTTSActive = false;
          document.getElementById('stopTTSBtn').disabled = true;
        }
      }
    };

    recognition.onend = () => {
      document.getElementById('status').innerText = "Speech Recognition Ended.";
      if (isListening) {
        recognition.start();
      } else {
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
      }
    };

    recognition.onresult = async (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          let sentence = event.results[i][0].transcript.trim();
          if (sentence) {
            const chatHistory = document.getElementById('chatHistory');
            const messageElem = document.createElement('div');
            messageElem.classList.add('message', 'user');
            messageElem.innerText = "You: " + sentence;
            chatHistory.appendChild(messageElem);
            document.getElementById('status').innerText = "Processing your input...";
            if (window.processUserInput) {
              await window.processUserInput(sentence);
            }
          }
        }
      }
    };

    document.getElementById('startBtn').addEventListener("click", () => {
      isListening = true;
      recognition.start();
      document.getElementById('startBtn').disabled = true;
      document.getElementById('stopBtn').disabled = false;
    });

    document.getElementById('stopBtn').addEventListener("click", () => {
      isListening = false;
      recognition.stop();
      document.getElementById('startBtn').disabled = false;
      document.getElementById('stopBtn').disabled = true;
      document.getElementById('status').innerText = "Speech Recognition stopped.";
    });

    document.getElementById('stopTTSBtn').addEventListener("click", () => {
      if (currentUtterance) {
        currentUtterance.onend = null;
        window.speechSynthesis.cancel();
        currentUtterance = null;
        isTTSActive = false;
        document.getElementById('stopTTSBtn').disabled = true;
        document.getElementById('status').innerText = "TTS stopped.";
      }
    });
  } else {
    alert("Your browser does not support webkitSpeechRecognition.");
  }
}

export function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = parseFloat(document.getElementById('pitchRange').value);
  utterance.rate = parseFloat(document.getElementById('rateRange').value);
  const selectedVoiceName = document.getElementById('voiceSelect').value;
  const voices = speechSynthesis.getVoices();

  if (!voices.length) {
    setTimeout(() => speak(text), 100);
    return;
  }
  if (selectedVoiceName !== 'No Voice') {
    const voice = voices.find(voice => voice.name === selectedVoiceName);
    utterance.voice = voice ? voice : voices[0];
    isTTSActive = true;
    window.speechSynthesis.speak(utterance);
    currentUtterance = utterance;
    document.getElementById('stopTTSBtn').disabled = false;
    document.getElementById('status').innerText = "Speaking...";
    utterance.onend = () => {
      isTTSActive = false;
      currentUtterance = null;
      document.getElementById('stopTTSBtn').disabled = true;
      document.getElementById('status').innerText = "Speech synthesis ended.";
    };
  } else {
    document.getElementById('status').innerText = "TTS is turned off.";
  }
}

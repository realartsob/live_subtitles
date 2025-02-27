export function populateVoiceList() {
    const voiceSelect = document.getElementById('voiceSelect');
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
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
      voiceSelect.value = savedVoice;
    }
  }
  
  export function initVoiceSelection() {
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.addEventListener('change', () => {
      localStorage.setItem('selectedVoice', voiceSelect.value);
    });
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }
  
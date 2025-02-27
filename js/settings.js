export function loadSettings() {
    const pitch = localStorage.getItem('pitch');
    const rate = localStorage.getItem('rate');
    if (pitch) {
      document.getElementById('pitchRange').value = pitch;
      document.getElementById('pitchValue').innerText = pitch;
    }
    if (rate) {
      document.getElementById('rateRange').value = rate;
      document.getElementById('rateValue').innerText = rate;
    }
  }
  
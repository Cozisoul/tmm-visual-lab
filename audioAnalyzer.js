class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.enabled = false;
    this.sensitivity = 1; // Default sensitivity
    this.stream = null; // To hold the MediaStream
  }

  async init() {
    if (this.audioContext === null) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512; // Can be adjusted
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.microphone = this.audioContext.createMediaStreamSource(this.stream);
        this.microphone.connect(this.analyser);
        
        console.log("AudioContext and AnalyserNode initialized.");
      } catch (err) {
        console.error("Error initializing audio:", err);
        this.enabled = false; // Disable if initialization fails
      }
    }
  }

  setEnabled(enable) {
    this.enabled = enable;
    if (this.microphone) {
      if (enable) {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        console.log("Microphone enabled.");
      } else {
        if (this.audioContext.state === 'running') {
          this.audioContext.suspend();
        }
        console.log("Microphone disabled.");
      }
    }
  }

  getAmplitude() {
    if (this.enabled && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      // Calculate average amplitude from frequency data
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      let average = sum / this.dataArray.length;
      // Normalize to 0-1 range (max value for Uint8Array is 255)
      return (average / 255) * this.sensitivity;
    }
    return 0;
  }

  // FFT and other methods are not directly supported with this basic AnalyserNode setup
  // They would require more complex processing of the dataArray or a different node setup.
  getSpectrum() { return []; }
  getBass() { return 0; }
  getMid() { return 0; }
  getTreble() { return 0; }

  setSensitivity(sensitivity) {
    this.sensitivity = sensitivity;
  }
}

window.audioAnalyzer = new AudioAnalyzer();
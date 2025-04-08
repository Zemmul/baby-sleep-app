// Audio worklet processor for background audio processing
class BackgroundAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastTime = 0;
    this._interval = 0.1; // 100ms interval
    this._tick = 0;
    this._isPlaying = false;
    this._volume = 0.0001; // Almost silent
    
    // Handle messages from the main thread
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case 'interval':
          this._interval = event.data.interval;
          break;
        case 'playbackState':
          this._isPlaying = event.data.isPlaying;
          break;
        case 'volume':
          this._volume = event.data.volume;
          break;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const currentTime = currentTime;
    
    // Generate a silent output to keep the audio context alive
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        // Generate a very quiet sine wave (almost silent)
        outputChannel[i] = Math.sin(this._tick) * this._volume;
        this._tick += 0.01;
      }
    }
    
    // Send a message to the main thread periodically
    if (currentTime - this._lastTime >= this._interval) {
      this.port.postMessage({ 
        type: 'tick', 
        time: currentTime,
        isPlaying: this._isPlaying
      });
      this._lastTime = currentTime;
    }
    
    // Return true to keep the processor running
    return true;
  }
}

// Register the processor
registerProcessor('background-audio-processor', BackgroundAudioProcessor); 
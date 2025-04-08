// Audio worklet for background audio processing
class BackgroundAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._volume = 0.0001;
        this._isPlaying = false;
        this._tickCounter = 0;
        
        // Handle messages from the main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'volume') {
                this._volume = event.data.volume;
            } else if (event.data.type === 'playbackState') {
                this._isPlaying = event.data.isPlaying;
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        // Send a tick message every 1000 samples (about 23ms at 44.1kHz)
        this._tickCounter++;
        if (this._tickCounter >= 1000) {
            this._tickCounter = 0;
            this.port.postMessage({ type: 'tick' });
        }
        
        // If not playing, output silence
        if (!this._isPlaying) {
            return true;
        }
        
        // Process audio
        const output = outputs[0];
        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; ++i) {
                // Apply volume
                outputChannel[i] = this._volume;
            }
        }
        
        return true;
    }
}

// Register the processor
registerProcessor('background-audio-processor', BackgroundAudioProcessor); 
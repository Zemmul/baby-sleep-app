// Sound data
const soundData = [
    {
        id: 'rain',
        title: 'Rain',
        description: 'Gentle rainfall',
        image: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.aac'
    },
    {
        id: 'ocean',
        title: 'Ocean',
        description: 'Calm ocean waves',
        image: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.aac'
    },
    {
        id: 'fireplace',
        title: 'Fireplace',
        description: 'Crackling fireplace',
        image: 'assets/images/fireplace.jpg',
        audio: 'assets/audio/fireplace.aac'
    },
    {
        id: 'birds',
        title: 'Birds',
        description: 'Morning birdsong',
        image: 'assets/images/birds.jpg',
        audio: 'assets/audio/birds.aac'
    },
    {
        id: 'heartbeat',
        title: 'Heartbeat',
        description: 'Soothing heartbeat',
        image: 'assets/images/heartbeart.jpg',
        audio: 'assets/audio/heartbeat.aac'
    },
    {
        id: 'stream',
        title: 'Stream',
        description: 'Flowing stream',
        image: 'assets/images/stream.jpg',
        audio: 'assets/audio/stream.aac'
    },
    {
        id: 'vacuum',
        title: 'Vacuum',
        description: 'Vacuum cleaner',
        image: 'assets/images/vacuum.jpg',
        audio: 'assets/audio/vacuum.aac'
    },
    {
        id: 'whitenoise',
        title: 'White Noise',
        description: 'White noise',
        image: 'assets/images/whitenoise.jpg',
        audio: 'assets/audio/whitenoise.aac'
    },
    {
        id: 'hair-dryer',
        title: 'Hair Dryer',
        description: 'Hair dryer sound',
        image: 'assets/images/hair-dryer.jpg',
        audio: 'assets/audio/hair-dryer.aac'
    },
    {
        id: 'shush',
        title: 'Shush',
        description: 'Shushing sound',
        image: 'assets/images/shush.jpg',
        audio: 'assets/audio/shush.aac'
    },
    {
        id: 'coffee-shop',
        title: 'Coffee Shop',
        description: 'Coffee shop ambiance',
        image: 'assets/images/coffee-shop.jpg',
        audio: 'assets/audio/coffee-shop.aac'
    }
];

// DOM elements
let soundGrid;
let volumeSlider;
let volumeToggle;
let currentAudio = null;
let audioContext = null;
let gainNode = null;
let isPlaying = false;
let prevButton;
let nextButton;
let fadeInterval = null;
let lastVolume = 0.5; // Store the last volume level
let audioCache = {}; // Cache for preloaded audio elements
let wakeLock = null; // Wake lock object
let audioSource = null; // Web Audio API source node
let heartbeatInterval = null; // Interval to keep audio context alive
let audioBuffers = {}; // Cache for audio buffers
let batteryManager = null; // Battery status manager
let backgroundPlaybackEnabled = true; // User preference for background playback
let currentSoundIndex = null; // Store the current sound index
let currentAudioBufferSource = null; // Store the current AudioBufferSource node

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    soundGrid = document.getElementById('soundGrid');
    volumeSlider = document.getElementById('volumeSlider');
    volumeToggle = document.getElementById('volumeToggle');
    prevButton = document.querySelector('.carousel-nav.prev');
    nextButton = document.querySelector('.carousel-nav.next');
    
    // Initialize Web Audio API
    initAudioContext();
    
    // Preload audio files
    preloadAudio();
    
    // Initialize sound cards
    initializeSoundCards();
    
    // Set up volume control
    setupVolumeControl();
    
    // Set up carousel navigation
    setupCarouselNavigation();
    
    // Set initial volume
    lastVolume = volumeSlider.value / 100;
    
    // Initialize battery monitoring
    initBatteryMonitoring();
    
    // Request wake lock when playing
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isPlaying) {
            resumeAudioContext();
        }
    });
    
    // Handle beforeunload event
    window.addEventListener('beforeunload', () => {
        if (isPlaying) {
            // Save playback state to localStorage
            localStorage.setItem('lastPlayedSound', currentSoundIndex);
            localStorage.setItem('lastVolume', lastVolume);
            localStorage.setItem('wasPlaying', 'true');
        }
    });
    
    // Check if we need to resume playback
    checkResumePlayback();
});

// Check if we need to resume playback from previous session
function checkResumePlayback() {
    const wasPlaying = localStorage.getItem('wasPlaying') === 'true';
    const lastPlayedSound = localStorage.getItem('lastPlayedSound');
    const lastVolume = localStorage.getItem('lastVolume');
    
    if (wasPlaying && lastPlayedSound) {
        // Restore volume
        if (lastVolume) {
            volumeSlider.value = lastVolume * 100;
            updateVolume(lastVolume);
        }
        
        // Resume playback
        playSound(parseInt(lastPlayedSound));
    }
}

// Initialize battery monitoring
function initBatteryMonitoring() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            batteryManager = battery;
            
            // Listen for battery level changes
            battery.addEventListener('levelchange', () => {
                handleBatteryLevelChange(battery.level);
            });
            
            // Listen for charging status changes
            battery.addEventListener('chargingchange', () => {
                handleChargingChange(battery.charging);
            });
            
            // Initial check
            handleBatteryLevelChange(battery.level);
            handleChargingChange(battery.charging);
        });
    }
}

// Handle battery level changes
function handleBatteryLevelChange(level) {
    // If battery is low and not charging, show a warning
    if (level < 0.2 && !batteryManager.charging) {
        showBatteryWarning();
    }
}

// Handle charging status changes
function handleChargingChange(isCharging) {
    if (isCharging) {
        // Hide battery warning if it's showing
        hideBatteryWarning();
    } else if (batteryManager.level < 0.2) {
        // Show warning if battery is low and not charging
        showBatteryWarning();
    }
}

// Show battery warning
function showBatteryWarning() {
    // Create warning element if it doesn't exist
    let warning = document.getElementById('battery-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'battery-warning';
        warning.className = 'battery-warning';
        warning.innerHTML = `
            <p>Low battery! Consider plugging in your device to keep the sleep sounds playing.</p>
            <button id="dismiss-warning">Dismiss</button>
        `;
        document.body.appendChild(warning);
        
        // Add event listener to dismiss button
        document.getElementById('dismiss-warning').addEventListener('click', hideBatteryWarning);
    }
    
    // Show the warning
    warning.style.display = 'block';
}

// Hide battery warning
function hideBatteryWarning() {
    const warning = document.getElementById('battery-warning');
    if (warning) {
        warning.style.display = 'none';
    }
}

// Handle visibility change
async function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && isPlaying) {
        await requestWakeLock();
        resumeAudioContext();
    }
}

// Resume audio context
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
}

// Request wake lock
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            
            // Re-request wake lock if it's released
            wakeLock.addEventListener('release', () => {
                if (isPlaying) {
                    requestWakeLock();
                }
            });
        }
    } catch (err) {
        console.error('Wake Lock error:', err);
    }
}

// Release wake lock
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
            });
    }
}

// Start heartbeat to keep audio context alive
function startHeartbeat() {
    // Clear any existing heartbeat
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    // Create a silent oscillator to keep the audio context alive
    const silentOscillator = audioContext.createOscillator();
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0.0001; // Almost silent
    silentOscillator.connect(silentGain);
    silentGain.connect(audioContext.destination);
    silentOscillator.start();
    
    // Store the oscillator for later cleanup
    audioContext._silentOscillator = silentOscillator;
    
    // Set up periodic heartbeat
    heartbeatInterval = setInterval(() => {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Audio context resumed by heartbeat');
            });
        }
    }, 10000); // Check every 10 seconds
}

// Stop heartbeat
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    // Stop the silent oscillator
    if (audioContext && audioContext._silentOscillator) {
        audioContext._silentOscillator.stop();
        audioContext._silentOscillator = null;
    }
}

// Preload audio files
function preloadAudio() {
    soundData.forEach(sound => {
        // Create standard Audio element
        const audio = new Audio();
        audio.src = sound.audio;
        audio.preload = 'auto';
        audioCache[sound.id] = audio;
        
        // Also preload as AudioBuffer for more robust playback
        fetch(sound.audio)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                audioBuffers[sound.id] = audioBuffer;
                console.log(`Preloaded audio buffer for ${sound.title}`);
            })
            .catch(error => {
                console.error(`Error preloading audio buffer for ${sound.title}:`, error);
            });
    });
}

// Initialize Web Audio API
function initAudioContext() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        
        // Set initial volume
        gainNode.gain.value = volumeSlider.value / 100;
        
        // Load audio worklet for background processing
        loadAudioWorklet();
    } catch (e) {
        console.error('Web Audio API not supported:', e);
    }
}

// Load audio worklet for background processing
async function loadAudioWorklet() {
    try {
        if (audioContext.audioWorklet) {
            await audioContext.audioWorklet.addModule('audio-worklet.js');
            console.log('Audio worklet loaded successfully');
        }
    } catch (e) {
        console.error('Error loading audio worklet:', e);
    }
}

// Initialize sound cards
function initializeSoundCards() {
    // Clear existing content
    const existingCards = soundGrid.querySelectorAll('.sound-card');
    existingCards.forEach(card => card.remove());
    
    // Add data-index attribute to each card
    soundData.forEach((sound, index) => {
        const card = createSoundCard(sound, index);
        soundGrid.appendChild(card);
    });
}

// Create a sound card
function createSoundCard(sound, index) {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.setAttribute('data-index', index);
    
    // Create card content
    card.innerHTML = `
        <div class="album-art-wrapper">
            <img src="${sound.image}" alt="${sound.title}">
            <div class="play-button">
                <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        </div>
        <div class="sound-card-content">
            <h3>${sound.title}</h3>
            <p>${sound.description}</p>
        </div>
    `;
    
    // Add click event to the play button
    const playButton = card.querySelector('.play-button');
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePlayButtonClick(index);
    });
    
    return card;
}

// Handle play button click
function handlePlayButtonClick(index) {
    // Toggle play/pause
    if (isPlaying) {
        pauseSound();
    } else {
        playSound(index);
    }
}

// Play a sound
function playSound(index) {
    const sound = soundData[index];
    currentSoundIndex = index; // Store current sound index
    
    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Use cached audio if available, otherwise create new
    if (audioCache[sound.id]) {
        currentAudio = audioCache[sound.id];
    } else {
        currentAudio = new Audio(sound.audio);
        audioCache[sound.id] = currentAudio;
    }
    
    // Reset the audio to the beginning
    currentAudio.currentTime = 0;
    currentAudio.loop = true; // Enable looping
    
    // Connect to Web Audio API if available
    if (audioContext && gainNode) {
        try {
            // Resume audio context if it's suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Check if already connected
            if (!currentAudio._connected) {
                audioSource = audioContext.createMediaElementSource(currentAudio);
                audioSource.connect(gainNode);
                currentAudio._connected = true;
            }
            gainNode.gain.value = 0; // Start at volume 0 for fade in
        } catch (e) {
            console.error('Error connecting audio to Web Audio API:', e);
            currentAudio.volume = 0; // Fallback to standard volume control
        }
    } else {
        currentAudio.volume = 0; // Fallback to standard volume control
    }
    
    // Request wake lock when playing
    requestWakeLock();
    
    // Start heartbeat to keep audio context alive
    startHeartbeat();
    
    // Play the audio
    const playPromise = currentAudio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            
            // Update UI
            const cards = document.querySelectorAll('.sound-card');
            const activeCard = cards[index];
            if (activeCard) {
                activeCard.classList.add('playing');
                
                // Update play button to pause
                const playButton = activeCard.querySelector('.play-button svg');
                playButton.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            }

            // Fade in the audio
            const targetVolume = volumeSlider.value / 100;
            let currentVolume = 0;
            const fadeStep = 0.1; // Increased fade step for faster fade in
            
            // Clear any existing fade interval
            if (fadeInterval) {
                clearInterval(fadeInterval);
            }
            
            fadeInterval = setInterval(() => {
                if (currentVolume < targetVolume) {
                    currentVolume = Math.min(currentVolume + fadeStep, targetVolume);
                    if (gainNode) {
                        gainNode.gain.value = currentVolume;
                    } else {
                        currentAudio.volume = currentVolume;
                    }
                } else {
                    clearInterval(fadeInterval);
                }
            }, 30); // Reduced interval for faster updates
            
        }).catch(error => {
            console.error('Error playing audio:', error);
            
            // Try fallback method using AudioBuffer if available
            if (audioBuffers[sound.id]) {
                playAudioBuffer(sound.id);
            }
        });
    }
}

// Play audio using AudioBuffer (fallback method)
function playAudioBuffer(soundId) {
    if (!audioContext || !audioBuffers[soundId]) return;
    
    // Create buffer source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[soundId];
    source.loop = true;
    
    // Connect to gain node
    source.connect(gainNode);
    
    // Start playback
    source.start(0);
    
    // Store reference to stop later
    currentAudioBufferSource = source;
    
    // Update UI
    isPlaying = true;
    updatePlayButtonUI();
}

// Pause the current sound
function pauseSound() {
    if (currentAudio) {
        // Fade out before pausing
        const fadeStep = 0.1; // Increased fade step for faster fade out
        let currentVolume = gainNode ? gainNode.gain.value : currentAudio.volume;
        
        // Clear any existing fade interval
        if (fadeInterval) {
            clearInterval(fadeInterval);
        }
        
        fadeInterval = setInterval(() => {
            if (currentVolume > 0) {
                currentVolume = Math.max(currentVolume - fadeStep, 0);
                if (gainNode) {
                    gainNode.gain.value = currentVolume;
                } else {
                    currentAudio.volume = currentVolume;
                }
            } else {
                clearInterval(fadeInterval);
                currentAudio.pause();
                isPlaying = false;
                
                // Stop audio buffer if it's playing
                if (currentAudioBufferSource) {
                    currentAudioBufferSource.stop();
                    currentAudioBufferSource = null;
                }
                
                // Release wake lock when paused
                releaseWakeLock();
                
                // Stop heartbeat
                stopHeartbeat();
                
                // Update UI
                updatePlayButtonUI();
            }
        }, 30); // Reduced interval for faster updates
    }
}

// Update play button UI
function updatePlayButtonUI() {
    const cards = document.querySelectorAll('.sound-card');
    cards.forEach(card => {
        if (isPlaying) {
            card.classList.add('playing');
            
            // Update play button to pause
            const playButton = card.querySelector('.play-button svg');
            if (playButton) {
                playButton.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            }
        } else {
            card.classList.remove('playing');
            
            // Update play button to play
            const playButton = card.querySelector('.play-button svg');
            if (playButton) {
                playButton.innerHTML = '<path d="M8 5v14l11-7z"/>';
            }
        }
    });
}

// Set up volume control
function setupVolumeControl() {
    // Set initial volume
    if (gainNode) {
        gainNode.gain.value = volumeSlider.value / 100;
    } else if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100;
    }
    
    // Add event listener for volume changes from slider
    volumeSlider.addEventListener('input', () => {
        const newVolume = volumeSlider.value / 100;
        updateVolume(newVolume);
    });
    
    // Add event listener for volume toggle
    volumeToggle.addEventListener('click', () => {
        if (currentAudio) {
            if ((gainNode && gainNode.gain.value > 0) || (!gainNode && currentAudio.volume > 0)) {
                // Store current volume and mute
                lastVolume = gainNode ? gainNode.gain.value : currentAudio.volume;
                updateVolume(0);
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                `;
            } else {
                // Restore previous volume
                updateVolume(lastVolume);
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                `;
            }
        }
    });
}

// Update volume across all components
function updateVolume(volume) {
    // Store the volume
    lastVolume = volume;
    
    // Update the slider
    volumeSlider.value = volume * 100;
    
    // Update the audio volume
    if (currentAudio) {
        if (gainNode) {
            gainNode.gain.value = volume;
        } else {
            currentAudio.volume = volume;
        }
    }
    
    // Update the volume icon based on volume level
    if (volume === 0) {
        // Muted icon
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
        `;
    } else if (volume < 0.3) {
        // Low volume icon (1 bar)
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3z"/>
            </svg>
        `;
    } else if (volume < 0.7) {
        // Medium volume icon (2 bars)
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
        `;
    } else {
        // High volume icon (3 bars)
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
        `;
    }
}

// Set up carousel navigation
function setupCarouselNavigation() {
    // Add event listener for previous button
    prevButton.addEventListener('click', () => {
        scrollCarousel('prev');
    });
    
    // Add event listener for next button
    nextButton.addEventListener('click', () => {
        scrollCarousel('next');
    });
}

// Scroll the carousel
function scrollCarousel(direction) {
    const cardWidth = document.querySelector('.sound-card').offsetWidth;
    const gap = 20; // Gap between cards
    const scrollAmount = cardWidth + gap;
    
    if (direction === 'prev') {
        soundGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        soundGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
} 
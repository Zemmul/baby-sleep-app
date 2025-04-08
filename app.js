// Sound data
const soundData = [
    {
        id: 'rain',
        title: 'Rain',
        description: 'The soft, steady sound of rain creates a calming rhythm that mimics the sounds babies hear inside the womb. It helps mask sudden noises that might startle them',
        image: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.aac'
    },
    {
        id: 'ocean',
        title: 'Ocean',
        description: 'The repetitive crashing and pulling of waves is soothing and rhythmic, creating a natural "lull" that helps regulate a baby\'s breathing and heartbeat.',
        image: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.aac'
    },
    {
        id: 'fireplace',
        title: 'Fireplace',
        description: 'The soft crackling of a fire sounds cozy and comforting, promoting warmth and security, like being held close.',
        image: 'assets/images/fireplace.jpg',
        audio: 'assets/audio/fireplace.aac'
    },
    {
        id: 'birds',
        title: 'Birds',
        description: 'Gentle bird songs can create a peaceful, natural atmosphere, helping babies feel safe and connected to the world around them.',
        image: 'assets/images/birds.jpg',
        audio: 'assets/audio/birds.aac'
    },
    {
        id: 'heartbeat',
        title: 'Heartbeat',
        description: 'Babies are used to hearing their mother\'s heartbeat in the womb. Replaying a heartbeat sound gives them a deep sense of familiarity and safety.',
        image: 'assets/images/heartbeart.jpg',
        audio: 'assets/audio/heartbeat.aac'
    },
    {
        id: 'stream',
        title: 'Stream',
        description: 'The flowing sound of a stream mimics a natural environment and provides steady, gentle white noise that helps mask background disturbances.',
        image: 'assets/images/stream.jpg',
        audio: 'assets/audio/stream.aac'
    },
    {
        id: 'vacuum',
        title: 'Vacuum',
        description: 'Strangely enough, vacuums create a deep, consistent hum that babies find very similar to the rushing blood sounds in the womb. Many babies instantly relax or even fall asleep to it! ',
        image: 'assets/images/vacuum.jpg',
        audio: 'assets/audio/vacuum.aac'
    },
    {
        id: 'whitenoise',
        title: 'White Noise',
        description: 'White noise is a blend of all sound frequencies at once. It smooths over sharp sounds (like a door closing) and creates a cocoon of calmness. ',
        image: 'assets/images/whitenoise.jpg',
        audio: 'assets/audio/whitenoise.aac'
    },
    {
        id: 'hair-dryer',
        title: 'Hair Dryer',
        description: 'Like a vacuum, the hair dryer\'s hum is low, consistent, and womb-like. It can quickly soothe fussy or overstimulated babies.',
        image: 'assets/images/hair-dryer.jpg',
        audio: 'assets/audio/hair-dryer.aac'
    },
    {
        id: 'shush',
        title: 'Shush',
        description: 'Saying "shhh" mimics the sounds of blood flow babies hear inside the womb. It\'s familiar and rhythmic, reassuring them they\'re safe.',
        image: 'assets/images/shush.jpg',
        audio: 'assets/audio/shush.aac'
    },
    {
        id: 'coffee-shop',
        title: 'Coffee Shop',
        description: 'Soft background chatter and clinking noises can simulate a familiar "busy" environment. It can feel cozy and safe if it\'s low and gentle.',
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
let deferredPrompt = null; // Store the beforeinstallprompt event
let isPWA = false; // Flag to track if running as PWA

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    soundGrid = document.getElementById('soundGrid');
    volumeSlider = document.getElementById('volumeSlider');
    volumeToggle = document.getElementById('volumeToggle');
    prevButton = document.querySelector('.carousel-nav.prev');
    nextButton = document.querySelector('.carousel-nav.next');
    
    // Check if running as PWA
    checkPWAMode();
    
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
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install prompt if not in PWA mode
        if (!isPWA) {
            showInstallPrompt();
        }
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        // Log the installation
        console.log('App was installed');
        // Hide the install prompt
        hideInstallPrompt();
        // Update PWA status
        isPWA = true;
    });
});

// Check if running as PWA
function checkPWAMode() {
    // Check if the app is running in standalone mode (PWA)
    isPWA = window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone || 
            document.referrer.includes('android-app://');
    
    console.log('Running as PWA:', isPWA);
    
    // If not in PWA mode, show the install prompt after a delay
    if (!isPWA) {
        setTimeout(() => {
            showInstallPrompt();
        }, 3000); // Show after 3 seconds
    }
}

// Show install prompt
function showInstallPrompt() {
    // Check if we already have a prompt
    let prompt = document.getElementById('install-prompt');
    
    // If no prompt exists, create one
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'install-prompt';
        prompt.className = 'install-prompt';
        
        // Create prompt content
        prompt.innerHTML = `
            <div class="install-content">
                <h3>Install Baby Sleep App</h3>
                <p>Install this app on your device for the best experience, including background audio playback.</p>
                <div class="install-buttons">
                    <button id="install-button" class="install-button">Install</button>
                    <button id="dismiss-install" class="dismiss-button">Not Now</button>
                </div>
            </div>
        `;
        
        // Add to the document
        document.body.appendChild(prompt);
        
        // Add event listeners
        document.getElementById('install-button').addEventListener('click', installApp);
        document.getElementById('dismiss-install').addEventListener('click', hideInstallPrompt);
    }
    
    // Show the prompt
    prompt.style.display = 'flex';
}

// Hide install prompt
function hideInstallPrompt() {
    const prompt = document.getElementById('install-prompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
}

// Install the app
function installApp() {
    // Hide the prompt
    hideInstallPrompt();
    
    // Show the prompt if we have a deferred prompt
    if (deferredPrompt) {
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            deferredPrompt = null;
        });
    } else {
        // If no deferred prompt, show instructions for manual installation
        showManualInstallInstructions();
    }
}

// Show manual installation instructions
function showManualInstallInstructions() {
    // Create instructions element
    const instructions = document.createElement('div');
    instructions.id = 'manual-install-instructions';
    instructions.className = 'manual-install-instructions';
    
    // Determine device type
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Set content based on device
    if (isIOS) {
        instructions.innerHTML = `
            <div class="instructions-content">
                <h3>Install on iOS</h3>
                <ol>
                    <li>Tap the Share button <img src="assets/images/ios-share.png" alt="Share button" class="instruction-icon"></li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                </ol>
                <button id="close-instructions" class="close-button">Got it</button>
            </div>
        `;
    } else if (isAndroid) {
        instructions.innerHTML = `
            <div class="instructions-content">
                <h3>Install on Android</h3>
                <ol>
                    <li>Tap the menu button <img src="assets/images/android-menu.png" alt="Menu button" class="instruction-icon"></li>
                    <li>Tap "Add to Home screen" or "Install app"</li>
                    <li>Follow the prompts to install</li>
                </ol>
                <button id="close-instructions" class="close-button">Got it</button>
            </div>
        `;
    } else {
        instructions.innerHTML = `
            <div class="instructions-content">
                <h3>Install on Desktop</h3>
                <p>Click the install icon in your browser's address bar to install this app.</p>
                <button id="close-instructions" class="close-button">Got it</button>
            </div>
        `;
    }
    
    // Add to the document
    document.body.appendChild(instructions);
    
    // Add event listener to close button
    document.getElementById('close-instructions').addEventListener('click', () => {
        instructions.remove();
    });
}

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
    if (isPlaying) {
        if (document.visibilityState === 'visible') {
            await requestWakeLock();
            resumeAudioContext();
        } else if (isPWA) {
            // In PWA mode, maintain wake lock even when in background
            await requestWakeLock();
        }
    }
}

// Resume audio context
async function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
            console.log('Audio context resumed');
            
            // Update background processor state
            if (audioContext._backgroundProcessor) {
                audioContext._backgroundProcessor.port.postMessage({
                    type: 'playbackState',
                    isPlaying: isPlaying
                });
            }
        } catch (error) {
            console.error('Error resuming audio context:', error);
        }
    }
}

// Request wake lock
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            // Request both screen and system wake lock
            wakeLock = await navigator.wakeLock.request('screen');
            
            // Also request system wake lock if available
            if ('systemWakeLock' in navigator) {
                await navigator.systemWakeLock.request();
            }
            
            // Re-request wake lock if it's released
            wakeLock.addEventListener('release', () => {
                if (isPlaying) {
                    requestWakeLock();
                }
            });
            
            // Log wake lock status
            console.log('Wake Lock active:', wakeLock !== null);
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
                console.log('Wake Lock released');
            });
    }
}

// Start heartbeat to keep audio context alive
function startHeartbeat() {
    // Clear any existing heartbeat
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    // Update background processor state
    if (audioContext && audioContext._backgroundProcessor) {
        audioContext._backgroundProcessor.port.postMessage({
            type: 'playbackState',
            isPlaying: true
        });
    }
    
    // Set up periodic heartbeat
    heartbeatInterval = setInterval(() => {
        if (audioContext && audioContext.state === 'suspended' && isPlaying) {
            resumeAudioContext();
        }
    }, 10000); // Check every 10 seconds
}

// Stop heartbeat
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    // Update background processor state
    if (audioContext && audioContext._backgroundProcessor) {
        audioContext._backgroundProcessor.port.postMessage({
            type: 'playbackState',
            isPlaying: false
        });
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
async function initAudioContext() {
    try {
        // Create audio context with latencyHint for better performance
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'playback'
        });
        
        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        
        // Load and register the audio worklet
        await audioContext.audioWorklet.addModule('audio-worklet.js');
        
        // Create background audio processor
        const backgroundProcessor = new AudioWorkletNode(audioContext, 'background-audio-processor');
        backgroundProcessor.connect(audioContext.destination);
        
        // Handle messages from the processor
        backgroundProcessor.port.onmessage = (event) => {
            if (event.data.type === 'tick') {
                // Check if audio context is suspended and resume if needed
                if (audioContext.state === 'suspended' && isPlaying) {
                    resumeAudioContext();
                }
            }
        };
        
        // Store the processor for later use
        audioContext._backgroundProcessor = backgroundProcessor;
        
        // Set up periodic checks for audio context state
        setInterval(() => {
            if (isPlaying && audioContext.state === 'suspended') {
                resumeAudioContext();
            }
        }, 5000); // Check every 5 seconds
        
        // Set up iOS-specific audio session
        if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers) {
            // Request audio session for iOS
            window.webkit.messageHandlers.audioSession.postMessage({
                type: 'requestAudioSession',
                category: 'playback',
                mode: 'default',
                options: ['mixWithOthers', 'duckOthers']
            });
        }

        // Register service worker for background audio
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                    
                    // Set up message handling for the service worker
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data.type === 'audioState') {
                            if (event.data.isPlaying && audioContext.state === 'suspended') {
                                resumeAudioContext();
                            }
                        }
                    });
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed:', err);
                });
        }
        
        // Set up a periodic check to ensure audio context stays active
        setInterval(() => {
            if (isPlaying) {
                // Check if audio context is suspended
                if (audioContext.state === 'suspended') {
                    console.log('Audio context suspended, attempting to resume');
                    resumeAudioContext();
                }
                
                // Check if audio is actually playing
                if (currentAudio && currentAudio.paused) {
                    console.log('Audio paused, attempting to resume');
                    currentAudio.play().catch(err => {
                        console.error('Error resuming audio:', err);
                    });
                }
                
                // Request wake lock if needed
                if (!wakeLock) {
                    requestWakeLock();
                }
            }
        }, 10000); // Check every 10 seconds
        
        console.log('Audio context initialized successfully');
    } catch (error) {
        console.error('Error initializing audio context:', error);
    }
}

// Initialize sound cards
function initializeSoundCards() {
    // Clear existing content
    soundGrid.innerHTML = '';
    
    // Add data-index attribute to each card
    soundData.forEach((sound, index) => {
        const card = createSoundCard(sound, index);
        soundGrid.appendChild(card);
    });
    
    // Add scroll event listener to handle centering
    soundGrid.addEventListener('scroll', handleScroll);
    
    // Initial scroll to center the first card
    setTimeout(() => {
        centerFirstCard();
    }, 100);
}

// Center the first card
function centerFirstCard() {
    const firstCard = soundGrid.querySelector('.sound-card');
    if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const containerWidth = soundGrid.offsetWidth;
        const scrollPosition = (cardWidth + 20) / 2 - containerWidth / 2;
        
        soundGrid.scrollTo({
            left: scrollPosition,
            behavior: 'instant'
        });
    }
}

// Handle scroll events to detect when we reach the end
function handleScroll() {
    const scrollLeft = soundGrid.scrollLeft;
    const scrollWidth = soundGrid.scrollWidth;
    const clientWidth = soundGrid.clientWidth;
    
    // Check if we're at the beginning
    if (scrollLeft < 10) {
        // We're at the beginning, ensure first card is centered
        centerFirstCard();
    }
    
    // Check if we're at the end
    if (scrollLeft + clientWidth >= scrollWidth - 10) {
        // We're at the end, center the last card
        centerLastCard();
    }
}

// Center the last card
function centerLastCard() {
    const cards = soundGrid.querySelectorAll('.sound-card');
    const lastCard = cards[cards.length - 1];
    
    if (lastCard) {
        const cardWidth = lastCard.offsetWidth;
        const containerWidth = soundGrid.offsetWidth;
        const scrollPosition = soundGrid.scrollWidth - containerWidth - (cardWidth + 20) / 2 + containerWidth / 2;
        
        soundGrid.scrollTo({
            left: scrollPosition,
            behavior: 'instant'
        });
    }
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
    // If a different sound is currently playing, pause it first
    if (isPlaying && currentSoundIndex !== index) {
        // Pause the current sound
        pauseSound();
        
        // Play the new sound after a short delay to ensure the previous sound is fully stopped
        setTimeout(() => {
            playSound(index);
        }, 100);
    } else {
        // Toggle play/pause for the current sound
        if (isPlaying) {
            pauseSound();
        } else {
            playSound(index);
        }
    }
}

// Play a sound
function playSound(index) {
    const sound = soundData[index];
    currentSoundIndex = index;
    
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
    currentAudio.loop = true;
    
    // Set iOS-specific audio attributes
    if (typeof currentAudio.webkitAudioContext !== 'undefined') {
        currentAudio.setAttribute('playsinline', '');
        currentAudio.setAttribute('webkit-playsinline', '');
    }
    
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
            
            // Set initial volume for fade in
            gainNode.gain.value = 0;
            
            // Update background processor volume
            if (audioContext._backgroundProcessor) {
                audioContext._backgroundProcessor.port.postMessage({
                    type: 'volume',
                    volume: 0.0001
                });
            }

            // Notify service worker about playback state
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'audioState',
                    isPlaying: true,
                    soundId: sound.id
                });
            }
        } catch (e) {
            console.error('Error connecting audio to Web Audio API:', e);
            currentAudio.volume = 0;
        }
    } else {
        currentAudio.volume = 0;
    }
    
    // Request wake lock when playing
    requestWakeLock();
    
    // Start heartbeat to keep audio context alive
    startHeartbeat();
    
    // Play the audio
    const playPromise = currentAudio.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                isPlaying = true;
                updatePlayButtonUI();
                
                // Start fade in
                fadeIn();
                
                // Request iOS audio session if needed
                if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers) {
                    window.webkit.messageHandlers.audioSession.postMessage({
                        type: 'activateAudioSession'
                    });
                }
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                // Try fallback method using AudioBuffer if available
                if (audioBuffers[sound.id]) {
                    playAudioBuffer(sound.id);
                } else {
                    isPlaying = false;
                    updatePlayButtonUI();
                }
            });
    }
}

// Fade in the audio
function fadeIn() {
    const targetVolume = volumeSlider.value / 100;
    let currentVolume = 0;
    const fadeStep = 0.1;
    
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
    }, 30);
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
    
    // Start fade in
    fadeIn();
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
                
                // Deactivate iOS audio session if needed
                if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers) {
                    window.webkit.messageHandlers.audioSession.postMessage({
                        type: 'deactivateAudioSession'
                    });
                }
            }
        }, 30); // Reduced interval for faster updates
    }
}

// Update play button UI
function updatePlayButtonUI() {
    const cards = document.querySelectorAll('.sound-card');
    cards.forEach((card, index) => {
        // Check if this is the currently playing card
        const isCurrentCard = index === currentSoundIndex;
        
        if (isPlaying && isCurrentCard) {
            // Only add playing class to the current card
            card.classList.add('playing');
            
            // Update play button to pause for the current card
            const playButton = card.querySelector('.play-button svg');
            if (playButton) {
                playButton.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            }
        } else {
            // Remove playing class from all cards
            card.classList.remove('playing');
            
            // Update play button to play for all cards
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
    
    // Check scroll position after animation completes
    setTimeout(() => {
        handleScroll();
    }, 500);
} 
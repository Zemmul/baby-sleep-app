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
let mediaSession = null;

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
    
    // Set up media session for better volume control
    setupMediaSession();
});

// Preload audio files
function preloadAudio() {
    soundData.forEach(sound => {
        const audio = new Audio();
        audio.src = sound.audio;
        audio.preload = 'auto';
        audioCache[sound.id] = audio;
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
    } catch (e) {
        console.error('Web Audio API not supported:', e);
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
        <img src="${sound.image}" alt="${sound.title}">
        <div class="sound-card-content">
            <h3>${sound.title}</h3>
            <p>${sound.description}</p>
        </div>
        <div class="play-button">
            <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
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
            // Check if already connected
            if (!currentAudio._connected) {
                const source = audioContext.createMediaElementSource(currentAudio);
                source.connect(gainNode);
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
    
    // Update media session
    updateMediaSession(index);
    
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
        });
    }
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
                
                // Update UI
                const cards = document.querySelectorAll('.sound-card');
                cards.forEach(card => {
                    card.classList.remove('playing');
                    
                    // Update play button to play
                    const playButton = card.querySelector('.play-button svg');
                    playButton.innerHTML = '<path d="M8 5v14l11-7z"/>';
                });
            }
        }, 30); // Reduced interval for faster updates
    }
}

// Set up media session for better volume control
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        mediaSession = navigator.mediaSession;
        
        // Set up media session metadata
        mediaSession.metadata = new MediaMetadata({
            title: 'Baby Sleep Sounds',
            artist: 'Baby Sleep & Rhyme Time',
            album: 'Sleep Sounds',
            artwork: [
                { src: 'assets/images/default-cover.jpg', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
        
        // Set up media session actions
        mediaSession.setActionHandler('play', () => {
            if (currentAudio && !isPlaying) {
                const activeCard = document.querySelector('.sound-card.playing');
                if (activeCard) {
                    const index = parseInt(activeCard.getAttribute('data-index'));
                    playSound(index);
                }
            }
        });
        
        mediaSession.setActionHandler('pause', () => {
            if (currentAudio && isPlaying) {
                pauseSound();
            }
        });
        
        mediaSession.setActionHandler('stop', () => {
            if (currentAudio) {
                pauseSound();
            }
        });
    }
}

// Update media session when playing a sound
function updateMediaSession(index) {
    if (mediaSession) {
        const sound = soundData[index];
        
        mediaSession.metadata = new MediaMetadata({
            title: sound.title,
            artist: 'Baby Sleep & Rhyme Time',
            album: 'Sleep Sounds',
            artwork: [
                { src: sound.image, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
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
    
    // Listen for device volume changes
    window.addEventListener('volumechange', () => {
        if (currentAudio) {
            // Get the current device volume
            const deviceVolume = gainNode ? gainNode.gain.value : currentAudio.volume;
            
            // Update our UI and stored volume
            updateVolume(deviceVolume);
        }
    });
    
    // Add a global event listener for volume changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && currentAudio) {
            // When the app becomes visible again, sync the volume
            const currentVolume = gainNode ? gainNode.gain.value : currentAudio.volume;
            updateVolume(currentVolume);
        }
    });
    
    // Add a direct event listener for the audio element
    if (currentAudio) {
        currentAudio.addEventListener('volumechange', () => {
            // When the audio volume changes (e.g., from device buttons)
            const newVolume = currentAudio.volume;
            updateVolume(newVolume);
        });
    }
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
    
    // Update the volume icon
    if (volume === 0) {
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
        `;
    } else {
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
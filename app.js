// Sound configuration
const sounds = [
    {
        id: 'white-noise',
        title: 'White Noise',
        category: 'Ambient',
        cover: 'assets/images/white-noise.jpg',
        audio: 'assets/audio/white-noise.mp3'
    },
    {
        id: 'rain',
        title: 'Gentle Rain',
        category: 'Nature',
        cover: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.mp3'
    },
    {
        id: 'lullaby',
        title: 'Sweet Lullaby',
        category: 'Music',
        cover: 'assets/images/lullaby.jpg',
        audio: 'assets/audio/lullaby.mp3'
    },
    {
        id: 'ocean',
        title: 'Ocean Waves',
        category: 'Nature',
        cover: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.mp3'
    }
];

// Audio player state
let currentAudio = null;
let isPlaying = false;

// DOM Elements
const soundGrid = document.getElementById('soundGrid');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeControl = document.getElementById('volume');
const currentCover = document.getElementById('currentCover');
const currentTrack = document.getElementById('currentTrack');
const currentCategory = document.getElementById('currentCategory');

// Initialize the app
function initApp() {
    loadSounds();
    setupEventListeners();
}

// Load sounds into the grid
function loadSounds() {
    soundGrid.innerHTML = sounds.map(sound => `
        <div class="sound-card" data-sound-id="${sound.id}">
            <img src="${sound.cover}" alt="${sound.title}" loading="lazy">
            <h3>${sound.title}</h3>
            <p>${sound.category}</p>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Sound card click
    soundGrid.addEventListener('click', (e) => {
        const soundCard = e.target.closest('.sound-card');
        if (soundCard) {
            const soundId = soundCard.dataset.soundId;
            playSound(soundId);
        }
    });

    // Play/Pause button
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Volume control
    volumeControl.addEventListener('input', (e) => {
        if (currentAudio) {
            currentAudio.volume = e.target.value / 100;
        }
    });
}

// Play a sound
function playSound(soundId) {
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Create and play new audio
    currentAudio = new Audio(sound.audio);
    currentAudio.loop = true;
    currentAudio.volume = volumeControl.value / 100;
    currentAudio.play();

    // Update UI
    currentCover.src = sound.cover;
    currentTrack.textContent = sound.title;
    currentCategory.textContent = sound.category;
    updatePlayPauseButton(true);
    isPlaying = true;
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        updatePlayPauseButton(false);
    } else {
        currentAudio.play();
        updatePlayPauseButton(true);
    }
    isPlaying = !isPlaying;
}

// Update play/pause button UI
function updatePlayPauseButton(playing) {
    const playIcon = playPauseBtn.querySelector('.play-icon');
    playIcon.textContent = playing ? '⏸' : '▶';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 
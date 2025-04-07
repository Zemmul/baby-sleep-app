// YouTube API integration
let player;
let playlistItems = [];
let currentVideoIndex = 0;

// YouTube playlist ID for Wyndham Libraries Online Baby Time
const PLAYLIST_ID = 'PLmT98yAiEP6lEfUrJxyOiFgkm0socMUrw';

// Initialize the YouTube player
function initYouTubePlayer() {
    // Load the YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// This function is called when the YouTube API is ready
function onYouTubeIframeAPIReady() {
    // Create the player
    player = new YT.Player('player', {
        height: '360',
        width: '100%',
        videoId: '', // Will be set when a video is selected
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1,
            'color': 'white'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Called when the player is ready
function onPlayerReady(event) {
    // Load the playlist
    loadPlaylist();
}

// Called when the player state changes
function onPlayerStateChange(event) {
    // Update UI based on player state
    if (event.data === YT.PlayerState.ENDED) {
        // Auto-play next video when current one ends
        playNextVideo();
    }
}

// Load the playlist from YouTube
function loadPlaylist() {
    // In a real implementation, you would use the YouTube Data API to fetch the playlist
    // For this example, we'll use a hardcoded list of videos from the playlist
    
    // This is a sample of videos from the Wyndham Libraries Online Baby Time playlist
    // In a production app, you would fetch this dynamically from the YouTube API
    playlistItems = [
        {
            id: 'dQw4w9WgXcQ', // This is a placeholder ID, replace with actual video IDs
            title: 'Baby Rhyme Time - Welcome',
            description: 'Welcome to Wyndham Libraries Online Baby Time!'
        },
        {
            id: 'dQw4w9WgXcQ', // This is a placeholder ID, replace with actual video IDs
            title: 'Baby Rhyme Time - Twinkle Twinkle Little Star',
            description: 'Sing along to Twinkle Twinkle Little Star with Wyndham Libraries.'
        },
        {
            id: 'dQw4w9WgXcQ', // This is a placeholder ID, replace with actual video IDs
            title: 'Baby Rhyme Time - Incy Wincy Spider',
            description: 'Sing along to Incy Wincy Spider with Wyndham Libraries.'
        },
        {
            id: 'dQw4w9WgXcQ', // This is a placeholder ID, replace with actual video IDs
            title: 'Baby Rhyme Time - Old MacDonald Had a Farm',
            description: 'Sing along to Old MacDonald Had a Farm with Wyndham Libraries.'
        },
        {
            id: 'dQw4w9WgXcQ', // This is a placeholder ID, replace with actual video IDs
            title: 'Baby Rhyme Time - Five Little Ducks',
            description: 'Sing along to Five Little Ducks with Wyndham Libraries.'
        }
    ];
    
    // Render the playlist
    renderPlaylist();
}

// Render the playlist in the UI
function renderPlaylist() {
    const playlistElement = document.getElementById('playlist');
    playlistElement.innerHTML = ''; // Clear existing items
    
    playlistItems.forEach((item, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.dataset.index = index;
        
        playlistItem.innerHTML = `
            <div class="playlist-thumbnail">
                <img src="https://img.youtube.com/vi/${item.id}/mqdefault.jpg" alt="${item.title}">
                <span class="play-icon">▶</span>
            </div>
            <div class="playlist-info">
                <h4>${item.title}</h4>
            </div>
        `;
        
        playlistItem.addEventListener('click', () => {
            playVideo(index);
        });
        
        playlistElement.appendChild(playlistItem);
    });
}

// Play a specific video
function playVideo(index) {
    if (index < 0 || index >= playlistItems.length) return;
    
    currentVideoIndex = index;
    const video = playlistItems[index];
    
    // Update the player
    player.loadVideoById(video.id);
    
    // Update the UI
    document.getElementById('video-title').textContent = video.title;
    document.getElementById('video-description').textContent = video.description;
    
    // Update the active playlist item
    updateActivePlaylistItem();
}

// Play the next video
function playNextVideo() {
    const nextIndex = (currentVideoIndex + 1) % playlistItems.length;
    playVideo(nextIndex);
}

// Update the active playlist item
function updateActivePlaylistItem() {
    const playlistItems = document.querySelectorAll('.playlist-item');
    
    playlistItems.forEach((item, index) => {
        if (index === currentVideoIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initYouTubePlayer();
}); 
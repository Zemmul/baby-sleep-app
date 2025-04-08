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
    const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // You'll need to replace this with a real API key
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            playlistItems = data.items.map(item => ({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description: item.snippet.description
            }));
            renderPlaylist();
            // Play the first video automatically
            if (playlistItems.length > 0) {
                playVideo(0);
            }
        })
        .catch(error => {
            console.error('Error loading playlist:', error);
            // Fallback to sample videos if API fails
            playlistItems = [
                {
                    id: 'dQw4w9WgXcQ',
                    title: 'Sample Video 1',
                    description: 'This is a sample video description.'
                }
            ];
            renderPlaylist();
        });
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
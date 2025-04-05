# Help Me Make My Baby Sleep

A beautiful, baby-friendly Progressive Web App (PWA) that plays soothing sounds to help babies sleep. Inspired by Spotify and Winamp, but designed with a soft, calming aesthetic perfect for babies.

## Features

- 🎵 Multiple soothing sounds (white noise, rain, lullabies, ocean waves)
- 📱 Responsive, mobile-first design
- 🌙 Beautiful, baby-friendly UI with pastel colors
- 📲 Installable as a PWA
- 🔄 Offline capable
- 🔊 Volume control
- 🎨 Easy to customize sounds and cover art

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/baby-sleep-app.git
```

2. Open `index.html` in your browser or deploy to your preferred hosting service.

## Customization

To add or modify sounds, edit the `sounds` array in `app.js`:

```javascript
const sounds = [
    {
        id: 'your-sound-id',
        title: 'Your Sound Title',
        category: 'Category',
        cover: 'path/to/cover.jpg',
        audio: 'path/to/audio.mp3'
    }
];
```

## Deployment

This app can be deployed to any static hosting service like:
- GitHub Pages
- Vercel
- Netlify
- Firebase Hosting

## License

MIT License - feel free to use this project for your own baby sleep app! 
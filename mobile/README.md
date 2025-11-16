# Tic-Tac-Toe Mobile Client

A cross-platform mobile client for the Tic-Tac-Toe Multiplayer game, built with React Native and Expo.

## 📱 Features

- 🎮 Real-time multiplayer gameplay
- 🔐 Device-based authentication
- 🎯 Automated skill-based matchmaking
- 🏆 Global leaderboards
- 📊 Player statistics
- 🔄 Automatic reconnection
- 📱 iOS and Android support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer/mobile

# Install dependencies
npm install

# Start the development server
npm start
```

### Configuration

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_NAKAMA_HOST=your-server.com
EXPO_PUBLIC_NAKAMA_PORT=7350
EXPO_PUBLIC_NAKAMA_USE_SSL=true
EXPO_PUBLIC_SERVER_KEY=your-server-key
```

## 🏗️ Project Structure

```
mobile/
├── App.js                  # App entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── src/
    ├── screens/           # Screen components
    │   ├── AuthScreen.js
    │   ├── LobbyScreen.js
    │   ├── MatchmakingScreen.js
    │   ├── GameScreen.js
    │   └── ResultScreen.js
    ├── components/        # Reusable UI components
    │   ├── Board.js
    │   ├── Cell.js
    │   └── Leaderboard.js
    └── services/          # API and realtime services
        ├── api.js
        └── socket.js
```

## 🎮 Game Flow

1. **Authentication**
   - Device-based login
   - Display name setup
   - Session persistence

2. **Lobby**
   - View player stats
   - Browse leaderboard
   - Start matchmaking

3. **Matchmaking**
   - Search for opponents
   - Cancel option
   - Automatic match start

4. **Gameplay**
   - Interactive board
   - Turn indicators
   - Real-time updates

5. **Results**
   - Match outcome
   - Statistics
   - Rematch option

## 🛠 Development

### Running the App

```bash
# Start Metro bundler
npm start

# iOS Simulator
expo start --ios

# Android Emulator
expo start --android

# Web (for testing)
expo start --web
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### Debugging

- Shake device → Show Dev Menu
- Enable Remote Debugging
- Use React Native Debugger
- View logs with `expo logs`

## 📦 Building for Production

### iOS

```bash
# Build the app
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### Android

```bash
# Build the app
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## 🚨 Troubleshooting

### Common Issues

**App won't connect to server**
- Verify server is running
- Check network connectivity
- Ensure correct host/port in `.env`

**Build fails**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo SDK version compatibility

**Performance issues**
- Enable Hermes in `app.json`
- Use production builds for testing
- Optimize re-renders with React.memo

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Your Name]

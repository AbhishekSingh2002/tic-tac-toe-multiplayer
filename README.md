# Tic-Tac-Toe Multiplayer

A scalable, real-time multiplayer Tic-Tac-Toe game built with Nakama server and React Native client.

## 🚀 Features

- **Real-time Multiplayer**: WebSocket-based gameplay with instant updates
- **Smart Matchmaking**: Automatic player pairing with skill-based rating system
- **Cross-Platform**: Native mobile apps for iOS and Android using React Native
- **Secure Authentication**: Device-based auth with JWT tokens
- **Player Statistics**: Comprehensive stats tracking and leaderboards
- **Scalable Architecture**: Designed for 10,000+ concurrent players
- **Modern Tech Stack**: Nakama, PostgreSQL, React Native, Expo

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Setup & Installation](#-setup--installation)
- [Architecture & Design](#-architecture--design)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)

## 🏃‍♂️ Quick Start

Get the game running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer

# 2. Start the server
docker-compose up -d

# 3. Verify installation
curl http://localhost:7350/v2/health

# 4. Access admin console
open http://localhost:7351
# Username: admin, Password: password
```

## ⚙️ Setup & Installation

### Prerequisites

**Required:**
- Docker & Docker Compose
- Node.js 16+ (for mobile development)
- Git

**Optional (for mobile development):**
- Expo CLI: `npm install -g @expo/cli`
- React Native CLI: `npm install -g react-native-cli`
- iOS Simulator (macOS) or Android Studio

### Local Development Setup

#### 1. Server Setup

```bash
# Clone and navigate to project
git clone https://github.com/your-username/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer

# Start Nakama server and PostgreSQL
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose logs -f nakama

# Verify server is running
curl http://localhost:7350/v2/health
```

#### 2. Mobile Client Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Scan QR code with Expo Go app on mobile device
# OR run on simulator:
npm run ios        # iOS Simulator (macOS only)
npm run android    # Android Studio/Emulator
```

#### 3. Environment Configuration

Create `.env` file in project root:

```bash
# Copy template
cp .env.example .env

# Edit with your configuration
NAKAMA_SERVER_KEY=defaultkey
NAKAMA_HOST=localhost
NAKAMA_PORT=7350
DATABASE_URL=postgres://nakama:nakama_password@localhost:5432/nakama
```

### Verification

Test that everything is working:

```bash
# Test server health
curl http://localhost:7350/v2/health

# Test admin console access
curl http://localhost:7351

# Run matchmaking test
./test-matchmaking.ps1  # PowerShell
# OR
./test-debug.ps1       # Alternative test
```

## 🏗️ Architecture & Design

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Native App]
        B[Expo Go]
    end
    
    subgraph "Server Layer"
        C[Nakama Server]
        D[Lua Modules]
        E[Match Handler]
        F[Game Logic]
    end
    
    subgraph "Data Layer"
        G[PostgreSQL]
        H[Redis Cache]
    end
    
    A -->|WebSocket| C
    B -->|WebSocket| C
    C --> D
    D --> E
    D --> F
    C --> G
    C --> H
```

### Design Decisions

#### **Nakama as Game Server**
- **Why**: Purpose-built for multiplayer games with real-time features
- **Benefits**: Built-in matchmaking, leaderboards, authentication, scalability
- **Trade-offs**: Learning curve for Lua modules

#### **PostgreSQL for Persistence**
- **Why**: ACID compliance, complex queries, reliability
- **Benefits**: Strong consistency, mature ecosystem
- **Trade-offs**: Requires more resources than NoSQL alternatives

#### **React Native + Expo**
- **Why**: Cross-platform development with single codebase
- **Benefits**: Fast development, over-the-air updates, large ecosystem
- **Trade-offs**: Performance overhead vs native

#### **Microservices Architecture**
- **Why**: Separation of concerns, independent scaling
- **Benefits**: Easier maintenance, technology flexibility
- **Trade-offs**: Increased complexity for small projects

### Component Breakdown

#### **Server Components**
- **Matchmaker**: Handles player pairing and queue management
- **Game Logic**: Move validation, win detection, state management
- **Match Handler**: Real-time game coordination via WebSocket
- **Statistics**: Player performance tracking and rankings

#### **Client Components**
- **Authentication**: Device-based login and session management
- **Lobby**: Matchmaking interface and player discovery
- **Game Board**: Interactive Tic-Tac-Toe grid
- **Results**: Game outcomes and statistics display

### Data Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nakama
    participant DB as Database
    
    C->>N: Authenticate device
    N->>DB: Create/find user
    DB-->>N: User data
    N-->>C: JWT token
    
    C->>N: Find match
    N->>N: Matchmaking logic
    N-->>C: Match found
    
    C->>N: Make move
    N->>N: Validate move
    N->>N: Update game state
    N->>DB: Save move
    N-->>C: Game update
```

## 📡 API Documentation

### Base URLs

- **Development**: `http://localhost:7350`
- **Production**: `https://api.yourdomain.com`

### Authentication

All API requests require authentication:

```http
Authorization: Bearer <jwt_token>
```

#### Device Authentication

```http
POST /v2/account/authenticate/device
Content-Type: application/json

{
  "id": "unique-device-id",
  "create": true,
  "username": "optional-username"
}
```

### Core Endpoints

#### Matchmaking

**Find Match**
```http
POST /v2/rpc/find_match
Authorization: Bearer <token>

# Response
{
  "ticket": "matchmaker-ticket-uuid",
  "message": "Finding match..."
}
```

**Cancel Matchmaking**
```http
POST /v2/rpc/cancel_matchmaking
Content-Type: application/json

{
  "ticket": "matchmaker-ticket-uuid"
}
```

#### Gameplay

**Make Move**
```http
POST /v2/rpc/make_move
Content-Type: application/json

{
  "match_id": "match-uuid",
  "cell_index": 4
}

# Response
{
  "success": true,
  "state": {
    "board": ["X", "", "", "", "O", "", "", "", ""],
    "next_turn": "X",
    "status": "active"
  },
  "game_status": "continue"
}
```

#### Statistics

**Get Player Stats**
```http
POST /v2/rpc/get_player_stats
Authorization: Bearer <token>

# Response
{
  "wins": 10,
  "losses": 5,
  "draws": 2,
  "rating": 1550
}
```

**Get Leaderboard**
```http
POST /v2/rpc/get_leaderboard
Content-Type: application/json

{
  "limit": 50
}

# Response
[
  {
    "user_id": "user-uuid-1",
    "username": "Player1",
    "score": 1800,
    "rank": 1
  }
]
```

### WebSocket Events

#### Connection
```javascript
const client = new Client('defaultkey', 'localhost', '7350');
const socket = client.createSocket();
await socket.connect(session);
```

#### Game Events
```javascript
// Match found
socket.onmatchdata = (matchData) => {
  console.log('Game update:', matchData.data);
};

// Match complete
socket.onmatchpresence = (matchPresence) => {
  console.log('Player status changed:', matchPresence);
};
```

### Rate Limits

| Endpoint | Limit | Period |
|----------|-------|--------|
| Matchmaking | 20 requests | per hour |
| Make Move | 30 requests | per minute |
| Leaderboard | 100 requests | per hour |
| Player Stats | 50 requests | per hour |

## 🚀 Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f nakama

# Stop services
docker-compose down
```

### Cloud Deployment (AWS)

#### Prerequisites
- AWS CLI configured
- Docker installed
- Appropriate IAM permissions

#### Step 1: Build and Push Image

```bash
# Build Docker image
docker build -f Dockerfile.nakama -t tic-tac-toe-nakama .

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag tic-tac-toe-nakama:latest \
  YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/tic-tac-toe-nakama:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/tic-tac-toe-nakama:latest
```

#### Step 2: Deploy Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier tic-tac-toe-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username nakama \
  --master-user-password your-secure-password \
  --allocated-storage 20
```

#### Step 3: Deploy Application

```bash
# Deploy to ECS
aws ecs register-task-definition --cli-input-json file://deploy/aws/ecs-task-definition.json
aws ecs create-service --cluster tic-tac-toe-cluster --service-name tic-tac-toe-nakama \
  --task-definition tic-tac-toe-nakama --desired-count 1
```

#### Step 4: Configure Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer --name tic-tac-toe-lb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx
```

### Kubernetes Deployment

```bash
# Deploy all services
kubectl apply -f deploy/

# Check deployment status
kubectl get pods -n tic-tac-toe
kubectl get services -n tic-tac-toe

# Scale if needed
kubectl scale deployment nakama --replicas=3 -n tic-tac-toe
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NAKAMA_SERVER_KEY` | Server authentication key | `defaultkey` | Yes |
| `NAKAMA_DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `NAKAMA_CONSOLE_PASSWORD` | Admin console password | `password` | Yes |
| `REDIS_URL` | Redis connection string | - | No |
| `LOG_LEVEL` | Logging verbosity | `INFO` | No |
| `METRICS_PORT` | Prometheus metrics port | `9100` | No |

## 🧪 Testing

### Server Testing

#### Automated Tests

```bash
# Run matchmaking test
./test-matchmaking.ps1

# Run debug tests
./test-debug.ps1

# Test win detection
open test_win_detection.html  # In browser
```

#### Manual Testing

1. **Authentication Test**
   ```bash
   curl -X POST http://localhost:7350/v2/account/authenticate/device \
     -H 'Authorization: Basic ZGVmYXVsdGtleTo=' \
     -H 'Content-Type: application/json' \
     -d '{"id":"test-device","create":true,"username":"TestUser"}'
   ```

2. **Matchmaking Test**
   ```bash
   # Get auth token first, then:
   curl -X POST http://localhost:7350/v2/rpc/find_match \
     -H 'Authorization: Bearer YOUR_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

#### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

### Client Testing

#### Mobile App Testing

```bash
# Navigate to mobile directory
cd mobile

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

#### Manual Testing Checklist

**Authentication Flow:**
- [ ] Device registration works
- [ ] Session token generation
- [ ] Token refresh mechanism
- [ ] Invalid credentials handling

**Matchmaking Flow:**
- [ ] Join matchmaking queue
- [ ] Match found notification
- [ ] Cancel matchmaking
- [ ] Queue timeout handling

**Gameplay Flow:**
- [ ] Move submission
- [ ] Move validation
- [ ] Win detection
- [ ] Draw detection
- [ ] Game over handling

**Statistics Flow:**
- [ ] Stats update after game
- [ ] Leaderboard updates
- [ ] Rating calculation
- [ ] Historical data

### Test Data

**Test Users:**
- Player 1: `player1@test.com` / `password123`
- Player 2: `player2@test.com` / `password123`

**Test Scenarios:**
- Complete game flow (2 players)
- Concurrent matchmaking (4+ players)
- Network disconnection/reconnection
- Invalid move handling
- Timeout scenarios

## 👨‍💻 Development Guide

### Project Structure

```
tic-tac-toe-multiplayer/
├── server/
│   ├── nakama/
│   │   └── modules/           # Custom Lua modules
│   │       ├── game_logic/    # Game rules and validation
│   │       └── matchmaking/   # Player pairing logic
│   └── postgres/
│       └── init.sql          # Database initialization
├── mobile/                   # React Native client
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/          # App screens
│   │   ├── services/         # API and networking
│   │   └── utils/            # Helper functions
│   └── assets/               # Images and fonts
├── deploy/                   # Deployment configurations
│   ├── aws/                  # AWS deployment files
│   └── k8s/                  # Kubernetes manifests
├── docs/                     # Documentation
├── public/                   # Static files and tests
└── tests/                    # Test files and utilities
```

### Adding New Features

1. **Server-side (Lua)**
   ```bash
   # Create new module
   touch server/nakama/modules/new_feature.lua
   
   # Register RPC endpoint
   # Add to nakama.yml configuration
   
   # Test with curl
   curl -X POST http://localhost:7350/v2/rpc/new_feature
   ```

2. **Client-side (React Native)**
   ```bash
   # Create new component
   touch mobile/src/components/NewFeature.jsx
   
   # Add navigation
   # Update App.js or navigation config
   
   # Test on device/simulator
   npm run ios  # or npm run android
   ```

### Code Style

**Lua (Server):**
- Use 2 spaces for indentation
- Prefix local variables with `local_`
- Comment complex logic
- Follow Nakama conventions

**JavaScript/React (Client):**
- Use 2 spaces for indentation
- Prefer functional components with hooks
- Use TypeScript when possible
- Follow React Native guidelines

### Debugging

#### Server Debugging

```bash
# View real-time logs
docker-compose logs -f nakama

# Debug Lua modules
# Add logging to your Lua code:
nk.logger_error("Debug message")

# Connect to Nakama console
open http://localhost:7351
```

#### Client Debugging

```bash
# React Native debugger
# Shake device/emulator and select "Debug"

# View logs
npx react-native log-ios
npx react-native log-android

# Network debugging
# Use React Native Debugger or Flipper
```

## 🔧 Troubleshooting

### Common Issues

#### **Server Won't Start**
```bash
# Check Docker logs
docker-compose logs nakama

# Common solutions:
# 1. Check port conflicts (7350, 7351, 5432)
# 2. Verify Docker is running
# 3. Check docker-compose.yml syntax
```

#### **Database Connection Errors**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 30 seconds, then start nakama
docker-compose up -d nakama
```

#### **Matchmaking Not Working**
```bash
# Verify Nakama modules are loaded
curl http://localhost:7350/v2/rpc/find_match

# Check matchmaking logs
docker-compose logs nakama | grep matchmaking
```

#### **Mobile App Connection Issues**
```bash
# Verify server is accessible
curl http://localhost:7350/v2/health

# Check network configuration
# Ensure mobile device and server are on same network
# Update IP address in app configuration
```

### Performance Issues

#### **High Latency**
- Check server resource usage
- Monitor database query performance
- Verify network connectivity
- Consider Redis caching

#### **Memory Issues**
- Monitor Docker container memory
- Check for memory leaks in Lua modules
- Optimize database connections

### Getting Help

1. **Check logs**: `docker-compose logs -f nakama`
2. **Verify configuration**: Check `.env` and `docker-compose.yml`
3. **Test components**: Run individual test scripts
4. **Community**: Post issues on GitHub Discussions
5. **Documentation**: Check Nakama official docs

## 📝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push branch: `git push origin feature/amazing-feature`
7. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Nakama](https://heroiclabs.com/) - Game server platform
- [React Native](https://reactnative.dev/) - Mobile framework
- [Expo](https://expo.dev/) - Development platform
- [PostgreSQL](https://www.postgresql.org/) - Database

---

**Built with ❤️ for the gaming community**

For support, please open an issue on GitHub or join our Discord community.

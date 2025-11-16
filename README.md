# Tic-Tac-Toe Multiplayer Server

A scalable, real-time multiplayer Tic-Tac-Toe game server built with Nakama.

## Features

- 🎮 Real-time multiplayer gameplay
- 🔄 Automatic matchmaking with skill-based pairing
- 📊 Player statistics and leaderboards
- 🔒 Secure authentication
- 📱 Mobile-optimized API
- 🚀 Scalable architecture

## Architecture

```mermaid
graph TD
    A[Client] -->|WebSocket| B[Nakama Server]
    B -->|PostgreSQL| C[(Database)]
    B --> D[Custom Lua Modules]
    D --> E[Game Logic]
    D --> F[Matchmaking]
    D --> G[Match Handler]
```

## Prerequisites

- Docker & Docker Compose
- Node.js 16+ (for client SDK)
- (Optional) Kubernetes cluster for production

## Local Development

### Start Services

```bash
# Start Nakama and PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f nakama
```

### Access Admin Console

- **URL**: http://localhost:7351
- **Username**: admin
- **Password**: password (change in production)

## Project Structure

```
server/
├── Dockerfile           # Nakama server container
├── nakama/
│   ├── modules/         # Custom Lua modules
│   │   ├── game_logic/  # Game rules and logic
│   │   └── matchmaking/ # Matchmaking logic
│   └── nakama.yml       # Server configuration
deploy/
├── postgres.yaml        # PostgreSQL K8s config
├── nakama.yaml          # Nakama K8s config
└── networking.yaml      # Networking config
```

## API Documentation

### Authentication

```http
POST /v2/account/authenticate/device
```

### Game Endpoints

- `POST /v2/rpc/find_match` - Join matchmaking queue
- `POST /v2/rpc/make_move` - Submit a move
- `GET /v2/rpc/get_leaderboard` - Get leaderboard data

## Deployment

### Local Development

```bash
# Start Nakama and PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f nakama
```

### Cloud Deployment (AWS)

#### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed
- AWS ECR repository created
- AWS RDS PostgreSQL instance created

#### Step 1: Build and Push Docker Image

```bash
# Build the Docker image
docker build -f Dockerfile.nakama -t tic-tac-toe-nakama .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag tic-tac-toe-nakama:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tic-tac-toe-nakama:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tic-tac-toe-nakama:latest
```

#### Step 2: Deploy RDS PostgreSQL

```bash
# Create RDS parameter group
aws rds create-db-parameter-group --db-parameter-group-name tic-tac-toe-postgres-params --db-parameter-group-family postgres14 --description "Custom parameter group for Tic-Tac-Toe"

# Apply parameters from deploy/aws/rds-parameters.json
aws rds modify-db-parameter-group --db-parameter-group-name tic-tac-toe-postgres-params --parameters file://deploy/aws/rds-parameters.json

# Create RDS instance
aws rds create-db-instance --db-instance-identifier tic-tac-toe-db --db-instance-class db.t3.micro --engine postgres --engine-version 14.9 --master-username nakama --master-user-password your-secure-password --allocated-storage 20 --db-parameter-group-name tic-tac-toe-postgres-params --vpc-security-group-ids sg-xxxxxxxxx --db-subnet-group-name default
```

#### Step 3: Deploy ECS Service

```bash
# Register ECS task definition
aws ecs register-task-definition --cli-input-json file://deploy/aws/ecs-task-definition.json

# Create ECS cluster
aws ecs create-cluster --cluster-name tic-tac-toe-cluster

# Create service
aws ecs create-service --cluster tic-tac-toe-cluster --service-name tic-tac-toe-nakama --task-definition tic-tac-toe-nakama --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}"
```

#### Step 4: Configure Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer --name tic-tac-toe-lb --subnets subnet-xxxxxxxxx subnet-yyyyyyyy --security-groups sg-xxxxxxxxx

# Create target group
aws elbv2 create-target-group --name tic-tac-toe-nakama --protocol HTTP --port 7350 --vpc-id vpc-xxxxxxxxx --target-type ip

# Create listener
aws elbv2 create-listener --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:loadbalancer/app/tic-tac-toe-lb/xxxxxxxxx --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:targetgroup/tic-tac-toe-nakama/xxxxxxxxx
```

#### Production URLs

After deployment, update your `.env` file with the production URLs:

```bash
PRODUCTION_NAKAMA_HOST=your-nakama-domain.com
PRODUCTION_DATABASE_URL=postgres://nakama:your-secure-password@tic-tac-toe-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/nakama
PRODUCTION_FRONTEND_URL=https://your-frontend-domain.com
PRODUCTION_MOBILE_API_URL=https://your-nakama-domain.com
```

### Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f deploy/

# Check status
kubectl get pods
kubectl get svc
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NAKAMA_DATABASE_URL` | PostgreSQL connection string | `postgres://nakama:password@postgres:5432/nakama` |
| `NAKAMA_SERVER_KEY` | Server authentication key | `defaultkey` |
| `NAKAMA_CONSOLE_PASSWORD` | Admin console password | `password` |

## Monitoring

### Metrics

Prometheus metrics available at `:7351/metrics`

### Logs

```bash
# View logs
docker-compose logs nakama

# Follow logs
docker-compose logs -f nakama
```

## Security

1. Change default credentials
2. Enable TLS/SSL
3. Configure network policies
4. Set up monitoring and alerts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT

---

Built with ❤️ by Your Name

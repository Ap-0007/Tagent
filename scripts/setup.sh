#!/bin/bash
# Tagent Development Setup Script

set -e

echo "=== Tagent Development Setup ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "  ✗ $1 not found. Please install $1."
        exit 1
    else
        echo "  ✓ $1 found"
    fi
}

check_command git
check_command docker
check_command go
check_command python3
check_command node
check_command npm

echo ""
echo "All prerequisites met."
echo ""

# Start local infrastructure
echo "Starting local infrastructure..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "Installing AI Engine dependencies..."
cd backend/services/ai-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../../..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Services:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis:      localhost:6379"
echo "  Prometheus: localhost:9090"
echo "  Kafka:      localhost:9092"
echo ""
echo "To start the API Gateway:"
echo "  cd backend/services/api-gateway && go run cmd/server/main.go"
echo ""
echo "To start the AI Engine:"
echo "  cd backend/services/ai-engine && uvicorn app.main:app --port 8083"

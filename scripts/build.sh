#!/bin/bash
# Build all Tagent services

set -e

echo "=== Building Tagent Services ==="

# API Gateway
echo "Building API Gateway..."
cd backend/services/api-gateway
go build -o ../../../bin/tagent-api-gateway ./cmd/server
cd ../../..

# Discovery
echo "Building Discovery Service..."
cd backend/services/discovery
go build -o ../../../bin/tagent-discovery ./cmd/server
cd ../../..

echo ""
echo "=== Build Complete ==="
echo "Binaries in ./bin/"

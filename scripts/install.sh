#!/bin/sh
# Tagent CLI Installer
# Usage: curl -sSL https://get.tagent.cfd | sh

set -e

REPO="Tagent-dev/Tagent"
BINARY="tagent"
INSTALL_DIR="/usr/local/bin"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "$OS" in
  linux|darwin) ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Get latest release tag
echo "Detecting latest version..."
TAG=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)

if [ -z "$TAG" ]; then
  echo "Could not detect latest version. Using v0.3.0"
  TAG="v0.3.0"
fi

echo "Installing Tagent CLI ${TAG} (${OS}/${ARCH})..."

# Download binary
URL="https://github.com/${REPO}/releases/download/${TAG}/tagent-${OS}-${ARCH}"
echo "Downloading from: ${URL}"

curl -sSL -o /tmp/${BINARY} "${URL}"
chmod +x /tmp/${BINARY}

# Install
if [ -w "$INSTALL_DIR" ]; then
  mv /tmp/${BINARY} ${INSTALL_DIR}/${BINARY}
else
  echo "Need sudo to install to ${INSTALL_DIR}"
  sudo mv /tmp/${BINARY} ${INSTALL_DIR}/${BINARY}
fi

echo ""
echo "✓ Tagent CLI installed successfully!"
echo "  Version: ${TAG}"
echo "  Location: ${INSTALL_DIR}/${BINARY}"
echo ""
echo "Get started:"
echo "  tagent status"
echo "  tagent incidents"
echo "  tagent chat 'how many pods are running?'"
echo ""
echo "Set your API URL:"
echo "  export TAGENT_API_URL=http://your-cluster:8080"

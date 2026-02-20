#!/bin/bash
# Build script for RivicQ Crosschain Hub

set -e

VERSION=${1:-v2.0.0}
PROFILE=${2:-release}

echo "========================================="
echo "  RivicQ Crosschain Hub Build Script"
echo "========================================="
echo "Version: $VERSION"
echo "Profile: $PROFILE"
echo ""

# Build OSS
echo "[1/2] Building OSS version..."
cd crosschain-hub
cargo build --$PROFILE --features oss
echo "✅ OSS build complete"

# Build Enterprise
echo ""
echo "[2/2] Building Enterprise version..."
cargo build --$PROFILE --features enterprise
echo "✅ Enterprise build complete"

echo ""
echo "========================================="
echo "  Build Complete!"
echo "========================================="
echo ""
echo "Artifacts:"
echo "  OSS:       target/$PROFILE/libcrosschain_hub.so"
echo "  Enterprise: target/$PROFILE/libcrosschain_hub.so"
echo ""
echo "Docker images:"
echo "  docker build -t rivicq/crosschain-hub:oss-$VERSION ."
echo "  docker build -t rivicq/crosschain-hub:enterprise-$VERSION -f Dockerfile.enterprise ."

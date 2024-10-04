#!/bin/bash

# This script installs NVM and Node.js

# Define the NVM version to install
NVM_VERSION="v0.39.5"  # You can change this to the latest version

# Install NVM
echo "Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Check if NVM is installed
command -v nvm > /dev/null
if [ $? -ne 0 ]; then
    echo "NVM installation failed."
    exit 1
fi

# Install the latest LTS version of Node.js
echo "Installing the latest LTS version of Node.js..."
nvm install --lts

# Verify installation
echo "Verifying Node.js installation..."
node -v
npm -v

echo "Node.js installation using NVM completed!"

npm install
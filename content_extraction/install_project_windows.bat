@echo off
setlocal

REM Define NVM version
set NVM_VERSION=1.1.9

REM Download nvm-windows installer
echo Downloading nvm-windows...
curl -LO https://github.com/coreybutler/nvm-windows/releases/download/%NVM_VERSION%/nvm-setup.zip

REM Unzip the installer
echo Unzipping the installer...
tar -xf nvm-setup.zip

REM Run the installer
echo Installing nvm-windows...
start /wait nvm-setup.exe

REM Clean up
del nvm-setup.zip
del nvm-setup.exe

REM Install the latest LTS version of Node.js
echo Installing the latest LTS version of Node.js...
nvm install lts
nvm use lts

REM Verify installation
echo Verifying Node.js installation...
node -v
npm -v

echo Node.js installation using nvm-windows completed!

npm install

endlocal

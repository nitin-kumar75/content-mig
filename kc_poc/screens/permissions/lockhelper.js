import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

class LockBluetoothHelper {

    constructor(context, deviceId, token) {
        this.context = context;
        this.deviceId = deviceId;
        this.token = token;
        this.bleManager = new BleManager();
        this.reachedTimeout = false;
        this.reconnectTimer = null;
        this.timeoutTimer = null;
        this.echoInitialized = false;
    }

    async startConnectionWithLock() {
        try {
            if (!this.deviceId) {
                alert('Device not found.');
                this.disconnectDevice();
                return;
            }
            this.disconnectDevice();
            await this.startConnection();
        } catch (error) {
            console.error('Error in startConnectionWithLock:', error);
        }
    }

    

    async startConnection() {
        try {
            this.reachedTimeout = false;
            await this.connectToDevice();
            this.startTimeoutTimer();
        } catch (error) {
            console.error('Error in startConnection:', error);
        }
    }

    async connectToDevice() {
        try {
            const device = await this.bleManager.connectToDevice(this.deviceId, { autoConnect: true });
            await device.discoverAllServicesAndCharacteristics();
            this.enableNotifications(device);
        } catch (error) {
            this.scheduleReconnect();
        }
    }

    async enableNotifications(device) {
        try {
            await device.writeCharacteristicWithResponseForService(
                Constants.SERVICE_UUID,
                Constants.CHARACTERISTIC_UUID,
                Buffer.from([0x01, 0x00]).toString('base64')
            );
        } catch (error) {
            console.error('Error enabling notifications:', error);
        }
    }

    startTimeoutTimer() {
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        this.timeoutTimer = setTimeout(() => {
            this.reachedTimeout = true;
            this.scheduleReconnect();
        }, Constants.TIMEOUT_IN_MILLIS);
    }

    scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            if (!this.reachedTimeout) this.connectToDevice();
        }, Constants.ATTEMPT_RECONNECT_AFTER_MILLISECONDS);
    }

    async disconnectDevice() {
        try {
            if (this.deviceId) {
                await this.bleManager.cancelDeviceConnection(this.deviceId);
            }
        } catch (error) {
            console.error('Error disconnecting from device:', error);
        }
    }

    openLock() {
        const message = Buffer.from(this.token, 'base64');
        this.sendMessage(message);
    }

    async sendMessage(message) {
        try {
            if (!this.echoInitialized) {
                await this.connectToDevice();
                return;
            }

            await this.device.writeCharacteristicWithResponseForService(
                Constants.SERVICE_UUID,
                Constants.CHARACTERISTIC_UUID,
                Buffer.from(message).toString('base64')
            );
        } catch (error) {
            console.error('Error sending message:', error);
            this.scheduleReconnect();
        }
    }
}

const Constants = {
    SERVICE_UUID: 'd3810001-96ad-447f-a62f-fd0e6460d4d6',
    CHARACTERISTIC_UUID: 'd3810003-96ad-447f-a62f-fd0e6460d4d6',
    TIMEOUT_IN_MILLIS: 11000,
    ATTEMPT_RECONNECT_AFTER_MILLISECONDS: 5000,
};

export default LockBluetoothHelper;

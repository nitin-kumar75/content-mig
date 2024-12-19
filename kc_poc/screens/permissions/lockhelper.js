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

    function base64ToUint8Array(base64) => {
        const binaryString = atob(base64); // Decode base64 string into a binary string
        const byteArray = new Uint8Array(binaryString.length);
      
        for (let i = 0; i < binaryString.length; i++) {
          byteArray[i] = binaryString.charCodeAt(i);
        }
      
        return byteArray;
    }
      
    function mergeLsb(bytes) {
        // Merge bytes to the appropriate lock ID format
        return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    }
      
    function handleManufacturerData(device, ourLockId) => {
      
        const manufacturerData = device.manufacturerData;

        console.log("manufacturerData -- ", manufacturerData, ourLockId)
        if(manufacturerData !== null){

          let data = base64ToUint8Array(manufacturerData); 
      
          let index = 0;
      
          // Parse manufacturer code (2 bytes)
          const manuCode = data[index++] + (data[index++] << 8);
      
          
          if(manuCode == MANUCODE) {

              const version = data[index++];
              const deviceType = data[index++]
              const lockNumber = data[index++] + (data[index++] << 8);
        
      
              const lockId = new DataView(Uint8Array.from(data.slice(index, index + 4)).buffer).getUint32(0, true);
      
                if(ourLockId == lockId){
                  return {
                    id: device.id,
                    name: device.name,
                    manuCode: manuCode,
                    version: version,
                    deviceType,
                    lockNumber,
                    lockId,
                    manuData: manufacturerData
                  
                } } else{
                 return null;
                }
        }}
      
        return null;
      };

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

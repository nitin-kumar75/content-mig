import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import LockBluetoothHelper from './lockhelper';

const Device = ({ route }) => {
    const [bleManager] = useState(new BleManager());
    const [devices, setDevices] = useState([]);
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [lockHelper, setLockHelper] = useState(null);
    const { data } = route.params;


    useEffect(() => {
        if (Platform.OS === 'android') requestPermissions();
        return () => bleManager.destroy();
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
        }
    };

    const base64ToUint8Array = (base64) => {
        const binaryString = atob(base64); // Decode base64 string into a binary string
        const byteArray = new Uint8Array(binaryString.length);
      
        for (let i = 0; i < binaryString.length; i++) {
          byteArray[i] = binaryString.charCodeAt(i);
        }
      
        return byteArray;
    }
      
    const mergeLsb = (bytes) => {
        // Merge bytes to the appropriate lock ID format
        return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    }
      
    const handleManufacturerData = (device, ourLockId) => {
      
        const manufacturerData = device.manufacturerData;

        if(manufacturerData !== null){

          let data = this.base64ToUint8Array(manufacturerData); 
      
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
                  
                }
            } else{
                 return null;
            }
        }}
      
        return null;
      }

    
    
      const scanForDevices = () => {
        setDevices([]);
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error(error);
                return;
            }

            if (device && device.manufacturerData !== null) {

                const lockId = data?.LockId;
                const manufacturerData = handleManufacturerData(device, lockId);
                if(manufacturerData !== null) {
                    setDevices((prevDevices) => [...prevDevices, device]);
                }
            }
        });

        setTimeout(() => bleManager.stopDeviceScan(), 5000); // Stop scanning after 5 seconds
    };

    const connectToDevice = (device) => {

        const token = data?.Tokens[0];
        
        const helper = new LockBluetoothHelper(console, device.id, token);

        helper.startConnectionWithLock();
        setConnectedDevice(device);
        setLockHelper(helper);
    };

    const renderDevice = ({ item }) => (
        <TouchableOpacity onPress={() => connectToDevice(item)} style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Button title="Scan for Devices" onPress={scanForDevices} />
            <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text>No devices found.</Text>}
            />
            {connectedDevice && (
                <View>
                    <Text>Connected to: {connectedDevice.name}</Text>
                    <Button title="Unlock" onPress={() => lockHelper.openLock()} />
                </View>
            )}
        </View>
    );
};

export default Device;

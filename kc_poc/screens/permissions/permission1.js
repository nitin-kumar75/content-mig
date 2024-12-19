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

    const scanForDevices = () => {
        setDevices([]);
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error(error);
                return;
            }

            if (device && device.name && !  ``.some(d => d.id === device.id)) {
                setDevices((prevDevices) => [...prevDevices, device]);
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

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

const DEVICE_ID = "E5:95:4A:0C:7B:08"; // Replace with your device ID
const SERVICE_UUID = "d3810001-96ad-447f-a62f-fd0e6460d4d6"; // Replace with your service UUID
const CHARACTERISTIC_UUID = "d3810003-96ad-447f-a62f-fd0e6460d4d6"; // Replace with your writable characteristic UUID

const BLEApp = () => {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

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

  
  // Start scanning for BLE devices
    const startScan = () => {
        if (scanning) return;

        setDevices([]);
        setScanning(true);

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Error during scan:", error);
                Alert.alert("Scan Error", error.message);
                setScanning(false);
                return;
            }

            if (device && device.id && device.id == DEVICE_ID) {
                setDevices((prevDevices) => {
                const exists = prevDevices.some((d) => d.id === device.id);
                if (!exists) {
                    return [...prevDevices, { id: device.id, name: device.name }];
                }
                return prevDevices;
                });
            }
        });

        Alert.alert("Scanning Started", "Searching for BLE devices...");

        setTimeout(() => stopScan(), 10000); // Stop scanning after 10 seconds
    };

    // Stop scanning for devices
    const stopScan = () => {
        bleManager.stopDeviceScan();
        setScanning(false);
        Alert.alert("Scanning Stopped", "Stopped searching for BLE devices.");
    };

    // Connect to a selected device
    const connectToDevice = async (deviceId) => {
        try {
            const device = await bleManager.connectToDevice(deviceId);
            setConnectedDevice(device);
            Alert.alert("Connected", `Connected to device: ${device.id}`);
            await device.discoverAllServicesAndCharacteristics();
            discoverCharacteristics(device);
        } catch (error) {
            console.error("Connection failed:", error);
            Alert.alert("Error", "Failed to connect to device.");
        }
    };

    // Discover the characteristics of the connected device
    const discoverCharacteristics = (device) => {
        device
        .discoverAllServicesAndCharacteristics()
        .then((device) => {
            console.log("Discovered Characteristics:", device);
            // Assuming the characteristic you're writing to is available
            writeToCharacteristic(device);
        })
        .catch((error) => {
            console.error("Failed to discover characteristics:", error);
            Alert.alert("Error", "Failed to discover characteristics. " + JSON.stringify(error));
        });
    };

    // Write data to the characteristic
    const writeToCharacteristic = async (device) => {
        try {
        const encodedMessage = `Q1ZDRBZmV7JF3oLhn5zrwZ8xb8P56uNrB6Kmav2mNl4CQmnhPTfmuASczYkHsoSx83lnGS8lbJb/tMR67SZYwPkdeqJ0kKuYyAbnXTaVCwpOnochTAPB4FmdkOxYiu0O/WljLsgvhuP+zlXtfRpUD9eO+ZU=`; // Convert to Base64
        await device.writeCharacteristicWithResponseForService(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            encodedMessage
        );
        Alert.alert("Success", "Message written to characteristic!");
        } catch (error) {
        console.error("Failed to write characteristic:", error);
        Alert.alert("Error", "Failed to write to characteristic. " + JSON.stringify(error));
        }
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>BLE Device Scanner</Text>
        <Button
            title={scanning ? "Stop Scanning" : "Start Scanning"}
            onPress={scanning ? stopScan : startScan}
        />
        <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <View style={styles.deviceContainer}>
                <Text style={styles.deviceText}>
                {item.name || "Unnamed Device"} ({item.id})
                </Text>
                <Button
                title="Connect"
                onPress={() => connectToDevice(item.id)}
                />
            </View>
            )}
            ListEmptyComponent={<Text style={styles.noDevices}>No devices found</Text>}
        />
        {connectedDevice && (
            <View style={styles.connectedContainer}>
            <Text style={styles.connectedText}>
                Connected to: {connectedDevice.id}
            </Text>
            <Button title="Write to Characteristic" onPress={() => writeToCharacteristic(connectedDevice)} />
            </View>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  deviceContainer: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  deviceText: {
    fontSize: 16,
  },
  noDevices: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  connectedContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#e0e0e0',
  },
  connectedText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default BLEApp;

/* eslint-disable no-bitwise */
import { useMemo, useState, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";

const serviceID = "d3810001-96ad-447f-a62f-fd0e6460d4d6";
  
const sendCharacteristicID = "d3810003-96ad-447f-a62f-fd0e6460d4d6";

const readCharacteristicID = "d3810002-96ad-447f-a62f-fd0e6460d4d6";

const MANUCODE = 65534;


const BytesHelper = {
  mergeLsb: (bytes) => {
      // Assuming this function merges the byte array into an integer
      return bytes.reduce((acc, byte, index) => acc | (byte << (index * 8)), 0);
  },
};


const base64ToByteArray = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};


const handleManufacturerData = (device, ourLockId) => {

  const manufacturerData = device.manufacturerData;

  const decodedData = base64ToByteArray(manufacturerData);


  
  // Parse the manufacturerData if it exists
  if (decodedData) {
      const manufacturerBytes = Array.from(decodedData);
      const manuCode = manufacturerBytes[0]; // Assuming first byte is manuCode
      const debugging = true; // Set your debugging logic


      if (manuCode === MANUCODE || debugging) {

          const version = manufacturerBytes[1];
          const deviceType = manufacturerBytes[2];
          const lockNumberBytes = manufacturerBytes.slice(3, 7);
          const lockIdBytes = manufacturerBytes.slice(7, 11);
          const lockNumber = BytesHelper.mergeLsb(lockNumberBytes);
          const lockId = BytesHelper.mergeLsb(lockIdBytes);

          console.log({
            id: device.id,
            name: device.name,
            manuCode: manuCode,
            version: version,
            deviceType,
            lockNumber,
            lockId
          })

          if(ourLockId == lockId) {
            return {
              id: device.id,
              name: device.name,
              manuCode: manuCode,
              version: version,
              deviceType,
              lockNumber,
              lockId
            }
          } else {
            return null
          }
      }
  }

  return null;
};



import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const bleManager = new BleManager();

function useBLE() {

  const [allDevices, setAllDevices] = useState([]);

  const [connectedDevice, setConnectedDevice] = useState(null);

  const [bluetoothState, setBluetoothState] = useState('unknown');

  const [color, setColor] = useState("white");

  useEffect(() => {

    const checkBluetoothState = async () => {
      // Request permissions on Android
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }

      bleManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          setBluetoothState('PoweredOn');
          console.log('Bluetooth is enabled');
        } else {
          setBluetoothState('Unknown');
          console.log('Bluetooth is not enabled');
        }
      }, true);
    };

    checkBluetoothState();

    
  }, []);


  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const connectToDevice = async (device) => {
    try {
      if(device.id) {
        const deviceConnection = await bleManager.connectToDevice(device.id);
        if(!connectedDevice) {
          console.log('Connect to', deviceConnection.name)
          setConnectedDevice(device);
        }
        await deviceConnection.discoverAllServicesAndCharacteristics();
        console.log('Service and characterstic discovered', deviceConnection)
      }
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  }

  const writeData = async (token, deviceId, deviceType) => {
    try {

      if(deviceType === 'Android') {
          const deviceConnection = await bleManager.writeCharacteristicWithResponseForDevice(
            device.id,
            serviceID,
            sendCharacteristicID,
            base64.encode(token)
          );
          alert('Unlocked Door')
      }
    } catch (e) {
      alert('Failed to unlock door')
      alert(JSON.stringify(e));
      console.log("FAILED TO Open Door", e);
    }
  };

  const isDuplicteDevice = (devices, nextDevice) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = (deviceType) =>
    bleManager.startDeviceScan(null, null, async(error, device) => {
      if (error) {
        console.log(error);
      }
      console.log('device', device.manufacturerData)
        if (device && device.manufacturerData !== null) {
            const manufacturerData = handleManufacturerData(device);
            console.log('manufacturerData--', manufacturerData)
            if(manufacturerData !== null) {
                setAllDevices((prevState) => {
                  if (!isDuplicteDevice(prevState, manufacturerData)) {
                    return [...prevState, manufacturerData];
                  }
                  return prevState;
                });
                await connectToDevice(manufacturerData)
            }
        }
     
      
    });

  const onDataUpdate = (
    error,
    characteristic
  ) => {
    if (error) {
      console.log(error);
      return;
    } else if (!characteristic?.value) {
      console.log("No Data was received");
      return;
    }

    const colorCode = base64.decode(characteristic.value);

    let color = "white";
    if (colorCode === "B") {
      color = "blue";
    } else if (colorCode === "R") {
      color = "red";
    } else if (colorCode === "G") {
      color = "green";
    }

    setColor(color);
  };

  const startStreamingData = async (device) => {
    if (device) {
      device.monitorCharacteristicForService(
        serviceID,
        sendCharacteristicID,
        onDataUpdate
      );
    } else {
      console.log("No Device Connected");
    }
  };

  return {
    connectToDevice,
    allDevices,
    connectedDevice,
    color,
    bluetoothState,
    requestPermissions,
    scanForPeripherals,
    startStreamingData,
    writeData
  };
}

export default useBLE;
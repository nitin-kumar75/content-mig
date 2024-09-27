/* eslint-disable no-bitwise */
import { useMemo, useState, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";

const serviceID = "d3810001-96ad-447f-a62f-fd0e6460d4d6";
  
const sendCharacteristicID = "d3810003-96ad-447f-a62f-fd0e6460d4d6";

const readCharacteristicID = "d3810002-96ad-447f-a62f-fd0e6460d4d6";



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

    return () => {
      manager.destroy();
    };
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
        setConnectedDevice(device);
        await deviceConnection.discoverAllServicesAndCharacteristics();
        bleManager.stopDeviceScan();
        startStreamingData(deviceConnection);
      }
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  }

  const writeData = async (device, data) => {
    try {
      alert(device.id)
      const deviceConnection = await bleManager.writeCharacteristicWithResponseForDevice(
        device.id,
        serviceID,
        sendCharacteristicID,
        base64.encode(data)
      );
      alert('Unlocked Door')
    } catch (e) {
      alert('Failed to unlock door')
      alert(JSON.stringify(e));
      console.log("FAILED TO Open Door", e);
    }
  };

  const isDuplicteDevice = (devices, nextDevice) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }

      if (
        device &&
        (device.localName === "AirPods Pro" || device.name === "AirPods Pro")
      ) {
        setAllDevices((prevState) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
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
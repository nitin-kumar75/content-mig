/* eslint-disable no-bitwise */
import { useMemo, useState, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";

const serviceID = "d3810001-96ad-447f-a62f-fd0e6460d4d6";
  
const sendCharacteristicID = "d3810002-96ad-447f-a62f-fd0e6460d4d6";

const readCharacteristicID = "d3810002-96ad-447f-a62f-fd0e6460d4d6";

const MANUCODE = 65534;


const BytesHelper = {
  mergeLsb: (bytes) => {
      // Assuming this function merges the byte array into an integer
      return bytes.reduce((acc, byte, index) => acc | (byte << (index * 8)), 0);
  },
};


const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64); // Decode base64 string into a binary string
  const byteArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return byteArray;
};

function mergeLsb(bytes) {
  // Merge bytes to the appropriate lock ID format
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
}

const handleManufacturerData = (device, ourLockId) => {

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

        // alert("version -" + version);
        // alert("deviceType -" + deviceType);
        // alert("lockNumber -" + lockNumber);
        // alert("lockId -" + lockId);


          // console.log({
          //   id: device.id,
          //   name: device.name,
          //   manuCode: manuCode,
          //   version: version,
          //   deviceType,
          //   lockNumber,
          //   lockId
          // });
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


const handlerawScanRecordData = (device, ourLockId) => {
  
  const rawScanRecord = device.rawScanRecord;

  const decodedData = base64ToByteArray(rawScanRecord);


  
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

          // console.log({
          //   id: device?.id,
          //   name: device?.name,
          //   manuCode: manuCode,
          //   version: version,
          //   deviceType,
          //   lockNumber,
          //   lockId
          // });

            return {
              id: device.id,
              name: device.name,
              manuCode: manuCode,
              version: version,
              deviceType,
              lockNumber,
              lockId,
              rawScanRecord: rawScanRecord 
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
import { result } from "./result";
// import Clipboard from "@react-native-clipboard/clipboard";

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
      alert("device.id - " + device.id);
      if(device.id) {
        const deviceConnection = await bleManager.connectToDevice(device.id);
        alert('Connect to '+ deviceConnection);
        if(connectedDevice == null) {
          // console.log('Connect to', deviceConnection.name)
          setConnectedDevice(deviceConnection);
        }
        await deviceConnection.discoverAllServicesAndCharacteristics();
        console.log('Service and characterstic discovered', deviceConnection)
      }
    } catch (e) {
      alert(e);
      console.log("FAILED TO CONNECT", e);
    }
  }

  const writeData = async (token, deviceId, deviceType) => {
    // console.log("token - ",token );
    // console.log("deviceId - ", deviceId );
    // console.log("deviceType - ", deviceType );
    // console.log("serviceID - ", serviceID );
    // console.log("sendCharacteristicID - ", sendCharacteristicID );
    try {

      if(deviceType === 'Android') {
          // const deviceConnection = await bleManager.writeCharacteristicWithResponseForDevice(
          //   deviceId,
          //   serviceID,
          //   sendCharacteristicID,
          //   token
          // );
          await connectedDevice.writeCharacteristicWithResponseForService(
            serviceID,
            sendCharacteristicID,
            token
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

  const scanForPeripherals = (deviceType, lockId) =>
    // result.devices.map(async(d,i) => {
    //   // handleManufacturerData(d.manufacturerData,lockId);
    //   const manufacturerData = handleManufacturerData(d.manufacturerData, lockId);
    //   // const rawScanRecord = handlerawScanRecordData(device);
    //   const scanData = manufacturerData
    //   // console.log('manufacturerData--', manufacturerData)
    //   if(scanData !== null) {
    //       setAllDevices((prevState) => {
    //         if (!isDuplicteDevice(prevState, scanData)) {
    //           return [...prevState, scanData];
    //         }
    //         return prevState;
    //       });
    //       console.log(scanData)
    //       await connectToDevice(scanData)
    //   }
    // })
    bleManager.startDeviceScan(null, null, async(error, device) => {
      if (error) {
        console.log(error);
      }
        if (device && device.manufacturerData !== null) {
            const manufacturerData = handleManufacturerData(device, lockId);
            // const rawScanRecord = handlerawScanRecordData(device);
            const scanData = manufacturerData
            // console.log('manufacturerData--', manufacturerData)
            if(scanData !== null) {
                setAllDevices((prevState) => {
                  if (!isDuplicteDevice(prevState, scanData)) {
                    return [...prevState, scanData];
                  }
                  return prevState;
                });
                await connectToDevice(scanData)
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
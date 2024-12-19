import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import useBLE from "../../useBLE";
import * as Device from 'expo-device';
import PinCodeModal from "../../PinCodeModal"
import DebugModal from "../../DebugModal"
import { FlatList, ScrollView } from 'react-native-gesture-handler';


import { Buffer } from 'buffer';


// import { WebView } from 'react-native-webview';

import Clipboard from "@react-native-clipboard/clipboard";
import base64 from 'react-native-base64';



const Permission = ({ route })  => {

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Permission Check',
      headerBackTitle: 'Back',
      headerBackTitleStyle: { fontSize: 16, color: '#000' },
    });
  }, []);

  const {
    allDevices,
    connectedDevice,
    connectToDevice,
    color,
    requestPermissions,
    bluetoothState,
    writeData,
    scanForPeripherals,
    allChars
  } = useBLE();


  const { data } = route.params;

  let pinCode = null;

  if(data?.PinCodes?.length > 0) {
     pinCode  = data?.PinCodes[0]
  }

  
  
  const [isPermissionsEnabled, setPemissionEnabled] = useState(false)

  const [isPinModalVisible, setPinModalVisible] = useState(false)

  const [isDebugModalVisible, setDebugModalVisible] = useState(false)

  const permission = async() => {
    const isPermissionsEnabled = await requestPermissions();
    setPemissionEnabled(isPermissionsEnabled)
    if(isPermissionsEnabled) {
        scanForDevices();
    }
  }

  useEffect(() =>{
    permission();
   },[])

  
  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals(Device.isDevice && Device.osName === 'Android' ? 'Android' : 'Ios', data?.LockId);
    }
  };

  const unlockBuffer = (isWithout) => {
    const token = data?.Tokens[0];
    const message = Buffer.from(token, 'base64');
    const decodec = Buffer.from(message).toString('base64')
    if (Device.isDevice) {
      if (Device.osName === 'Android') {
        writeData(decodec, "", 'Android', isWithout)
      } else  {
        writeData(decodec, lockId, 'Ios', isWithout);
      }
    }

  }

  const unlockDoorDirectToken = (isWithout) => {
    const token = data?.Tokens[0];
    const lockId = data?.LockId;
    // const deviceId = connectedDevice.id;
    if (Device.isDevice) {
      if (Device.osName === 'Android') {
        writeData(token, "", 'Android', isWithout)
      } else  {
        writeData(token, lockId, 'Ios', isWithout);
      }
    }

  }
  const unlockDoorEncodedToken = (isWithout) => {
    const token = data?.Tokens[0];
    const lockId = data?.LockId;
    // const deviceId = connectedDevice.id;
    if (Device.isDevice) {
      if (Device.osName === 'Android') {
        writeData(base64.encode(token), "", 'Android', isWithout)
      } else  {
        writeData(token, lockId, 'Ios', isWithout);
      }
    }

  }
  const unlockDoorDecodeToken = (isWithout) => {
    const token = data?.Tokens[0];
    const lockId = data?.LockId;
    // const deviceId = connectedDevice.id;
    if (Device.isDevice) {
      if (Device.osName === 'Android') {
        writeData(base64.decode(token), "", 'Android', isWithout)
      } else  {
        writeData(token, lockId, 'Ios', isWithout);
      }
    }

  }


const copyData = async () => {
  await Clipboard.setString(JSON.stringify({
    api:data,
    devices: allDevices
    }))
  console.log(JSON.stringify({
    api:data,
    devices: allDevices
  }))
}

const copyDataChar = async () => {

  await Clipboard.setString(JSON.stringify({
      data: allChars
    }))
  console.log(JSON.stringify({
    data: allChars
  }))
}

  const debug = () => {
     setDebugModalVisible(true)
  }


  
  const renderKeys = (data) => {
    return Object.keys(data).map((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        return (
          <View key={key} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{key}:</Text>
            {value.map((item, index) => (
              <Text key={index}>- {JSON.stringify(item)}</Text>
            ))}
          </View>
        );
      }
      if (typeof value === 'object' && value !== null) {
        return (
          <View key={key} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{key}:</Text>
            {renderKeys(value)}
          </View>
        );
      }
      return (
        <Text key={key}>
          {key}: {String(value)}
        </Text>
      );
    });
  };

  return (
    <>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Bluetooth Connection</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.status}>
               Bluetooth Enabled  
               { bluetoothState === 'PoweredOn' ?
                 <Text style={styles.tick}>✔</Text>:
                 <ActivityIndicator size="small" color="#000" />
                }
            </Text>
            <Text style={styles.status}>
               Bluetooth Permission Granted 
               { isPermissionsEnabled ?
                 <Text style={styles.tick}>✔</Text>
                :
                <ActivityIndicator size="small" color="#000" />
                }
            </Text>
            <Text style={styles.status}>
               Device Found 
               { allDevices.length > 0 ?
               <Text style={styles.tick}>✔</Text>
               :
                 <ActivityIndicator size="small" color="#000" />
                }
               
            </Text>
          </View>

          <View style={styles.buttonContainer}>
          { isPermissionsEnabled && bluetoothState === 'PoweredOn'  &&
              <View style={{height:50, marginBottom:10}} >
              <TouchableOpacity style={styles.button} onPress={() => { debug()}}>
                <Text style={styles.buttonText}>Debug</Text>
              </TouchableOpacity>
              </View>
            }
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
                  <View style={{height:50, marginBottom:10}}>
                  <TouchableOpacity style={styles.button} onPress={() => { copyDataChar()}}>
                    <Text style={styles.buttonText}>Debug Service</Text>
                  </TouchableOpacity>
                  </View>
            }

{ isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
                  <View style={{height:50, marginBottom:10}}>
                  <TouchableOpacity style={styles.button} onPress={() => { unlockBuffer()}}>
                    <Text style={styles.buttonText}>Unlock Door with buffer</Text>
                  </TouchableOpacity>
                  </View>
            }




            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorDirectToken()}}>
                <Text style={styles.buttonText}>Unlock Door with direct Token</Text>
              </TouchableOpacity>
              </View>
            }
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorEncodedToken()}}>
                <Text style={styles.buttonText}>Unlock Door with encoded token</Text>
              </TouchableOpacity>
              </View>
            }
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorDecodeToken()}}>
                <Text style={styles.buttonText}>Unlock Door decoded token</Text>
              </TouchableOpacity>
              </View>
            }



{ isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
                  <View style={{height:50, marginBottom:10}}>
                  <TouchableOpacity style={styles.button} onPress={() => { unlockBuffer(true)}}>
                    <Text style={styles.buttonText}>Unlock Door with buffer W</Text>
                  </TouchableOpacity>
                  </View>
            }




            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorDirectToken(true)}}>
                <Text style={styles.buttonText}>Unlock Door with direct Token W</Text>
              </TouchableOpacity>
              </View>
            }
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorEncodedToken(true)}}>
                <Text style={styles.buttonText}>Unlock Door with encoded token W</Text>
              </TouchableOpacity>
              </View>
            }
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 && connectedDevice != null &&
              <View style={{height:50, marginBottom:10}}>
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoorDecodeToken(true)}}>
                <Text style={styles.buttonText}>Unlock Door decoded token W</Text>
              </TouchableOpacity>
              </View>
            }




            { pinCode !== null > 0 &&
              <View style={{height:50, marginBottom:10}}>
                <TouchableOpacity style={styles.button} onPress={() => { setPinModalVisible(true) }}>
                  <Text style={styles.buttonText}>Show Pin Code</Text>
                </TouchableOpacity>
                </View>
            }
          </View>
          {/* <View style={styles.modalContainer2}>
          <View style={styles.item}>
            <View style={styles.item}>
              <ScrollView>{renderKeys(data)}</ScrollView>
            </View>
          </View>
          </View> */}
          <PinCodeModal code = { pinCode } visible={ isPinModalVisible } onClose={ () => { setPinModalVisible(false) } }></PinCodeModal>
          
          <DebugModal devices = { allDevices } visible={ isDebugModalVisible } copyData ={() => {copyData()}} onClose={ () => { setDebugModalVisible(false) } }></DebugModal>
          
          
         
        </View>
      </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    alignItems: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    marginBottom: 15,
  },
  status: {
    fontSize: 16,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    padding: 15,
  },
  button: {
    flex: 1,
    height:10,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FF3D00',
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  tick: {
    color: 'green',
    fontSize: 20, // Adjust the size as needed
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  item: {
    padding: 5,
  },
  modalContainer2: {
    width: 400,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // Adds a shadow effect on Android
  },
  title2: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'left',
    color: '#000'
  },
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default Permission;

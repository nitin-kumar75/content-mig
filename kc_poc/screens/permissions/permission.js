import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import useBLE from "../../useBLE";
import * as Device from 'expo-device';
import PinCodeModal from "../../PinCodeModal"


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
  } = useBLE();


  const { data } = route.params;

  console.log(data)

  let pinCode = null;

  if(data?.PinCodes?.length > 0) {
     pinCode  = data?.PinCodes[0]
  }

  
  
  const [isPermissionsEnabled, setPemissionEnabled] = useState(false)

  const [isPinModalVisible, setPinModalVisible] = useState(false)

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
      scanForPeripherals();
    }
  };

  const unlockDoor = () => {
    const token = data?.Tokens[0];
    const lockId = data?.LockId;
    if (Device.isDevice) {
      if (Device.osName === 'Android') {
         //elements.unlockingToken.val() + "###" + elements.deviceAddress.val()
      } else  {
        const data = `${lockId}|${token}`
        console.log(data)
        console.log(allDevices)
        //writeData()
      }
    }

  }

  return (
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
            { isPermissionsEnabled && bluetoothState === 'PoweredOn'  && allDevices.length > 0 &&
              <TouchableOpacity style={styles.button} onPress={() => { unlockDoor()}}>
                <Text style={styles.buttonText}>Unlock Door</Text>
              </TouchableOpacity>
            }
            { pinCode !== null > 0 &&
                <TouchableOpacity style={styles.button} onPress={() => { setPinModalVisible(true) }}>
                  <Text style={styles.buttonText}>Show Pin Code</Text>
                </TouchableOpacity>
            }
          </View>
          <PinCodeModal code = { pinCode } visible={ isPinModalVisible } onClose={ () => { setPinModalVisible(false) } }></PinCodeModal>

          
         
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    flex: 1,
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
});

export default Permission;

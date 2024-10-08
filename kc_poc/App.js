import React, { useState } from "react";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceModal from "./DeviceConnectionModal";
// import useBLE from "./useBLE";
import BluetoothModal from "./PinCodeModal"

import Layout from './screens/layout'

const App = () => {
  // const {
  //   allDevices,
  //   connectedDevice,
  //   connectToDevice,
  //   color,
  //   requestPermissions,
  //   bluetoothState,
  //   writeData,
  //   scanForPeripherals,
  // } = useBLE();

  // const [isModalVisible, setIsModalVisible] = useState(false);

  // const [ isBlueToothVisible, setBluetoothModalVisible] = useState(false)

  
  // const scanForDevices = async () => {
  //   const isPermissionsEnabled = await requestPermissions();
  //   if (isPermissionsEnabled) {
  //     scanForPeripherals();
  //   }
  // };


  // const hideModal = () => {
  //   setIsModalVisible(false);
  // };

  // const openModal = async () => {
  //   if(bluetoothState === 'PoweredOn') {
  //     scanForDevices();
  //     setIsModalVisible(true);
  //   } else {
  //     alert('Please turn on bluetooth')
  //   }
  // };

  return (
    <SafeAreaView style={[styles.container]}>
      <Layout />
      {/* <View style={styles.heartRateTitleWrapper}>
        {connectedDevice ? (
          <>
           <View>
            <Text style={styles.heartRateTitleText}>Connected</Text> 
            <TouchableOpacity onPress={() => 
                 //writeData(connectedDevice, 'Test Data')
                 setBluetoothModalVisible(true)
              } style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Open Door</Text>
            </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.heartRateTitleText}>
            Please connect the AirPods Pro
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Connect</Text>
      </TouchableOpacity>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
      <BluetoothModal visible={isBlueToothVisible} onClose={() => setBluetoothModalVisible(false)}></BluetoothModal> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  heartRateTitleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default App;
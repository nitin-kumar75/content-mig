import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';


const Item = ({item}) => (
    // <View style={styles.item}>
    //   {Object.keys(item).map((key) => (
    //     <Text style={styles.title} key={key}>{key}: {Array.isArray(item[key])? <Item item={item[key]}/> : item[key]}</Text>
    //   ))}
    //   {/* <Text style={styles.title}>Name - {item.name}</Text>
    //   <Text style={styles.text}>ManufacturerData - {item.manuData}</Text> */}
    // </View>
    renderKeys(item)
);

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

const DebugModal = ({ devices, visible, copyData, onClose }) => {

  // console.log("DebugModal devices - ", devices)
 
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
            {/* <FlatList
                data={devices}
                renderItem={({item}) => <Item item={item} />}
                // renderItem={({item}) => renderKeys(item)}
                keyExtractor={item => item.id}
            /> */}
            <ScrollView>
              {devices.map((item, index) => (
                <View key={index} style={{ marginBottom: 20 }}>
                  <Text style={{ fontWeight: 'bold' }}>Device {index + 1}:</Text>
                  {renderKeys(item)}
                </View>
              ))}
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={copyData}>
                <Text style={styles.closeButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  item: {
    padding: 5,
  },
  modalContainer: {
    width: 400,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // Adds a shadow effect on Android
  },
  title: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'left',
    color: '#000'
  },
  text: {
    fontSize: 12,
    textAlign: 'left',
    color: '#000'
  },
  statusContainer: {
    width: '100%',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: 16,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    fontWeight: 'bold'
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
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
});

export default DebugModal;

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';


const Item = ({item}) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.text}>{item.manuData}</Text>
    </View>
);

const DebugModal = ({ devices, visible, onClose }) => {

 
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
            <FlatList
                data={devices}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={item => item.id}
            />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
});

export default DebugModal;

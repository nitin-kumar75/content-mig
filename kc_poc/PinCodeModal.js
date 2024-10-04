import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';


const PinCodeModal = ({ code, visible, onClose }) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Use Pincode to unlock the door</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.status}>
                 {code}
            </Text>
          </View>

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
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5, // Adds a shadow effect on Android
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

export default PinCodeModal;

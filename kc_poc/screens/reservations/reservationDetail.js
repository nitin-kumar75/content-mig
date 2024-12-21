import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ModalActivityIndicator from 'react-native-modal-activityindicator'


import moment from 'moment';
import axios from 'axios';


const getCustomerBooking = (accommodationItem, parkId) => {
  let c_status = '';

  if (accommodationItem.parkId !== parkId) {
    c_status = 'NoBooking';
  }

  const status = accommodationItem.status;
  const arrivalDate = moment(accommodationItem.arrival);
  const departureDate = moment(accommodationItem.departure);
  const currentDate = moment();

    
  if (arrivalDate.isAfter(currentDate) && status !== 31) {
    c_status = 'OnArrivalDay';
  }

  if (arrivalDate.isAfter(currentDate)) {
    c_status = 'BeforeOnArrivalDay';
  }

  if (
    departureDate.isBefore(currentDate) &&
    departureDate.isSame(currentDate) &&
    status === 41
  ) {
    c_status = 'BeforeDeparture';
  }

  console.log(status)

  if (
    arrivalDate.isBefore(currentDate) &&
    (departureDate.isSame(currentDate) || departureDate.isAfter(currentDate))  &&
    status === 31
  ) {
    c_status = 'DuringStay';
  }

  return {
    status: c_status,
  };
};

const ReservationDetails = ({ route, parkId }) => {

  

  const navigation = useNavigation();
  
  const { reservation } = route.params;
  
  const [isShowDigitalKey, setDigitalKey] = useState(false);

  const [resData, setRes] = useState(null)

  
  const [loading, setLoading] = useState(false);

  const getDigitalKey = async (reservationNumber) => {
    
    setLoading(true);

    try {

      const response = await axios.get(`http://3.108.61.39:8080/digital-key?reservationNumber=${reservationNumber}`, {
      });

      navigation.navigate('permission2',{
        data: response.data,
      })
      
      
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    navigation.setOptions({
      title: 'Reservation',
      headerLeft: () => null,
    });
  }, []);

  return (
   // View style={styles.container}
  
     <>
         { reservation && reservation.length > 0 ?
            <>
            <FlatList
              keyExtractor={(item, index) => index.toString()}
              data={reservation}
              //  extraData={overviewOrder}
              renderItem={({ item }) => (
                <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 15, backgroundColor: '#FFF', margin: 10 }}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <Text style={styles.title}>{item.name}</Text>
                  <Text>
                    <Text style={styles.bold}>Park Name:</Text> {item.parkName}
                  </Text>
                  <Text>
                    <Text style={styles.bold}>Reservation Number:</Text>{' '}
                    {item.reservationNumber}
                  </Text>
                  <Text>
                    <Text style={styles.bold}>Arrival:</Text>{' '}
                    {moment(item.arrival).format('LLL')}
                  </Text>
                  <Text>
                    <Text style={styles.bold}>Departure:</Text>{' '}
                    {moment(item.departure).format('LLL')}
                  </Text>
                  <Text>
                    <Text style={styles.bold}>Status:</Text>{' '}
                    {item.status === 31 ? 'Confirmed' : 'Pending'}
                  </Text>
                  <Text>
                    <Text style={styles.bold}>Accommodation Type:</Text>{' '}
                    {item.accommodationType === 0 ? 'Beach House' : 'Other'}
                  </Text>

                  {/* {getCustomerBooking(item, parkId)?.status === 'DuringStay' && ( */}

                        <View style={styles.buttonContainer}>
                          <TouchableOpacity style={styles.button} onPress={() => getDigitalKey(item.reservationNumber)}>
                              <Text style={styles.buttonText}>Get Digital Key</Text>
                            </TouchableOpacity>
                        </View>

                    
                  {/* )} */}
              
                </View>
              )}
              
            />
              <ModalActivityIndicator visible={loading} size='large' color='white' />
            </>
        : <View> 
          
          <Text>No Able To Find Reservation Detail. Please login again.</Text> 
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('login') }>
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
          
          </View> }
        </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    maxWidth: 400,
    alignSelf: 'center',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
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
});

export default ReservationDetails;

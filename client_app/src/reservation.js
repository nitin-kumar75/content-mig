import React, { useState } from 'react';

import { 
  Button
} from '@mui/material';


const moment = require('moment');


const getCustomerBooking = (accommodationItem, parkId, getDigitalKey) => {
  
  
  let c_btatus = ''

  if(accommodationItem.parkId !== parkId) {
    c_btatus = "NoBooking"   
  }

  const status = accommodationItem.status;
  const formatArrival = moment(accommodationItem.arrival).format('YYYY-MM-DD')
  const formatDeparture = moment(accommodationItem.departure).format('YYYY-MM-DD')
  const arrivalDate = moment(accommodationItem.arrival);
  const departureDate = moment(accommodationItem.departure);
  const accommodationParkId = accommodationItem.parkId;
  const reservationNumber= accommodationItem.reservationNumber;
  const currentDate = moment()

  if(arrivalDate.isAfter(currentDate) && status !== 31) {
    c_btatus = "OnArrivalDay"
  }
  

  if (arrivalDate.isAfter(currentDate)) {
    c_btatus = "BeforeOnArrivalDay"
  }


  if (departureDate.isBefore(currentDate) && departureDate.isSame(currentDate) && status === 41) {
    c_btatus = "BeforeDeparture"
  }

  if ((arrivalDate.isBefore(currentDate) && (departureDate.isSame(currentDate) || departureDate.isAfter(currentDate))) && status === 31) {
    c_btatus = "DuringStay"
  }

  // if (Departure.AddDays(RPConstants.MaxAfterDepartureDays) >= DateTime.Now || (Departure.Date == DateTime.Now.Date && Departure >= DateTime.Now && Status == NewyseApiClient.CheckedOutStatus))
  //   {
  //       return CustomerBookingStatus.AfterDeparture;
  //   }

  return {
    status: c_btatus
  }
  


  
}

const ReservationDetails = ({ reservation, parkId, getDigitalKey }) => {
  const { 
    image, 
    arrival, 
    departure, 
    status, 
    accommodationType, 
    parkName, 
    name, 
    reservationNumber 
  } = reservation;

  const [isShowDigitalKey, setDigitalKey] = useState(false)

  const customerBooking = getCustomerBooking(reservation, parkId); 

  return (
    <div style={styles.container}>
      <img src={image} alt={name} style={styles.image} />
      <h2>{name}</h2>
      <p><strong>Park Name:</strong> {parkName}</p>
      <p><strong>Reservation Number:</strong> {reservationNumber}</p>
      <p><strong>Arrival:</strong> {new Date(arrival).toLocaleString()}</p>
      <p><strong>Departure:</strong> {new Date(departure).toLocaleString()}</p>
      <p><strong>Status:</strong> {status === 31 ? 'Confirmed' : 'Pending'}</p>
      <p><strong>Accommodation Type:</strong> {accommodationType === 0 ? 'Beach House' : 'Other'}</p>
      { customerBooking?.status === "DuringStay" &&   
          <Button variant="contained" onClick={()=> getDigitalKey(reservationNumber)} color="primary" type="button">
                 Get Digital Key
              </Button>
      }
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '400px',
    textAlign: 'center',
    margin: 'auto',
  },
  image: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
};

export default ReservationDetails;


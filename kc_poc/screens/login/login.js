import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ModalActivityIndicator from 'react-native-modal-activityindicator'
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Provider as PaperProvider,
  DefaultTheme,
} from 'react-native-paper';

import { useNavigation } from '@react-navigation/native'

const Login = (props) => {

  const navigation = useNavigation()

  const [emailAdd, onChangeEmail] = useState('cees@emakina.nl');
  const [password, onChangePassword] = useState('Blaat123456!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const [loginResponseData, setLoginResponseData] = useState(null);

  useEffect(()=>{
    navigation.setOptions({
      title: 'Login'
    })
  },[navigation])

  const login = async () => {
    setLoading(true);
    setResponseData(null);
    try {
      const response = await axios.post(`http://3.108.61.39:8080/login`, {
        username: emailAdd,
        password: password,
        lang: 'en',
      });
      
      const { accommodationDetails } = response.data;
      setLoginResponseData(response.data);
      navigation.navigate('dashboard',{
        reservation: accommodationDetails
      })
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
    <View style={{ marginVertical: 20, marginHorizontal: 15 }}>
      <TextInput
        label={'E-mailaddress'}
        selectionColor={'#6BA8AD'}
        underlineColor={'#CA7A6B'}
        // contentStyle={{ backgroundColor:'#FFF'}}
        style={styles.input}
        // mode="outlined"
        outlineColor="#CA7A6B" // Inactive border color
        activeOutlineColor="#CA7A6B" // Active border color
        onChangeText={onChangeEmail}
        value={emailAdd}
        right={
          <TextInput.Icon
            name={'email'}
            color={'#919191'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />

      <TextInput
        label={'Password'}
        secureTextEntry={!showPassword}
        style={styles.input}
        onChangeText={onChangePassword}
        value={password}
        right={
          <TextInput.Icon
            name={showPassword ? 'eye-off' : 'eye'}
            color={'#919191'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />

      <Pressable
        style={styles.buttonContainer}
        onPress={() => login()}>
        <Text style={styles.buttonText}>Log in</Text>
      </Pressable>
    </View>
     <ModalActivityIndicator visible={loading} size='large' color='white' />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    // height: 60,
    //margin: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6E7E5',
    backgroundColor: '#FFF',
  },
  buttonContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E17539',
    borderRadius: 5,
    width: '50%',
    marginBottom: 30,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});

export default Login;

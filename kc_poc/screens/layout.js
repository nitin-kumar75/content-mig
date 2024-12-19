import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './login/login'
import ReservationDetails from './reservations/reservationDetail';
import Permission from './permissions/permission';
import permission1 from './permissions/permission1';

const Stack = createStackNavigator();

export default function Layout() {
  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName='Login'>
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="dashboard" component={ReservationDetails} />
      <Stack.Screen name="permission" component={Permission} />
      <Stack.Screen name="permission" component={Permission1} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
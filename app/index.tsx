// app/index.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Button } from 'react-native';
import { auth } from '../src/config/firebase';
import { signOut } from 'firebase/auth';
import CreateEventScreen from '../src/screens/CreateEventScreen';
import HomeScreen from '../src/screens/HomeScreen';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import EventDetailsScreen from '../src/screens/EventDetailsScreen'; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({ 
          title: 'Inicio', 
          headerBackVisible: false,
          headerRight: () => (
            <Button
              onPress={() => {
                signOut(auth)
                  .then(() => navigation.replace('Login'))
                  .catch((err) => console.log("Error al cerrar sesión:", err));
              }}
              title="Salir"
              color="#EF4444"
            />
          )
        })} 
      />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Crear Evento' }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Detalles del Evento' }} />
    </Stack.Navigator>
  );
}
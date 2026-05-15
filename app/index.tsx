// app/index.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../src/screens/LoginScreen';
import HomeScreen from '../src/screens/HomeScreen';
import RegisterScreen from '../src/screens/RegisterScreen'; // Importar la nueva pantalla

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}
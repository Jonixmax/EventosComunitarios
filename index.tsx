// app/index.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CreateEventScreen from "../src/screens/CreateEventScreen";
import EventDetailsScreen from "../src/screens/EventDetailsScreen";
import HomeScreen from "../src/screens/HomeScreen";
import LoginScreen from "../src/screens/LoginScreen";
import RegisterScreen from "../src/screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Registro" }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio", headerBackVisible: false }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: "Crear Nuevo Evento" }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: "Detalles del Evento" }}
      />
    </Stack.Navigator>
  );
}

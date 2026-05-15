// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';

// Librerías de Expo para Login Social
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

// Esto le dice al navegador nativo que se cierre una vez que devuelva el token
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. Configuración de Google
  // Reemplaza 'TU_WEB_CLIENT_ID' con el ID de cliente web que te dio Firebase en la configuración de Google
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com',
  });

  // 2. Configuración de Facebook
  // Reemplaza 'TU_APP_ID' con el ID de la aplicación de Meta for Developers
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '1538963127645703',
    scopes: ['public_profile'],
  });

  // Escuchar la respuesta de Google
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => Alert.alert("Éxito", "Sesión iniciada con Google"))
        .catch(error => Alert.alert("Error de Google", error.message));
    }
  }, [googleResponse]);

 // Escuchar la respuesta de Facebook
  useEffect(() => {
    if (fbResponse?.type === 'success') {
      // Corrección: usamos accessToken con la T mayúscula
      const { accessToken } = fbResponse.authentication;
      
      // Agregamos una pequeña validación de seguridad extra
      if (accessToken) {
        const credential = FacebookAuthProvider.credential(accessToken);
        signInWithCredential(auth, credential)
          .then(() => Alert.alert("Éxito", "Sesión iniciada con Facebook"))
          .catch(error => Alert.alert("Error de Facebook", error.message));
      }
    }
  }, [fbResponse]);

  // Funciones de Correo y Contraseña
  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => Alert.alert("Bienvenido", "Inicio de sesión exitoso"))
      .catch(error => Alert.alert("Error", "Revisa tus credenciales"));
  };

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => Alert.alert("Éxito", "Usuario registrado correctamente"))
      .catch(error => Alert.alert("Error", error.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Eventos</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>

      <View style={styles.socialContainer}>
        <TouchableOpacity 
          style={[styles.socialButton, {backgroundColor: '#DB4437'}]} 
          disabled={!googleRequest}
          onPress={() => googlePromptAsync()}
        >
          <Text style={styles.buttonText}>Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.socialButton, {backgroundColor: '#4267B2'}]} 
          disabled={!fbRequest}
          onPress={() => fbPromptAsync()}
        >
          <Text style={styles.buttonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  linkText: { color: '#007bff', marginTop: 15, textAlign: 'center' },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  socialButton: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' }
});

export default LoginScreen;
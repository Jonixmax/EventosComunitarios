// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';

// Librerías de Expo para Login Social
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configuración de Google
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com',
  });

  // Configuración de Facebook
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
        .then(() => navigation.replace('Home'))
        .catch(error => Alert.alert("Error de Google", error.message));
    }
  }, [googleResponse, navigation]);

 // Escuchar la respuesta de Facebook
  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { accessToken } = fbResponse.authentication;
      if (accessToken) {
        const credential = FacebookAuthProvider.credential(accessToken);
        signInWithCredential(auth, credential)
          .then(() => navigation.replace('Home'))
          .catch(error => Alert.alert("Error de Facebook", error.message));
      }
    }
  }, [fbResponse, navigation]);

  // Función de Inicio de Sesión mejorada con alertas
  const handleLogin = () => {
    // 1. Validar que no haya campos vacíos
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    // 2. Intentar iniciar sesión
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Home'))
      .catch(error => {
        console.error("Error de Login:", error.code);
        
        // 3. Atrapar errores específicos y mostrarlos en español
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          Alert.alert("Acceso denegado", "El correo o la contraseña son incorrectos. Por favor, verifica tus datos.");
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert("Correo inválido", "El formato del correo electrónico no es válido.");
        } else if (error.code === 'auth/too-many-requests') {
          Alert.alert("Demasiados intentos", "Has intentado iniciar sesión demasiadas veces. Intenta de nuevo más tarde.");
        } else {
          Alert.alert("Error", "Ocurrió un problema al iniciar sesión. Intenta más tarde.");
        }
      });
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
        keyboardType="email-address" // Muestra el teclado con el @
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

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
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
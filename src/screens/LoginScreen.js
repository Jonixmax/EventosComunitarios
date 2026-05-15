// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com',
  });

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '1538963127645703',
    scopes: ['public_profile'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace('Home'))
        .catch(error => Alert.alert("Error de Google", error.message));
    }
  }, [googleResponse, navigation]);

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

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Home'))
      .catch(error => {
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
    <KeyboardAvoidingView 
      style={styles.mainContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>Conecta con tu comunidad y descubre los mejores eventos locales.</Text>
        </View>

        {/* Tarjeta del Formulario */}
        <View style={styles.card}>
          <TextInput 
            style={styles.input} 
            placeholder="Correo electrónico"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Contraseña"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, {backgroundColor: '#FEF2F2', borderColor: '#FCA5A5'}]} 
              disabled={!googleRequest}
              onPress={() => googlePromptAsync()}
            >
              <Text style={[styles.socialButtonText, {color: '#DC2626'}]}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, {backgroundColor: '#EFF6FF', borderColor: '#93C5FD'}]} 
              disabled={!fbRequest}
              onPress={() => fbPromptAsync()}
            >
              <Text style={[styles.socialButtonText, {color: '#2563EB'}]}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5, marginBottom: 24 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', marginBottom: 16 },
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 14 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  socialButton: { flex: 0.48, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  socialButtonText: { fontSize: 15, fontWeight: '600' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: '700' }
});

export default LoginScreen;
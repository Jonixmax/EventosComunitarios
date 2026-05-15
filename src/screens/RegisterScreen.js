// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    // 1. Validación de campos vacíos
    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Campos incompletos", "Por favor, completa todos los campos para crear tu cuenta.");
      return;
    }

    // 2. Validación de formato de correo (Regex simple)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Correo inválido", "Por favor, ingresa una dirección de correo electrónico válida.");
      return;
    }

    // 3. Validación de longitud de contraseña
    if (password.length < 6) {
      Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres por seguridad.");
      return;
    }

    // 4. Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      Alert.alert("Error de validación", "Las contraseñas no coinciden. Intenta escribirlas de nuevo.");
      return;
    }

    // 5. Proceso de registro en Firebase
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Guardamos el nombre en el perfil de Firebase
        updateProfile(userCredential.user, {
          displayName: nombre
        }).then(() => {
          // ALERTA DE ÉXITO
          Alert.alert(
            "¡Cuenta creada!", 
            `Bienvenido/a a la comunidad, ${nombre}. Tu registro ha sido exitoso.`,
            [{ text: "Continuar", onPress: () => navigation.replace('Home') }]
          );
        });
      })
      .catch(error => {
        // MANEJO DE ERRORES ESPECÍFICOS DE FIREBASE
        console.log("Error de registro:", error.code);

        if (error.code === 'auth/email-already-in-use') {
          Alert.alert("Cuenta existente", "Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.");
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert("Correo no válido", "El formato del correo ingresado no es correcto.");
        } else if (error.code === 'auth/weak-password') {
          Alert.alert("Seguridad insuficiente", "La contraseña es muy sencilla. Prueba combinando letras y números.");
        } else if (error.code === 'auth/network-request-failed') {
          Alert.alert("Error de conexión", "No se pudo conectar con el servidor. Revisa tu internet.");
        } else {
          Alert.alert("Fallo en el registro", "Ocurrió un error inesperado. Por favor, intenta más tarde.");
        }
      });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.mainContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete para organizar y participar en eventos únicos de tu zona.</Text>
        </View>

        <View style={styles.card}>
          <TextInput 
            style={styles.input} 
            placeholder="Nombre completo"
            placeholderTextColor="#9CA3AF"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
          
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
            placeholder="Contraseña (mín. 6 caracteres)"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput 
            style={styles.input} 
            placeholder="Confirmar contraseña"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
            <Text style={styles.primaryButtonText}>Registrarse Ahora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
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
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: '700' }
});

export default RegisterScreen;
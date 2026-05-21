// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (titulo, mensaje) => {
    if (Platform.OS === 'web') {
      alert(`${titulo}: ${mensaje}`);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const handleSignUp = () => {
    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      showAlert("Campos incompletos", "Por favor, completa todos los campos.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      showAlert("Correo inválido", "Por favor, ingresa un correo válido.");
      return;
    }

    if (password.length < 6) {
      showAlert("Contraseña débil", "Debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        updateProfile(userCredential.user, { displayName: nombre })
          .then(() => {
            setLoading(false);
            if (Platform.OS === 'web') {
              alert(`¡Bienvenido/a, ${nombre}!`);
              navigation.replace('Home');
            } else {
              Alert.alert("¡Cuenta creada!", "Tu registro ha sido exitoso.", [{ text: "Continuar", onPress: () => navigation.replace('Home') }]);
            }
          });
      })
      .catch(error => {
        setLoading(false);
        console.log("Error de registro:", error.code);
        if (error.code === 'auth/email-already-in-use') {
          showAlert("Cuenta existente", "Este correo ya está registrado.");
        } else {
          showAlert("Fallo en el registro", "Ocurrió un error. Intenta más tarde.");
        }
      });
  };

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete para organizar y participar en eventos únicos de tu zona.</Text>
        </View>

        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#9CA3AF" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirmar contraseña" placeholderTextColor="#9CA3AF" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          <TouchableOpacity 
            style={[styles.primaryButton, loading && { backgroundColor: '#93C5FD' }]} 
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Registrarse Ahora</Text>}
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
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5, marginBottom: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', marginBottom: 16 },
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: '700' }
});

export default RegisterScreen;
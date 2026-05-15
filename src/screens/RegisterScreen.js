// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState(''); // <-- Nuevo estado para el nombre
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    // 1. Validar que no haya campos vacíos
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert("Atención", "Por favor, completa todos los campos, incluyendo tu nombre.");
      return;
    }

    // 2. Validar tamaño de la contraseña ANTES de enviarla a Firebase
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Por seguridad, tu contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // 3. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden. Verifícalas.");
      return;
    }

    // 4. Crear la cuenta en Firebase
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Si se crea con éxito, le asignamos el nombre al perfil del usuario
        updateProfile(userCredential.user, {
          displayName: nombre
        }).then(() => {
          Alert.alert("¡Bienvenido/a!", `Cuenta creada exitosamente, ${nombre}`);
          navigation.replace('Home');
        });
      })
      .catch(error => {
        console.error("Error detallado de Firebase:", error);
        
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert("Correo duplicado", "Este correo ya está registrado en la aplicación.");
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert("Correo inválido", "Asegúrate de escribir un correo electrónico válido.");
        } else {
          Alert.alert("Error", error.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      {/* Nuevo Input para el Nombre */}
      <TextInput 
        style={styles.input} 
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña (Mínimo 6 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Confirmar Contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  linkText: { color: '#007bff', marginTop: 15, textAlign: 'center' }
});

export default RegisterScreen;
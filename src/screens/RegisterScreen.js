// src/screens/RegisterScreen.js
// Importamos React y el hook useState para manejar los datos del formulario (estado local).
import React, { useState } from 'react';
// Importamos componentes de UI y utilidades de React Native.
import { 
  View, 
  Text, 
  TextInput, // Campos de entrada de texto
  TouchableOpacity, // Botones con efecto visual al tocarlos
  StyleSheet, 
  Alert, // Alertas nativas para mensajes de error/éxito
  KeyboardAvoidingView, // Evita que el teclado oculte el formulario al escribir
  Platform, // Útil para escribir código específico para web, iOS o Android
  ScrollView, // Permite hacer scroll si la pantalla es muy pequeña
  ActivityIndicator // El "spinner" o círculo de carga
} from 'react-native';

// Importamos la instancia de autenticación configurada de Firebase.
import { auth } from '../config/firebase';
// Importamos las funciones de Firebase Auth necesarias para crear un usuario y actualizar su perfil.
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Componente principal: Pantalla de Registro
const RegisterScreen = ({ navigation }) => {
  // --- Estados de la Pantalla ---
  // Almacenan lo que el usuario escribe en cada campo del formulario.
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estado para controlar cuándo mostrar el spinner de carga (evita doble click al botón).
  const [loading, setLoading] = useState(false);

  // --- Funciones Auxiliares ---
  // Función para mostrar alertas de forma consistente tanto en la Web como en Móviles (iOS/Android).
  const showAlert = (titulo, mensaje) => {
    if (Platform.OS === 'web') {
      // Usa la alerta nativa del navegador en la versión Web
      alert(`${titulo}: ${mensaje}`);
    } else {
      // Usa el componente Alert de React Native en dispositivos móviles
      Alert.alert(titulo, mensaje);
    }
  };

  // --- Función de Lógica de Registro ---
  const handleSignUp = () => {
    // 1. Validación de campos vacíos
    // Comprobamos que ningún campo esté vacío (usamos trim() para ignorar espacios en blanco).
    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      showAlert("Campos incompletos", "Por favor, completa todos los campos.");
      return; // Detenemos la ejecución si hay campos vacíos
    }

    // 2. Validación de formato de correo electrónico usando una Expresión Regular (Regex)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      showAlert("Correo inválido", "Por favor, ingresa un correo válido.");
      return;
    }

    // 3. Validación de la fuerza de la contraseña (Firebase exige mínimo 6 caracteres)
    if (password.length < 6) {
      showAlert("Contraseña débil", "Debe tener al menos 6 caracteres.");
      return;
    }

    // 4. Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      showAlert("Error", "Las contraseñas no coinciden.");
      return;
    }

    // Si pasamos todas las validaciones, iniciamos el estado de carga
    setLoading(true);

    // 5. Creación del usuario en Firebase Auth
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Si el usuario se crea con éxito, Firebase devuelve un "userCredential".
        // 6. Actualizamos el perfil del nuevo usuario para agregarle su Nombre.
        // createUserWithEmailAndPassword solo guarda correo y contraseña, por eso necesitamos este paso extra.
        updateProfile(userCredential.user, { displayName: nombre })
          .then(() => {
            // Detenemos el estado de carga
            setLoading(false);
            
            // Mostramos mensaje de éxito y navegamos a la pantalla "Home"
            if (Platform.OS === 'web') {
              alert(`¡Bienvenido/a, ${nombre}!`);
              navigation.replace('Home'); // replace evita que el usuario pueda volver al registro con el botón atrás
            } else {
              Alert.alert(
                "¡Cuenta creada!", 
                "Tu registro ha sido exitoso.", 
                [{ text: "Continuar", onPress: () => navigation.replace('Home') }]
              );
            }
          });
      })
      .catch(error => {
        // Manejo de errores si Firebase rechaza la creación de la cuenta
        setLoading(false);
        console.log("Error de registro:", error.code);
        
        // Comprobamos si el error es porque el correo ya está en uso
        if (error.code === 'auth/email-already-in-use') {
          showAlert("Cuenta existente", "Este correo ya está registrado.");
        } else {
          // Manejo de errores genéricos (ej. sin conexión a internet)
          showAlert("Fallo en el registro", "Ocurrió un error. Intenta más tarde.");
        }
      });
  };

  // --- Renderizado de la Interfaz (UI) ---
  return (
    // KeyboardAvoidingView empuja el contenido hacia arriba para que el teclado no lo oculte
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* ScrollView permite desplazarse si el contenido es más alto que la pantalla */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN: Encabezado */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete para organizar y participar en eventos únicos de tu zona.</Text>
        </View>

        {/* SECCIÓN: Tarjeta del Formulario (Contenedor blanco con sombra) */}
        <View style={styles.card}>
          
          {/* Campo: Nombre */}
          <TextInput 
            style={styles.input} 
            placeholder="Nombre completo" 
            placeholderTextColor="#9CA3AF" 
            value={nombre} 
            onChangeText={setNombre} 
            autoCapitalize="words" // Pone en mayúscula la primera letra de cada palabra
          />
          
          {/* Campo: Correo Electrónico */}
          <TextInput 
            style={styles.input} 
            placeholder="Correo electrónico" 
            placeholderTextColor="#9CA3AF" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" // Desactiva las mayúsculas automáticas
            keyboardType="email-address" // Muestra el teclado optimizado para emails (con la arroba a mano)
          />
          
          {/* Campo: Contraseña */}
          <TextInput 
            style={styles.input} 
            placeholder="Contraseña (mín. 6 caracteres)" 
            placeholderTextColor="#9CA3AF" 
            secureTextEntry // Oculta los caracteres de la contraseña
            value={password} 
            onChangeText={setPassword} 
          />
          
          {/* Campo: Confirmar Contraseña */}
          <TextInput 
            style={styles.input} 
            placeholder="Confirmar contraseña" 
            placeholderTextColor="#9CA3AF" 
            secureTextEntry // Oculta los caracteres de la contraseña
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
          />

          {/* Botón Principal de Registro */}
          <TouchableOpacity 
            // Si está cargando (loading=true), le aplicamos un color azul más claro
            style={[styles.primaryButton, loading && { backgroundColor: '#93C5FD' }]} 
            onPress={handleSignUp}
            disabled={loading} // Deshabilita el botón mientras carga para evitar múltiples registros accidentales
          >
            {/* Si está cargando muestra el spinner, sino muestra el texto del botón */}
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Registrarse Ahora</Text>}
          </TouchableOpacity>
        </View>

        {/* SECCIÓN: Pie de página con enlace de redirección al Login */}
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

// --- Estilos de la Pantalla ---
// StyleSheet.create mejora el rendimiento creando un objeto de estilos compilado.
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' }, // Fondo gris muy claro para toda la pantalla
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  // Estilos del encabezado
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  
  // Estilo de la tarjeta blanca que contiene el formulario
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 5, 
    marginBottom: 24, 
    width: '100%', 
    maxWidth: 480, 
    alignSelf: 'center' 
  },
  
  // Estilo base para todos los campos de texto
  input: { 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: '#1F2937', 
    marginBottom: 16 
  },
  
  // Estilo del botón principal
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  // Estilos del enlace inferior
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: '700' }
});

export default RegisterScreen;
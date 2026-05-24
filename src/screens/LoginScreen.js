// src/screens/LoginScreen.js
// Importamos WebBrowser de Expo, esencial para manejar flujos de autenticación web (como Google o Facebook) en dispositivos móviles.
import * as WebBrowser from "expo-web-browser";

// Importamos la librería nativa para el inicio de sesión con Google en React Native.
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Importamos las funciones de autenticación desde Firebase.
// Estas funciones nos permiten conectar nuestra app con los servicios de identidad de Firebase.
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

// Importamos hooks de React: useEffect para ejecutar código al cargar la pantalla y useState para manejar datos locales.
import { useEffect, useState } from "react";

// Importamos los componentes visuales y utilidades de React Native.
import {
  Alert,
  KeyboardAvoidingView, // Evita que el teclado virtual oculte los campos de texto
  Platform, // Útil para ejecutar código diferente si estamos en web, iOS o Android
  SafeAreaView, // Evita que el contenido se superponga con la barra de estado del teléfono
  ScrollView, // Permite desplazar la pantalla si el contenido no cabe
  StyleSheet, // Para crear estilos CSS-like
  Text,
  TextInput, // Campo para que el usuario escriba
  TouchableOpacity, // Botón con efecto de opacidad al ser presionado
  View,
} from "react-native";

// Importamos la instancia de autenticación de Firebase configurada previamente.
import { auth } from "../config/firebase";

// Esta línea es necesaria para que Expo WebBrowser sepa cuándo se ha completado una sesión de autenticación emergente.
WebBrowser.maybeCompleteAuthSession();

// Componente principal: Pantalla de Inicio de Sesión
const LoginScreen = ({ navigation }) => {
  // --- Estados de la Pantalla ---
  // Guardamos el correo electrónico y la contraseña que el usuario escribe.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Efectos Secundarios (useEffect) ---
  // Configuramos Google Sign-In cuando la pantalla se carga por primera vez.
  useEffect(() => {
    // La configuración nativa de GoogleSignin solo se ejecuta en dispositivos móviles (iOS/Android), no en web.
    if (Platform.OS !== "web") {
      GoogleSignin.configure({
        // Este es el Client ID de tipo "Web application" generado en Google Cloud Console para Firebase.
        webClientId: "856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com",
      });
    }
  }, []);

  // --- Funciones de Lógica de Inicio de Sesión ---

  // 🔴 FLUJO DE GOOGLE (Soporte Híbrido: Web y Nativo)
  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === "web") {
        // --- Comportamiento para la WEB ---
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" }); // Fuerza a preguntar qué cuenta de Google usar
        // Muestra una ventana emergente para iniciar sesión
        await signInWithPopup(auth, provider);
        // Si tiene éxito, navegamos a la pantalla "Home"
        navigation.replace("Home");
      } else {
        // --- Comportamiento NATIVO (iOS/Android) ---
        // Verificamos si el dispositivo tiene los servicios de Google Play instalados
        await GoogleSignin.hasPlayServices();
        // Abrimos la pantalla nativa de inicio de sesión de Google
        const userInfo = await GoogleSignin.signIn();
        // Obtenemos el token de identidad (idToken)
        const idToken = userInfo.data?.idToken || userInfo.idToken;

        if (!idToken) {
          throw new Error("Google no devolvió un token de seguridad.");
        }

        // Creamos una credencial de Firebase usando el token de Google
        const credential = GoogleAuthProvider.credential(idToken);
        // Iniciamos sesión en Firebase con esta credencial
        await signInWithCredential(auth, credential);
        navigation.replace("Home");
      }
    } catch (error) {
      console.log("Error de Google:", error);
      Alert.alert("Error de Google", error.message);
    }
  };

  // 🔵 FLUJO DE FACEBOOK (Soporte Híbrido: Web y Nativo)
  const handleFacebookLogin = async () => {
    try {
      if (Platform.OS === "web") {
        // --- Comportamiento para la WEB ---
        const provider = new FacebookAuthProvider();
        // Solicitamos acceso al correo y perfil público del usuario
        provider.addScope('email');
        provider.addScope('public_profile');
        // Abre la ventana emergente de Facebook
        await signInWithPopup(auth, provider);
        navigation.replace("Home");
      } else {
        // --- Comportamiento NATIVO (iOS/Android) ---
        // Importamos la librería de Facebook aquí adentro para evitar errores al compilar en la Web,
        // ya que esta librería es estrictamente para dispositivos móviles.
        const { LoginManager, AccessToken } = require('react-native-fbsdk-next');

        // Iniciamos el proceso de login nativo pidiendo permisos
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        
        // Verificamos si el usuario canceló el proceso a medias
        if (result.isCancelled) {
          console.log("Login de Facebook cancelado por el usuario");
          return;
        }

        // Obtenemos el token de acceso devuelto por Facebook
        const data = await AccessToken.getCurrentAccessToken();
        if (!data) {
          throw new Error("No se pudo obtener el token nativo de Facebook");
        }

        // Creamos una credencial para Firebase con el token de Facebook
        const credential = FacebookAuthProvider.credential(data.accessToken);
        // Iniciamos sesión en Firebase
        await signInWithCredential(auth, credential);
        navigation.replace("Home");
      }
    } catch (error) {
      console.log("Error de Facebook:", error);
      
      // Manejo especial si el correo de Facebook ya fue registrado mediante Google o Contraseña
      if (error.code === 'auth/account-exists-with-different-credential') {
        Alert.alert(
          "Cuenta duplicada",
          "Ya tienes una cuenta con este correo registrada usando otro método (Google o Correo). Inicia sesión con ese método.",
          [{ text: "Entendido" }]
        );
      } else {
        Alert.alert("Error de Facebook", error.message || "Ocurrió un problema al conectar con Facebook.");
      }
    }
  };

  // ✉️ FLUJO DE CORREO Y CONTRASEÑA
  const handleLogin = () => {
    // 1. Validación: Comprobamos que los campos no estén vacíos
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    // 2. Ejecutamos la función de inicio de sesión de Firebase
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace("Home")) // Si es exitoso, enviamos al Home
      .catch((error) => {
        // Manejamos errores comunes de credenciales incorrectas
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          Alert.alert("Acceso denegado", "El correo o la contraseña son incorrectos.");
        } else {
          Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
        }
      });
  };

  // --- Renderizado de la Interfaz (UI) ---
  return (
    // SafeAreaView protege el contenido del "notch" o bordes curvos de los teléfonos modernos
    <SafeAreaView style={styles.mainContainer}>
      {/* KeyboardAvoidingView empuja el formulario hacia arriba cuando se abre el teclado */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* SECCIÓN: Logo y Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏕️</Text>
            </View>
            <Text style={styles.appName}>Eventos Comunidad</Text>
          </View>

          {/* SECCIÓN: Encabezado con mensaje de bienvenida */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>Ingresa para descubrir y organizar los mejores eventos de tu zona.</Text>
          </View>

          {/* SECCIÓN: Formulario de Correo y Contraseña */}
          <View style={styles.formContainer}>
            
            {/* Campo de Correo Electrónico */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none" // Evita que la primera letra se vuelva mayúscula (útil para emails)
                keyboardType="email-address" // Muestra el teclado optimizado para emails
              />
            </View>

            {/* Campo de Contraseña */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry // Oculta el texto ingresado por seguridad (muestra puntitos)
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Botón principal de Inicio de Sesión */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* SECCIÓN: Divisor visual "O continúa con" */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SECCIÓN: Botones Sociales (Google y Facebook) */}
          <View style={styles.socialContainer}>
            {/* Botón Google */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }]}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔴</Text>
              <Text style={[styles.socialButtonText, { color: "#374151" }]}>Google</Text>
            </TouchableOpacity>

            {/* Botón Facebook */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#1877F2", borderColor: "#1877F2" }]}
              onPress={handleFacebookLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={[styles.socialButtonText, { color: "#FFFFFF" }]}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* SECCIÓN: Pie de página con enlace a Registro */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            {/* Navega a la pantalla "Register" */}
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Estilos de la Pantalla ---
// StyleSheet optimiza los estilos definidos y los mapea a los componentes nativos de UI
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 30, paddingVertical: 40, width: "100%", maxWidth: 500, alignSelf: "center" },
  brandContainer: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 20, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1 },
  headerContainer: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "900", color: "#111827", marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "#6B7280", lineHeight: 24, fontWeight: "400" },
  formContainer: { width: "100%" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 16, marginBottom: 16, paddingHorizontal: 15 },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: "#1F2937", fontWeight: "500" },
  primaryButton: { backgroundColor: "#3B82F6", borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 35 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 15, color: "#9CA3AF", fontSize: 14, fontWeight: "500" },
  socialContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  socialButton: { flex: 0.48, flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingVertical: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  socialIcon: { fontSize: 18, marginRight: 8 },
  socialButtonText: { fontSize: 15, fontWeight: "700" },
  footerContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: "auto" },
  footerText: { color: "#6B7280", fontSize: 15, fontWeight: "500" },
  footerLink: { color: "#3B82F6", fontSize: 15, fontWeight: "800" },
});

export default LoginScreen;
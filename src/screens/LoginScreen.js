// src/screens/LoginScreen.js
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  
 // Configuración de Google (Modo Nativo Limpio)
  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: "856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com",
      // Usa el ID de Android que encontramos en tu archivo json:
      androidClientId: "856721282484-393gncl87p7dakltb8fbtdg12nqb6rqr.apps.googleusercontent.com",
      
     
    });
  // Configuración de Facebook (Modo Nativo)
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "1538963127645703",
    scopes: ["public_profile", "email"],
    redirectUri: makeRedirectUri({ scheme: 'eventoscomunitarios' }),
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace("Home"))
        .catch((error) => Alert.alert("Error de Google", error.message));
    }
  }, [googleResponse, navigation]);

  useEffect(() => {
    if (fbResponse?.type === "success") {
      const { accessToken } = fbResponse.authentication;
      if (accessToken) {
        const credential = FacebookAuthProvider.credential(accessToken);
        signInWithCredential(auth, credential)
          .then(() => navigation.replace("Home"))
          .catch((error) => Alert.alert("Error de Facebook", error.message));
      }
    }
  }, [fbResponse, navigation]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert(
        "Campos vacíos",
        "Por favor, ingresa tu correo y contraseña."
      );
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace("Home"))
      .catch((error) => {
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          Alert.alert(
            "Acceso denegado",
            "El correo o la contraseña son incorrectos. Por favor, verifica tus datos."
          );
        } else if (error.code === "auth/invalid-email") {
          Alert.alert(
            "Correo inválido",
            "El formato del correo electrónico no es válido."
          );
        } else if (error.code === "auth/too-many-requests") {
          Alert.alert(
            "Demasiados intentos",
            "Has intentado iniciar sesión demasiadas veces. Intenta de nuevo más tarde."
          );
        } else {
          Alert.alert(
            "Error",
            "Ocurrió un problema al iniciar sesión. Intenta más tarde."
          );
        }
      });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo y Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏕️</Text>
            </View>
            <Text style={styles.appName}>Eventos Comunidad</Text>
          </View>

          {/* Encabezado */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>
              Ingresa para descubrir y organizar los mejores eventos de tu zona.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botones Sociales */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
              ]}
              disabled={!googleRequest}
              onPress={() => googlePromptAsync()}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔴</Text>
              <Text style={[styles.socialButtonText, { color: "#374151" }]}>
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: "#1877F2", borderColor: "#1877F2" },
              ]}
              disabled={!fbRequest}
              onPress={() => fbPromptAsync()}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
                Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pie de página */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  brandContainer: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 1,
  },

  headerContainer: { marginBottom: 30 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    fontWeight: "400",
  },

  formContainer: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },

  forgotPasswordBtn: { alignSelf: "flex-end", marginBottom: 25 },
  forgotPasswordText: { color: "#3B82F6", fontSize: 14, fontWeight: "600" },

  primaryButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 35,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    marginHorizontal: 15,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  socialButton: {
    flex: 0.48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  socialIcon: { fontSize: 18, marginRight: 8 },
  socialButtonText: { fontSize: 15, fontWeight: "700" },

  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  footerText: { color: "#6B7280", fontSize: 15, fontWeight: "500" },
  footerLink: { color: "#3B82F6", fontSize: 15, fontWeight: "800" },
});

export default LoginScreen;
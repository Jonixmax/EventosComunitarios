// src/screens/LoginScreen.js
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
// 👇 Importamos la nueva librería nativa de Google 👇
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
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

// 👇 Configuramos Google Sign-In (Afuera del componente) 👇
// Usamos el Web Client ID porque Firebase lo necesita para generar el Token
GoogleSignin.configure({
  webClientId: "856721282484-qked104iulgeeti8007lakg1e0gp7d8s.apps.googleusercontent.com",
});

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fbDiag, setFbDiag] = useState(null);

  // ─── Redirect URI: usar proxy de Expo en nativo, vacío en web ────────────
  const redirectUri = makeRedirectUri(
    Platform.OS === 'web'
      ? {}
      : { useProxy: true }   // ← Expo Auth Proxy: siempre funciona en Expo Go
  );

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "1538963127645703",
    scopes: ["public_profile", "email"],
    redirectUri: Platform.OS !== 'web' ? redirectUri : undefined,
  });

  useEffect(() => {
    console.log("📌 [FB] Redirect URI calculado:", redirectUri);
    console.log("📌 [FB] Platform:", Platform.OS);
    console.log("📌 [FB] fbRequest listo:", !!fbRequest);
  }, [fbRequest]);

  // 🔍 Capturamos TODOS los estados de la respuesta de Facebook
  useEffect(() => {
    if (!fbResponse) return;

    console.log("📬 [FB] Respuesta completa:", JSON.stringify(fbResponse, null, 2));

    if (fbResponse.type === "success") {
      const { accessToken } = fbResponse.authentication ?? {};
      console.log("✅ [FB] accessToken recibido:", accessToken ? "SÍ" : "NO");
      setFbDiag(`✅ Token OK\n${accessToken?.slice(0, 20)}...`);

      if (accessToken) {
        const credential = FacebookAuthProvider.credential(accessToken);
        signInWithCredential(auth, credential)
          .then(() => {
            console.log("🎉 [FB] Firebase OK → navegando a Home");
            navigation.replace("Home");
          })
          .catch((error) => {
            console.error("❌ [FB] Error Firebase:", error.code, error.message);
            setFbDiag(`❌ Firebase error\nCódigo: ${error.code}\n${error.message}`);
            Alert.alert("Error de Facebook (Firebase)", `Código: ${error.code}\n\n${error.message}`);
          });
      } else {
        const msg = "accessToken vino vacío aunque type=success";
        console.warn("⚠️ [FB]", msg);
        setFbDiag(`⚠️ ${msg}`);
        Alert.alert("Error de Facebook", msg);
      }

    } else if (fbResponse.type === "error") {
      const err = fbResponse.error;
      console.error("❌ [FB] Error en auth-session:", JSON.stringify(err));
      setFbDiag(`❌ Auth error\nCódigo: ${err?.code}\n${err?.message}`);
      Alert.alert("Error de Facebook (auth-session)", `Código: ${err?.code}\n\n${err?.message}`);

    } else if (fbResponse.type === "cancel") {
      console.log("🚫 [FB] El usuario canceló el login");
      setFbDiag("🚫 Cancelado por el usuario");

    } else if (fbResponse.type === "dismiss") {
      console.log("🚪 [FB] El browser fue cerrado (dismiss)");
      setFbDiag("🚪 Ventana cerrada (dismiss)");

    } else {
      console.log("❓ [FB] Tipo de respuesta desconocido:", fbResponse.type);
      setFbDiag(`❓ Tipo: ${fbResponse.type}`);
    }
  }, [fbResponse, navigation]);
const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === "web") {
        // 🌐 --- FLUJO PARA LA WEB ---
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        // Si todo sale bien, Firebase inicia sesión solo y redirigimos
        navigation.replace("Home");

      } else {
        // 📱 --- FLUJO NATIVO PARA ANDROID/iOS ---
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        
        // Buscamos el token en la estructura
        const idToken = userInfo.data?.idToken || userInfo.idToken;

        if (!idToken) {
          throw new Error("Google no devolvió un token de seguridad.");
        }

        // Pasamos el Token a Firebase
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        
        navigation.replace("Home");
      }
    } catch (error) {
      console.log("Error de Google:", error);
      Alert.alert("Error de Google", error.message);
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor, ingresa tu correo y contraseña.");
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
          Alert.alert("Acceso denegado", "El correo o la contraseña son incorrectos.");
        } else {
          Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
        }
      });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.subtitle}>Ingresa para descubrir y organizar los mejores eventos de tu zona.</Text>
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

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 🔍 Panel de Diagnóstico Facebook */}
          {fbDiag && (
            <View style={styles.diagBox}>
              <Text style={styles.diagTitle}>🔍 Diagnóstico FB</Text>
              <Text style={styles.diagText}>{fbDiag}</Text>
              <TouchableOpacity onPress={() => setFbDiag(null)}>
                <Text style={styles.diagClose}>Cerrar ✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botones Sociales */}
          <View style={styles.socialContainer}>
            {/* 👇 BOTÓN DE GOOGLE ACTUALIZADO 👇 */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }]}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔴</Text>
              <Text style={[styles.socialButtonText, { color: "#374151" }]}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: "#1877F2", borderColor: "#1877F2" }]}
              disabled={Platform.OS !== 'web' && !fbRequest}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  // 🌐 Web: usar popup igual que Google
                  try {
                    const provider = new FacebookAuthProvider();
                    provider.addScope('email');
                    provider.addScope('public_profile');
                    await signInWithPopup(auth, provider);
                    navigation.replace("Home");
                  } catch (error) {
                    console.error("❌ [FB Web]", error.code, error.message);
                    if (error.code === 'auth/account-exists-with-different-credential') {
                      setFbDiag(
                        "⚠️ Ya existe una cuenta con ese email.\n\n" +
                        "Iniciá sesión con Google o email/contraseña " +
                        "usando el mismo correo de tu cuenta de Facebook."
                      );
                      Alert.alert(
                        "Cuenta duplicada",
                        "Ya tenés una cuenta con ese correo registrada con otro método " +
                        "(Google o email). Iniciá sesión con ese método.",
                        [{ text: "Entendido" }]
                      );
                    } else {
                      setFbDiag(`❌ Web error\n${error.code}\n${error.message}`);
                      Alert.alert("Error Facebook (web)", error.message);
                    }
                  }
                } else {
                  // 📱 Nativo: usar expo-auth-session
                  fbPromptAsync();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={[styles.socialButtonText, { color: "#FFFFFF" }]}>Facebook</Text>
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
  // 🔍 Estilos del panel de diagnóstico
  diagBox: { backgroundColor: "#FEF3C7", borderWidth: 1.5, borderColor: "#F59E0B", borderRadius: 12, padding: 14, marginBottom: 20 },
  diagTitle: { fontSize: 13, fontWeight: "800", color: "#92400E", marginBottom: 6 },
  diagText: { fontSize: 12, color: "#78350F", fontFamily: "monospace", lineHeight: 18 },
  diagClose: { marginTop: 8, fontSize: 12, color: "#B45309", fontWeight: "700", textAlign: "right" },
});

export default LoginScreen;
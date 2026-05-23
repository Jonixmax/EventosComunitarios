// src/screens/ProfileScreen.js
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { auth, db } from "../config/firebase";
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // <-- NUEVA IMPORTACIÓN

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [misAsistencias, setMisAsistencias] = useState([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalComentarios, setTotalComentarios] = useState(0);

  const usuarioLogueado = auth.currentUser;

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!usuarioLogueado) return;

      try {
        // 1. Historial de inscripciones
        const qAsistencias = query(
          collection(db, "participaciones"),
          where("usuarioUid", "==", usuarioLogueado.uid),
        );
        const snapshotAsistencias = await getDocs(qAsistencias);

        const historial = snapshotAsistencias.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        historial.sort(
          (a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro),
        );
        setMisAsistencias(historial);

        // 2. Contador de Comentarios Realizados (Colección principal)
        const qComentarios = query(
          collection(db, "comentarios"),
          where("usuarioUid", "==", usuarioLogueado.uid),
        );
        const snapshotComentarios = await getDocs(qComentarios);
        setTotalComentarios(snapshotComentarios.size);

        // 3. Total de eventos en la comunidad
        const snapshotEventos = await getDocs(collection(db, "eventos"));
        setTotalEventos(snapshotEventos.size);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

const handleCerrarSesion = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, salir",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Si es nativo (Android/iOS), cerramos sesión de Google
            if (Platform.OS !== "web") {
              await GoogleSignin.signOut();
            }

            // 2. Cerramos la sesión de Firebase Y ESPERAMOS a que termine
            await signOut(auth);

            // 3. Solo después de que Firebase responda, navegamos
            console.log("Sesión cerrada correctamente");
            navigation.replace("Login");
            
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* CABECERA AZUL (HERO) */}
      <View style={styles.headerBackground}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={handleCerrarSesion}
          >
            <Text style={styles.logoutIconText}>Salir 🚪</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userInfoContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuarioLogueado?.displayName
                ? usuarioLogueado.displayName.charAt(0).toUpperCase()
                : "U"}
            </Text>
          </View>
          <Text style={styles.userName}>
            {usuarioLogueado?.displayName || "Usuario de la Comunidad"}
          </Text>
          <Text style={styles.userEmail}>{usuarioLogueado?.email}</Text>
        </View>
      </View>

      {/* DASHBOARD FLOTANTE DE ESTADÍSTICAS */}
      <View style={styles.floatingStatsCard}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#10B981" }]}>
            {misAsistencias.length}
          </Text>
          <Text style={styles.statLabel}>Asistencias</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
            {totalComentarios}
          </Text>
          <Text style={styles.statLabel}>Comentarios</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#3B82F6" }]}>
            {totalEventos}
          </Text>
          <Text style={styles.statLabel}>Eventos</Text>
        </View>
      </View>

      {/* LISTA DE HISTORIAL */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Historial de Participación</Text>

        <FlatList
          data={misAsistencias}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎫</Text>
              <Text style={styles.emptyTextTitle}>Sin historial</Text>
              <Text style={styles.emptyTextSubtitle}>
                Aún no te has registrado en ningún evento. ¡Explora la
                comunidad!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyIconContainer}>
                <Text style={styles.historyIcon}>🎟️</Text>
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {item.eventoTitulo}
                </Text>
                <View style={styles.historyDateBadge}>
                  <Text style={styles.historyDateText}>
                    Registrado el:{" "}
                    {new Date(item.fechaRegistro).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F9FAFB" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 15,
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },

  headerBackground: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },
  logoutIconBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutIconText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  userInfoContainer: { alignItems: "center" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { fontSize: 36, fontWeight: "900", color: "#3B82F6" },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: { fontSize: 14, color: "#DBEAFE", fontWeight: "500" },

  floatingStatsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
    marginBottom: 25,
  },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  statNumber: { fontSize: 26, fontWeight: "900", marginBottom: 4 },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F3F4F6",
    height: "80%",
    alignSelf: "center",
  },

  listContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 15,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptyTextSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  historyCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  historyIcon: { fontSize: 24 },
  historyContent: { flex: 1 },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  historyDateBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historyDateText: { fontSize: 12, color: "#4B5563", fontWeight: "600" },
});

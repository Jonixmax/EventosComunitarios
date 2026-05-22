// src/screens/HomeScreen.js
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";

// Paleta de colores para darle vida a las tarjetas
const CARD_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

const HomeScreen = ({ navigation }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [misAsistencias, setMisAsistencias] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  // 1. Cargar Eventos
  useEffect(() => {
    const eventosRef = collection(db, "eventos");
    const unsubscribe = onSnapshot(eventosRef, (snapshot) => {
      const eventosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEventos(eventosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar mis asistencias en tiempo real
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "participaciones"),
      where("usuarioUid", "==", auth.currentUser.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const asistenciasData = snapshot.docs.map((doc) => doc.data().eventoId);
      setMisAsistencias(asistenciasData);
    });
    return () => unsubscribe();
  }, []);

  // 3. Calcular notificaciones (Eventos para hoy o mañana)
  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const proximos = eventos.filter((evento) => {
      if (!misAsistencias.includes(evento.id)) return false;
      if (!evento.fecha) return false;

      let eventDate;
      if (evento.fecha.includes("/")) {
        const [day, month, year] = evento.fecha.split("/");
        eventDate = new Date(year, month - 1, day);
      } else {
        eventDate = new Date(evento.fecha);
      }
      eventDate.setHours(0, 0, 0, 0);

      return (
        eventDate.getTime() === hoy.getTime() ||
        eventDate.getTime() === manana.getTime()
      );
    });

    setNotificaciones(proximos);
  }, [eventos, misAsistencias]);

  const abrirNotificaciones = () => {
    if (notificaciones.length > 0) {
      const titulos = notificaciones
        .map((e) => `⏰ ${e.titulo} (${e.fecha})`)
        .join("\n");
      Alert.alert(
        "🔔 Recordatorios",
        `¡No lo olvides! Tienes estos eventos próximamente:\n\n${titulos}`,
      );
    } else {
      Alert.alert(
        "🔔 Todo tranquilo",
        "No tienes eventos programados para hoy ni mañana.",
      );
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => navigation.replace("Login"))
      .catch((error) => console.log("Error al cerrar sesión:", error));
  };

  const confirmarEliminacion = (id, titulo) => {
    if (Platform.OS === "web") {
      const confirmar = window.confirm(`¿Eliminar el evento "${titulo}"?`);
      if (confirmar) ejecutarEliminacion(id);
    } else {
      Alert.alert(
        "Eliminar Evento",
        `¿Seguro que deseas eliminar "${titulo}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => ejecutarEliminacion(id),
          },
        ],
      );
    }
  };

  const ejecutarEliminacion = async (id) => {
    try {
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el evento.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loaderText}>Preparando tu comunidad...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER REDISEÑADO */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Descubre</Text>
            <Text style={styles.subtitle}>Eventos en tu comunidad</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={abrirNotificaciones}
            >
              <Text style={styles.iconEmoji}>🔔</Text>
              {notificaciones.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificaciones.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.iconEmoji}>👤</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {auth.currentUser && (
          <View style={styles.userChip}>
            <Text style={styles.userText}>
              👋 Hola, {auth.currentUser.displayName || auth.currentUser.email}
            </Text>
          </View>
        )}
      </View>

      {/* LISTA DE EVENTOS REDISEÑADA */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏕️</Text>
            <Text style={styles.emptyTextTitle}>Todo está muy tranquilo</Text>
            <Text style={styles.emptyTextSubtitle}>
              Sé el primero en organizar una actividad para la comunidad.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          // Asignar un color dinámico basado en la posición
          const cardBorderColor = CARD_COLORS[index % CARD_COLORS.length];

          return (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: cardBorderColor }]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("EventDetails", { event: item })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.eventName} numberOfLines={1}>
                  {item.titulo}
                </Text>

                {auth.currentUser?.uid === item.creadorId && (
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => confirmarEliminacion(item.id, item.titulo)}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.eventDescription} numberOfLines={2}>
                {item.descripcion}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>📅</Text>
                  <Text style={styles.tagText}>{item.fecha}</Text>
                </View>

                <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
                  <Text style={styles.tagIcon}>📍</Text>
                  <Text
                    style={[styles.tagText, { color: "#4B5563" }]}
                    numberOfLines={1}
                  >
                    {item.ubicacion.length > 15
                      ? item.ubicacion.substring(0, 15) + "..."
                      : item.ubicacion}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB (Botón Flotante) REDISEÑADO */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateEvent")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: { flex: 1 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 2, fontWeight: "500" },

  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    backgroundColor: "#F3F4F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: { fontSize: 18 },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },

  userChip: {
    marginTop: 15,
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  userText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },

  listContainer: { padding: 20, paddingBottom: 100 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
    marginRight: 10,
  },
  deleteIconBtn: { backgroundColor: "#FEF2F2", padding: 8, borderRadius: 10 },
  deleteIconText: { fontSize: 14 },

  eventDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 16,
  },

  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagIcon: { fontSize: 12, marginRight: 4 },
  tagText: { fontSize: 13, fontWeight: "600", color: "#2563EB" },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    padding: 20,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 15 },
  emptyTextTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyTextSubtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#3B82F6",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 32, color: "#FFFFFF", fontWeight: "300", marginTop: -2 },
});

export default HomeScreen;

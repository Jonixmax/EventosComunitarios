// src/screens/HomeScreen.js
// Importamos funciones para el manejo de la sesión desde Firebase Auth
import { signOut } from "firebase/auth";
// Importamos funciones de Firestore para interactuar con la base de datos (leer, eliminar y suscribirse a cambios)
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
// Importamos hooks fundamentales de React: useEffect (para efectos secundarios) y useState (para manejar el estado local)
import { useEffect, useState } from "react";
// Importamos componentes visuales de React Native para armar la interfaz
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
// Importamos la instancia de autenticación (auth) y base de datos (db) previamente configuradas en Firebase
import { auth, db } from "../config/firebase";
// Importamos GoogleSignin para manejar el cierre de sesión si el usuario entró con Google
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 

// Paleta de colores para darle un borde de color dinámico y distinto a cada tarjeta de evento
const CARD_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

// Componente principal: Pantalla de Inicio
const HomeScreen = ({ navigation }) => {
  // --- Estados de la Pantalla ---
  const [eventos, setEventos] = useState([]); // Guarda la lista de todos los eventos
  const [loading, setLoading] = useState(true); // Controla el estado de carga (muestra el "spinner" al inicio)
  
  const [misAsistencias, setMisAsistencias] = useState([]); // Guarda los IDs de los eventos a los que el usuario asiste
  const [notificaciones, setNotificaciones] = useState([]); // Guarda los eventos que están próximos (hoy o mañana)

  // --- Efectos Secundarios (useEffect) ---

  // Efecto para ocultar el encabezado nativo (barra superior) que provee React Navigation por defecto.
  // Lo ocultamos porque hemos creado nuestro propio encabezado personalizado más abajo.
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, 
    });
  }, [navigation]);

 // 1. Cargar Eventos en Tiempo Real
  useEffect(() => {
    const eventosRef = collection(db, "eventos");
    
    // onSnapshot escucha cambios en la colección "eventos" en tiempo real. 
    // Si se agrega, edita o elimina un evento en Firebase, esta función se ejecuta automáticamente.
    const unsubscribe = onSnapshot(
      eventosRef, 
      (snapshot) => {
        // Mapeamos los documentos para extraer su ID y su información (data)
        const eventosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEventos(eventosData); // Guardamos los eventos en el estado
        setLoading(false); // Detenemos la animación de carga
      },
      (error) => {
        // Silenciamos el error 'permission-denied' ya que este suele ocurrir 
        // cuando el usuario cierra sesión y los permisos de Firebase cortan la lectura repentinamente.
        if (error.code === 'permission-denied') return;
        console.log("Error en eventos:", error);
      }
    );
    // Retornamos la función unsubscribe para limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  // 2. Cargar Mis Asistencias en Tiempo Real
  useEffect(() => {
    // Si no hay un usuario logueado, no hacemos nada
    if (!auth.currentUser) return;
    
    // Creamos una consulta (query) para buscar en "participaciones" solo aquellas 
    // donde el "usuarioUid" coincida con el ID del usuario actual.
    const q = query(
      collection(db, "participaciones"),
      where("usuarioUid", "==", auth.currentUser.uid),
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        // Obtenemos un arreglo solo con los "eventoId" a los que el usuario confirmó asistencia
        const asistenciasData = snapshot.docs.map((doc) => doc.data().eventoId);
        setMisAsistencias(asistenciasData);
      },
      (error) => {
        if (error.code === 'permission-denied') return;
        console.log("Error en asistencias:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Calcular Notificaciones (Eventos próximos)
  // Este efecto depende de 'eventos' y 'misAsistencias'. Cada vez que uno cambie, se recalcula.
  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizamos la hora al inicio del día para comparar solo las fechas
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1); // Sumamos un día para obtener la fecha de mañana

    // Filtramos los eventos para encontrar los que suceden hoy o mañana, y a los que el usuario asiste
    const proximos = eventos.filter((evento) => {
      // Si el usuario no asiste a este evento, lo ignoramos
      if (!misAsistencias.includes(evento.id)) return false;
      if (!evento.fecha) return false;

      let eventDate;
      // Convertimos el formato "DD/MM/YYYY" o formato ISO a un objeto Date
      if (evento.fecha.includes("/")) {
        const [day, month, year] = evento.fecha.split("/");
        eventDate = new Date(year, month - 1, day);
      } else {
        eventDate = new Date(evento.fecha);
      }
      eventDate.setHours(0, 0, 0, 0);

      // Verificamos si la fecha del evento coincide con hoy o mañana
      return (
        eventDate.getTime() === hoy.getTime() ||
        eventDate.getTime() === manana.getTime()
      );
    });

    // Guardamos los eventos próximos en el estado de notificaciones
    setNotificaciones(proximos);
  }, [eventos, misAsistencias]);

  // --- Funciones del Componente ---

  // Función que se ejecuta al presionar el ícono de la campanita
  const abrirNotificaciones = () => {
    if (notificaciones.length > 0) {
      // Creamos una lista de texto con los títulos de los eventos próximos
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

  // Función para cerrar la sesión del usuario de forma segura
  const handleSignOut = async () => {
    try {
      // 1. Intentamos cerrar sesión en Google primero (por si el usuario ingresó por ese método)
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignoramos el error si no entró con Google
      }

      // 2. Redirigimos a la pantalla de Login PRIMERO.
      // Esto desmonta HomeScreen y limpia los onSnapshot, evitando errores de permisos al cerrar sesión en Firebase.
      navigation.replace("Login");

      // 3. Finalmente, cerramos la sesión en Firebase
      await signOut(auth);
      
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
    }
  };

  // Función para preguntar al usuario si está seguro de eliminar un evento
  const confirmarEliminacion = (id, titulo) => {
    if (Platform.OS === "web") {
      // En la web usamos el confirm nativo del navegador
      const confirmar = window.confirm(`¿Eliminar el evento "${titulo}"?`);
      if (confirmar) ejecutarEliminacion(id);
    } else {
      // En móviles usamos el componente Alert
      Alert.alert(
        "Eliminar Evento",
        `¿Seguro que deseas eliminar "${titulo}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive", // El estilo destructive muestra el botón en rojo en iOS
            onPress: () => ejecutarEliminacion(id),
          },
        ],
      );
    }
  };

  // Función para borrar el evento de la base de datos de Firestore
  const ejecutarEliminacion = async (id) => {
    try {
      // Pasamos la referencia exacta del documento a deleteDoc
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el evento.");
    }
  };

  // --- Renderizado Condicional ---
  
  // Si los datos aún están cargando desde Firebase, mostramos una pantalla con un indicador (ActivityIndicator)
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loaderText}>Preparando tu comunidad...</Text>
      </View>
    );
  }

  // --- Renderizado Principal (UI) ---
  return (
    // SafeAreaView previene que el contenido se solape con la barra de estado del sistema (notch, batería, etc.)
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER PERSONALIZADO --- */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Descubre</Text>
            <Text style={styles.subtitle}>Eventos en tu comunidad</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            
            {/* Botón de Notificaciones (Campanita) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={abrirNotificaciones}
            >
              <Text style={styles.iconEmoji}>🔔</Text>
              {/* Si hay notificaciones, mostramos un pequeño círculo rojo con la cantidad */}
              {notificaciones.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificaciones.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Botón de Perfil (Usuario) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.iconEmoji}>👤</Text>
            </TouchableOpacity>
            
          </View>
        </View>

        {/* Mensaje de bienvenida con el nombre o email del usuario */}
        {auth.currentUser && (
          <View style={styles.userChip}>
            <Text style={styles.userText}>
              👋 Hola, {auth.currentUser.displayName || auth.currentUser.email}
            </Text>
          </View>
        )}
      </View>

      {/* --- LISTA DE EVENTOS --- */}
      {/* FlatList es el componente recomendado para renderizar listas largas de manera eficiente en React Native */}
      <FlatList
        data={eventos} // El arreglo de datos que vamos a mostrar
        keyExtractor={(item) => item.id} // Identificador único para cada elemento de la lista
        contentContainerStyle={styles.listContainer} // Estilos para el contenedor interno de la lista
        showsVerticalScrollIndicator={false} // Ocultamos la barra de scroll vertical
        
        // Lo que se muestra si la lista de eventos está vacía
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏕️</Text>
            <Text style={styles.emptyTextTitle}>Todo está muy tranquilo</Text>
            <Text style={styles.emptyTextSubtitle}>
              Sé el primero en organizar una actividad para la comunidad.
            </Text>
          </View>
        }
        
        // Cómo se renderiza cada elemento (tarjeta) de la lista
        renderItem={({ item, index }) => {
          // Asignamos un color de borde distinto a cada tarjeta alternando los colores del arreglo CARD_COLORS
          const cardBorderColor = CARD_COLORS[index % CARD_COLORS.length];

          return (
            // TouchableOpacity hace que toda la tarjeta sea un botón interactivo
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: cardBorderColor }]}
              activeOpacity={0.7}
              // Al presionar la tarjeta, navegamos a EventDetails y le pasamos los datos del evento
              onPress={() =>
                navigation.navigate("EventDetails", { event: item })
              }
            >
              <View style={styles.cardHeader}>
                {/* Título del evento (limitado a 1 línea para no romper el diseño) */}
                <Text style={styles.eventName} numberOfLines={1}>
                  {item.titulo}
                </Text>

                {/* Si el usuario actual es el creador del evento, le mostramos el botón del basurero para eliminarlo */}
                {auth.currentUser?.uid === item.creadorId && (
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => confirmarEliminacion(item.id, item.titulo)}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Descripción del evento (limitada a 2 líneas) */}
              <Text style={styles.eventDescription} numberOfLines={2}>
                {item.descripcion}
              </Text>

              <View style={styles.cardFooter}>
                {/* Etiqueta de Fecha */}
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>📅</Text>
                  <Text style={styles.tagText}>{item.fecha}</Text>
                </View>

                {/* Etiqueta de Ubicación */}
                <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
                  <Text style={styles.tagIcon}>📍</Text>
                  <Text
                    style={[styles.tagText, { color: "#4B5563" }]}
                    numberOfLines={1}
                  >
                    {/* Si la ubicación es muy larga, la acortamos y le ponemos "..." */}
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

      {/* --- BOTÓN FLOTANTE (FAB) PARA CREAR EVENTOS --- */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        // Navega a la pantalla "CreateEvent" para añadir una nueva actividad
        onPress={() => navigation.navigate("CreateEvent")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// --- Estilos de la Pantalla ---
// Definimos los estilos usando StyleSheet para un mejor rendimiento en React Native
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  
  // Estilos de la pantalla de carga
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

  // Estilos del Encabezado (Header)
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

  // Estilos de los botones del Encabezado (Campanita, Perfil)
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

  // Estilos del indicador (burbujita) del usuario activo
  userChip: {
    marginTop: 15,
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  userText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },

  // Estilos del indicador rojo (badge) de notificaciones
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

  // Estilos de la Lista y las Tarjetas (Cards)
  listContainer: { padding: 20, paddingBottom: 100 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6, // Este borde izquierdo cambia de color dinámicamente
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
  
  // Estilos del botón de borrar evento
  deleteIconBtn: { backgroundColor: "#FEF2F2", padding: 8, borderRadius: 10 },
  deleteIconText: { fontSize: 14 },

  eventDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 16,
  },

  // Estilos de las etiquetas de la tarjeta (Fecha y Ubicación)
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

  // Estilos para cuando la lista no tiene eventos (Estado Vacío)
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

  // Estilos del Botón Flotante (FAB - Floating Action Button)
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30, // Separación inferior para evitar que se pise con menús nativos
    backgroundColor: "#3B82F6",
    width: 64,
    height: 64,
    borderRadius: 32, // Para hacerlo circular
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
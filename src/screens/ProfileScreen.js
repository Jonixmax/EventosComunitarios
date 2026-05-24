// src/screens/ProfileScreen.js
// Importamos la función signOut de Firebase Auth para permitir al usuario cerrar sesión.
import { signOut } from "firebase/auth";
// Importamos funciones de Firestore para leer datos de la base de datos (obtener colecciones, documentos y hacer consultas).
import { collection, getDocs, query, where } from "firebase/firestore";
// Importamos hooks de React: useEffect (para ejecutar lógica al montar la pantalla) y useState (para guardar datos localmente).
import { useEffect, useState } from "react";
// Importamos componentes fundamentales de React Native para construir la interfaz de usuario.
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
// Importamos nuestras configuraciones de autenticación (auth) y base de datos (db) de Firebase.
import { auth, db } from "../config/firebase";
// Importamos la librería de Google Sign-In para asegurar que el cierre de sesión desconecte la cuenta de Google también.
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // <-- NUEVA IMPORTACIÓN

// Componente principal: Pantalla de Perfil
export default function ProfileScreen({ navigation }) {
  // --- Estados de la Pantalla ---
  // Controla si se está mostrando la pantalla de carga (spinner)
  const [loading, setLoading] = useState(true);
  // Almacena el historial de eventos a los que el usuario ha confirmado asistencia
  const [misAsistencias, setMisAsistencias] = useState([]);
  // Almacena el número total de eventos creados en la plataforma
  const [totalEventos, setTotalEventos] = useState(0);
  // Almacena el número total de comentarios hechos por el usuario
  const [totalComentarios, setTotalComentarios] = useState(0);

  // Guardamos los datos del usuario que actualmente tiene la sesión iniciada
  const usuarioLogueado = auth.currentUser;

  // --- Efectos Secundarios (useEffect) ---
  // Este efecto se ejecuta una sola vez cuando la pantalla se carga por primera vez
  useEffect(() => {
    // Función asíncrona para cargar las estadísticas del usuario y de la app
    const cargarEstadisticas = async () => {
      // Si no hay usuario logueado, detenemos la función por seguridad
      if (!usuarioLogueado) return;

      try {
        // 1. Obtener Historial de Asistencias
        // Creamos una consulta (query) buscando en "participaciones" las que correspondan a este usuario
        const qAsistencias = query(
          collection(db, "participaciones"),
          where("usuarioUid", "==", usuarioLogueado.uid),
        );
        // Obtenemos los documentos que coinciden con la consulta
        const snapshotAsistencias = await getDocs(qAsistencias);

        // Mapeamos los resultados para crear un arreglo de objetos más fácil de usar
        const historial = snapshotAsistencias.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenamos el historial del más reciente al más antiguo usando la fechaRegistro
        historial.sort(
          (a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro),
        );
        // Guardamos el historial ordenado en el estado
        setMisAsistencias(historial);

        // 2. Obtener Total de Comentarios Realizados
        // Buscamos en la colección "comentarios" todos los creados por este usuario
        const qComentarios = query(
          collection(db, "comentarios"),
          where("usuarioUid", "==", usuarioLogueado.uid),
        );
        const snapshotComentarios = await getDocs(qComentarios);
        // Guardamos la cantidad de comentarios encontrados (.size)
        setTotalComentarios(snapshotComentarios.size);

        // 3. Obtener Total de Eventos en la Comunidad
        // Buscamos todos los documentos en la colección "eventos" (sin filtrar)
        const snapshotEventos = await getDocs(collection(db, "eventos"));
        // Guardamos la cantidad total de eventos creados
        setTotalEventos(snapshotEventos.size);
      } catch (error) {
        // Si hay algún problema (ej. fallo de red), lo registramos en la consola
        console.error("Error al cargar estadísticas:", error);
      } finally {
        // Sin importar si hubo éxito o error, quitamos la pantalla de carga
        setLoading(false);
      }
    };

    // Ejecutamos la función que acabamos de definir
    cargarEstadisticas();
  }, []);

  // --- Funciones del Componente ---
  // Maneja el proceso de cierre de sesión
  const handleCerrarSesion = async () => {
    // Como Alert.alert de React Native no funciona en navegadores web, usamos una condición.
    // Pedimos al usuario que confirme si realmente desea salir.
    const confirmado =
      Platform.OS === "web"
        ? window.confirm("¿Estás seguro de que deseas salir?") // Confirmación nativa de la web
        : await new Promise((resolve) =>
            // Confirmación nativa de iOS/Android
            Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas salir?", [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Sí, salir", style: "destructive", onPress: () => resolve(true) }, // Destructive le da color rojo en iOS
            ])
          );

    // Si el usuario dijo que no, detenemos la ejecución
    if (!confirmado) return;

    try {
      // Si estamos en la aplicación móvil (no en web), cerramos la sesión de Google Sign-In.
      // Importamos dinámicamente GoogleSignin para evitar errores de compilación en el navegador.
      if (Platform.OS !== "web") {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      }

      // Ejecutamos el cierre de sesión oficial de Firebase
      await signOut(auth);
      console.log("Sesión cerrada correctamente");
      
      // Reemplazamos la pantalla actual por el "Login" (evita que el usuario regrese con el botón "Atrás")
      navigation.replace("Login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Mostramos un mensaje de error dependiendo de la plataforma
      if (Platform.OS === "web") {
        window.alert("No se pudo cerrar sesión. Inténtalo de nuevo.");
      } else {
        Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.");
      }
    }
  };

  // --- Renderizado Condicional ---
  // Si los datos de Firebase todavía se están cargando, mostramos una pantalla de espera
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  // --- Renderizado Principal de la Interfaz (UI) ---
  return (
    // SafeAreaView asegura que el contenido respete la barra de estado y los bordes del dispositivo
    <SafeAreaView style={styles.mainContainer}>
      
      {/* --- CABECERA AZUL SUPERIOR (Hero Section) --- */}
      <View style={styles.headerBackground}>
        {/* Barra superior con título y botón de Salir */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={handleCerrarSesion}
          >
            <Text style={styles.logoutIconText}>Salir 🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de información del usuario (Foto, Nombre, Correo) */}
        <View style={styles.userInfoContainer}>
          {/* Avatar (Foto de perfil simulada con la inicial del nombre) */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {/* Si hay displayName toma la primera letra, si no, usa "U" */}
              {usuarioLogueado?.displayName
                ? usuarioLogueado.displayName.charAt(0).toUpperCase()
                : "U"}
            </Text>
          </View>
          {/* Nombre de usuario o un texto por defecto */}
          <Text style={styles.userName}>
            {usuarioLogueado?.displayName || "Usuario de la Comunidad"}
          </Text>
          {/* Correo electrónico del usuario */}
          <Text style={styles.userEmail}>{usuarioLogueado?.email}</Text>
        </View>
      </View>

      {/* --- DASHBOARD FLOTANTE DE ESTADÍSTICAS --- */}
      {/* Esta tarjeta se superpone sobre la cabecera azul gracias al 'marginTop: -40' en estilos */}
      <View style={styles.floatingStatsCard}>
        
        {/* Estadística: Número de Asistencias */}
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#10B981" }]}>
            {misAsistencias.length}
          </Text>
          <Text style={styles.statLabel}>Asistencias</Text>
        </View>

        {/* Divisor vertical gris */}
        <View style={styles.statDivider} />

        {/* Estadística: Comentarios publicados */}
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
            {totalComentarios}
          </Text>
          <Text style={styles.statLabel}>Comentarios</Text>
        </View>

        {/* Divisor vertical gris */}
        <View style={styles.statDivider} />

        {/* Estadística: Eventos globales */}
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#3B82F6" }]}>
            {totalEventos}
          </Text>
          <Text style={styles.statLabel}>Eventos</Text>
        </View>
      </View>

      {/* --- LISTA: HISTORIAL DE PARTICIPACIÓN --- */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Historial de Participación</Text>

        {/* FlatList renderiza el historial de eventos de forma eficiente */}
        <FlatList
          data={misAsistencias} // Los datos a mostrar
          keyExtractor={(item) => item.id} // ID único para cada tarjeta
          showsVerticalScrollIndicator={false} // Oculta la barra de scroll
          contentContainerStyle={{ paddingBottom: 40 }}
          
          // Lo que se muestra si el usuario aún no tiene asistencias
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
          
          // Cómo se dibuja cada tarjeta del historial
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              {/* Ícono de ticket a la izquierda */}
              <View style={styles.historyIconContainer}>
                <Text style={styles.historyIcon}>🎟️</Text>
              </View>
              {/* Contenido (Nombre del evento y Fecha de registro) */}
              <View style={styles.historyContent}>
                {/* Nombre del evento limitado a una línea */}
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {item.eventoTitulo}
                </Text>
                {/* Etiqueta gris con la fecha en que el usuario se registró */}
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

// --- Estilos de la Pantalla ---
// StyleSheet optimiza los estilos para que React Native los maneje de manera nativa y eficiente.
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F9FAFB" }, // Color de fondo gris muy claro
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

  // Estilos de la Cabecera Azul (Hero)
  headerBackground: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 70, // Espacio extra abajo para alojar la tarjeta flotante
    borderBottomLeftRadius: 30, // Bordes curvos inferiores
    borderBottomRightRadius: 30,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between", // Separa título y botón a los extremos
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },
  
  // Estilos del botón de Cerrar Sesión
  logoutIconBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Botón blanco semitransparente
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutIconText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // Estilos de la Información del Usuario (Avatar y Textos)
  userInfoContainer: { alignItems: "center" }, // Centra horizontalmente todo adentro
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40, // Lo hace completamente circular
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000", // Sombras para darle elevación
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5, // Sombra específica para Android
  },
  avatarText: { fontSize: 36, fontWeight: "900", color: "#3B82F6" },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: { fontSize: 14, color: "#DBEAFE", fontWeight: "500" },

  // Estilos del Dashboard / Tarjeta de Estadísticas Flotante
  floatingStatsCard: {
    flexDirection: "row", // Coloca los 3 elementos de estadística lado a lado
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -40, // Este valor negativo es el truco para que flote sobre la cabecera azul
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
    marginBottom: 25,
  },
  statItem: { flex: 1, alignItems: "center", justifyContent: "center" }, // Flex 1 hace que los 3 ocupen el mismo ancho
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
    backgroundColor: "#F3F4F6", // Línea delgada separadora
    height: "80%",
    alignSelf: "center",
  },

  // Estilos del Historial (Lista de eventos)
  listContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 15,
  },

  // Estilos para cuando la lista de historial está vacía
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderStyle: "dashed", // Borde punteado
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

  // Estilos de cada tarjeta (ítem) en el Historial de Asistencias
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
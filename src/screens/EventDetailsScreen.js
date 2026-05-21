import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore"; // Importamos deleteDoc y doc
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";

export default function EventDetailsScreen({ route, navigation }) {
  // Validamos que route.params exista.
  const eventData = route.params?.event || {};
  const { id, titulo, fecha, hora, ubicacion, descripcion } = eventData;

  const [yaInscrito, setYaInscrito] = useState(false);
  const [cargandoRSVP, setCargandoRSVP] = useState(true);

  // Verificar si el usuario ya está participando
  useEffect(() => {
    const comprobarAsistencia = async () => {
      try {
        const usuarioLogueado = auth.currentUser;
        if (!usuarioLogueado || !id) {
          setCargandoRSVP(false);
          return;
        }

        const q = query(
          collection(db, "participaciones"),
          where("eventoId", "==", id),
          where("usuarioUid", "==", usuarioLogueado.uid),
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setYaInscrito(true);
        }
      } catch (error) {
        console.error("Error al comprobar asistencia: ", error);
      } finally {
        setCargandoRSVP(false);
      }
    };

    comprobarAsistencia();
  }, [id]);

  // Registrar la participación (RSVP)
  const handleParticipar = async () => {
    try {
      const usuarioLogueado = auth.currentUser;

      if (!usuarioLogueado) {
        Alert.alert(
          "Iniciar Sesión",
          "Debes estar autenticado para registrar tu asistencia.",
        );
        return;
      }

      await addDoc(collection(db, "participaciones"), {
        eventoId: id,
        eventoTitulo: titulo || "Sin título",
        usuarioUid: usuarioLogueado.uid,
        usuarioEmail: usuarioLogueado.email,
        fechaRegistro: new Date(),
      });

      setYaInscrito(true);
      Alert.alert(
        "¡Inscripción Exitosa!",
        `Te has registrado para asistir a:\n${titulo || "este evento"}.`,
      );
    } catch (error) {
      console.error("Error al registrar asistencia: ", error);
      Alert.alert("Error", "No se pudo procesar tu inscripción.");
    }
  };

  // Función para eliminar el evento de la base de datos
  const handleEliminarEvento = () => {
    Alert.alert(
      "Eliminar Evento",
      "¿Estás seguro de que deseas eliminar este evento permanentemente? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive", // Aplica estilo rojo en iOS
          onPress: async () => {
            try {
              // Eliminamos el documento de la colección 'eventos' usando su ID
              await deleteDoc(doc(db, "eventos", id));

              Alert.alert(
                "Éxito",
                "El evento ha sido eliminado correctamente.",
              );

              // Regresar automáticamente a la pantalla de Inicio (donde la lista se actualizará sola)
              navigation.goBack();
            } catch (error) {
              console.error("Error al eliminar el evento: ", error);
              Alert.alert(
                "Error",
                "No se pudo eliminar el evento de la base de datos.",
              );
            }
          },
        },
      ],
    );
  };

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          No se pudo cargar la información del evento.
        </Text>
        <Button title="Volver al Inicio" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{titulo || "Evento sin título"}</Text>

      <View style={styles.card}>
        <Text style={styles.detail}>
          📅 Fecha: {fecha || "Fecha no especificada"}
        </Text>
        <Text style={styles.detail}>
          ⏰ Hora: {hora || "Hora no especificada"}
        </Text>
        <Text style={styles.detail}>
          📍 Lugar: {ubicacion || "Ubicación no especificada"}
        </Text>

        <Text style={styles.subtitle}>Descripción del Evento:</Text>
        <Text style={styles.description}>
          {descripcion ||
            "Este evento no cuenta con una descripción detallada."}
        </Text>
      </View>

      {/* Contenedor de botones */}
      <View style={styles.buttonContainer}>
        {cargandoRSVP ? (
          <ActivityIndicator
            size="small"
            color="#28a745"
            style={{ marginBottom: 15 }}
          />
        ) : (
          <Button
            title={
              yaInscrito ? "¡Ya estás inscrito!" : "Confirmar Asistencia (RSVP)"
            }
            onPress={handleParticipar}
            color={yaInscrito ? "#6c757d" : "#28a745"}
            disabled={yaInscrito}
          />
        )}

        {/* Espacio entre botones */}
        <View style={{ height: 15 }} />

        {/* Botón para Eliminar el Evento */}
        <Button
          title="Eliminar Evento"
          onPress={handleEliminarEvento}
          color="#dc3545" // Color rojo de advertencia
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f4f4" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 30,
  },
  detail: { fontSize: 16, color: "#555", marginBottom: 12, fontWeight: "600" },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#007bff",
  },
  description: { fontSize: 16, color: "#666", lineHeight: 24 },
  buttonContainer: { marginBottom: 50 },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 20,
    textAlign: "center",
  },
});

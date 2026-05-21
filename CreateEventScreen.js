import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../config/firebase"; // Asegúrate de que esta ruta sea correcta

export default function CreateEventScreen({ navigation }) {
  // Estados para guardar lo que el usuario escribe
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Función para guardar en Firebase
  const handleCreateEvent = async () => {
    // Validar que no haya campos vacíos
    if (!titulo || !fecha || !hora || !ubicacion || !descripcion) {
      Alert.alert("Error", "Por favor llena todos los campos requeridos.");
      return;
    }

    try {
      // Guardar el documento en la colección "eventos" en Firestore
      await addDoc(collection(db, "eventos"), {
        titulo: titulo,
        fecha: fecha,
        hora: hora,
        ubicacion: ubicacion,
        descripcion: descripcion,
        creadoEn: new Date(), // Fecha de creación del registro
      });

      Alert.alert("Éxito", "Evento creado correctamente");

      // Limpiar el formulario
      setTitulo("");
      setFecha("");
      setHora("");
      setUbicacion("");
      setDescripcion("");

      // Regresar a la pantalla anterior (Home)
      if (navigation) navigation.goBack();
    } catch (error) {
      console.error("Error al crear evento: ", error);
      Alert.alert(
        "Error",
        "Hubo un problema al crear el evento en la base de datos.",
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Nuevo Evento</Text>

      <Text style={styles.label}>Título del Evento</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej. Jornada de Limpieza"
      />

      <Text style={styles.label}>Fecha</Text>
      <TextInput
        style={styles.input}
        value={fecha}
        onChangeText={setFecha}
        placeholder="DD/MM/AAAA"
      />

      <Text style={styles.label}>Hora</Text>
      <TextInput
        style={styles.input}
        value={hora}
        onChangeText={setHora}
        placeholder="00:00 AM/PM"
      />

      <Text style={styles.label}>Ubicación</Text>
      <TextInput
        style={styles.input}
        value={ubicacion}
        onChangeText={setUbicacion}
        placeholder="Lugar del evento"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Detalles sobre las actividades del evento..."
        multiline={true}
        numberOfLines={4}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Guardar Evento"
          onPress={handleCreateEvent}
          color="#007BFF"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontSize: 16, marginBottom: 5, fontWeight: "600", color: "#333" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  buttonContainer: { marginTop: 10, marginBottom: 40 },
});

// src/screens/CreateEventScreen.js
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../config/firebase'; // Importación de db y auth asegurada
import { collection, addDoc } from 'firebase/firestore';

const CreateEventScreen = ({ navigation }) => {
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);

    const tempDate = new Date(currentDate);
    const fDate =
      tempDate.getDate().toString().padStart(2, "0") +
      "/" +
      (tempDate.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      tempDate.getFullYear();
    setFecha(fDate);
  };

  const showAlert = (tituloAlerta, mensaje, onSuccess) => {
    if (Platform.OS === 'web') {
      alert(`${tituloAlerta}: ${mensaje}`);
      if (onSuccess) onSuccess();
    } else {
      const botones = onSuccess ? [{ text: 'OK', onPress: onSuccess }] : [{ text: 'OK' }];
      Alert.alert(tituloAlerta, mensaje, botones);
    }
  };

  const handleCreateEvent = async () => {
    if (!titulo.trim() || !fecha.trim() || !ubicacion.trim() || !descripcion.trim()) {
      showAlert('Campos incompletos', 'Por favor, llena todos los campos antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      // Estructura de guardado incluyendo verificación de usuario por seguridad
      await addDoc(collection(db, "eventos"), {
        titulo: titulo.trim(),
        fecha: fecha.trim(),
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
        createdBy: auth.currentUser ? auth.currentUser.uid : 'Anónimo',
        createdAt: new Date(),
      });

      setLoading(false);
      showAlert('¡Éxito!', 'El evento ha sido creado correctamente.', () => navigation.goBack());
    } catch (error) {
      setLoading(false);
      console.error("Error al guardar en Firebase: ", error);
      showAlert('Error', 'No se pudo guardar el evento. Inténtalo de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo Evento</Text>
          <Text style={styles.subtitle}>Completa los detalles para organizar la actividad</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Título del Evento</Text>
          <TextInput style={styles.input} placeholder="Ej. Reunión de Vecinos..." placeholderTextColor="#95A5A6" value={titulo} onChangeText={setTitulo} />

          <Text style={styles.label}>Fecha</Text>
          {Platform.OS === 'web' ? (
            <TextInput style={styles.input} placeholder="DD/MM/AAAA " placeholderTextColor="#95A5A6" value={fecha} onChangeText={setFecha} />
          ) : (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
              <View pointerEvents="none">
                <TextInput style={styles.input} placeholder="Toca para seleccionar una fecha" placeholderTextColor="#95A5A6" value={fecha} editable={false} />
              </View>
            </TouchableOpacity>
          )}

          {Platform.OS !== "web" && showPicker && (
            <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={onChangeDate} />
          )}

          <Text style={styles.label}>Ubicación</Text>
          <TextInput style={styles.input} placeholder="Ej. Parque Central..." placeholderTextColor="#95A5A6" value={ubicacion} onChangeText={setUbicacion} />

          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Describe brevemente el evento..." placeholderTextColor="#95A5A6" multiline={true} numberOfLines={4} value={descripcion} onChangeText={setDescripcion} />

          <TouchableOpacity style={[styles.submitButton, loading && { backgroundColor: '#93C5FD' }]} activeOpacity={0.8} onPress={handleCreateEvent} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Crear Evento</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', width: '100%', maxWidth: 600, alignSelf: 'center' },
  scrollContainer: { paddingBottom: 40, paddingTop: 20 },
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  subtitle: { fontSize: 15, color: '#7F8C8D', marginTop: 4 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#2C3E50" },
  textArea: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  submitButton: { backgroundColor: '#4A90E2', borderRadius: 12, paddingVertical: 15, marginTop: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

export default CreateEventScreen;
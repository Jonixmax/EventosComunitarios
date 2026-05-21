// src/screens/EditEventScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditEventScreen = ({ route, navigation }) => {
  // Recibimos el evento a editar
  const { event } = route.params;

  // Los estados inician con los datos actuales del evento
  const [titulo, setTitulo] = useState(event.titulo);
  const [fecha, setFecha] = useState(event.fecha);
  const [ubicacion, setUbicacion] = useState(event.ubicacion);
  const [descripcion, setDescripcion] = useState(event.descripcion);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (e, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); 
    setDate(currentDate);

    const tempDate = new Date(currentDate);
    const fDate = tempDate.getDate().toString().padStart(2, '0') + '/' + 
                 (tempDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                 tempDate.getFullYear();
    setFecha(fDate);
  };

  const handleUpdateEvent = async () => {
    if (!titulo.trim() || !fecha.trim() || !ubicacion.trim() || !descripcion.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.');
      return;
    }

    setLoading(true);

    try {
      // Apuntamos específicamente al documento que queremos actualizar
      const eventRef = doc(db, 'eventos', event.id);
      
      await updateDoc(eventRef, {
        titulo: titulo.trim(),
        fecha: fecha.trim(),
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
      });

      setLoading(false);
      Alert.alert('¡Actualizado!', 'El evento ha sido modificado correctamente.', [
        // Al terminar, enviamos al usuario al Home para que vea los cambios reflejados en la lista
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      setLoading(false);
      console.error("Error al actualizar: ", error);
      Alert.alert('Error', 'No se pudo actualizar el evento. Inténtalo de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Editar Evento</Text>
          <Text style={styles.subtitle}>Modifica los detalles de la actividad</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Título del Evento</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} />

          <Text style={styles.label}>Fecha</Text>
          {Platform.OS === 'web' ? (
            <TextInput style={styles.input} value={fecha} onChangeText={setFecha} />
          ) : (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
              <View pointerEvents="none">
                <TextInput style={styles.input} value={fecha} editable={false} />
              </View>
            </TouchableOpacity>
          )}

          {Platform.OS !== 'web' && showPicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}

          <Text style={styles.label}>Ubicación</Text>
          <TextInput style={styles.input} value={ubicacion} onChangeText={setUbicacion} />

          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline={true} numberOfLines={4} value={descripcion} onChangeText={setDescripcion} />

          <TouchableOpacity style={styles.submitButton} activeOpacity={0.8} onPress={handleUpdateEvent} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContainer: { paddingBottom: 30 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  subtitle: { fontSize: 15, color: '#7F8C8D', marginTop: 4, marginBottom: 10 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2C3E50' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  submitButton: { backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, marginTop: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default EditEventScreen;
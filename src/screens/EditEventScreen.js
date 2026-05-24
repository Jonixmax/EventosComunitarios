// src/screens/EditEventScreen.js
// Importamos React y el hook useState para el manejo del estado local
import React, { useState } from 'react';
// Importamos componentes visuales y utilidades esenciales de React Native
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
// Importamos la configuración de nuestra base de datos (Firestore)
import { db } from '../config/firebase';
// Importamos funciones de Firestore para actualizar un documento específico
import { doc, updateDoc } from 'firebase/firestore';
// Importamos el selector de fechas (DatePicker)
import DateTimePicker from '@react-native-community/datetimepicker';

// Componente principal para editar un evento existente
const EditEventScreen = ({ route, navigation }) => {
  // --- Recepción de Datos ---
  // Recibimos el objeto 'event' que fue pasado como parámetro desde la pantalla anterior (EventDetailsScreen o HomeScreen)
  const { event } = route.params;

  // --- Definición de Estados (State) ---
  // Los estados se inicializan con la información actual del evento para que el formulario aparezca pre-llenado
  const [titulo, setTitulo] = useState(event.titulo);
  const [fecha, setFecha] = useState(event.fecha);
  const [ubicacion, setUbicacion] = useState(event.ubicacion);
  const [descripcion, setDescripcion] = useState(event.descripcion);
  
  // Estado para mostrar un indicador de carga mientras se actualiza la base de datos
  const [loading, setLoading] = useState(false);

  // Estados para manejar el selector de fecha (calendario nativo)
  const [date, setDate] = useState(new Date()); // Objeto Date interno
  const [showPicker, setShowPicker] = useState(false); // Controla si se muestra el calendario

  // --- Funciones Lógicas ---

  // Función que se dispara cuando el usuario escoge una nueva fecha en el calendario
  const onChangeDate = (e, selectedDate) => {
    // Si no selecciona nada, mantenemos la fecha anterior
    const currentDate = selectedDate || date;
    
    // Ocultamos el selector nativo en Android (iOS tiene un comportamiento continuo distinto)
    setShowPicker(Platform.OS === 'ios'); 
    setDate(currentDate);

    // Formateamos la fecha al estilo DD/MM/AAAA para guardarla como cadena de texto (String)
    const tempDate = new Date(currentDate);
    const fDate = tempDate.getDate().toString().padStart(2, '0') + '/' + 
                 (tempDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                 tempDate.getFullYear();
    setFecha(fDate);
  };

  // Función principal para actualizar los datos del evento en Firebase Firestore
  const handleUpdateEvent = async () => {
    // 1. Validación de seguridad: Comprobamos que ningún campo quedó vacío
    if (!titulo.trim() || !fecha.trim() || !ubicacion.trim() || !descripcion.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.');
      return; // Detenemos la ejecución
    }

    // 2. Activamos la rueda de carga en el botón
    setLoading(true);

    try {
      // 3. Referencia al Documento: Apuntamos específicamente al evento que queremos modificar usando su ID
      const eventRef = doc(db, 'eventos', event.id);
      
      // 4. Actualización en Firebase: Usamos updateDoc para cambiar solo los campos indicados
      await updateDoc(eventRef, {
        titulo: titulo.trim(),
        fecha: fecha.trim(),
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
      });

      // 5. Finalización exitosa: Ocultamos la carga y avisamos al usuario
      setLoading(false);
      Alert.alert('¡Actualizado!', 'El evento ha sido modificado correctamente.', [
        // Al darle OK a la alerta, enviamos al usuario al Home para que vea la lista de eventos actualizada
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      // 6. Manejo de Errores: Si falla (ej. pérdida de internet) mostramos alerta y permitimos reintentar
      setLoading(false);
      console.error("Error al actualizar: ", error);
      Alert.alert('Error', 'No se pudo actualizar el evento. Inténtalo de nuevo.');
    }
  };

  // --- Renderizado de la Interfaz (UI) ---
  return (
    // SafeAreaView mantiene el contenido dentro de las áreas seguras del teléfono (lejos de notches)
    <SafeAreaView style={styles.container}>
      {/* ScrollView permite que el formulario se pueda desplazar si el teclado lo tapa */}
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* SECCIÓN: Encabezado de la pantalla */}
        <View style={styles.header}>
          <Text style={styles.title}>Editar Evento</Text>
          <Text style={styles.subtitle}>Modifica los detalles de la actividad</Text>
        </View>

        {/* SECCIÓN: Tarjeta que contiene el formulario */}
        <View style={styles.formCard}>
          
          {/* Campo: Título */}
          <Text style={styles.label}>Título del Evento</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} />

          {/* Campo: Fecha */}
          <Text style={styles.label}>Fecha</Text>
          {/* Manejo condicional: en Web usamos un campo de texto normal, en móviles usamos DateTimePicker */}
          {Platform.OS === 'web' ? (
            <TextInput style={styles.input} value={fecha} onChangeText={setFecha} />
          ) : (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
              {/* pointerEvents="none" evita que el input reciba toques para que TouchableOpacity maneje el click */}
              <View pointerEvents="none">
                <TextInput style={styles.input} value={fecha} editable={false} />
              </View>
            </TouchableOpacity>
          )}

          {/* Renderizado del Calendario Nativo (solo en móviles y cuando showPicker es true) */}
          {Platform.OS !== 'web' && showPicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}

          {/* Campo: Ubicación */}
          <Text style={styles.label}>Ubicación</Text>
          <TextInput style={styles.input} value={ubicacion} onChangeText={setUbicacion} />

          {/* Campo: Descripción */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline={true} numberOfLines={4} value={descripcion} onChangeText={setDescripcion} />

          {/* Botón Guardar Cambios */}
          <TouchableOpacity style={styles.submitButton} activeOpacity={0.8} onPress={handleUpdateEvent} disabled={loading}>
            {/* Si está guardando, muestra el ActivityIndicator (ruedita). Si no, muestra el texto */}
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Guardar Cambios</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Estilos de la Pantalla ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, // Fondo gris claro
  scrollContainer: { paddingBottom: 30 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  subtitle: { fontSize: 15, color: '#7F8C8D', marginTop: 4, marginBottom: 10 },
  
  // Tarjeta contenedora con sombra suave
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  
  // Estilo de las etiquetas (labels) de cada campo
  label: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 8, marginTop: 12 },
  
  // Estilo base de los campos de entrada de texto
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2C3E50' },
  
  // Variación para que la descripción sea más alta y empiece el texto arriba (textArea)
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  
  // Botón principal, de color naranja/amarillo para diferenciarlo del crear
  submitButton: { backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, marginTop: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default EditEventScreen;
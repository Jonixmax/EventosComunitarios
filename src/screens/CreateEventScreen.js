// src/screens/CreateEventScreen.js
// Importamos React y el hook useState para manejar el estado del componente
import React, { useState } from 'react';
// Importamos componentes de interfaz de usuario de React Native
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Importamos el selector de fecha y hora, muy útil para formularios de eventos
import DateTimePicker from '@react-native-community/datetimepicker';
// Importamos la configuración de nuestra base de datos (db) y autenticación (auth) desde Firebase
import { db, auth } from '../config/firebase'; 
// Importamos funciones específicas de Firestore para interactuar con la base de datos
import { collection, addDoc } from 'firebase/firestore';

// Componente principal de la pantalla para crear un evento
const CreateEventScreen = ({ navigation }) => {
  // --- Definición de Estados (State) ---
  // Guardan la información que el usuario ingresa en el formulario
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  
  // Estado para manejar el indicador de carga cuando guardamos en la base de datos
  const [loading, setLoading] = useState(false);

  // Estados para manejar el selector de fecha (DatePicker)
  const [date, setDate] = useState(new Date()); // Guarda la fecha internamente como objeto Date
  const [showPicker, setShowPicker] = useState(false); // Controla la visibilidad del selector de fecha

  // --- Funciones de Lógica de la Pantalla ---

  // Función que se ejecuta cuando el usuario selecciona una fecha en el DatePicker
  const onChangeDate = (event, selectedDate) => {
    // Si el usuario no selecciona nada, mantenemos la fecha actual
    const currentDate = selectedDate || date;
    
    // Ocultamos el selector en Android (en iOS a veces se maneja de forma distinta, pero esto previene bugs visuales)
    setShowPicker(Platform.OS === "ios");
    
    // Actualizamos el estado de la fecha con el objeto Date seleccionado
    setDate(currentDate);

    // Formateamos la fecha a una cadena de texto (String) en formato DD/MM/AAAA
    const tempDate = new Date(currentDate);
    const fDate =
      tempDate.getDate().toString().padStart(2, "0") + // Día con 2 dígitos
      "/" +
      (tempDate.getMonth() + 1).toString().padStart(2, "0") + // Mes con 2 dígitos (getMonth empieza en 0)
      "/" +
      tempDate.getFullYear(); // Año completo
      
    // Guardamos la fecha formateada en el estado que usará el input visualmente y la base de datos
    setFecha(fDate);
  };

  // Función auxiliar para mostrar alertas consistentes en la Web y en Móviles (iOS/Android)
  const showAlert = (tituloAlerta, mensaje, onSuccess) => {
    if (Platform.OS === 'web') {
      // En la versión Web, usamos el alert nativo del navegador
      alert(`${tituloAlerta}: ${mensaje}`);
      if (onSuccess) onSuccess(); // Si hay una función de éxito, la ejecutamos
    } else {
      // En dispositivos móviles, usamos el componente Alert de React Native
      const botones = onSuccess ? [{ text: 'OK', onPress: onSuccess }] : [{ text: 'OK' }];
      Alert.alert(tituloAlerta, mensaje, botones);
    }
  };

  // Función principal para manejar la creación del evento en Firebase
  const handleCreateEvent = async () => {
    // 1. Validación: Comprobamos que ningún campo esté vacío
    if (!titulo.trim() || !fecha.trim() || !ubicacion.trim() || !descripcion.trim()) {
      showAlert('Campos incompletos', 'Por favor, llena todos los campos antes de continuar.');
      return; // Detenemos la ejecución si faltan datos
    }

    // 2. Activamos el estado de carga (muestra el ActivityIndicator en el botón)
    setLoading(true);

    try {
      // 3. Guardado en Firebase: Agregamos un nuevo documento a la colección 'eventos'
      // La función addDoc genera un ID único automáticamente para el nuevo evento
      await addDoc(collection(db, 'eventos'), {
        titulo: titulo,
        fecha: fecha,
        ubicacion: ubicacion,
        descripcion: descripcion,
        // Agregamos el ID del usuario actual para saber quién creó el evento
        creadorId: auth.currentUser.uid, 
        // Registramos la fecha y hora exacta en la que se creó el registro
        createdAt: new Date(),
      });

      // 4. Éxito: Desactivamos la carga y mostramos una alerta
      setLoading(false);
      showAlert('¡Éxito!', 'El evento ha sido creado correctamente.', () => navigation.goBack()); // navigation.goBack() regresa a la pantalla anterior
    } catch (error) {
      // 5. Manejo de Errores: Si algo falla (ej. sin internet), desactivamos la carga y notificamos al usuario
      setLoading(false);
      console.error("Error al guardar en Firebase: ", error);
      showAlert('Error', 'No se pudo guardar el evento. Inténtalo de nuevo.');
    }
  };

  // --- Renderizado de la Interfaz (UI) ---
  return (
    // SafeAreaView asegura que el contenido no se oculte detrás de la barra de estado o notch en los teléfonos
    <SafeAreaView style={styles.container}>
      {/* ScrollView permite deslizar la pantalla si el contenido es más alto que el dispositivo */}
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Encabezado de la pantalla */}
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo Evento</Text>
          <Text style={styles.subtitle}>Completa los detalles para organizar la actividad</Text>
        </View>

        {/* Contenedor tipo tarjeta (Card) para el formulario */}
        <View style={styles.formCard}>
          
          {/* Campo: Título del Evento */}
          <Text style={styles.label}>Título del Evento</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. Reunión de Vecinos..." 
            placeholderTextColor="#95A5A6" 
            value={titulo} 
            onChangeText={setTitulo} // Actualiza el estado 'titulo' conforme se escribe
          />

          {/* Campo: Fecha del Evento */}
          <Text style={styles.label}>Fecha</Text>
          {Platform.OS === 'web' ? (
            // Si es Web, mostramos un campo de texto normal para la fecha
            <TextInput style={styles.input} placeholder="DD/MM/AAAA " placeholderTextColor="#95A5A6" value={fecha} onChangeText={setFecha} />
          ) : (
            // Si es Móvil, mostramos un campo inactivo que al tocar abre el DateTimePicker
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
              <View pointerEvents="none">
                <TextInput style={styles.input} placeholder="Toca para seleccionar una fecha" placeholderTextColor="#95A5A6" value={fecha} editable={false} />
              </View>
            </TouchableOpacity>
          )}

          {/* Componente del calendario/selector de fecha para dispositivos móviles */}
          {Platform.OS !== "web" && showPicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display="default" 
              minimumDate={new Date()} // No permite seleccionar fechas pasadas
              onChange={onChangeDate} 
            />
          )}

          {/* Campo: Ubicación */}
          <Text style={styles.label}>Ubicación</Text>
          <TextInput style={styles.input} placeholder="Ej. Parque Central..." placeholderTextColor="#95A5A6" value={ubicacion} onChangeText={setUbicacion} />

          {/* Campo: Descripción */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} // Combina el estilo base de input con el de área de texto (más grande)
            placeholder="Describe brevemente el evento..." 
            placeholderTextColor="#95A5A6" 
            multiline={true} // Permite múltiples líneas
            numberOfLines={4} 
            value={descripcion} 
            onChangeText={setDescripcion} 
          />

          {/* Botón de Envío (Submit) */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && { backgroundColor: '#93C5FD' }]} // Cambia de color si está cargando
            activeOpacity={0.8} 
            onPress={handleCreateEvent} // Llama a la función de guardado
            disabled={loading} // Deshabilita el botón para prevenir múltiples clicks mientras guarda
          >
            {/* Muestra el ícono de carga si 'loading' es true, de lo contrario muestra el texto */}
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Crear Evento</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Estilos del Componente ---
// Usamos StyleSheet.create para definir los estilos de forma optimizada
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
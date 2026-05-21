// src/screens/EventDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { db, auth } from '../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const EventDetailScreen = ({ route, navigation }) => {
  const { event } = route.params; 
  const [loading, setLoading] = useState(false);
  
  // Estados para los comentarios y calificaciones
  const [comentario, setComentario] = useState('');
  const [calificacion, setCalificacion] = useState(5); // Por defecto 5 estrellas
  const [listaComentarios, setListaComentarios] = useState([]);
  const [loadingComentario, setLoadingComentario] = useState(false);


  // Red de seguridad: Si por alguna razón el evento no llega, mostramos un cargando en vez del error rojo
  if (!event) {
    return (
      <SafeAreaView style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Cargando detalles...</Text>
      </SafeAreaView>
    );
  }

  // Escuchar los comentarios en tiempo real desde Firestore
  useEffect(() => {
    const comentariosRef = collection(db, 'eventos', event.id, 'comentarios');
    // Ordenamos para que los más recientes salgan primero
    const q = query(comentariosRef, orderBy('fecha', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comentariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListaComentarios(comentariosData);
    });

    return () => unsubscribe();
  }, [event.id]);

  // Función para Confirmar Asistencia
  const handleRSVP = async () => {
    setLoading(true);
    try {
      const usuarioId = auth.currentUser?.uid;
      const usuarioNombre = auth.currentUser?.displayName || 'Usuario';
      const asistenciaRef = collection(db, 'eventos', event.id, 'asistentes');
      await addDoc(asistenciaRef, {
        userId: usuarioId,
        nombre: usuarioNombre,
        fechaConfirmacion: new Date().toISOString()
      });
      setLoading(false);
      Alert.alert('¡Asistencia Confirmada!', `Te has registrado con éxito en "${event.titulo}".`);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No pudimos registrar tu asistencia. Inténtalo de nuevo.');
    }
  };

  // Función para Publicar un Comentario
  const handleAddComment = async () => {
    if (!comentario.trim()) {
      Alert.alert("Atención", "Por favor escribe un comentario antes de publicarlo.");
      return;
    }
    setLoadingComentario(true);
    try {
      const usuarioId = auth.currentUser?.uid;
      const usuarioNombre = auth.currentUser?.displayName || 'Usuario';
      const comentariosRef = collection(db, 'eventos', event.id, 'comentarios');
      
      await addDoc(comentariosRef, {
        userId: usuarioId,
        nombre: usuarioNombre,
        texto: comentario.trim(),
        calificacion: calificacion,
        fecha: new Date().toISOString()
      });

      setComentario('');
      setCalificacion(5); // Reseteamos las estrellas
      setLoadingComentario(false);
    } catch (error) {
      setLoadingComentario(false);
      Alert.alert("Error", "No se pudo publicar el comentario.");
    }
  };

  // Componente interno para dibujar las estrellas interactiva
  const renderStarsSelector = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setCalificacion(star)}>
            <Text style={[styles.starIcon, { color: star <= calificacion ? '#F59E0B' : '#D1D5DB' }]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* === TARJETA DEL EVENTO === */}
        <View style={styles.card}>
          <Text style={styles.title}>{event.titulo}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}><Text style={styles.icon}>📅</Text></View>
            <View>
              <Text style={styles.infoLabel}>Fecha y Hora</Text>
              <Text style={styles.infoValue}>{event.fecha}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}><Text style={styles.icon}>📍</Text></View>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>{event.ubicacion}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Acerca de esta actividad</Text>
          <Text style={styles.description}>{event.descripcion}</Text>
          
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleRSVP} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirmar Asistencia</Text>}
          </TouchableOpacity>
        </View>

        {/* === SECCIÓN DE CALIFICAR Y COMENTAR === */}
        <View style={styles.commentFormCard}>
          <Text style={styles.sectionTitle}>Deja tu opinión</Text>
          <Text style={styles.infoLabel}>Califica este evento:</Text>
          {renderStarsSelector()}
          
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe tu comentario aquí..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={comentario}
            onChangeText={setComentario}
          />
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddComment} disabled={loadingComentario}>
            {loadingComentario ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.secondaryButtonText}>Publicar Comentario</Text>}
          </TouchableOpacity>
        </View>

        {/* === LISTA DE COMENTARIOS === */}
        <View style={styles.commentsListContainer}>
          <Text style={styles.sectionTitle}>Comentarios ({listaComentarios.length})</Text>
          
          {listaComentarios.length === 0 ? (
            <Text style={styles.emptyCommentsText}>Aún no hay comentarios. ¡Sé el primero en opinar!</Text>
          ) : (
            listaComentarios.map((item) => (
              <View key={item.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{item.nombre}</Text>
                  <Text style={styles.commentStars}>
                    {/* Dibuja estrellitas amarillas según la calificación */}
                    {'★'.repeat(item.calificacion)}{'☆'.repeat(5 - item.calificacion)}
                  </Text>
                </View>
                <Text style={styles.commentText}>{item.texto}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContainer: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 40, height: 40, backgroundColor: '#EFF6FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 18 },
  infoLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#374151', fontWeight: '700' },
  infoValueContainer: { flex: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  primaryButton: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  
  // Estilos nuevos para los comentarios
  commentFormCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginVertical: 10 },
  starIcon: { fontSize: 35, marginRight: 5 },
  commentInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, fontSize: 15, color: '#1F2937', height: 90, textAlignVertical: 'top', marginBottom: 15 },
  secondaryButton: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  commentsListContainer: { paddingBottom: 20 },
  emptyCommentsText: { color: '#6B7280', fontStyle: 'italic', marginTop: 10 },
  commentItem: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  commentAuthor: { fontWeight: '700', color: '#374151', fontSize: 15 },
  commentStars: { color: '#F59E0B', fontSize: 14 },
  commentText: { color: '#4B5563', fontSize: 14, lineHeight: 20 }
});

export default EventDetailScreen;
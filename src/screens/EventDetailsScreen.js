// src/screens/EventDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Share } from 'react-native';
import { db, auth } from '../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs, where } from 'firebase/firestore';

export default function EventDetailsScreen({ route, navigation }) {
  const event = route.params?.event || {};
  
  const { id, titulo, fecha, ubicacion, descripcion, creadorId } = event;
  const esCreador = auth.currentUser?.uid === creadorId;

  const [yaInscrito, setYaInscrito] = useState(false);
  const [participacionId, setParticipacionId] = useState(null);
  const [cargandoRSVP, setCargandoRSVP] = useState(true);

  const [comentario, setComentario] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [listaComentarios, setListaComentarios] = useState([]);
  const [loadingComentario, setLoadingComentario] = useState(false);

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
          where("usuarioUid", "==", usuarioLogueado.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setYaInscrito(true);
          setParticipacionId(querySnapshot.docs[0].id);
        }
      } catch (error) {
        console.error("Error al comprobar asistencia: ", error);
      } finally {
        setCargandoRSVP(false);
      }
    };
    comprobarAsistencia();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const comentariosRef = collection(db, 'eventos', id, 'comentarios');
    const q = query(comentariosRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comentariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaComentarios(comentariosData);
    });
    return () => unsubscribe();
  }, [id]);

  const handleToggleParticipacion = async () => {
    try {
      const usuarioLogueado = auth.currentUser;
      if (!usuarioLogueado) {
        Alert.alert("Atención", "Debes estar autenticado para modificar tu asistencia.");
        return;
      }
      setCargandoRSVP(true);
      if (yaInscrito && participacionId) {
        await deleteDoc(doc(db, "participaciones", participacionId));
        setYaInscrito(false);
        setParticipacionId(null);
        Alert.alert("Asistencia Cancelada", "Ya no estás registrado para este evento.");
      } else {
        const docRef = await addDoc(collection(db, "participaciones"), {
          eventoId: id,
          eventoTitulo: titulo || "Sin título",
          usuarioUid: usuarioLogueado.uid,
          usuarioEmail: usuarioLogueado.email,
          fechaRegistro: new Date().toISOString(),
        });
        setYaInscrito(true);
        setParticipacionId(docRef.id);
        Alert.alert("¡Inscripción Exitosa!", `Te has registrado para asistir a:\n${titulo}`);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar tu solicitud.");
    } finally {
      setCargandoRSVP(false);
    }
  };

  const handleEliminarEvento = () => {
    Alert.alert(
      "Eliminar Evento",
      "¿Estás seguro de que deseas eliminar este evento permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "eventos", id));
              Alert.alert("Éxito", "El evento ha sido eliminado correctamente.");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el evento.");
            }
          },
        },
      ]
    );
  };

  // NUEVA FUNCIÓN: Compartir el evento
  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Hola! Te invito al evento "${titulo}" 📅 el ${fecha} 📍 en ${ubicacion}. ¡Únete a nuestra comunidad!`,
      });
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al intentar compartir el evento.");
    }
  };

  const handleAddComment = async () => {
    if (!comentario.trim()) {
      Alert.alert("Atención", "Por favor escribe un comentario antes de publicarlo.");
      return;
    }
    setLoadingComentario(true);
    try {
      const usuarioNombre = auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario';
      const comentariosRef = collection(db, 'eventos', id, 'comentarios');
      await addDoc(comentariosRef, {
        nombre: usuarioNombre,
        texto: comentario.trim(),
        calificacion: calificacion,
        fecha: new Date().toISOString()
      });
      setComentario('');
      setCalificacion(5);
      setLoadingComentario(false);
    } catch (error) {
      setLoadingComentario(false);
      Alert.alert("Error", "No se pudo publicar el comentario.");
    }
  };

  const renderStarsSelector = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setCalificacion(star)}>
          <Text style={[styles.starIcon, { color: star <= calificacion ? '#F59E0B' : '#D1D5DB' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar la información del evento.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.title}>{titulo}</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}><Text style={styles.icon}>📅</Text></View>
            <View>
              <Text style={styles.infoLabel}>Fecha del evento</Text>
              <Text style={styles.infoValue}>{fecha}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}><Text style={styles.icon}>📍</Text></View>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>{ubicacion}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Acerca de esta actividad</Text>
          <Text style={styles.description}>{descripcion}</Text>

          
          {/* Fila de Botones: Asistencia, Compartir, Editar, Eliminar */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={[styles.primaryButton, yaInscrito && { backgroundColor: '#EF4444' }]} 
              activeOpacity={0.8} 
              onPress={handleToggleParticipacion} 
              disabled={cargandoRSVP}
            >
              {cargandoRSVP ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {yaInscrito ? "Cancelar Asistencia" : "Confirmar Asistencia"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>

            {/* 👇 ¡AQUÍ ESTÁ LA MAGIA! Solo mostramos estos botones si es el creador 👇 */}
            {esCreador && (
              <>
                <TouchableOpacity 
                  style={[styles.deleteButton, { backgroundColor: '#FEF3C7', marginRight: 8 }]} 
                  onPress={() => navigation.navigate('EditEvent', { event: event })}
                >
                  <Text style={{ fontSize: 16 }}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleEliminarEvento}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

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
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContainer: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#EF4444", marginBottom: 20, textAlign: "center" },
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

  // Estilos actualizados para la fila de botones
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  primaryButton: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginRight: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  shareButton: { backgroundColor: '#DBEAFE', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', marginRight: 8 },
  shareButtonText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  deleteButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#EF4444', fontSize: 16 },

  commentFormCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginVertical: 10 },
  starIcon: { fontSize: 35, marginRight: 5 },
  commentInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, fontSize: 15, color: '#1F2937', height: 90, textAlignVertical: 'top', marginBottom: 15 },
  secondaryButton: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', paddingHorizontal: 20 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  commentsListContainer: { paddingBottom: 20 },
  emptyCommentsText: { color: '#6B7280', fontStyle: 'italic', marginTop: 10 },
  commentItem: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  commentAuthor: { fontWeight: '700', color: '#374151', fontSize: 15 },
  commentStars: { color: '#F59E0B', fontSize: 14 },
  commentText: { color: '#4B5563', fontSize: 14, lineHeight: 20 }
});
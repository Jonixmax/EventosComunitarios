// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, where } from 'firebase/firestore'; // Agregamos query y where
import { signOut } from 'firebase/auth';
import { db, auth } from '../config/firebase'; 

const HomeScreen = ({ navigation }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para nuestro sistema de Notificaciones Inteligentes
  const [misAsistencias, setMisAsistencias] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  // 1. Cargar Eventos
  useEffect(() => {
    const eventosRef = collection(db, 'eventos');
    const unsubscribe = onSnapshot(eventosRef, (snapshot) => {
      const eventosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventos(eventosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar mis asistencias en tiempo real
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'participaciones'), where('usuarioUid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const asistenciasData = snapshot.docs.map(doc => doc.data().eventoId);
      setMisAsistencias(asistenciasData);
    });
    return () => unsubscribe();
  }, []);

  // 3. Calcular notificaciones (Eventos para hoy o mañana)
  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const proximos = eventos.filter(evento => {
      if (!misAsistencias.includes(evento.id)) return false;
      if (!evento.fecha) return false;

      // Intentar convertir la fecha del evento (formato DD/MM/YYYY)
      let eventDate;
      if (evento.fecha.includes('/')) {
        const [day, month, year] = evento.fecha.split('/');
        eventDate = new Date(year, month - 1, day);
      } else {
        eventDate = new Date(evento.fecha);
      }
      eventDate.setHours(0,0,0,0);

      // Si el evento es hoy o mañana, lo guardamos como notificación
      return eventDate.getTime() === hoy.getTime() || eventDate.getTime() === manana.getTime();
    });

    setNotificaciones(proximos);
  }, [eventos, misAsistencias]);

  // Función para abrir la campanita
  const abrirNotificaciones = () => {
    if (notificaciones.length > 0) {
      const titulos = notificaciones.map(e => `⏰ ${e.titulo} (${e.fecha})`).join('\n');
      Alert.alert(
        "🔔 Recordatorios de Eventos", 
        `¡No lo olvides! Tienes estos eventos próximamente:\n\n${titulos}`
      );
    } else {
      Alert.alert("🔔 Todo tranquilo", "No tienes eventos programados para hoy ni mañana. ¡Explora la lista y apúntate a uno!");
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => navigation.replace('Login'))
      .catch((error) => console.log('Error al cerrar sesión:', error));
  };

  const confirmarEliminacion = (id, titulo) => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el evento "${titulo}"?`);
      if (confirmar) ejecutarEliminacion(id);
    } else {
      Alert.alert(
        "Eliminar Evento",
        `¿Estás seguro de que deseas eliminar el evento "${titulo}"?`,
        [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => ejecutarEliminacion(id) }]
      );
    }
  };

  const ejecutarEliminacion = async (id) => {
    try {
      await deleteDoc(doc(db, 'eventos', id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el evento.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loaderText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>Próximos Eventos</Text>
                <Text style={styles.subtitle}>Descubre lo que pasa en tu comunidad</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* === BOTÓN DE NOTIFICACIONES === */}
              <TouchableOpacity 
                style={[styles.logoutBtn, { backgroundColor: '#FEF3C7', marginRight: 8, paddingHorizontal: 10 }]}
                onPress={abrirNotificaciones}
              >
                <Text style={{ fontSize: 16 }}>🔔</Text>
                {/* Solo mostramos el punto rojo si hay notificaciones */}
                {notificaciones.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificaciones.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.logoutBtn, { backgroundColor: '#DBEAFE', marginRight: 8 }]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={[styles.logoutText, { color: '#2563EB' }]}>📊 Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
        </View>
        {auth.currentUser && (
          <Text style={styles.userText}>Usuario: {auth.currentUser.displayName || auth.currentUser.email}</Text>
        )}
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTextTitle}>No hay eventos próximos</Text>
            <Text style={styles.emptyTextSubtitle}>¡Sé el primero en organizar uno!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('EventDetails', { event: item })}
              >
                <Text style={styles.eventName} numberOfLines={1}>{item.titulo}</Text>
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{item.fecha}</Text>
                </View>
                {auth.currentUser?.uid === item.creadorId && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => confirmarEliminacion(item.id, item.titulo)}
                  >
                    <Text style={styles.deleteButtonText}>Borrar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.eventLocation}>📍 {item.ubicacion}</Text>
              <Text style={styles.eventDescription}>{item.descripcion}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', width: '100%', maxWidth: 800, alignSelf: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, fontSize: 16, color: '#7F8C8D' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  subtitle: { fontSize: 15, color: '#7F8C8D', marginTop: 4 },
  userText: { fontSize: 14, color: '#2563EB', marginTop: 4, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  
  // Estilos del puntito rojo de notificaciones
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  listContainer: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventName: { fontSize: 18, fontWeight: '700', color: '#34495E', marginRight: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { backgroundColor: '#E8F0FE', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginRight: 8 },
  dateText: { fontSize: 12, fontWeight: '600', color: '#4A90E2' },
  deleteButton: { backgroundColor: '#FEE2E2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  deleteButtonText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#F0F3F4', paddingTop: 12 },
  eventLocation: { fontSize: 14, color: '#7F8C8D', marginBottom: 6, fontWeight: '500' },
  eventDescription: { fontSize: 14, color: '#95A5A6', lineHeight: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20 },
  emptyTextTitle: { fontSize: 18, fontWeight: '600', color: '#34495E', marginBottom: 8 },
  emptyTextSubtitle: { fontSize: 15, color: '#95A5A6', textAlign: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 30, backgroundColor: '#4A90E2', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  fabIcon: { fontSize: 30, color: '#FFFFFF', fontWeight: '400', marginTop: -2 },
});

export default HomeScreen;
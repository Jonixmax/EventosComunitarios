// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { db, auth } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [misAsistencias, setMisAsistencias] = useState([]);
  const [totalEventos, setTotalEventos] = useState(0);

  const usuarioLogueado = auth.currentUser;

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!usuarioLogueado) return;

      try {
        // 1. Buscamos el historial de inscripciones del usuario actual
        const qAsistencias = query(
          collection(db, "participaciones"), 
          where("usuarioUid", "==", usuarioLogueado.uid)
        );
        const snapshotAsistencias = await getDocs(qAsistencias);
        
        const historial = snapshotAsistencias.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenamos para que los más recientes salgan arriba
        historial.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
        setMisAsistencias(historial);

        // 2. Contamos cuántos eventos hay en total en la comunidad
        const snapshotEventos = await getDocs(collection(db, "eventos"));
        setTotalEventos(snapshotEventos.size);

      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando tus estadísticas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Cabecera del Perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {usuarioLogueado?.displayName ? usuarioLogueado.displayName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>{usuarioLogueado?.displayName || usuarioLogueado?.email}</Text>
      </View>

      {/* Tarjetas de Estadísticas (Dashboard) */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderTopColor: '#10B981', borderTopWidth: 4 }]}>
          <Text style={styles.statNumber}>{misAsistencias.length}</Text>
          <Text style={styles.statLabel}>Eventos Confirmados</Text>
        </View>
        
        <View style={[styles.statCard, { borderTopColor: '#3B82F6', borderTopWidth: 4 }]}>
          <Text style={styles.statNumber}>{totalEventos}</Text>
          <Text style={styles.statLabel}>Eventos en la Comunidad</Text>
        </View>
      </View>

      {/* Historial en Lista */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Historial de Participación</Text>
        
        <FlatList
          data={misAsistencias}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aún no tienes historial. ¡Confirma tu asistencia a un evento!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>🎟️ {item.eventoTitulo}</Text>
              <Text style={styles.historyDate}>
                Te registraste el: {new Date(item.fechaRegistro).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, color: '#6B7280', fontSize: 16 },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#2563EB' },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -20 },
  statCard: { flex: 0.48, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statNumber: { fontSize: 32, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 5, textAlign: 'center', fontWeight: '500' },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 15 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  historyCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 5 },
  historyDate: { fontSize: 13, color: '#9CA3AF' }
});
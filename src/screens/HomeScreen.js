// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const HomeScreen = ({ navigation }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onSnapshot crea una conexión en tiempo real con Firestore
    const eventosRef = collection(db, 'eventos');
    const unsubscribe = onSnapshot(eventosRef, (snapshot) => {
      const eventosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventos(eventosData);
      setLoading(false);
    });

    // Limpiamos la conexión cuando la pantalla se cierra
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Próximos Eventos</Text>
      
      <FlatList 
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.eventName}>{item.titulo}</Text>
            <Text style={styles.eventDate}>📅 {item.fecha}</Text>
            <Text style={styles.eventLocation}>📍 {item.ubicacion}</Text>
            <Text style={styles.eventDescription}>{item.descripcion}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no hay eventos registrados.</Text>}
      />

      {/* Botón flotante para crear un nuevo evento */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => console.log("Ir a crear evento")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  loader: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#007bff', marginBottom: 5 },
  eventDate: { fontSize: 14, color: '#555', marginBottom: 2 },
  eventLocation: { fontSize: 14, color: '#555', marginBottom: 8 },
  eventDescription: { fontSize: 14, color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#007bff', borderRadius: 30, elevation: 8 },
  fabIcon: { fontSize: 30, color: 'white' }
});

export default HomeScreen;
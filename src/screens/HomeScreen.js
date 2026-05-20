// src/screens/HomeScreen.js
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../config/firebase';

const HomeScreen = ({ navigation }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <Text style={styles.title}>Próximos Eventos</Text>
        <Text style={styles.subtitle}>Descubre lo que pasa en tu comunidad</Text>
      </View>
      
      <FlatList 
        data={eventos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.eventName}>{item.titulo}</Text>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{item.fecha}</Text>
              </View>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.eventLocation}>📍 {item.ubicacion}</Text>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {item.descripcion}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTextTitle}>Sin eventos a la vista</Text>
            <Text style={styles.emptyText}>Anímate a organizar el primero tocando el botón de abajo.</Text>
          </View>
        }
      />

      {/* Botón flotante */}
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
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA', // Gris azulado muy claro
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loaderText: {
    marginTop: 10,
    color: '#7F8C8D',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#2C3E50', 
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Espacio para que el último elemento no quede detrás del botón
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 18,
    marginBottom: 16, 
    // Sombras más elegantes
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
    elevation: 3, 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#34495E', 
    flex: 1,
    marginRight: 10,
  },
  dateBadge: {
    backgroundColor: '#E8F0FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dateText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: '#4A90E2', 
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    paddingTop: 12,
  },
  eventLocation: { 
    fontSize: 14, 
    color: '#7F8C8D', 
    marginBottom: 6,
    fontWeight: '500',
  },
  eventDescription: { 
    fontSize: 14, 
    color: '#95A5A6',
    lineHeight: 20,
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#95A5A6', 
    fontSize: 15, 
    lineHeight: 22,
  },
  fab: { 
    position: 'absolute', 
    width: 60, 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    right: 20, 
    bottom: 30, 
    backgroundColor: '#4A90E2', 
    borderRadius: 30, 
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8, 
  },
  fabIcon: { 
    fontSize: 32, 
    color: 'white',
    lineHeight: 34,
  }
});

export default HomeScreen;
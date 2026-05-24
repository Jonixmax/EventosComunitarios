// src/screens/EventDetailsScreen.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";

export default function EventDetailsScreen({ route, navigation }) {
  const event = route.params?.event || {};

  const { id, titulo, fecha, ubicacion, descripcion, creadorId } = event;
  const esCreador = auth.currentUser?.uid === creadorId;

  // Estado que verifica si el evento viene finalizado desde Firebase
  const [isFinalizado, setIsFinalizado] = useState(
    event.estado === "finalizado",
  );

  const [yaInscrito, setYaInscrito] = useState(false);
  const [participacionId, setParticipacionId] = useState(null);
  const [cargandoRSVP, setCargandoRSVP] = useState(true);

  const [totalParticipantes, setTotalParticipantes] = useState(0);

  const [comentario, setComentario] = useState("");
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
          where("usuarioUid", "==", usuarioLogueado.uid),
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
    const qParticipantes = query(
      collection(db, "participaciones"),
      where("eventoId", "==", id),
    );
    const unsubscribe = onSnapshot(qParticipantes, (snapshot) => {
      setTotalParticipantes(snapshot.size);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "comentarios"), where("eventoId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comentariosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      comentariosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setListaComentarios(comentariosData);
    });
    return () => unsubscribe();
  }, [id]);

  const handleToggleParticipacion = async () => {
    // Si ya está finalizado, bloqueamos cualquier intento de ejecución
    if (isFinalizado) return;

    try {
      const usuarioLogueado = auth.currentUser;
      if (!usuarioLogueado) {
        Alert.alert(
          "Atención",
          "Debes estar autenticado para modificar tu asistencia.",
        );
        return;
      }
      setCargandoRSVP(true);
      if (yaInscrito && participacionId) {
        await deleteDoc(doc(db, "participaciones", participacionId));
        setYaInscrito(false);
        setParticipacionId(null);
        Alert.alert(
          "Asistencia Cancelada",
          "Ya no estás registrado para este evento.",
        );
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
        Alert.alert(
          "¡Inscripción Exitosa!",
          `Te has registrado para asistir a:\n${titulo}`,
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar tu solicitud.");
    } finally {
      setCargandoRSVP(false);
    }
  };

  // Función interna para ejecutar el cambio en Firebase
  const ejecutarFinalizar = async () => {
    try {
      // 1. Lo guardamos en Firebase
      await updateDoc(doc(db, "eventos", id), { estado: "finalizado" });

      // 2. Bloqueamos la pantalla al instante
      setIsFinalizado(true);

      // 3. Mostramos éxito
      if (Platform.OS === "web") {
        window.alert(
          "El evento ha sido marcado como finalizado. Ya no se pueden inscribir más personas.",
        );
      } else {
        Alert.alert("Éxito", "El evento ha sido marcado como finalizado.");
      }
    } catch (error) {
      if (Platform.OS === "web")
        window.alert("Error: No se pudo finalizar el evento.");
      else Alert.alert("Error", "No se pudo finalizar el evento.");
    }
  };

  const handleFinalizarEvento = () => {
    // Validación para que el botón SÍ funcione en Web
    if (Platform.OS === "web") {
      const confirmar = window.confirm(
        "¿Estás seguro de que deseas finalizar este evento? Ya no se permitirán nuevas inscripciones.",
      );
      if (confirmar) ejecutarFinalizar();
    } else {
      Alert.alert(
        "Finalizar Evento",
        "¿Estás seguro de que deseas finalizar este evento? Ya no se permitirán nuevas inscripciones.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, finalizar",
            style: "destructive",
            onPress: ejecutarFinalizar,
          },
        ],
      );
    }
  };

  const ejecutarEliminar = async () => {
    try {
      await deleteDoc(doc(db, "eventos", id));
      if (Platform.OS === "web")
        window.alert("El evento ha sido eliminado correctamente.");
      else Alert.alert("Éxito", "El evento ha sido eliminado correctamente.");
      navigation.goBack();
    } catch (error) {
      if (Platform.OS === "web")
        window.alert("Error: No se pudo eliminar el evento.");
      else Alert.alert("Error", "No se pudo eliminar el evento.");
    }
  };

  const handleEliminarEvento = () => {
    if (Platform.OS === "web") {
      const confirmar = window.confirm(
        "¿Estás seguro de que deseas eliminar este evento permanentemente?",
      );
      if (confirmar) ejecutarEliminar();
    } else {
      Alert.alert(
        "Eliminar Evento",
        "¿Estás seguro de que deseas eliminar este evento permanentemente?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: ejecutarEliminar },
        ],
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Hola! Te invito al evento "${titulo}" 📅 el ${fecha} 📍 en ${ubicacion}. Ya somos ${totalParticipantes} confirmados. ¡Únete a nuestra comunidad!`,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Ocurrió un problema al intentar compartir el evento.",
      );
    }
  };

  const handleAddComment = async () => {
    if (!comentario.trim()) {
      Alert.alert(
        "Atención",
        "Por favor escribe un comentario antes de publicarlo.",
      );
      return;
    }
    setLoadingComentario(true);
    try {
      const usuarioLogueado = auth.currentUser;
      const usuarioNombre =
        usuarioLogueado?.displayName || usuarioLogueado?.email || "Usuario";

      const comentariosRef = collection(db, "comentarios");
      await addDoc(comentariosRef, {
        eventoId: id,
        usuarioUid: usuarioLogueado.uid,
        nombre: usuarioNombre,
        texto: comentario.trim(),
        calificacion: calificacion,
        fecha: new Date().toISOString(),
      });
      setComentario("");
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
        <TouchableOpacity
          key={star}
          onPress={() => setCalificacion(star)}
          style={{ padding: 5 }}
        >
          <Text
            style={[
              styles.starIcon,
              { color: star <= calificacion ? "#F59E0B" : "#E5E7EB" },
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          No se pudo cargar la información del evento.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER */}
        <View
          style={[
            styles.heroBanner,
            isFinalizado && { backgroundColor: "#4B5563" },
          ]}
        >
          <Text style={styles.heroTitle}>{titulo}</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.shareBadge} onPress={handleShare}>
              <Text style={styles.shareBadgeText}>🔗 Compartir Evento</Text>
            </TouchableOpacity>
            {isFinalizado && (
              <View
                style={[
                  styles.shareBadge,
                  { backgroundColor: "#EF4444", marginLeft: 10 },
                ]}
              >
                <Text style={styles.shareBadgeText}>🔒 Finalizado</Text>
              </View>
            )}
          </View>
        </View>

        {/* TARJETA FLOTANTE */}
        <View style={styles.floatingInfoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{isFinalizado ? "🔴" : "🟢"}</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Estado del Evento</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isFinalizado ? "#EF4444" : "#10B981" },
                ]}
              >
                {isFinalizado ? "Finalizado" : "En curso"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>📅</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{fecha}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>📍</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>{ubicacion}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>👥</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Participantes</Text>
              <Text style={[styles.infoValue, { color: "#3B82F6" }]}>
                {totalParticipantes}{" "}
                {totalParticipantes === 1
                  ? "persona inscrita"
                  : "personas inscritas"}
              </Text>
            </View>
          </View>
        </View>

        {/* BOTÓN DE ASISTENCIA: SI ESTÁ FINALIZADO SE DESHABILITA Y SE VE GRIS */}
        {isFinalizado ? (
          <View
            style={[
              styles.rsvpButton,
              {
                backgroundColor: "#F3F4F6",
                shadowOpacity: 0,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              },
            ]}
          >
            <Text style={[styles.rsvpButtonText, { color: "#9CA3AF" }]}>
              🚫 Las inscripciones han cerrado
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.rsvpButton, yaInscrito && styles.rsvpButtonCancel]}
            activeOpacity={0.8}
            onPress={handleToggleParticipacion}
            disabled={cargandoRSVP}
          >
            {cargandoRSVP ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.rsvpButtonText}>
                {yaInscrito
                  ? "✅ Asistencia Confirmada (Toca para cancelar)"
                  : "👋 ¡Quiero Asistir!"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Acerca de esta actividad</Text>
          <Text style={styles.descriptionText}>{descripcion}</Text>
        </View>

        {/* HERRAMIENTAS DE ORGANIZADOR */}
        {esCreador && (
          <View style={styles.adminContainer}>
            <Text style={styles.adminTitle}>Herramientas de Organizador</Text>
            <View style={styles.adminButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.adminBtn,
                  { backgroundColor: "#FEF3C7", marginRight: 10 },
                ]}
                onPress={() =>
                  navigation.navigate("EditEvent", { event: event })
                }
              >
                <Text style={[styles.adminBtnText, { color: "#D97706" }]}>
                  ✏️ Editar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminBtn, { backgroundColor: "#FEE2E2" }]}
                onPress={handleEliminarEvento}
              >
                <Text style={[styles.adminBtnText, { color: "#EF4444" }]}>
                  🗑️ Eliminar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Solo se muestra si el evento NO está finalizado */}
            {!isFinalizado && (
              <TouchableOpacity
                style={styles.finalizeBtn}
                onPress={handleFinalizarEvento}
              >
                <Text style={styles.finalizeBtnText}>🏁 Finalizar Evento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* FORMULARIO DE COMENTARIOS */}
        <View style={styles.commentFormCard}>
          <Text style={styles.sectionTitle}>Deja tu opinión</Text>
          <Text style={styles.infoLabel}>¿Qué te pareció este evento?</Text>
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

          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleAddComment}
            disabled={loadingComentario}
          >
            {loadingComentario ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Publicar Comentario</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* COMENTARIOS */}
        <View style={styles.commentsListContainer}>
          <Text style={styles.sectionTitle}>
            Comentarios ({listaComentarios.length})
          </Text>

          {listaComentarios.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsEmoji}>💬</Text>
              <Text style={styles.emptyCommentsText}>
                Sé el primero en opinar sobre este evento.
              </Text>
            </View>
          ) : (
            listaComentarios.map((item) => (
              <View key={item.id} style={styles.commentBubble}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {item.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{item.nombre}</Text>
                    <Text style={styles.commentStars}>
                      {"★".repeat(item.calificacion)}
                      {"☆".repeat(5 - item.calificacion)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{item.texto}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContainer: { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 20,
    textAlign: "center",
  },

  heroBanner: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 15,
    lineHeight: 34,
  },
  heroActions: { flexDirection: "row", alignItems: "center" },
  shareBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  shareBadgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  floatingInfoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon: { fontSize: 20 },
  infoTextContainer: { flex: 1 },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: { fontSize: 16, color: "#1F2937", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 15 },

  rsvpButton: {
    marginHorizontal: 20,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 25,
  },
  rsvpButtonCancel: { backgroundColor: "#EF4444", shadowColor: "#EF4444" },
  rsvpButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  sectionContainer: { paddingHorizontal: 25, marginBottom: 25 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  descriptionText: { fontSize: 15, color: "#4B5563", lineHeight: 24 },

  adminContainer: {
    marginHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 15,
    textAlign: "center",
  },
  adminButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  adminBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  adminBtnText: { fontWeight: "700", fontSize: 14 },

  finalizeBtn: {
    backgroundColor: "#4B5563",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  finalizeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  commentFormCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  starsContainer: { flexDirection: "row", marginVertical: 5, marginLeft: -5 },
  starIcon: { fontSize: 32 },
  commentInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: "#1F2937",
    height: 100,
    textAlignVertical: "top",
    marginTop: 10,
    marginBottom: 15,
  },
  publishButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  publishButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  commentsListContainer: { paddingHorizontal: 20 },
  emptyComments: {
    alignItems: "center",
    marginTop: 10,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyCommentsEmoji: { fontSize: 30, marginBottom: 10 },
  emptyCommentsText: {
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },

  commentBubble: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commentAvatarText: { color: "#1D4ED8", fontWeight: "800", fontSize: 18 },
  commentContent: { flex: 1 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: { fontWeight: "700", color: "#111827", fontSize: 14 },
  commentStars: { color: "#F59E0B", fontSize: 12 },
  commentText: { color: "#4B5563", fontSize: 14, lineHeight: 20 },
});

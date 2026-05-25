# 📅 Eventos Comunitarios

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-12.13-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Licencia-CC%20BY--NC%204.0-lightgrey?style=for-the-badge" />
</p>

<p align="center">
  Aplicación móvil para descubrir, crear y gestionar eventos comunitarios. Desarrollada con React Native + Expo y respaldada por Firebase en tiempo real.
</p>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso](#-uso)
- [Documentación](#-documentación)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## 📖 Descripción

**Eventos Comunitarios** es una aplicación móvil multiplataforma (Android, iOS y Web) que permite a los usuarios de una comunidad explorar eventos cercanos, registrar su asistencia, crear sus propios eventos y recibir recordatorios automáticos. La aplicación se conecta a Firebase para autenticación de usuarios y almacenamiento de datos en tiempo real.

---

## ✨ Características

- 🔐 **Autenticación múltiple** — Inicio de sesión con correo/contraseña, Google y Facebook.
- 📋 **Listado de eventos en tiempo real** — Tarjetas con título, descripción, fecha y ubicación actualizadas al instante mediante Firestore.
- ➕ **Creación de eventos** — Formulario completo con selector de fecha nativo (DateTimePicker).
- ✏️ **Edición y eliminación** — El creador del evento puede modificarlo o eliminarlo con confirmación.
- 👀 **Detalle de evento** — Vista completa con descripción, fecha, ubicación y opción de marcar asistencia.
- 🔔 **Notificaciones en app** — Recordatorio automático de eventos programados para hoy o mañana en los que el usuario confirmó asistencia.
- 👤 **Perfil de usuario** — Pantalla con datos del usuario autenticado y opción de cerrar sesión.
- 📱 **Soporte multiplataforma** — Android, iOS y Web desde una sola base de código.

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.81.5 | Framework principal de UI |
| Expo | ~54.0 | Herramientas de desarrollo y build |
| Expo Router | ~6.0 | Navegación basada en archivos |
| Firebase Auth | 12.13 | Autenticación de usuarios |
| Cloud Firestore | 12.13 | Base de datos en tiempo real |
| React Navigation | 7.x | Navegación entre pantallas |
| Google Sign-In | 16.1 | Autenticación con Google (nativa) |
| React Native FBSDK | 13.4 | Autenticación con Facebook |
| DateTimePicker | 9.1 | Selector de fecha nativo |
| TypeScript | ~5.9 | Tipado estático |

---

## 🎨 Diseño UX/UI (Mockups)
* [🔗 Ver Prototipo Interactivo en Figma](https://www.figma.com/design/BvSfsUnUEJ9fvu4mfBEJOo/DPS.eventoscomunitarios?node-id=0-1&m=dev&t=qNnD3PMj81ENrh2J-1)

---

## 📁 Estructura del Proyecto

```
EventosComunitarios/
├── app/
│   ├── _layout.tsx          # Layout raíz de la aplicación (Expo Router)
│   └── index.tsx            # Punto de entrada
├── src/
│   ├── config/
│   │   └── firebase.js      # Inicialización y exportación de Firebase (auth, db)
│   └── screens/
│       ├── LoginScreen.js       # Pantalla de inicio de sesión
│       ├── RegisterScreen.js    # Pantalla de registro de usuario
│       ├── HomeScreen.js        # Listado principal de eventos
│       ├── CreateEventScreen.js # Formulario de creación de evento
│       ├── EditEventScreen.js   # Formulario de edición de evento
│       ├── EventDetailsScreen.js# Detalle de evento y asistencia
│       └── ProfileScreen.js     # Perfil del usuario autenticado
├── assets/
│   └── images/              # Íconos y recursos gráficos
├── app.json                 # Configuración de la app Expo
├── google-services.json     # Configuración de Firebase para Android
├── package.json
└── tsconfig.json
```

---

## 🚀 Instalación y Configuración

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Expo CLI](https://docs.expo.dev/get-started/installation/) instalado globalmente
- Cuenta de [Firebase](https://firebase.google.com/) con proyecto activo
- (Opcional) Android Studio o Xcode para emuladores nativos

### Pasos

**1. Clonar el repositorio**

```bash
git clone https://github.com/Jonixmax/EventosComunitarios.git
cd EventosComunitarios
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar Firebase**

Edita el archivo `src/config/firebase.js` con las credenciales de tu propio proyecto Firebase:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

> ⚠️ Asegúrate de habilitar **Email/Password**, **Google** y **Facebook** como proveedores de autenticación en la consola de Firebase.

**4. Configurar Google Sign-In (Android)**

Reemplaza el `google-services.json` en la raíz del proyecto con el archivo descargado de tu consola de Firebase.

Actualiza también el `webClientId` en `LoginScreen.js`:

```js
GoogleSignin.configure({
  webClientId: "TU_WEB_CLIENT_ID",
});
```

**5. Iniciar la aplicación**

```bash
npx expo start
```

Desde la terminal podrás abrir la app en:

- 📱 **Expo Go** (escanea el QR)
- 🤖 **Android** — presiona `a`
- 🍎 **iOS** — presiona `i`
- 🌐 **Web** — presiona `w`

Para ejecutar en dispositivo/emulador nativo:

```bash
npx expo run:android
# o
npx expo run:ios
```

---

## 📱 Uso

1. **Registro / Inicio de sesión** — Crea una cuenta con correo, o inicia sesión con Google o Facebook.
2. **Explorar eventos** — La pantalla principal muestra todos los eventos de la comunidad en tiempo real.
3. **Ver detalle** — Toca cualquier tarjeta para ver la información completa y confirmar tu asistencia.
4. **Crear un evento** — Presiona el botón flotante `+` para llenar el formulario con título, descripción, fecha y ubicación.
5. **Gestionar tus eventos** — Si eres el creador de un evento, podrás editarlo ✏️ o eliminarlo 🗑️ directamente desde la lista o el detalle.
6. **Notificaciones** — El ícono 🔔 te avisará si tienes eventos confirmados para hoy o mañana.
7. **Perfil** — Accede al ícono 👤 para ver tu información y cerrar sesión de forma segura.

---

## 📄 Documentación

El siguiente documento PDF contiene el informe técnico completo del proyecto, incluyendo análisis, diseño, arquitectura y conclusiones:

📎 [**DPS_Proyecto2_ReactNative_.pdf**](./DPS_Proyecto2_ReactNative_.pdf)

---

## 👥 Autores

Este proyecto fue desarrollado como parte de un trabajo académico por:

| Nombre | Carné |
|---|---|
| Jonathan Alexander Alberto | AC200739 |
| Christian Geovanni Centeno | CS241743 |
| José Alexander Montoya | MQ252529 |
| Gabriel Quintanilla Rodríguez | QR230082 |

---

## 📄 Licencia

[![Licencia de Creative Commons](https://i.creativecommons.org/l/by-nc/4.0/88x31.png)](http://creativecommons.org/licenses/by-nc/4.0/)

Este proyecto se distribuye bajo una [Licencia Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0)](http://creativecommons.org/licenses/by-nc/4.0/).

Puedes compartir y adaptar el material siempre que des crédito a los autores y no lo uses con fines comerciales.
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    // Con headerShown: false apagamos el encabezado global de Expo Router
    <Stack screenOptions={{ headerShown: false }} />
  );
}
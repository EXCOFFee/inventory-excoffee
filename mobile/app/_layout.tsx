/**
 * Layout raíz de la aplicación móvil.
 * Configura la navegación y los providers.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/authStore';
import '../global.css';

// Mantener splash screen visible mientras carga
SplashScreen.preventAutoHideAsync();

// Cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await checkAuth();
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1e1e2e' : '#ffffff',
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#1e293b',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a12' : '#f8fafc',
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ 
          title: 'Escanear Código',
          presentation: 'modal',
        }} />
        <Stack.Screen name="product/[id]" options={{ 
          title: 'Detalle del Producto',
        }} />
        <Stack.Screen name="movement/new" options={{ 
          title: 'Nuevo Movimiento',
          presentation: 'modal',
        }} />
      </Stack>
    </QueryClientProvider>
  );
}

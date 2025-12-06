/**
 * Pantalla de redirección inicial.
 * Verifica autenticación y redirige.
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-950">
        <ActivityIndicator size="large" color="#0080ff" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

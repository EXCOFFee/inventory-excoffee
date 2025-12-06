/**
 * Pantalla de Login - App Móvil.
 * 
 * Diseño coherente con la versión web (dark theme glassmorphism).
 */

import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, requires2FA } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    
    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  // Redirigir a 2FA si es necesario
  if (requires2FA) {
    router.replace('/(auth)/two-factor');
    return null;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-dark-950"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-cyan items-center justify-center mb-4 shadow-lg">
              <Ionicons name="cube-outline" size={40} color="white" />
            </View>
            <Text className="text-4xl font-bold text-white">InventoryPro</Text>
            <Text className="text-dark-400 mt-2">Sistema de Gestión de Inventarios</Text>
          </View>

          {/* Card de Login */}
          <View className="bg-dark-900/80 rounded-3xl p-6 border border-dark-700">
            <Text className="text-2xl font-bold text-white mb-2">Bienvenido</Text>
            <Text className="text-dark-400 mb-6">Ingresa tus credenciales</Text>

            {/* Error */}
            {error && (
              <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-danger ml-2 flex-1">{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Email */}
            <View className="mb-4">
              <Text className="text-dark-300 text-sm font-medium mb-2">
                Correo electrónico
              </Text>
              <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                <Ionicons name="mail-outline" size={20} color="#65657f" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor="#65657f"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 py-4 px-3 text-white"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-dark-300 text-sm font-medium mb-2">
                Contraseña
              </Text>
              <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#65657f" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#65657f"
                  secureTextEntry={!showPassword}
                  className="flex-1 py-4 px-3 text-white"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#65657f" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              className={`
                py-4 rounded-xl items-center justify-center flex-row
                ${isLoading ? 'bg-primary-700' : 'bg-primary-500'}
              `}
              style={{
                shadowColor: '#0080ff',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-lg mr-2">
                    Iniciar Sesión
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Link a Registro */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-dark-400">¿No tienes cuenta? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-semibold">Regístrate</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Credenciales Demo */}
          <View className="mt-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
            <Text className="text-dark-400 text-center text-sm">
              Demo: admin@inventorypro.com / Admin123!
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

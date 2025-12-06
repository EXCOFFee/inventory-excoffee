/**
 * Pantalla de Registro - App Móvil.
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
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/api/auth.service';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.register({
        firstName,
        lastName,
        email,
        password,
      });
      
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = firstName && lastName && email && password && confirmPassword && password === confirmPassword;

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
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan items-center justify-center mb-4">
              <Ionicons name="person-add-outline" size={32} color="white" />
            </View>
            <Text className="text-3xl font-bold text-white">Crear Cuenta</Text>
            <Text className="text-dark-400 mt-2">Únete a InventoryPro</Text>
          </View>

          {/* Card */}
          <View className="bg-dark-900/80 rounded-3xl p-6 border border-dark-700">
            {/* Error */}
            {error && (
              <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-danger ml-2 flex-1">{error}</Text>
                <TouchableOpacity onPress={() => setError(null)}>
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Nombre */}
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-dark-300 text-sm font-medium mb-2">Nombre</Text>
                <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                  <Ionicons name="person-outline" size={18} color="#65657f" />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Juan"
                    placeholderTextColor="#65657f"
                    className="flex-1 py-3 px-3 text-white"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-dark-300 text-sm font-medium mb-2">Apellido</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Pérez"
                  placeholderTextColor="#65657f"
                  className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-dark-300 text-sm font-medium mb-2">Correo electrónico</Text>
              <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                <Ionicons name="mail-outline" size={18} color="#65657f" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor="#65657f"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 py-3 px-3 text-white"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-dark-300 text-sm font-medium mb-2">Contraseña</Text>
              <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={18} color="#65657f" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#65657f"
                  secureTextEntry={!showPassword}
                  className="flex-1 py-3 px-3 text-white"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={18} 
                    color="#65657f" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-dark-300 text-sm font-medium mb-2">Confirmar contraseña</Text>
              <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={18} color="#65657f" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#65657f"
                  secureTextEntry={!showPassword}
                  className="flex-1 py-3 px-3 text-white"
                />
              </View>
              {password && confirmPassword && password !== confirmPassword && (
                <Text className="text-danger text-xs mt-1">Las contraseñas no coinciden</Text>
              )}
            </View>

            {/* Botón Registrar */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
              className={`
                py-4 rounded-xl items-center justify-center flex-row
                ${isLoading || !isFormValid ? 'bg-dark-700' : 'bg-primary-500'}
              `}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-lg mr-2">
                    Crear Cuenta
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Link a Login */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-dark-400">¿Ya tienes cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-semibold">Inicia sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

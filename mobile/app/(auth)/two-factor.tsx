/**
 * Pantalla de Verificación 2FA - App Móvil.
 */

import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function TwoFactorScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { verify2FA, isLoading, error, clearError } = useAuthStore();

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pastedCode = text.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    
    const success = await verify2FA(fullCode);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const isCodeComplete = code.every(c => c !== '');

  useEffect(() => {
    if (isCodeComplete) {
      handleVerify();
    }
  }, [code]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-dark-950"
    >
      <View className="flex-1 justify-center px-6 py-12">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-primary-500/20 items-center justify-center mb-4">
            <Ionicons name="shield-checkmark-outline" size={40} color="#0080ff" />
          </View>
          <Text className="text-3xl font-bold text-white">Verificación 2FA</Text>
          <Text className="text-dark-400 mt-2 text-center">
            Ingresa el código de 6 dígitos de tu app de autenticación
          </Text>
        </View>

        {/* Card */}
        <View className="bg-dark-900/80 rounded-3xl p-6 border border-dark-700">
          {/* Error */}
          {error && (
            <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text className="text-danger ml-2 flex-1">{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Code Inputs */}
          <View className="flex-row justify-between mb-6">
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={6}
                className="w-12 h-14 bg-dark-800 border border-dark-600 rounded-xl text-white text-2xl text-center font-bold"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Botón Verificar */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading || !isCodeComplete}
            className={`
              py-4 rounded-xl items-center justify-center flex-row
              ${isLoading || !isCodeComplete ? 'bg-dark-700' : 'bg-primary-500'}
            `}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg mr-2">
                  Verificar
                </Text>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Volver */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mt-4 py-3 items-center"
          >
            <Text className="text-dark-400">Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

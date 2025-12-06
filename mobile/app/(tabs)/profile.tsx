/**
 * Pantalla de Perfil - App Móvil.
 */

import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const MenuItem = ({ 
    icon, 
    label, 
    onPress, 
    danger = false 
  }: { 
    icon: string; 
    label: string; 
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-dark-700"
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
        danger ? 'bg-danger/20' : 'bg-dark-700'
      }`}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={danger ? '#ef4444' : '#0080ff'} 
        />
      </View>
      <Text className={`flex-1 font-medium ${danger ? 'text-danger' : 'text-white'}`}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#65657f" />
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-dark-950">
      <View className="p-4">
        {/* User Info Card */}
        <View className="bg-dark-900 rounded-2xl p-6 border border-dark-700 items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-dark-400 mt-1">{user?.email}</Text>
          <View className="mt-2 px-3 py-1 bg-primary-500/20 rounded-full">
            <Text className="text-primary-400 font-medium">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Personal'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700 mb-6">
          <Text className="text-dark-400 text-sm font-medium mb-2 uppercase">
            Cuenta
          </Text>
          <MenuItem 
            icon="person-outline" 
            label="Editar Perfil" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="lock-closed-outline" 
            label="Cambiar Contraseña" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="shield-checkmark-outline" 
            label="Autenticación 2FA" 
            onPress={() => {}} 
          />
        </View>

        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700 mb-6">
          <Text className="text-dark-400 text-sm font-medium mb-2 uppercase">
            Preferencias
          </Text>
          <MenuItem 
            icon="notifications-outline" 
            label="Notificaciones" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="language-outline" 
            label="Idioma" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="moon-outline" 
            label="Tema" 
            onPress={() => {}} 
          />
        </View>

        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700 mb-6">
          <Text className="text-dark-400 text-sm font-medium mb-2 uppercase">
            Soporte
          </Text>
          <MenuItem 
            icon="help-circle-outline" 
            label="Centro de Ayuda" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="document-text-outline" 
            label="Términos y Condiciones" 
            onPress={() => {}} 
          />
          <MenuItem 
            icon="information-circle-outline" 
            label="Acerca de" 
            onPress={() => {}} 
          />
        </View>

        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700">
          <MenuItem 
            icon="log-out-outline" 
            label="Cerrar Sesión" 
            onPress={handleLogout}
            danger
          />
        </View>

        {/* Version */}
        <Text className="text-dark-500 text-center mt-6 mb-4">
          InventoryPro v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

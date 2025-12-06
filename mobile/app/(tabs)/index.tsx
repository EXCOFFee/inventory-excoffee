/**
 * Dashboard - Pantalla principal de la app móvil.
 * 
 * Muestra KPIs y resumen del inventario.
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { reportsService } from '../../src/api/reports.service';

export default function DashboardScreen() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsService.getDashboardStats(),
  });

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-dark-900 rounded-2xl p-4 flex-1 mx-1 border border-dark-700"
      style={{
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="text-dark-400 text-sm mt-1">{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      className="flex-1 bg-dark-950"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#0080ff"
        />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white">Dashboard</Text>
          <Text className="text-dark-400 mt-1">Resumen del inventario</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-4">
          <StatCard
            title="Productos"
            value={stats?.totalProducts || 0}
            icon="cube-outline"
            color="#0080ff"
            onPress={() => router.push('/(tabs)/products')}
          />
          <StatCard
            title="Stock Bajo"
            value={stats?.lowStockCount || 0}
            icon="warning-outline"
            color="#f59e0b"
          />
        </View>

        <View className="flex-row mb-6">
          <StatCard
            title="Mov. Hoy"
            value={stats?.todayMovements || 0}
            icon="swap-horizontal-outline"
            color="#10b981"
            onPress={() => router.push('/(tabs)/movements')}
          />
          <StatCard
            title="Valor Total"
            value={`$${(stats?.inventoryValue || 0).toLocaleString()}`}
            icon="cash-outline"
            color="#a855f7"
          />
        </View>

        {/* Alertas de Stock Bajo */}
        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-white">Alertas de Stock</Text>
            <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
          </View>
          
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
            stats.lowStockProducts.slice(0, 5).map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => router.push(`/product/${product.id}`)}
                className="flex-row items-center py-3 border-b border-dark-700 last:border-0"
              >
                <View className="w-10 h-10 rounded-xl bg-warning/20 items-center justify-center mr-3">
                  <Ionicons name="cube" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{product.name}</Text>
                  <Text className="text-dark-400 text-sm">SKU: {product.sku}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-warning font-bold">{product.currentStock}</Text>
                  <Text className="text-dark-500 text-xs">/ {product.minStock} min</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center py-6">
              <Ionicons name="checkmark-circle" size={40} color="#10b981" />
              <Text className="text-dark-400 mt-2">Todo el stock está en orden</Text>
            </View>
          )}
        </View>

        {/* Acciones Rápidas */}
        <View className="bg-dark-900 rounded-2xl p-4 border border-dark-700">
          <Text className="text-lg font-bold text-white mb-4">Acciones Rápidas</Text>
          
          <View className="flex-row flex-wrap">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              className="w-1/2 p-2"
            >
              <View className="bg-primary-500/20 rounded-xl p-4 items-center">
                <Ionicons name="scan" size={28} color="#0080ff" />
                <Text className="text-white mt-2 font-medium">Escanear</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/movement/new')}
              className="w-1/2 p-2"
            >
              <View className="bg-success/20 rounded-xl p-4 items-center">
                <Ionicons name="add-circle" size={28} color="#10b981" />
                <Text className="text-white mt-2 font-medium">Movimiento</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

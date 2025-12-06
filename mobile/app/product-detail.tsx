/**
 * Pantalla de Detalle de Producto - App Móvil.
 */

import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '../src/api/products.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Error al eliminar producto');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de eliminar "${product?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const getStockStatus = () => {
    if (!product) return { color: '#65657f', label: 'Sin datos', bg: 'bg-dark-700' };
    
    const { currentStock, minStock, maxStock } = product;
    
    if (currentStock <= 0) {
      return { color: '#ef4444', label: 'Sin Stock', bg: 'bg-danger/20' };
    }
    if (currentStock <= minStock) {
      return { color: '#f59e0b', label: 'Stock Bajo', bg: 'bg-warning/20' };
    }
    if (maxStock && currentStock >= maxStock) {
      return { color: '#0080ff', label: 'Stock Máximo', bg: 'bg-primary-500/20' };
    }
    return { color: '#10b981', label: 'Stock OK', bg: 'bg-success/20' };
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0080ff" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-dark-400 mt-4">Producto no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary-500">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <View className="flex-1 bg-dark-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-dark-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#a0a0b2" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Detalle</Text>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => router.push(`/product-form?id=${id}`)} 
            className="p-2"
          >
            <Ionicons name="pencil-outline" size={22} color="#0080ff" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete} 
            disabled={deleteMutation.isPending}
            className="p-2 ml-2"
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch}
            tintColor="#0080ff"
          />
        }
      >
        {/* Hero Section */}
        <View className="px-4 py-6 bg-dark-900/50 border-b border-dark-800">
          <View className="flex-row items-start">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/20 items-center justify-center">
              <Ionicons name="cube-outline" size={32} color="#0080ff" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-white">{product.name}</Text>
              <Text className="text-dark-400 mt-1">SKU: {product.sku}</Text>
              {product.category && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="pricetag-outline" size={14} color="#65657f" />
                  <Text className="text-dark-400 text-sm ml-1">{product.category.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stock Card */}
        <View className="px-4 py-4">
          <View className="bg-dark-900/80 rounded-2xl p-4 border border-dark-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-dark-400 text-sm">Stock Actual</Text>
              <View className={`px-3 py-1 rounded-full ${stockStatus.bg}`}>
                <Text style={{ color: stockStatus.color }} className="text-xs font-medium">
                  {stockStatus.label}
                </Text>
              </View>
            </View>
            <Text className="text-5xl font-bold text-white text-center mb-4">
              {product.currentStock}
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-dark-400 text-xs">Mínimo</Text>
                <Text className="text-warning font-semibold">{product.minStock || '-'}</Text>
              </View>
              <View className="w-px bg-dark-700" />
              <View className="items-center">
                <Text className="text-dark-400 text-xs">Máximo</Text>
                <Text className="text-primary-400 font-semibold">{product.maxStock || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 py-2">
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              onPress={() => router.push(`/movement-form?productId=${id}&sku=${product.sku}`)}
              className="flex-1 bg-success/20 border border-success/30 rounded-xl py-4 items-center flex-row justify-center"
            >
              <Ionicons name="arrow-down-circle" size={20} color="#10b981" />
              <Text className="text-success font-medium ml-2">Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push(`/movement-form?productId=${id}&sku=${product.sku}`)}
              className="flex-1 bg-danger/20 border border-danger/30 rounded-xl py-4 items-center flex-row justify-center"
            >
              <Ionicons name="arrow-up-circle" size={20} color="#ef4444" />
              <Text className="text-danger font-medium ml-2">Salida</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details */}
        <View className="px-4 py-4">
          <Text className="text-white font-semibold mb-3">Información</Text>
          <View className="bg-dark-900/80 rounded-2xl border border-dark-700 overflow-hidden">
            {product.description && (
              <View className="px-4 py-3 border-b border-dark-700">
                <Text className="text-dark-400 text-xs mb-1">Descripción</Text>
                <Text className="text-white">{product.description}</Text>
              </View>
            )}
            {product.price !== null && product.price !== undefined && (
              <View className="px-4 py-3 border-b border-dark-700 flex-row justify-between">
                <Text className="text-dark-400">Precio</Text>
                <Text className="text-success font-semibold">
                  ${product.price.toFixed(2)}
                </Text>
              </View>
            )}
            {product.location && (
              <View className="px-4 py-3 border-b border-dark-700 flex-row justify-between">
                <Text className="text-dark-400">Ubicación</Text>
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#65657f" />
                  <Text className="text-white ml-1">{product.location}</Text>
                </View>
              </View>
            )}
            <View className="px-4 py-3 flex-row justify-between">
              <Text className="text-dark-400">Creado</Text>
              <Text className="text-white">
                {new Date(product.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Value Summary */}
        <View className="px-4 py-4 mb-8">
          <View className="bg-gradient-to-r from-primary-500/20 to-accent-purple/20 rounded-2xl p-4 border border-primary-500/30">
            <Text className="text-dark-400 text-sm">Valor del Inventario</Text>
            <Text className="text-3xl font-bold text-white mt-1">
              ${((product.price || 0) * product.currentStock).toFixed(2)}
            </Text>
            <Text className="text-dark-400 text-xs mt-1">
              {product.currentStock} unidades × ${(product.price || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

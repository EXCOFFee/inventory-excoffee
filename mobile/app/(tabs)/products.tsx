/**
 * Pantalla de Lista de Productos - App Móvil.
 * 
 * Lista productos con búsqueda y filtros.
 */

import { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { productsService } from '../../src/api/products.service';

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['products', search, showLowStock],
    queryFn: () => productsService.getAll({ 
      search, 
      lowStock: showLowStock,
      page: 1,
      limit: 50,
    }),
  });

  const products = data?.data || [];

  const renderProduct = ({ item }: { item: any }) => {
    const isLowStock = item.currentStock <= (item.minStock || 0);
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/product-detail?id=${item.id}`)}
        className="bg-dark-900 rounded-2xl p-4 mb-3 border border-dark-700 mx-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View className="flex-row items-start">
          <View className="w-14 h-14 rounded-xl bg-primary-500/20 items-center justify-center mr-4">
            <Ionicons name="cube" size={28} color="#0080ff" />
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-dark-400 text-sm mt-1">SKU: {item.sku}</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-dark-700 rounded-lg px-2 py-1 mr-2">
                <Text className="text-dark-300 text-xs">{item.category?.name || 'Sin categoría'}</Text>
              </View>
              {isLowStock && (
                <View className="bg-warning/20 rounded-lg px-2 py-1 flex-row items-center">
                  <Ionicons name="warning" size={12} color="#f59e0b" />
                  <Text className="text-warning text-xs ml-1">Stock bajo</Text>
                </View>
              )}
            </View>
          </View>
          
          <View className="items-end">
            <Text className="text-white font-bold text-lg">
              ${(item.price || item.unitPrice || 0).toFixed(2)}
            </Text>
            <Text className={`text-sm mt-1 ${isLowStock ? 'text-warning' : 'text-success'}`}>
              Stock: {item.currentStock}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Search Bar */}
      <View className="p-4 pb-2">
        <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
          <Ionicons name="search" size={20} color="#65657f" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar productos..."
            placeholderTextColor="#65657f"
            className="flex-1 py-3 px-3 text-white"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#65657f" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Chips */}
        <View className="flex-row mt-3">
          <TouchableOpacity
            onPress={() => setShowLowStock(!showLowStock)}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
              showLowStock ? 'bg-warning' : 'bg-dark-700'
            }`}
          >
            <Ionicons 
              name="warning-outline" 
              size={16} 
              color={showLowStock ? '#000' : '#fff'} 
            />
            <Text className={`ml-1 font-medium ${showLowStock ? 'text-black' : 'text-white'}`}>
              Stock bajo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0080ff" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="cube-outline" size={60} color="#3a3a50" />
          <Text className="text-dark-400 text-lg mt-4">No se encontraron productos</Text>
          <Text className="text-dark-500 text-center mt-2">
            {search ? 'Intenta con otro término de búsqueda' : 'Aún no hay productos registrados'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0080ff"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/product-form')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full items-center justify-center"
        style={{
          shadowColor: '#0080ff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

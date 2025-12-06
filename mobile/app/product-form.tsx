/**
 * Pantalla de Crear/Editar Producto - App Móvil.
 */

import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '../src/api/products.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    minStock: '',
    maxStock: '',
    location: '',
  });

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category?.name || '',
        price: product.price?.toString() || '',
        minStock: product.minStock?.toString() || '',
        maxStock: product.maxStock?.toString() || '',
        location: product.location || '',
      });
    }
  }, [product]);

  const createMutation = useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear producto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Error al actualizar producto');
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.sku) {
      Alert.alert('Error', 'Nombre y SKU son requeridos');
      return;
    }

    const price = formData.price ? parseFloat(formData.price) : 0;
    const minStock = formData.minStock ? parseInt(formData.minStock) : 0;

    const data = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description || undefined,
      categoryId: undefined,
      price,
      minStock,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingProduct) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0080ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-dark-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#a0a0b2" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={isLoading}
          className="p-2"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0080ff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#0080ff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Nombre *</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nombre del producto"
            placeholderTextColor="#65657f"
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
          />
        </View>

        {/* SKU */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">SKU *</Text>
          <TextInput
            value={formData.sku}
            onChangeText={(text) => setFormData({ ...formData, sku: text.toUpperCase() })}
            placeholder="PRD-001"
            placeholderTextColor="#65657f"
            autoCapitalize="characters"
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
          />
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Descripción</Text>
          <TextInput
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Descripción del producto"
            placeholderTextColor="#65657f"
            multiline
            numberOfLines={3}
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white min-h-[80px]"
            textAlignVertical="top"
          />
        </View>

        {/* Categoría */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Categoría</Text>
          <TextInput
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
            placeholder="Electrónica, Ropa, etc."
            placeholderTextColor="#65657f"
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
          />
        </View>

        {/* Precio */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Precio</Text>
          <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
            <Text className="text-dark-400">$</Text>
            <TextInput
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
              placeholder="0.00"
              placeholderTextColor="#65657f"
              keyboardType="decimal-pad"
              className="flex-1 py-3 px-2 text-white"
            />
          </View>
        </View>

        {/* Stock Mínimo y Máximo */}
        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1">
            <Text className="text-dark-300 text-sm font-medium mb-2">Stock Mín.</Text>
            <TextInput
              value={formData.minStock}
              onChangeText={(text) => setFormData({ ...formData, minStock: text.replace(/[^0-9]/g, '') })}
              placeholder="0"
              placeholderTextColor="#65657f"
              keyboardType="number-pad"
              className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
            />
          </View>
          <View className="flex-1">
            <Text className="text-dark-300 text-sm font-medium mb-2">Stock Máx.</Text>
            <TextInput
              value={formData.maxStock}
              onChangeText={(text) => setFormData({ ...formData, maxStock: text.replace(/[^0-9]/g, '') })}
              placeholder="100"
              placeholderTextColor="#65657f"
              keyboardType="number-pad"
              className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
            />
          </View>
        </View>

        {/* Ubicación */}
        <View className="mb-6">
          <Text className="text-dark-300 text-sm font-medium mb-2">Ubicación</Text>
          <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
            <Ionicons name="location-outline" size={18} color="#65657f" />
            <TextInput
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Almacén A, Estante 1"
              placeholderTextColor="#65657f"
              className="flex-1 py-3 px-2 text-white"
            />
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`
            py-4 rounded-xl items-center justify-center flex-row mb-8
            ${isLoading ? 'bg-dark-700' : 'bg-primary-500'}
          `}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                {isEditing ? 'Actualizar' : 'Crear Producto'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

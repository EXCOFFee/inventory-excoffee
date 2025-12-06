/**
 * Pantalla de Crear Movimiento - App Móvil.
 */

import { useState } from 'react';
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
import { movementsService, MovementType } from '../src/api/movements.service';
import { productsService } from '../src/api/products.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MovementFormScreen() {
  const { productId, sku } = useLocalSearchParams<{ productId?: string; sku?: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    productSku: sku || '',
    type: 'IN' as MovementType,
    quantity: '',
    reason: '',
    notes: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const movementTypes: { value: MovementType; label: string; icon: string; color: string }[] = [
    { value: 'IN', label: 'Entrada', icon: 'arrow-down-circle', color: '#10b981' },
    { value: 'OUT', label: 'Salida', icon: 'arrow-up-circle', color: '#ef4444' },
  ];

  // Buscar producto por SKU
  const searchProduct = async () => {
    if (!formData.productSku) return;
    
    try {
      const products = await productsService.getAll({ search: formData.productSku });
      const product = products.data?.find((p: any) => p.sku === formData.productSku);
      if (product) {
        setSelectedProduct(product);
      } else {
        Alert.alert('Producto no encontrado', 'Verifica el SKU ingresado');
        setSelectedProduct(null);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
  };

  const createMutation = useMutation({
    mutationFn: movementsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Éxito', 'Movimiento registrado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear movimiento');
    },
  });

  const handleSubmit = () => {
    if (!formData.productSku || !formData.quantity) {
      Alert.alert('Error', 'SKU del producto y cantidad son requeridos');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número positivo');
      return;
    }

    createMutation.mutate({
      productSku: formData.productSku,
      type: formData.type,
      quantity,
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <View className="flex-1 bg-dark-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-dark-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#a0a0b2" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Nuevo Movimiento</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={createMutation.isPending}
          className="p-2"
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#0080ff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#0080ff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Tipo de Movimiento */}
        <View className="mb-6">
          <Text className="text-dark-300 text-sm font-medium mb-3">Tipo de Movimiento</Text>
          <View className="flex-row flex-wrap gap-2">
            {movementTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setFormData({ ...formData, type: type.value })}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  formData.type === type.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-800'
                }`}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={formData.type === type.value ? type.color : '#65657f'} 
                />
                <Text className={`ml-2 ${
                  formData.type === type.value ? 'text-white' : 'text-dark-400'
                }`}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SKU del Producto */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">SKU del Producto *</Text>
          <View className="flex-row items-center space-x-2">
            <View className="flex-1 flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
              <Ionicons name="barcode-outline" size={18} color="#65657f" />
              <TextInput
                value={formData.productSku}
                onChangeText={(text) => {
                  setFormData({ ...formData, productSku: text.toUpperCase() });
                  setSelectedProduct(null);
                }}
                placeholder="PRD-001"
                placeholderTextColor="#65657f"
                autoCapitalize="characters"
                className="flex-1 py-3 px-2 text-white"
                onBlur={searchProduct}
              />
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/scan')}
              className="p-3 bg-dark-800 border border-dark-600 rounded-xl"
            >
              <Ionicons name="scan-outline" size={22} color="#0080ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Producto Seleccionado */}
        {selectedProduct && (
          <View className="mb-4 p-4 bg-dark-800/50 border border-dark-600 rounded-xl">
            <Text className="text-white font-medium">{selectedProduct.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-dark-400 text-sm">Stock actual: </Text>
              <Text className="text-primary-400 font-semibold">{selectedProduct.currentStock}</Text>
            </View>
          </View>
        )}

        {/* Cantidad */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Cantidad *</Text>
          <View className="flex-row items-center bg-dark-800 border border-dark-600 rounded-xl px-4">
            <Ionicons name="cube-outline" size={18} color="#65657f" />
            <TextInput
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text.replace(/[^0-9]/g, '') })}
              placeholder="0"
              placeholderTextColor="#65657f"
              keyboardType="number-pad"
              className="flex-1 py-3 px-2 text-white text-lg"
            />
          </View>
        </View>

        {/* Motivo */}
        <View className="mb-4">
          <Text className="text-dark-300 text-sm font-medium mb-2">Motivo</Text>
          <TextInput
            value={formData.reason}
            onChangeText={(text) => setFormData({ ...formData, reason: text })}
            placeholder="Compra, Venta, Ajuste de inventario..."
            placeholderTextColor="#65657f"
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white"
          />
        </View>

        {/* Notas */}
        <View className="mb-6">
          <Text className="text-dark-300 text-sm font-medium mb-2">Notas adicionales</Text>
          <TextInput
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Observaciones..."
            placeholderTextColor="#65657f"
            multiline
            numberOfLines={3}
            className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white min-h-[80px]"
            textAlignVertical="top"
          />
        </View>

        {/* Resumen */}
        <View className="mb-6 p-4 bg-dark-800/50 border border-dark-600 rounded-xl">
          <Text className="text-dark-400 text-sm mb-2">Resumen del movimiento:</Text>
          <View className="flex-row items-center">
            <Ionicons 
              name={movementTypes.find(t => t.value === formData.type)?.icon as any} 
              size={24} 
              color={movementTypes.find(t => t.value === formData.type)?.color} 
            />
            <Text className="text-white ml-2">
              {movementTypes.find(t => t.value === formData.type)?.label}: {' '}
              <Text className="font-bold">{formData.quantity || '0'}</Text> unidades
            </Text>
          </View>
          {selectedProduct && (
            <Text className="text-dark-400 text-sm mt-2">
              Stock resultante: {' '}
              <Text className="text-primary-400 font-semibold">
                {formData.type === 'IN' 
                  ? selectedProduct.currentStock + (parseInt(formData.quantity) || 0)
                  : formData.type === 'OUT'
                  ? selectedProduct.currentStock - (parseInt(formData.quantity) || 0)
                  : '?'}
              </Text>
            </Text>
          )}
        </View>

        {/* Botón Registrar */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className={`
            py-4 rounded-xl items-center justify-center flex-row mb-8
            ${createMutation.isPending ? 'bg-dark-700' : 'bg-primary-500'}
          `}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Registrar Movimiento
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

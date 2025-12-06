/**
 * Pantalla de Movimientos - App Móvil.
 */

import { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { movementsService } from '../../src/api/movements.service';
import { formatDate, formatTime } from '../../src/utils/formatters';

export default function MovementsScreen() {
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['movements', filter],
    queryFn: () => movementsService.getAll({ 
      type: filter === 'ALL' ? undefined : filter,
      page: 1,
      limit: 50,
    }),
  });

  const movements = data?.data || [];

  const renderMovement = ({ item }: { item: any }) => {
    const isEntry = item.type === 'ENTRY';
    
    return (
      <View className="bg-dark-900 rounded-2xl p-4 mb-3 border border-dark-700 mx-4">
        <View className="flex-row items-start">
          <View 
            className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
              isEntry ? 'bg-success/20' : 'bg-danger/20'
            }`}
          >
            <Ionicons 
              name={isEntry ? 'arrow-down' : 'arrow-up'} 
              size={24} 
              color={isEntry ? '#10b981' : '#ef4444'} 
            />
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-semibold" numberOfLines={1}>
              {item.product?.name || 'Producto'}
            </Text>
            <Text className="text-dark-400 text-sm mt-1">
              {item.reason} • {item.user?.firstName} {item.user?.lastName}
            </Text>
            <Text className="text-dark-500 text-xs mt-1">
              {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
            </Text>
          </View>
          
          <View className="items-end">
            <Text className={`text-lg font-bold ${isEntry ? 'text-success' : 'text-danger'}`}>
              {isEntry ? '+' : '-'}{item.quantity}
            </Text>
            <Text className="text-dark-500 text-xs mt-1">unidades</Text>
          </View>
        </View>
        
        {item.notes && (
          <View className="mt-3 pt-3 border-t border-dark-700">
            <Text className="text-dark-400 text-sm">{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const FilterButton = ({ 
    label, 
    value, 
    icon 
  }: { 
    label: string; 
    value: 'ALL' | 'IN' | 'OUT'; 
    icon: string;
  }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
        filter === value ? 'bg-primary-500' : 'bg-dark-700'
      }`}
    >
      <Ionicons name={icon as any} size={16} color="white" />
      <Text className="text-white ml-1 font-medium">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-dark-950">
      {/* Filtros */}
      <View className="p-4 pb-2 flex-row">
        <FilterButton label="Todos" value="ALL" icon="list-outline" />
        <FilterButton label="Entradas" value="IN" icon="arrow-down" />
        <FilterButton label="Salidas" value="OUT" icon="arrow-up" />
      </View>

      {/* Lista */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0080ff" />
        </View>
      ) : movements.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="swap-horizontal-outline" size={60} color="#3a3a50" />
          <Text className="text-dark-400 text-lg mt-4">Sin movimientos</Text>
          <Text className="text-dark-500 text-center mt-2">
            No hay movimientos registrados
          </Text>
        </View>
      ) : (
        <FlatList
          data={movements}
          renderItem={renderMovement}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0080ff"
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/movement-form')}
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

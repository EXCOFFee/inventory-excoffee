/**
 * Pantalla de Escaneo de Código de Barras.
 * 
 * Usa la cámara para escanear códigos de barras/QR.
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { productsService } from '../../src/api/products.service';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-dark-950" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center p-6">
        <Ionicons name="camera-outline" size={80} color="#3a3a50" />
        <Text className="text-white text-xl font-bold mt-6 text-center">
          Se necesita acceso a la cámara
        </Text>
        <Text className="text-dark-400 text-center mt-2 mb-6">
          Para escanear códigos de barras, necesitamos acceso a tu cámara
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Permitir acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Buscar producto por código de barras
      const product = await productsService.getByBarcode(data);
      
      if (product) {
        router.push(`/product/${product.id}`);
      } else {
        Alert.alert(
          'Producto no encontrado',
          `No se encontró ningún producto con el código: ${data}`,
          [
            { text: 'Escanear otro', onPress: () => setScanned(false) },
            { text: 'Crear producto', onPress: () => {
              // Navegar a crear producto con el código pre-llenado
              router.push({
                pathname: '/product/new',
                params: { barcode: data },
              });
            }},
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Ocurrió un error al buscar el producto',
        [{ text: 'Reintentar', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code39',
            'code128',
            'codabar',
            'itf14',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay con guías de escaneo */}
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-black/50">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Escanear Código</Text>
          
          <TouchableOpacity
            onPress={() => setFlashOn(!flashOn)}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              flashOn ? 'bg-warning' : 'bg-white/20'
            }`}
          >
            <Ionicons 
              name={flashOn ? 'flash' : 'flash-outline'} 
              size={24} 
              color={flashOn ? 'black' : 'white'} 
            />
          </TouchableOpacity>
        </View>

        {/* Área de escaneo */}
        <View className="flex-1 items-center justify-center">
          <View className="w-72 h-72 relative">
            {/* Esquinas del visor */}
            <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary-500 rounded-tl-xl" />
            <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary-500 rounded-tr-xl" />
            <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary-500 rounded-bl-xl" />
            <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary-500 rounded-br-xl" />
            
            {/* Línea de escaneo animada */}
            <View 
              className="absolute left-4 right-4 h-0.5 bg-primary-500"
              style={{ top: '50%' }}
            />
          </View>
        </View>

        {/* Footer */}
        <View className="p-6 bg-black/70">
          <Text className="text-white text-center text-lg mb-2">
            Apunta la cámara al código de barras
          </Text>
          <Text className="text-dark-400 text-center text-sm">
            Soporta EAN, UPC, QR, Code128 y más
          </Text>
          
          {scanned && (
            <TouchableOpacity
              onPress={() => setScanned(false)}
              className="mt-4 bg-primary-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Escanear otro</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

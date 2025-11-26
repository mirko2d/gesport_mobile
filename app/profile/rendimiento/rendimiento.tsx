import { Activity, Timer, TrendingUp } from 'lucide-react-native';
import { default as React, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import AppShell from '../../components/AppShell';
import Card from '../../components/ui/Card';

// Mock performance data for marathon segments
const marathonData = [
  { km: 0, time: '00:00', pace: '05:30', label: 'Start' },
  { km: 5, time: '28:15', pace: '05:40', label: '5K' },
  { km: 10, time: '56:30', pace: '05:35', label: '10K' },
  { km: 15, time: '85:45', pace: '05:50', label: '15K' },
  { km: 20, time: '115:20', pace: '06:00', label: '20K' },
  { km: 25, time: '145:10', pace: '06:10', label: '25K' },
  { km: 30, time: '175:30', pace: '06:05', label: '30K' },
  { km: 35, time: '205:45', pace: '06:15', label: '35K' },
  { km: 40, time: '236:20', pace: '06:20', label: '40K' },
  { km: 42.2, time: '250:00', pace: '06:30', label: 'Finish' },
];

// Generate heatmap data based on pace (faster pace = better performance)
const generateHeatmapData = () => {
  return marathonData.map((segment, index) => {
    // Convert pace to seconds for comparison (faster = lower seconds)
    const paceParts = segment.pace.split(':');
    const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1]);
    
    // Determine color intensity based on pace
    // Best pace (4:30) = green, worst pace (7:00) = red
    const bestPace = 4 * 60 + 30; // 4:30
    const worstPace = 7 * 60; // 7:00
    
    // Normalize between 0 (best) and 1 (worst)
    const normalized = Math.min(1, Math.max(0, (paceSeconds - bestPace) / (worstPace - bestPace)));
    
    // Color scale: green (0) to yellow (0.5) to red (1)
    let color;
    if (normalized < 0.5) {
      // Green to yellow
      const intensity = normalized * 2;
      const green = 255;
      const red = Math.floor(255 * intensity);
      color = `rgb(${red}, ${green}, 0)`;
    } else {
      // Yellow to red
      const intensity = (normalized - 0.5) * 2;
      const green = Math.floor(255 * (1 - intensity));
      const red = 255;
      color = `rgb(${red}, ${green}, 0)`;
    }
    
    return {
      ...segment,
      color,
      performance: 1 - normalized // Performance score (0 to 1)
    };
  });
};

const heatmapData = generateHeatmapData();

// Data for charts
const paceChartData = marathonData.map(item => ({
  value: parseFloat(item.pace.split(':')[0]) + parseFloat(item.pace.split(':')[1]) / 60,
  label: item.label,
}));

const performanceSummary = {
  totalTime: '4h 10m',
  avgPace: '5:55 min/km',
  bestSegment: '0-5K',
  bestPace: '5:30 min/km',
  worstSegment: '20-25K',
  worstPace: '6:10 min/km',
};

const costaneraRoute = [
  { latitude: -26.1820, longitude: -58.1750 },
  { latitude: -26.1835, longitude: -58.1745 },
  { latitude: -26.1850, longitude: -58.1735 },
  { latitude: -26.1865, longitude: -58.1740 },
  { latitude: -26.1875, longitude: -58.1755 },
  { latitude: -26.1870, longitude: -58.1770 },
  { latitude: -26.1855, longitude: -58.1765 },
];

// Mock global participants (clasificación)
const participants = [
  { name: 'Juan Pérez', time: '45:23', position: 1, dorsal: 101 },
  { name: 'María García', time: '46:12', position: 2, dorsal: 245 },
  { name: 'Carlos López', time: '47:05', position: 3, dorsal: 387 },
  { name: 'Ana Martínez', time: '48:30', position: 4, dorsal: 523 },
  { name: 'Pedro Ruiz', time: '49:15', position: 5, dorsal: 654 },
];

export default function PerformanceScreen() {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const heatPoints = useMemo(() => {
    return costaneraRoute.map((pt, idx) => {
      const density = Math.ceil((participants.length / costaneraRoute.length) * (idx + 1));
      return { lat: pt.latitude, lng: pt.longitude, count: density };
    });
  }, []);
  const maxHeatCount = useMemo(() => heatPoints.reduce((m, p) => (p.count > m ? p.count : m), 0), [heatPoints]);
  const heatColor = (count: number) => {
    if (maxHeatCount <= 1) return 'rgba(255,0,0,0.5)';
    const r = count / maxHeatCount;
    if (r < 0.25) return 'rgba(0,0,255,0.35)';
    if (r < 0.5) return 'rgba(0,255,255,0.45)';
    if (r < 0.75) return 'rgba(255,165,0,0.55)';
    return 'rgba(255,0,0,0.65)';
  };
  const centerLat = costaneraRoute.reduce((sum, p) => sum + p.latitude, 0) / costaneraRoute.length;
  const centerLon = costaneraRoute.reduce((sum, p) => sum + p.longitude, 0) / costaneraRoute.length;
  return (
    <AppShell showBack title="Mi Rendimiento">
      <ScrollView className="flex-1 px-4 py-6 bg-white">
        {/* Performance Summary Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <Card className="mb-4 w-[48%]">
            <View className="flex-row items-center mb-2">
              <Timer color="#000000" size={20} />
              <Text className="font-bold text-gray-800 ml-2">Tiempo Total</Text>
            </View>
            <Text className="text-2xl font-bold text-primary">{performanceSummary.totalTime}</Text>
          </Card>

          <Card className="mb-4 w-[48%]">
            <View className="flex-row items-center mb-2">
              <TrendingUp color="#10B981" size={20} />
              <Text className="font-bold text-gray-800 ml-2">Ritmo Prom.</Text>
            </View>
            <Text className="text-2xl font-bold text-green-600">{performanceSummary.avgPace}</Text>
          </Card>

          <Card className="mb-4 w-[48%]">
            <View className="flex-row items-center mb-2">
              <Activity color="#8B5CF6" size={20} />
              <Text className="font-bold text-gray-800 ml-2">Mejor Segmento</Text>
            </View>
            <Text className="text-lg font-bold text-purple-600">{performanceSummary.bestSegment}</Text>
            <Text className="text-gray-600">{performanceSummary.bestPace}</Text>
          </Card>

          <Card className="mb-4 w-[48%]">
            <View className="flex-row items-center mb-2">
              <Activity color="#EF4444" size={20} />
              <Text className="font-bold text-gray-800 ml-2">Peor Segmento</Text>
            </View>
            <Text className="text-lg font-bold text-red-600">{performanceSummary.worstSegment}</Text>
            <Text className="text-gray-600">{performanceSummary.worstPace}</Text>
          </Card>
        </View>

        {/* Heatmap Visualization */}
        <Card className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Mapa de Calor del Recorrido</Text>
          
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Mejor Rendimiento</Text>
              <Text className="text-gray-600">Peor Rendimiento</Text>
            </View>
            
            <View className="flex-row h-8 rounded-full overflow-hidden mb-4">
              <View className="flex-1 bg-green-500"></View>
              <View className="flex-1 bg-green-300"></View>
              <View className="flex-1 bg-yellow-300"></View>
              <View className="flex-1 bg-orange-300"></View>
              <View className="flex-1 bg-red-500"></View>
            </View>
          </View>
          
          {/* Heatmap segments */}
          <View className="flex-row flex-wrap gap-2">
            {heatmapData.map((segment, index) => (
              <View 
                key={index} 
                className="flex-1 min-w-[30%] items-center py-3 rounded-lg"
                style={{ backgroundColor: segment.color }}
              >
                <Text className="font-bold text-gray-800">{segment.km}K</Text>
                <Text className="text-xs text-gray-700">{segment.pace}</Text>
              </View>
            ))}
          </View>
          
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-gray-600 text-sm">
              El mapa de calor muestra tu ritmo en cada segmento del recorrido. 
              Las zonas verdes indican buen rendimiento, mientras que las rojas 
              muestran donde puedes mejorar.
            </Text>
          </View>
        </Card>

        {/* Pace Chart */}
        <Card className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Ritmo por Segmento (min/km)</Text>
          <View className="h-64">
            <LineChart
              areaChart
              data={paceChartData}
              width={300}
              height={250}
              color="#000000"
              thickness={3}
              spacing={40}
              startFillColor="rgba(0, 0, 0, 0.3)"
              endFillColor="rgba(0, 0, 0, 0.1)"
              startOpacity={0.9}
              endOpacity={0.2}
              hideRules
              hideYAxisText
              xAxisThickness={0}
              yAxisThickness={0}
              curved
              isAnimated
              animateOnDataChange
              animationDuration={1000}
              showScrollIndicator={false}
            />
          </View>
        </Card>

        {/* Detailed Performance Table */}
        <Card className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Detalle por Kilómetros</Text>
          <View className="flex-row bg-gray-100 py-2 rounded-t-lg">
            <Text className="flex-1 text-center font-bold text-gray-700">Km</Text>
            <Text className="flex-1 text-center font-bold text-gray-700">Tiempo</Text>
            <Text className="flex-1 text-center font-bold text-gray-700">Ritmo</Text>
          </View>
          
          {marathonData.map((segment, index) => (
            <View 
              key={index} 
              className={`flex-row py-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <Text className="flex-1 text-center text-gray-800">{segment.km}K</Text>
              <Text className="flex-1 text-center text-gray-800">{segment.time}</Text>
              <Text className="flex-1 text-center text-gray-800">{segment.pace}</Text>
            </View>
          ))}
        </Card>

        {/* Global Results (Clasificación + Mapa) */}
        <Card className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Resultados Globales</Text>

          <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: centerLat,
                longitude: centerLon,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              scrollEnabled={false}
            >
              {!showHeatmap && (
                <Polyline coordinates={costaneraRoute} strokeColor="#111" strokeWidth={4} />
              )}
              {showHeatmap && heatPoints.map((hp, i) => (
                <Circle
                  key={i}
                  center={{ latitude: hp.lat, longitude: hp.lng }}
                  radius={10 + (hp.count / (maxHeatCount || 1)) * 25}
                  strokeColor="transparent"
                  fillColor={heatColor(hp.count)}
                />
              ))}
              <Marker coordinate={costaneraRoute[0]} title="Inicio" />
              <Marker coordinate={costaneraRoute[costaneraRoute.length - 1]} title="Meta" />
            </MapView>
          </View>
          <View className="flex-row justify-between mt-3 gap-2">
            <TouchableOpacity
              onPress={() => setShowHeatmap(false)}
              className={`flex-1 px-4 py-2 rounded-full border ${!showHeatmap ? 'bg-black border-black' : 'bg-white border-gray-300'}`}
            >
              <Text className={!showHeatmap ? 'text-white font-semibold text-center' : 'text-gray-800 font-semibold text-center'}>
                Ruta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHeatmap(true)}
              className={`flex-1 px-4 py-2 rounded-full border ${showHeatmap ? 'bg-black border-black' : 'bg-white border-gray-300'}`}
            >
              <Text className={showHeatmap ? 'text-white font-semibold text-center' : 'text-gray-800 font-semibold text-center'}>
                Mapa de calor
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-5">
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Participantes</Text>
                <Text className="font-extrabold text-gray-900">{participants.length}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Ganador</Text>
                <Text className="font-extrabold text-gray-900">{participants[0].name}</Text>
              </View>
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-extrabold text-gray-900 mb-3">Clasificación</Text>
            {participants.map((p) => (
              <View key={p.position} className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="bg-black rounded-full w-8 h-8 items-center justify-center">
                    <Text className="text-white font-bold text-sm">#{p.position}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{p.name}</Text>
                    <Text className="text-gray-500 text-xs">Dorsal: {p.dorsal}</Text>
                  </View>
                </View>
                <Text className="font-extrabold text-[#2C1810]">{p.time}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Performance Tips */}
  <View className="bg-white rounded-2xl p-4 mb-6 border border-brown/20">
          <Text className="text-lg font-bold text-coffee mb-2">Consejos para Mejorar</Text>
          <Text className="text-brown">
            • Tu ritmo se desaceleró en el kilómetro 20-25. Considera mejorar tu resistencia en esa zona.
          </Text>
          <Text className="text-brown mt-1">
            • Mantuviste un buen ritmo en los primeros 10K. ¡Excelente inicio!
          </Text>
          <Text className="text-brown mt-1">
            • La zona 30-35K muestra una leve recuperación. ¡Sigue así!
          </Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}
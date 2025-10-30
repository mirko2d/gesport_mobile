import { Activity, Timer, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
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

export default function PerformanceScreen() {
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
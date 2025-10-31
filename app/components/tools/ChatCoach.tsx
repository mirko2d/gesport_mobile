import { MessageCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Small decorative stripes like on the Historial cards
function Stripes({
  tint = 'rgba(255,255,255,0.08)',
  lines = 3,
  thickness = 4,
  gap = 10,
  rotate = '-18deg',
}: {
  tint?: string;
  lines?: number;
  thickness?: number;
  gap?: number;
  rotate?: string;
}) {
  return (
    <View style={{ position: 'absolute', top: -20, right: -50, transform: [{ rotate }], pointerEvents: 'none' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ height: thickness, width: 260, backgroundColor: tint, marginBottom: gap }} />
      ))}
    </View>
  );
}

function ruleBasedCoach(question: string): string {
  const q = question.toLowerCase();

  if (/(comer|alimento|desayuno|pre\s*entreno|antes de correr)/.test(q)) {
    return [
      'Antes de correr (2–3 h): prioriza carbohidratos fáciles (arroz, pasta, pan, fruta) + poca grasa/fibra; hidrátate bien.',
      '30–60 min antes (opcional): snack liviano (banana, tostada con miel o gel).',
      'Evita comidas muy pesadas o picantes. Prueba en entrenos, no estrenes el día de la carrera.'
    ].join('\n• ');
  }
  if (/(despu[eé]s|post\s*entreno|recuperaci[oó]n)/.test(q)) {
    return [
      'En la primera hora: 20–30 g de proteína + carbos (leche+cereal, yogur+cereal, sandwich de pavo, batido con fruta).',
      'Hidratación con agua; si el entreno fue largo/intenso, añade sales/electrolitos.',
      'Incluye algo de potasio y sodio (fruta, agua con sales).'
    ].join('\n• ');
  }
  if (/hidrat/.test(q)) {
    return [
      'Día a día: orina clara/amarillo pálido = buena referencia.',
      'Antes: 300–600 ml en la hora previa.',
      'Durante (>45–60 min): sorbos regulares; añade sales si hace calor o sudas mucho.',
      'Después: repón con agua y algo de sodio.'
    ].join('\n• ');
  }
  if (/(calent|warm[- ]?up)/.test(q)) {
    return [
      '5–10 min trote suave.',
      'Movilidad dinámica (tobillos, cadera, skipping, talones al glúteo).',
      'Progresivos (2–4 de 60–80 m) si harás trabajo de calidad.'
    ].join('\n• ');
  }
  if (/(ritmo|pace|km|min\/km)/.test(q)) {
    return [
      'Usa la Calculadora de Ritmo para estimar tu min/km según distancia y tiempo.',
      'Como guía: rodajes cómodos a RPE 5–6/10; series más rápidas con pausas controladas.'
    ].join('\n• ');
  }
  if (/(fuerza|gim|pesas)/.test(q)) {
    return [
      '2 sesiones/semana de fuerza total: sentadillas, zancadas, peso muerto rumano, core.',
      'Carga progresiva, técnica correcta y respeta 48 h entre estímulos fuertes.'
    ].join('\n• ');
  }
  if (/(lesi[oó]n|dolor|molestia)/.test(q)) {
    return [
      'Reduce o pausa el volumen si hay dolor agudo o persistente.',
      'Hielo/descanso según tolerancia. Si no mejora en 48–72 h, consulta profesional de salud.',
      'Refuerza técnica y fuerza para prevenir recaídas.'
    ].join('\n• ');
  }
  if (/(suplement|cafe[ií]na|gel|isot[oó]nico)/.test(q)) {
    return [
      'Cafeína (opcional): 3 mg/kg 45–60 min antes; prueba en entrenos.',
      'Geles/isotónicos: en tiradas >60–75 min, 30–60 g CHO/h, según tolerancia.',
      'Siempre ensaya en entrenamiento antes de competir.'
    ].join('\n• ');
  }

  return [
    'Cuéntame tu objetivo, nivel y contexto (distancia, clima, molestias).',
    'Puedo ayudarte con: nutrición pre/post, hidratación, calentamiento, ritmo y fuerza.',
    'Tip general: progresa poco a poco (10–15%/semana), prioriza consistencia y descanso.'
  ].join('\n• ');
}

export default function ChatCoach({ fullScreen = false }: { fullScreen?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'm0',
      role: 'assistant',
      content: 'Hola, soy tu coach. Pregúntame sobre nutrición, ritmo, hidratación o entrenamiento y te doy consejos prácticos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<ScrollView>(null);

  const canSend = input.trim().length > 0 && !loading;

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Small UX delay to emulate thinking
    setTimeout(() => {
      try {
        const answer = ruleBasedCoach(text);
        const botMsg: Msg = { id: `a-${Date.now()}`, role: 'assistant', content: answer };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      }
    }, 250);
  };

  const renderBubble = (item: Msg) => {
    const isUser = item.role === 'user';
    return (
      <View key={item.id} className={`mb-3 w-full ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`${isUser ? 'bg-white/90' : 'bg-white/10'} rounded-2xl px-4 py-3 max-w-[88%]`}>
          <Text className={`${isUser ? 'text-black' : 'text-white'}`}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const containerClass = fullScreen ? 'flex-1 bg-black px-4 py-4 relative overflow-hidden' : 'bg-black rounded-2xl p-4 relative overflow-hidden';

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: fullScreen ? 1 : undefined }}>
      <View className={containerClass}>
        <Stripes />
        <View className="flex-row items-center mb-3">
          <MessageCircle color="white" size={22} />
          <Text className="text-white text-xl font-extrabold ml-2">Chat Coach</Text>
        </View>

        <ScrollView
          ref={listRef}
          contentContainerStyle={{ paddingVertical: 4, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderBubble)}
        </ScrollView>

        <View className="mt-3">
          <View className="bg-white/10 rounded-xl px-3 py-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pregúntame qué comer antes, hidratación, ritmo, etc."
              placeholderTextColor="#cfcfcf"
              className="text-white min-h-[40px]"
              multiline
              onSubmitEditing={handleSend}
              blurOnSubmit
              returnKeyType="send"
            />
          </View>
          <View className="flex-row justify-end mt-3">
            <TouchableOpacity disabled={!canSend} onPress={handleSend} activeOpacity={0.9}>
              <View className={`px-4 py-2 rounded-full ${canSend ? 'bg-primary' : 'bg-white/20'}`}>
                <Text className="text-white font-semibold">Enviar</Text>
              </View>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View className="mt-2 flex-row items-center">
              <ActivityIndicator color="#fff" />
              <Text className="text-white/80 ml-2">Pensando…</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-white/60 text-xs mt-3">Consejos generales; ante dudas médicas, consulta a un profesional.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

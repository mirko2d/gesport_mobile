import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Card from '../../components/ui/Card';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const tick = () => {
    if (startRef.current == null) return;
    const now = Date.now();
    setElapsed(now - startRef.current);
  };

  const start = () => {
    if (running) return;
    const now = Date.now();
    startRef.current = now - elapsed; // soporte reanudar
    setRunning(true);
  timerRef.current = setInterval(tick, 1000);
  };

  const pause = () => {
    if (!running) return;
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    // stop updates by clearing start
    startRef.current = null;
  };

  const reset = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
    setElapsed(0);
  };

  useEffect(() => {
    return () => {
  if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Card className="mt-3 border border-gray-100">
      <Text className="text-[#2C1810] text-xl font-extrabold tracking-tight">Cronómetro</Text>
      <View className="items-center mt-3">
        <Text className="text-4xl font-extrabold tracking-wider">{formatTime(elapsed)}</Text>
        <View className="flex-row gap-x-3 mt-4">
          <TouchableOpacity onPress={start} className="bg-black px-5 py-3 rounded-full">
            <Text className="text-white font-semibold">Iniciar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pause} className="bg-gray-800 px-5 py-3 rounded-full">
            <Text className="text-white font-semibold">Pausar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} className="bg-gray-200 px-5 py-3 rounded-full">
            <Text className="text-gray-800 font-semibold">Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

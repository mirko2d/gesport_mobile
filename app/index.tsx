import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import {
    Activity,
    Calendar,
    ChevronDown,
    Clock,
    MapPin,
    Newspaper
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Image, ImageSourcePropType, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { listEvents, listNews, updateMe } from '../lib/api';
import { PAST_EDITIONS } from '../lib/editions';
import { SPONSORS, type SponsorItem } from '../lib/sponsors';
import AppShell from './components/AppShell';
import Button from './components/ui/Button';
import HowItWorksModal from './components/ui/HowItWorksModal';
import SectionTitle from './components/ui/SectionTitle';
import TermsModal from './components/ui/TermsModal';

// Setup LinearGradient for NativeWind
cssInterop(LinearGradient, {
  className: 'style',
});

const { width } = Dimensions.get('window');

// Simple reveal-on-scroll wrapper
function RevealOnScroll({
  children,
  scrollY,
  viewportHeight,
  offset = 100,
  delay = 0,
  direction = 'up', // 'up' | 'left' | 'right'
  baseY,
  distance = 40,
}: {
  children: React.ReactNode;
  scrollY: number;
  viewportHeight: number;
  offset?: number;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  baseY?: number;
  distance?: number;
}) {
  const [shown, setShown] = useState(false);
  const yRef = useRef(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set initial translation based on direction
    const initial = direction === 'up' ? distance : distance;
    const sign = direction === 'left' ? -1 : 1;
    if (direction === 'up') {
      translate.setValue(initial);
    } else {
      translate.setValue(initial * sign);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shown) return;
    const absY = (baseY ?? 0) + yRef.current;
    const trigger = scrollY + viewportHeight > absY - offset;
    if (trigger) {
      setShown(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translate, { toValue: 0, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [scrollY, viewportHeight, offset, delay, shown, opacity, translate, baseY]);

  return (
    <Animated.View
      onLayout={(e) => {
        // y relative to ScrollView content
        yRef.current = e.nativeEvent.layout.y;
      }}
      style={{
        opacity,
        transform: [direction === 'up' ? { translateY: translate } : { translateX: translate }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Simple diagonal stripes decoration (adidas-like)
function Stripes({
  tint = 'rgba(255,255,255,0.06)',
  lines = 3,
  thickness = 6,
  gap = 10,
  rotate = '-18deg',
  widthFactor = 0.9,
}: {
  tint?: string;
  lines?: number;
  thickness?: number;
  gap?: number;
  rotate?: string;
  widthFactor?: number;
}) {
  return (
    <View style={{ position: 'absolute', top: -20, right: -50, transform: [{ rotate }], pointerEvents: 'none' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ height: thickness, width: width * widthFactor, backgroundColor: tint, marginBottom: gap }} />
      ))}
    </View>
  );
}

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <View className="flex-row justify-between mb-6">
      <View className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 items-center mx-1">
        <Text className="text-2xl font-bold text-[#00E676]">{timeLeft.days}</Text>
        <Text className="text-sm uppercase tracking-wide mt-1 text-white">Días</Text>
      </View>
      <View className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 items-center mx-1">
        <Text className="text-2xl font-bold text-[#00E676]">{timeLeft.hours}</Text>
        <Text className="text-sm uppercase tracking-wide mt-1 text-white">Horas</Text>
      </View>
      <View className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 items-center mx-1">
        <Text className="text-2xl font-bold text-[#00E676]">{timeLeft.minutes}</Text>
        <Text className="text-sm uppercase tracking-wide mt-1 text-white">Min</Text>
      </View>
      <View className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 items-center mx-1">
        <Text className="text-2xl font-bold text-[#00E676]">{timeLeft.seconds}</Text>
        <Text className="text-sm uppercase tracking-wide mt-1 text-white">Seg</Text>
      </View>
    </View>
  );
}

// Sponsor Carousel Component
function toImageSource(logo: SponsorItem['logo']): ImageSourcePropType {
  if (typeof logo === 'string') {
    return { uri: logo } as any;
  }
  return logo as any;
}

function SponsorCarousel({ items = SPONSORS, autoPlayInterval = 2500 }: { items?: SponsorItem[]; autoPlayInterval?: number }) {
  const ITEM_WIDTH = 220;
  const SPACING = 20;
  const STEP = ITEM_WIDTH + SPACING;

  const n = items?.length ?? 0;
  const data = React.useMemo(() => (n > 0 ? [...items, ...items, ...items] : []), [n, items]);
  const startIndex = n; // arranca en la sección del medio para looping

  const listRef = React.useRef<FlatList>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [index, setIndex] = React.useState(startIndex);
  const didInit = React.useRef(false);

  // Posiciona al centro (sección del medio) sin animación al montar
  React.useEffect(() => {
    if (n === 0) return;
    if (!didInit.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: startIndex * STEP, animated: false });
        didInit.current = true;
      });
    }
  }, [n, startIndex, STEP]);

  // Autoplay infinito
  React.useEffect(() => {
    if (!n || n <= 1) return; // no autoplay si 0 o 1
    const id = setInterval(() => {
      const next = index + 1; // avanzamos dentro del arreglo extendido
      listRef.current?.scrollToOffset({ offset: next * STEP, animated: true });
      setIndex(next);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [index, n, autoPlayInterval, STEP]);

  const handleMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / STEP);
    let corrected = i;
    // Si salimos del rango de la sección del medio, corregimos sin animación
    if (i >= 2 * n) corrected = i - n;
    else if (i < n) corrected = i + n;

    if (corrected !== i) {
      listRef.current?.scrollToOffset({ offset: corrected * STEP, animated: false });
    }
    setIndex(corrected);
  };

  if (n === 0) return null;

  const activeDot = ((index % n) + n) % n; // normaliza para 0..n-1

  return (
    <View className="py-10">
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, i) => `${item.name}-${i}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={STEP}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index: i }) => {
          const inputRange = [
            (i - 1) * STEP,
            i * STEP,
            (i + 1) * STEP,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.95, 1, 0.95],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View style={{ width: ITEM_WIDTH, marginRight: SPACING, transform: [{ scale }], opacity }}>
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-white rounded-2xl items-center justify-center p-4 shadow-sm"
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <Image
                  source={toImageSource(item.logo)}
                  className="h-24 w-full"
                  resizeMode="contain"
                />
                <Text className="text-coffee font-semibold mt-3 text-base">{item.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />

      {/* Dots */}
      <View className="flex-row justify-center mt-3">
        {Array.from({ length: n }).map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-2 rounded-full ${i === activeDot ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </View>
    </View>
  );
}

// Edition Card Component
function EditionCard({ id, year, color, image, description }: { id: string; year: string; color: string; image: any; description?: string }) {
  return (
    <View className="flex-1 mb-4">
      <Link href={{ pathname: '/ediciones/[id]', params: { id } }} asChild>
        <TouchableOpacity activeOpacity={0.9} className="rounded-xl overflow-hidden shadow-lg">
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            className="h-48 w-full"
            resizeMode="cover"
          />
          <LinearGradient 
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']} 
            className="absolute bottom-0 left-0 right-0 p-4"
          >
            <Text className="text-white text-3xl font-extrabold">{year}</Text>
            <Text className="text-white/90 text-base mt-1">Ver detalles</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
      {/* Brief description + Ver más */}
      {description ? (
        <View className="mt-2">
          <Text className="text-coffee text-lg leading-7" numberOfLines={4}>
            {description}
          </Text>
          <View className="mt-1">
            <Link href="/ediciones/Index" asChild>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-primary text-lg font-semibold">Ver todas las ediciones</Text>
                <ChevronDown color="#000000" size={22} className="rotate-[-90deg] ml-1" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// (Avatar initials now handled by AppShell default)

export default function HomeScreen() {
  const router = useRouter();
  const { isAuth, user } = useAuth();
  const params = useLocalSearchParams<{ section?: string; from?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  // const [pendingScroll, setPendingScroll] = useState(false);
  // const contactPos = useRef<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const viewportHeight = Dimensions.get('window').height;
  // Base Y positions for full-screen sections
  const historialBaseY = useRef(0);
  const edicionesBaseY = useRef(0);
  const caracteristicasBaseY = useRef(0);
  const eventosBaseY = useRef(0);
  const herramientasBaseY = useRef(0);
  // const testimoniosBaseY = useRef(0);
  const sponsorsBaseY = useRef(0);
  // const noticiasBaseY = useRef(0);
  const [news, setNews] = useState<{ _id: string; title?: string; content?: string; imageUrl?: string; createdAt?: string; published?: boolean }[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{ _id: string; titulo: string; descripcion?: string; fecha?: string; lugar?: string; afiche?: string }>>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [nextEvent, setNextEvent] = useState<{ _id: string; titulo: string; descripcion?: string; fecha?: string; lugar?: string; afiche?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const editions = PAST_EDITIONS.map(e => ({
    id: e.id,
    year: e.year,
    color: 'bg-primary',
    image: e.image,
    description: e.description,
  }));

  const eventDate = nextEvent?.fecha ? new Date(nextEvent.fecha) : new Date();
  
  // If navigated with ?section=contacto, defer scroll until layout ready
  useEffect(() => {
    // Si es superadmin, redirigir a su panel minimalista, salvo cuando viene desde el footer a ver Noticias
    if (user?.role === 'superadmin' && params?.from !== 'footer') {
      router.replace('/admin/AdminProfile');
      return;
    }
    // if (params?.section === 'contacto') {
    //   setPendingScroll(true);
    // }
  }, [params?.section, params?.from, user?.role, router]);

  // Cargar últimas noticias (públicas)
  useEffect(() => {
    (async () => {
      try {
        setNewsLoading(true);
        const data: any[] = await listNews();
        const items = Array.isArray(data) ? data.filter((n) => n.published !== false) : [];
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setNews(items.slice(0, 3));
      } catch {
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    })();
  }, []);

  // Fetch eventos + calcular próximo
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const data: any[] = await listEvents();
      const items = Array.isArray(data) ? data : [];
      setEvents(items);
      const now = Date.now();
      const upcoming = items
        .filter((e) => e.fecha)
        .map((e) => ({ ...e, ts: new Date(e.fecha as string).getTime() }))
        .filter((e) => !isNaN(e.ts))
        .sort((a, b) => a.ts - b.ts)
        .find((e) => e.ts >= now) || null;
      setNextEvent(upcoming);
    } catch {
      setEvents([]);
      setNextEvent(null);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refresh al enfocar Home (ej: al volver desde Admin)
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);
  
  // Derivados: futuros y pasados
  const upcomingEvents = React.useMemo(() => {
    const now = Date.now();
    return (events || []).filter((e) => {
      if (!e.fecha) return true; // sin fecha: mantener en próximos
      const ts = new Date(e.fecha).getTime();
      return !isNaN(ts) && ts >= now;
    });
  }, [events]);

  const pastEvents = React.useMemo(() => {
    const now = Date.now();
    return (events || []).filter((e) => {
      if (!e.fecha) return false; // sin fecha no lo consideramos pasado
      const ts = new Date(e.fecha).getTime();
      return !isNaN(ts) && ts < now;
    });
  }, [events]);
  
  // UI
  const [howWorksOpen, setHowWorksOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsRequiredOpen, setTermsRequiredOpen] = useState(false);

  useEffect(() => {
    // Mostrar Términos al iniciar sesión si no fueron aceptados (local o backend)
    (async () => {
      try {
        if (user && isAuth) {
          const key = `@gesport:acceptedTerms:${user._id}`;
          const stored = await AsyncStorage.getItem(key);
          const backendAccepted = (user as any)?.acceptedTerms;
          if (!stored && !backendAccepted) {
            setTermsRequiredOpen(true);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user, isAuth]);

  const acceptTermsForUser = async () => {
    if (!user) return;
    const key = `@gesport:acceptedTerms:${user._id}`;
    try {
      await AsyncStorage.setItem(key, '1');
      // Intenta persistir en backend si la API lo permite
        try {
        await updateMe({ acceptedTerms: true } as any);
      } catch (e) {
        // backend puede ignorar; no bloquear al usuario
      }
    } catch (e) {
      // ignore
    }
    setTermsRequiredOpen(false);
  };

  return (
    <AppShell>
      <ScrollView
        ref={scrollRef}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: (72 + 16 + (insets?.bottom || 0) + 24) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#000000", "#1a1a1a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="px-4 py-10"
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} direction="up">
            <Text className="text-white text-4xl font-extrabold text-center mb-3">GeSPORT</Text>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} direction="up">
            <Text className="text-white text-lg leading-7 text-center font-medium mb-6">
              Somos GeSPORT, una comunidad que impulsa el running con eventos seguros, vibrantes y
              bien organizados. Conectamos deportistas de todos los niveles para vivir la
              experiencia de correr, competir y superar metas.
            </Text>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={140} direction="up">
            <View className="flex-row justify-center gap-3 mb-6">
              <View className="bg-white/10 px-3.5 py-1.5 rounded-full"><Text className="text-white text-sm">Organización</Text></View>
              <View className="bg-white/10 px-3.5 py-1.5 rounded-full"><Text className="text-white text-sm">Seguridad</Text></View>
              <View className="bg-white/10 px-3.5 py-1.5 rounded-full"><Text className="text-white text-sm">Comunidad</Text></View>
            </View>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={180} direction="up">
            <View className="flex-row flex-wrap justify-center mb-6" style={{ rowGap: 8, columnGap: 8 }}>
              <View style={{ flexGrow: 1, flexBasis: '48%', minWidth: 150 }}>
                <Link href="/masinformacion/Index" asChild>
                  <Button title="Conócenos" variant="secondary" />
                </Link>
              </View>
              <View style={{ flexGrow: 1, flexBasis: '48%', minWidth: 150 }}>
                <Link href="/events/TodosEvents" asChild>
                  <Button title="Ver eventos" variant="secondary" />
                </Link>
              </View>
              <View style={{ flexGrow: 1, flexBasis: '48%', minWidth: 150 }}>
                <Link href="/noticias/Index" asChild>
                  <Button title="Noticias" variant="secondary" />
                </Link>
              </View>
              <View style={{ flexGrow: 1, flexBasis: '48%', minWidth: 150 }}>
                <Button title="¿Cómo funciona?" variant="secondary" onPress={() => setHowWorksOpen(true)} />
              </View>
            </View>
          </RevealOnScroll>

          {/* Cuenta regresiva */}
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} direction="left">
            <Text className="text-white text-3xl font-bold mb-2">PRÓXIMO EVENTO</Text>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} direction="right">
            <Text className="text-white text-3xl font-bold mb-5">{nextEvent?.titulo || 'Próximo evento'}</Text>
          </RevealOnScroll>
          
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={100} direction="up">
            <View className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-10">
              <CountdownTimer targetDate={eventDate} />
              
              <View className="flex-row items-center mb-2">
                <Calendar color="white" size={16} />
                <Text className="text-white ml-2">
                  {nextEvent?.fecha ? new Date(nextEvent.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Por anunciar'}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Clock color="white" size={16} />
                <Text className="text-white ml-2">
                  {nextEvent?.fecha ? new Date(nextEvent.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
              </View>

              <View className="flex-row items-center">
                <MapPin color="white" size={16} />
                <Text className="text-white ml-2">{nextEvent?.lugar || 'Lugar a confirmar'}</Text>
              </View>
            </View>
          </RevealOnScroll>
          
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={140} direction="right">
            <View className="flex-row justify-between">
              <Button
                title="INSCRIBIRSE"
                variant="secondary"
                onPress={() => {
                  if (nextEvent?._id) {
                    router.push({ pathname: '/events/[id]', params: { id: String(nextEvent._id) } });
                  } else {
                    router.push('/events/TodosEvents');
                  }
                }}
              />
              <Link href="/calendario/Calendar" asChild>
                <Button title="CALENDARIO" variant="secondary" />
              </Link>
            </View>
          </RevealOnScroll>
        </LinearGradient>

        {/* Noticias - ahora arriba de Eventos */}
        <View className="py-10 px-4 bg-white">
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} direction="left">
            <View className="flex-row items-center justify-between">
              <SectionTitle className="text-3xl">NOTICIAS</SectionTitle>
              <Link href="/noticias/Index" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Ver todas</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} direction="right">
            {newsLoading ? (
              <Text className="text-gray-500 mt-4">Cargando noticias…</Text>
            ) : news.length === 0 ? (
              <Text className="text-gray-700 mt-4">No hay noticias por el momento.</Text>
            ) : (
              <View className="mt-4">
                {news.map((n, idx) => (
                  <RevealOnScroll key={n._id} scrollY={scrollY} viewportHeight={viewportHeight} delay={idx * 80} direction={idx % 2 === 0 ? 'left' : 'right'}>
                    <Link href="/noticias/Index" asChild>
                      <TouchableOpacity className="bg-black rounded-2xl p-4 mb-3 relative overflow-hidden">
                        <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                        <View className="flex-row items-center mb-1">
                          <Newspaper color="#ffffff" size={18} />
                          <Text className="text-white font-semibold text-lg ml-2" numberOfLines={1}>
                            {n.title || 'Noticia'}
                          </Text>
                        </View>
                        {n.content ? (
                          <Text className="text-white/80" numberOfLines={2}>{n.content}</Text>
                        ) : null}
                        {n.createdAt ? (
                          <Text className="text-white/50 text-xs mt-2">{new Date(n.createdAt).toLocaleDateString()}</Text>
                        ) : null}
                      </TouchableOpacity>
                    </Link>
                  </RevealOnScroll>
                ))}
              </View>
            )}
          </RevealOnScroll>
        </View>

        {/* Eventos (cartas) - ahora más destacado y debajo de Noticias */}
        <View className="py-10 px-4 bg-white"
          onLayout={(e) => { eventosBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={eventosBaseY.current} direction="left">
            <View className="flex-row items-center justify-between">
              <SectionTitle className="text-3xl">PRÓXIMOS EVENTOS</SectionTitle>
              <Link href="/events/TodosEvents" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Ver todos</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={40} baseY={eventosBaseY.current} direction="left">
            <LinearGradient
              colors={["#000000", "#222222"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 3, borderRadius: 9999, width: 200, marginTop: 8 }}
            />
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={eventosBaseY.current} direction="right">
            <Text className="text-black text-xl leading-7 mt-3 font-bold">¡No te lo pierdas! Inscribite y viví la experiencia GeSPORT.</Text>
          </RevealOnScroll>
          <View className="mt-6">
            {eventsLoading ? (
              <Text className="text-gray-500">Cargando eventos…</Text>
            ) : upcomingEvents.length === 0 ? (
              <Text className="text-gray-700">No hay eventos activos por el momento.</Text>
            ) : (
              upcomingEvents.slice(0, 3).map((ev, idx) => (
                <RevealOnScroll key={ev._id} scrollY={scrollY} viewportHeight={viewportHeight} delay={idx * 80} baseY={eventosBaseY.current} direction={idx % 2 === 0 ? 'left' : 'right'}>
                  <Link href={{ pathname: '/events/[id]', params: { id: ev._id } }} asChild>
                    <TouchableOpacity className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden shadow-lg hover:opacity-95" activeOpacity={0.9}>
                      <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                      <Text className="text-white text-2xl font-extrabold" numberOfLines={1}>{ev.titulo}</Text>
                      <View className="flex-row items-center mt-2">
                        <Calendar color="white" size={16} />
                        <Text className="text-white/90 ml-2">
                          {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha a confirmar'}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Clock color="white" size={16} />
                        <Text className="text-white/90 ml-2">
                          {ev.fecha ? new Date(ev.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </Text>
                      </View>
                      {ev.lugar ? (
                        <View className="flex-row items-center mt-1">
                          <MapPin color="white" size={16} />
                          <Text className="text-white/90 ml-2" numberOfLines={1}>{ev.lugar}</Text>
                        </View>
                      ) : null}
                      <View className="mt-3">
                        {(() => {
                          const isPast = ev?.fecha ? new Date(ev.fecha as string).getTime() < Date.now() : false;
                          const pillClass = isPast ? 'bg-gray-200' : 'bg-white';
                          const textClass = isPast ? 'text-gray-700' : 'text-black';
                          const label = isPast ? 'Finalizado' : 'Inscribirme';
                          return (
                            <View className={`${pillClass} rounded-full px-3 py-1 self-start`}>
                              <Text className={`${textClass} font-semibold`}>{label}</Text>
                            </View>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  </Link>
                </RevealOnScroll>
              ))
            )}
          </View>
        </View>

        {/* Características (Adidas-like) */}
        <View className="py-16 px-4 bg-white"
          onLayout={(e) => { caracteristicasBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={caracteristicasBaseY.current} direction="left">
            <SectionTitle className="text-3xl">CARACTERÍSTICAS</SectionTitle>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={caracteristicasBaseY.current} direction="right">
            <Text className="text-coffee text-lg leading-7 mt-3">Todo lo que necesitás para correr mejor.</Text>
          </RevealOnScroll>

          <View className="mt-6">
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={caracteristicasBaseY.current} direction="left">
              <View className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <Text className="text-white text-2xl font-extrabold">Entrenamientos personalizados</Text>
                <Text className="text-white/80 mt-2 text-lg">Ajustá objetivos y seguí tu progreso día a día.</Text>
              </View>
            </RevealOnScroll>
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={80} baseY={caracteristicasBaseY.current} direction="right">
              <View className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <Text className="text-white text-2xl font-extrabold">Desafíos y logros</Text>
                <Text className="text-white/80 mt-2 text-lg">Motivate con metas semanales y medallas.</Text>
              </View>
            </RevealOnScroll>
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={160} baseY={caracteristicasBaseY.current} direction="left">
              <View className="bg-black rounded-2xl p-5 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <Text className="text-white text-2xl font-extrabold">Comunidad y clubes</Text>
                <Text className="text-white/80 mt-2 text-lg">Unite a la comunidad y corré acompañado.</Text>
              </View>
            </RevealOnScroll>
          </View>
        </View>
        
        {/* Stats Section */}
        <View className="py-16 px-4 bg-white"
          onLayout={(e) => { historialBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={historialBaseY.current}>
            <SectionTitle className="text-3xl">HISTORIAL</SectionTitle>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={historialBaseY.current}>
            <Text className="text-black text-xl leading-7 mt-3 font-medium">
              Nuestras cifras hablan por sí solas: participación, ediciones y distancias que inspiran.
            </Text>
          </RevealOnScroll>
          
          <View className="mt-6 mb-8">
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={0} baseY={historialBaseY.current} direction="left">
              <View className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <View className="items-center">
                  <Text className="text-white text-4xl font-extrabold">+15K</Text>
                  <Text className="text-white/80 text-lg font-medium">Participantes</Text>
                </View>
              </View>
            </RevealOnScroll>
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={80} baseY={historialBaseY.current} direction="right">
              <View className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <View className="items-center">
                  <Text className="text-white text-4xl font-extrabold">4</Text>
                  <Text className="text-white/80 text-lg font-medium">Ediciones</Text>
                </View>
              </View>
            </RevealOnScroll>
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={80} baseY={historialBaseY.current} direction="right">
              <View className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                <View className="items-center">
                  <Text className="text-white text-3xl font-extrabold">5K , 10K , 21KK</Text>
                  <Text className="text-white/80 text-lg font-medium">Distancias</Text>
                </View>
              </View>
            </RevealOnScroll>
          </View>
          
          {/* Noticias moved above Eventos */}
        </View>
        
        {/* Runner Tools */}
        <View className="py-16 px-4"
          onLayout={(e) => { herramientasBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={herramientasBaseY.current} direction="left">
            <SectionTitle className="text-3xl">RECURSOS PARA CORREDORES</SectionTitle>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={herramientasBaseY.current} direction="right">
            <Text className="text-black text-xl leading-7 mt-3 font-medium">
              Calculá tu ritmo y tu índice de masa corporal para entrenar mejor.
            </Text>
          </RevealOnScroll>

          <View className="mt-6">
            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={herramientasBaseY.current} direction="left">
              <Link href="/herramientas/Index" asChild>
                <TouchableOpacity activeOpacity={0.9} className="bg-black rounded-2xl p-5 mb-4 relative overflow-hidden">
                  <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                  <View className="flex-row items-center">
                    <Activity color="white" size={24} />
                    <Text className="text-white text-2xl font-extrabold ml-3">Calculadora de Ritmo</Text>
                  </View>
                  <Text className="text-white/80 mt-2 text-lg">Ingresá distancia y tiempo para conocer tu pace por km.</Text>
                </TouchableOpacity>
              </Link>
            </RevealOnScroll>

            <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={80} baseY={herramientasBaseY.current} direction="right">
              <Link href="/herramientas/Index" asChild>
                <TouchableOpacity activeOpacity={0.9} className="bg-black rounded-2xl p-5 relative overflow-hidden">
                  <Stripes tint="rgba(255,255,255,0.08)" thickness={4} />
                  <View className="flex-row items-center">
                    <Clock color="white" size={24} />
                    <Text className="text-white text-2xl font-extrabold ml-3">Calculadora de IMC</Text>
                  </View>
                  <Text className="text-white/80 mt-2 text-lg">Averiguá tu IMC para ajustar objetivos y cargas.</Text>
                </TouchableOpacity>
              </Link>
            </RevealOnScroll>
          </View>
        </View>

        {/* Testimonials removed per request */}

        

        {/* Past Editions */}
        <View className="py-16 px-4"
          onLayout={(e) => { edicionesBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={edicionesBaseY.current} direction="left">
            <Link href="/ediciones/Index" asChild>
              <TouchableOpacity>
                <SectionTitle className="text-3xl">EDICIONES ANTERIORES</SectionTitle>
              </TouchableOpacity>
            </Link>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={edicionesBaseY.current} direction="right">
            <Text className="text-black text-xl font-semibold leading-8 mt-3">
              Revive nuestras competencias anteriores, historias y momentos destacados de cada edición.
            </Text>
          </RevealOnScroll>
          
          <View>
            {editions.map((edition, index) => (
              <View key={index} className="w-full mb-3">
                <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={index * 80} baseY={edicionesBaseY.current} direction={(index % 2 === 0) ? 'left' : 'right'}>
                  <EditionCard 
                    id={edition.id}
                    year={edition.year} 
                    color={edition.color} 
                    image={edition.image}
                    description={edition.description}
                  />
                </RevealOnScroll>
              </View>
            ))}
            {/* Listado compacto de eventos finalizados recientes (dinámico del backend) */}
            {pastEvents.length > 0 ? (
              <View className="mt-6">
                <SectionTitle className="text-2xl">EVENTOS FINALIZADOS RECIENTES</SectionTitle>
                {pastEvents.slice(0, 3).map((ev, idx) => (
                  <RevealOnScroll key={ev._id} scrollY={scrollY} viewportHeight={viewportHeight} delay={idx * 60} baseY={edicionesBaseY.current} direction={idx % 2 === 0 ? 'left' : 'right'}>
                    <Link href={{ pathname: '/events/[id]', params: { id: ev._id } }} asChild>
                      <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 mt-3" activeOpacity={0.9}>
                        <Text className="text-gray-900 text-lg font-extrabold" numberOfLines={1}>{ev.titulo}</Text>
                        <View className="flex-row items-center mt-1">
                          <Calendar color="#6b7280" size={16} />
                          <Text className="text-gray-600 ml-2">
                            {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha pasada'}
                          </Text>
                          <View className="ml-3 bg-gray-800 px-2 py-0.5 rounded-full self-center">
                            <Text className="text-white text-xs font-semibold">Finalizado</Text>
                          </View>
                        </View>
                        {ev.lugar ? (
                          <View className="flex-row items-center mt-1">
                            <MapPin color="#6b7280" size={16} />
                            <Text className="text-gray-600 ml-2" numberOfLines={1}>{ev.lugar}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    </Link>
                  </RevealOnScroll>
                ))}
              </View>
            ) : null}
          </View>
        </View>
        
        {/* Sponsors */}
        <View className="py-16 bg-white"
          onLayout={(e) => { sponsorsBaseY.current = e.nativeEvent.layout.y; }}
        >
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} baseY={sponsorsBaseY.current} direction="left">
            <SectionTitle className="text-3xl">PATROCINADORES</SectionTitle>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={60} baseY={sponsorsBaseY.current} direction="right">
            <Text className="text-brown text-lg leading-7 mt-3 px-4 text-center">
              Gracias a quienes hacen posible cada evento. Descubre nuestras marcas aliadas.
            </Text>
          </RevealOnScroll>
          <RevealOnScroll scrollY={scrollY} viewportHeight={viewportHeight} delay={120} baseY={sponsorsBaseY.current} direction="right">
            <SponsorCarousel />
          </RevealOnScroll>
        </View>
        
        {/* Contact section removed to avoid duplication since footer is fixed and larger now */}
      </ScrollView>
      {/* Modal ¿Cómo funciona? */}
      <HowItWorksModal visible={howWorksOpen} onClose={() => setHowWorksOpen(false)} />
      {/* Términos y Condiciones que se muestra al iniciar sesión (si corresponde) */}
      <TermsModal visible={termsRequiredOpen || termsOpen} onClose={() => { setTermsOpen(false); setTermsRequiredOpen(false); }} onAccept={acceptTermsForUser} />
    </AppShell>
  );
}
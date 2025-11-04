import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Check, Menu, MessageCircle, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const HISTORY_MAX_MESSAGES = 200;
const SESSION_KEY = '@gesport:chat:sessionId';
const historyKey = (sid: string) => `@gesport:chat:history:${sid}`;
const SESSIONS_KEY = '@gesport:chat:sessions';
const SESSIONS_MAX = 20;
const FONT_SCALE_KEY = '@gesport:chat:fontScale';

type SessionMeta = {
  id: string;
  title: string;
  createdAt: number;
  lastAt: number;
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

function resolveChatWebhookURL(): string {
  // 1) Explicit env
  const envUrl = process.env.EXPO_PUBLIC_CHAT_WEBHOOK_URL as string | undefined;
  if (envUrl) return envUrl;

  // 2) app.json extra
  const extraUrl = (Constants.expoConfig?.extra as any)?.CHAT_WEBHOOK_URL as string | undefined;
  if (extraUrl) return extraUrl;

  // 3) Derive from Expo dev server host (LAN IP preferred)
  // debuggerHost: "192.168.x.x:19000" or "localhost:19000"
  // hostUri: "192.168.x.x:8081"
  // @ts-ignore SDK differences
  const hostCand: string = Constants.expoGoConfig?.debuggerHost || Constants.expoConfig?.hostUri || '';
  if (hostCand) {
    const host = hostCand.split(':')[0];
    if (Platform.OS === 'android') {
      // En emulador Android, preferimos 10.0.2.2 cuando el host no es una IP LAN típica
      const isLikelyLan = /^192\.168\.|^10\.(?!0\.2\.2)/.test(host);
      const isLocal = host === '127.0.0.1' || host === 'localhost';
      const isWeird = host.startsWith('10.254.') || host.startsWith('172.') || host.startsWith('169.254.');
      if (isLocal || !isLikelyLan || isWeird) {
  return 'http://localhost:5678/webhook/chat';
      }
    }
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
  return `http://localhost:5678/webhook/chat`;
    }
  }

  // 4) Emulators / local fallbacks
  if (Platform.OS === 'android') return 'http://localhost:5678/webhook/chat';
  return 'http://localhost:5678/webhook/chat';
}

function normalizeN8nUrl(raw: string): string {
  // Ensure we hit the proper n8n webhook base. If user typed just "/chat" or left out base, default to production base "/webhook/chat".
  try {
    const u = new URL(raw);
    if (u.pathname === '/chat') {
      u.pathname = '/chat';
      return u.toString();
    }
    if (u.pathname === '' || u.pathname === '/') {
      u.pathname = '/webhook/chat';
      return u.toString();
    }
    return raw;
  } catch {
    // If it's not a full URL, try to coerce (e.g., user typed only host:port or path)
    if (/^https?:\/\//i.test(raw)) return raw;
    // If it's something like 192.168.1.10:5678 then prefix http:// and add /webhook/chat
    if (/^([\w.-]+)(:\d+)?(\/.*)?$/.test(raw)) {
      const match = raw.match(/^([\w.-]+)(:\d+)?(\/.*)?$/)!;
      const host = match[1];
      const port = match[2] || ':5678';
      const path = match[3] || '/webhook/chat';
      return `http://${host}${port}${path}`;
    }
    return raw;
  }
}

function isLikelyUnreachable(url: string): boolean {
  try {
    const u = new URL(url);
    const h = (u.hostname || '').toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h.startsWith('10.254.') || // direcciones virtuales poco accesibles desde móviles
      h === ''
    );
  } catch {
    return true;
  }
}

async function sendToN8n(message: string, sessionId: string, webhookUrl: string): Promise<string> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg: message, sessionId }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return `No pude conectar con el chat (HTTP ${res.status}). ${body?.slice(0, 200)}`.trim();
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      const candidates = [data?.text, data?.message, data?.answer, data?.output, data?.result, (typeof data === 'string' ? data : null)];
      const pick = candidates.find((x) => typeof x === 'string' && x.trim().length > 0);
      return (pick as string) || 'Sin respuesta.';
    } else {
      const txt = await res.text();
      return txt?.trim() || 'Sin respuesta.';
    }
  } catch (e: any) {
    return `No pude conectar con el chat (${e?.message || 'error de red'}). URL usada: ${webhookUrl}\nVerifica que:
- El servidor n8n esté accesible desde tu dispositivo (misma red LAN).
- Si estás en un emulador Android, usa 10.0.2.2 en lugar de localhost.
- Define EXPO_PUBLIC_CHAT_WEBHOOK_URL con la URL correcta (p. ej., http://TU-IP-LAN:5678/webhook/chat) o usa app.json->extra.CHAT_WEBHOOK_URL.`;
  }
}

export default function ChatCoach({ fullScreen = false }: { fullScreen?: boolean }) {
  const GREETING: Msg = {
    id: 'm0',
    role: 'assistant',
    content: 'Hola, soy tu coach. Pregúntame sobre nutrición, ritmo, hidratación o entrenamiento y te doy consejos prácticos.',
  };
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<ScrollView>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string | null>(null);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');

  useEffect(() => {
    (async () => {
      try {
        let sid = await AsyncStorage.getItem(SESSION_KEY);
        if (!sid) {
          sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await AsyncStorage.setItem(SESSION_KEY, sid);
        }
        setSessionId(sid);
      } catch {}
    })();
  }, []);

  // Load history after session is known
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        // Load sessions list
        const rawSessions = await AsyncStorage.getItem(SESSIONS_KEY);
        const parsedSessions: SessionMeta[] = rawSessions ? JSON.parse(rawSessions) : [];
        setSessions(Array.isArray(parsedSessions) ? parsedSessions : []);

        // Ensure current session exists in meta list
        const exists = parsedSessions?.some((s) => s.id === sessionId);
        if (!exists) {
          const now = Date.now();
          const newMeta: SessionMeta = {
            id: sessionId,
            title: defaultTitle(now),
            createdAt: now,
            lastAt: now,
          };
          const next = [newMeta, ...(parsedSessions || [])].slice(0, SESSIONS_MAX);
          setSessions(next);
          await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
        }

        const raw = await AsyncStorage.getItem(historyKey(sessionId));
        if (raw) {
          const parsed: Msg[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            // Scroll to end after a tick
            requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
            return;
          }
        }
        // If no history, ensure greeting
        setMessages([GREETING]);
      } catch {}
    })();
  }, [sessionId]);

  async function persistHistory(next: Msg[]) {
    if (!sessionId) return;
    try {
      const trimmed = next.slice(-HISTORY_MAX_MESSAGES);
      await AsyncStorage.setItem(historyKey(sessionId), JSON.stringify(trimmed));
    } catch {}
  }

  function defaultTitle(ts: number) {
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `Chat ${date} ${time}`;
  }

  async function loadSessionsList(): Promise<SessionMeta[]> {
    try {
      const raw = await AsyncStorage.getItem(SESSIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  async function saveSessionsList(list: SessionMeta[]) {
    try {
      const trimmed = list
        .sort((a, b) => b.lastAt - a.lastAt)
        .slice(0, SESSIONS_MAX);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
      setSessions(trimmed);
    } catch {}
  }

  async function ensureSessionMetaUpdate(opts?: { titleFromMessage?: string }) {
    if (!sessionId) return;
    const list = await loadSessionsList();
    const now = Date.now();
    const idx = list.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      const cur = { ...list[idx] };
      cur.lastAt = now;
      if (opts?.titleFromMessage && (!cur.title || cur.title.startsWith('Chat '))) {
        cur.title = opts.titleFromMessage;
      }
      list.splice(idx, 1);
      await saveSessionsList([cur, ...list]);
    } else {
      const meta: SessionMeta = {
        id: sessionId,
        title: opts?.titleFromMessage || defaultTitle(now),
        createdAt: now,
        lastAt: now,
      };
      await saveSessionsList([meta, ...list]);
    }
  }

  async function startNewChat() {
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([GREETING]);
    await AsyncStorage.setItem(historyKey(newId), JSON.stringify([GREETING]));
    const now = Date.now();
    await saveSessionsList([
      { id: newId, title: defaultTitle(now), createdAt: now, lastAt: now },
      ...sessions,
    ]);
    setShowMenu(false);
  }

  async function switchToSession(id: string) {
    if (!id || id === sessionId) {
      setShowMenu(false);
      return;
    }
    await AsyncStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
    // history will load via useEffect
    setShowMenu(false);
  }

  // Load any locally overridden webhook URL
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@gesport:chat:webhookUrl');
        if (saved) setCustomWebhookUrl(saved);
        const fs = await AsyncStorage.getItem('@gesport:chat:fontScale');
        if (fs === 'sm' || fs === 'md' || fs === 'lg') setFontScale(fs);
      } catch {}
    })();
  }, []);

  const canSend = input.trim().length > 0 && !loading;

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      void persistHistory(next);
      return next;
    });
    setLoading(true);

    try {
      const finalWebhook = "http://10.0.2.2:5678/webhook/chat";
      const answer = await sendToN8n(text, sessionId || 'anon', finalWebhook);
      const botMsg: Msg = { id: `a-${Date.now()}`, role: 'assistant', content: answer };
      setMessages((prev) => {
        const next = [...prev, botMsg];
        void persistHistory(next);
        return next;
      });
      // If this was the first user message, use it as session title
      if (messages.length <= 1) {
        const title = text.length > 30 ? `${text.slice(0, 30)}…` : text;
        await ensureSessionMetaUpdate({ titleFromMessage: title });
      } else {
        await ensureSessionMetaUpdate();
      }
    } finally {
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const renderBubble = (item: Msg) => {
    const isUser = item.role === 'user';
    const fontSize = fontScale === 'lg' ? 17 : fontScale === 'sm' ? 14 : 16;
    return (
      <View key={item.id} className={`mb-3 w-full ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`${isUser ? 'bg-white/90' : 'bg-white/10'} rounded-2xl px-4 py-3 max-w-[88%]`}>
          <Text className={`${isUser ? 'text-black' : 'text-white'}`} style={{ fontSize, lineHeight: Math.round(fontSize * 1.4) }}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const containerClass = fullScreen ? 'flex-1 bg-black px-4 py-4 relative overflow-hidden' : 'bg-black rounded-2xl p-4 relative overflow-hidden';
  const resolvedUrl = (customWebhookUrl && customWebhookUrl.trim().length > 0) ? customWebhookUrl!.trim() : resolveChatWebhookURL();

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: fullScreen ? 1 : undefined }}>
      <View className={containerClass}>
        <Stripes />
        <View className="flex-row items-center mb-3">
          <MessageCircle color="white" size={22} />
          <Text className="text-white text-xl font-extrabold ml-2">Chat Coach</Text>
          <View className="flex-1" />
          {/* Botón para iniciar un chat nuevo (fuera del menú) */}
          <TouchableOpacity onPress={startNewChat} accessibilityRole="button" accessibilityLabel="Nuevo chat">
            <View className="px-2 py-1 rounded-full bg-white/10 mr-2">
              <Plus color="#fff" size={18} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu((v) => !v)} accessibilityRole="button" accessibilityLabel="Abrir menú">
            <View className="px-2 py-1 rounded-full bg-white/10">
              <Menu color="#fff" size={18} />
            </View>
          </TouchableOpacity>
        </View>
        {showMenu ? (
          <>
            {/* Overlay oscuro */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            />
            {/* Panel solo con chats guardados */}
            <View
              className="absolute right-3 top-12 rounded-xl p-2"
              style={{ minWidth: 280, maxHeight: 420, backgroundColor: 'rgba(10,10,10,0.96)', zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }}
            >
              <Text className="text-white/80 text-xs px-2 pb-1">Chats guardados</Text>
              <View className="h-[1px] bg-white/10 mb-1" />
              <ScrollView style={{ maxHeight: 360 }}>
                {sessions.length === 0 ? (
                  <View className="px-2 py-2">
                    <Text className="text-white/60 text-sm">No hay chats guardados</Text>
                  </View>
                ) : (
                  sessions.map((s) => (
                    <TouchableOpacity key={s.id} onPress={() => switchToSession(s.id)} accessibilityRole="button">
                      <View className="px-2 py-2 rounded-md flex-row items-center">
                        {s.id === sessionId ? <Check color="#20e070" size={16} /> : <View style={{ width: 16 }} />}
                        <View className="ml-2 flex-1">
                          <Text className="text-white text-sm" numberOfLines={1}>{s.title || 'Chat'}</Text>
                          <Text className="text-white/50 text-[10px]">{new Date(s.lastAt).toLocaleString()}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </>
        ) : null}

        {/* Warning banner when URL seems unreachable */}
        {isLikelyUnreachable(resolvedUrl) ? (
          <View className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-2 mb-2">
            <Text className="text-yellow-200 text-xs">
              La URL actual del webhook parece no ser accesible desde tu dispositivo. Configúrala con tu IP LAN o usa 10.0.2.2 si es un emulador Android.
            </Text>
            <View className="flex-row mt-2">
              <TouchableOpacity
                onPress={async () => {
                  const candidate = 'http://localhost:5678/webhook/chat';
                  try {
                    await AsyncStorage.setItem('@gesport:chat:webhookUrl', candidate);
                    setCustomWebhookUrl(candidate);
                  } catch {}
                }}
                activeOpacity={0.9}
              >
                <View className="px-3 py-1 mr-2 rounded-full bg-yellow-500/40">
                  <Text className="text-white text-xs">Usar 10.0.2.2 (AVD)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowUrlEditor(true);
                  setUrlInput('http://localhost:5678/webhook/chat');
                }}
                activeOpacity={0.9}
              >
                <View className="px-3 py-1 rounded-full bg-yellow-500/40">
                  <Text className="text-white text-xs">Configurar IP LAN…</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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
              style={{ fontSize: fontScale === 'lg' ? 17 : fontScale === 'sm' ? 14 : 16, lineHeight: fontScale === 'lg' ? 24 : fontScale === 'sm' ? 20 : 22 }}
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
        {/* Debug + quick override: show and edit resolved webhook URL */}
        <View className="mt-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-white/40 text-[10px]">Webhook: {resolvedUrl}{customWebhookUrl ? ' (personalizado)' : ''}</Text>
            <TouchableOpacity onPress={() => { setShowUrlEditor((s) => !s); setUrlInput(resolvedUrl); }}>
              <Text className="text-white/50 text-[10px] underline">{showUrlEditor ? 'Cerrar' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>
          {showUrlEditor ? (
            <View className="bg-white/10 rounded-md px-2 py-2 mt-1">
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="http://X.X.X.X/webhook/chat"
                placeholderTextColor="#cfcfcf"
                className="text-white min-h-[36px]"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View className="flex-row mt-2 space-x-3">
                <TouchableOpacity
                  onPress={async () => {
                    let val = urlInput.trim();
                    if (!/^https?:\/\//i.test(val)) return;
                    try {
                      val = normalizeN8nUrl(val);
                      await AsyncStorage.setItem('@gesport:chat:webhookUrl', val);
                      setCustomWebhookUrl(val);
                      setShowUrlEditor(false);
                    } catch {}
                  }}
                  activeOpacity={0.9}
                >
                  <View className="px-3 py-1 rounded-full bg-primary">
                    <Text className="text-white text-xs font-semibold">Guardar</Text>
                  </View>
                </TouchableOpacity>
                {customWebhookUrl ? (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await AsyncStorage.removeItem('@gesport:chat:webhookUrl');
                        setCustomWebhookUrl(null);
                        setShowUrlEditor(false);
                      } catch {}
                    }}
                    activeOpacity={0.9}
                  >
                    <View className="px-3 py-1 rounded-full bg-white/20">
                      <Text className="text-white text-xs">Quitar</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text className="text-white/40 text-[10px] mt-2">Consejo: En n8n, activa el workflow y usa /webhook/chat.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

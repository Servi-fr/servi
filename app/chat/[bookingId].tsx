import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getMessages, sendMessage, getUid, getBookingById, type ChatMessage } from '../../lib/api';

export default function Chat() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [title, setTitle] = useState('Conversation');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function reload() {
    const m = await getMessages(bookingId);
    setMessages(m);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const [u, b] = await Promise.all([getUid(), getBookingById(bookingId)]);
      if (!active) return;
      setUid(u);
      if (b) {
        const other = b.clientId === u ? b.prestataire?.name : b.client?.name;
        setTitle(other || b.service);
      }
      await reload();
    })();
    const iv = setInterval(reload, 4000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [bookingId]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    await sendMessage(bookingId, text);
    await reload();
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={title} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={4}
      >
        {messages === null ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.link} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 ? (
              <Text style={s.hint}>Démarrez la conversation 👋</Text>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === uid;
                return (
                  <View key={m.id} style={[s.bubbleRow, mine ? s.right : s.left]}>
                    <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                      <Text style={[s.bubbleText, mine && { color: '#fff' }]}>{m.content}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <View style={s.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Votre message…"
            placeholderTextColor={colors.faint}
            style={s.input}
            multiline
          />
          <Pressable style={[s.sendBtn, !input.trim() && { opacity: 0.5 }]} disabled={!input.trim() || sending} onPress={send}>
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexGrow: 1 },
  hint: { textAlign: 'center', marginTop: 40, fontFamily: font.body, fontSize: 14, color: colors.muted },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.blue, borderBottomRightRadius: 5 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 5 },
  bubbleText: { fontFamily: font.body, fontSize: 15, color: colors.ink, lineHeight: 20 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  input: { flex: 1, maxHeight: 110, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line3, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: font.body, fontSize: 15, color: colors.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});

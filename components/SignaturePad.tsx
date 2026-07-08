import { useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { Pressable } from './motion';
import Svg, { Polyline } from 'react-native-svg';
import { colors, font } from '../theme/colors';

// Signature dessinée au doigt, stockée en JSON compact :
// { w, h, strokes: [ [[x,y],[x,y],…], … ] } — affichable partout (mobile/web).
export type SignatureData = { w: number; h: number; strokes: number[][][] };

const PAD_H = 180;

export function SignaturePad({ onChange }: { onChange: (json: string | null) => void }) {
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const current = useRef<number[][]>([]);
  const [, force] = useState(0);
  const width = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        current.current = [[r(e.nativeEvent.locationX), r(e.nativeEvent.locationY)]];
        force((n) => n + 1);
      },
      onPanResponderMove: (e) => {
        current.current.push([r(e.nativeEvent.locationX), r(e.nativeEvent.locationY)]);
        force((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (current.current.length > 1) {
          setStrokes((prev) => {
            const next = [...prev, current.current];
            onChange(JSON.stringify({ w: r(width.current), h: PAD_H, strokes: next }));
            return next;
          });
        }
        current.current = [];
      },
    }),
  ).current;

  function r(n: number) {
    return Math.round(n * 10) / 10;
  }

  function clear() {
    setStrokes([]);
    current.current = [];
    onChange(null);
  }

  const all = current.current.length > 1 ? [...strokes, current.current] : strokes;

  return (
    <View>
      <View
        style={s.pad}
        onLayout={(e) => {
          width.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        {all.length === 0 && <Text style={s.hint}>Le client signe ici avec le doigt</Text>}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {all.map((stroke, i) => (
            <Polyline
              key={i}
              points={stroke.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="none"
              stroke={colors.ink}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      <Pressable onPress={clear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Effacer la signature">
        <Text style={s.clear}>Effacer</Text>
      </Pressable>
    </View>
  );
}

// Affichage d'une signature stockée (côté client, réservation terminée).
export function SignatureView({ json, height = 120 }: { json: string; height?: number }) {
  const data = useMemo<SignatureData | null>(() => {
    try {
      const d = JSON.parse(json);
      return d && Array.isArray(d.strokes) ? d : null;
    } catch {
      return null;
    }
  }, [json]);
  if (!data) return null;
  return (
    <View style={[s.view, { height }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${data.w || 300} ${data.h || 180}`}>
        {data.strokes.map((stroke, i) => (
          <Polyline
            key={i}
            points={stroke.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={colors.ink}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  pad: {
    height: PAD_H,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line3,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hint: { fontFamily: font.body, fontSize: 13, color: colors.faint },
  clear: { fontFamily: font.semi, fontSize: 13, color: colors.muted, marginTop: 8, textAlign: 'right' },
  view: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
});

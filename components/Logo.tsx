import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, font } from '../theme/colors';

export function Logo({
  size = 23,
  color = colors.link,
  wordColor = colors.ink,
  word = true,
}: {
  size?: number;
  color?: string;
  wordColor?: string;
  word?: boolean;
}) {
  const w = Math.round((size / 23) * 36);
  const h = Math.round((size / 23) * 25);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Svg width={w} height={h} viewBox="0 0 44 30">
        <Path d="M2 4 L42 4 L34 13 L2 13 Z" fill={color} />
        <Path d="M10 17 L42 17 L42 26 L2 26 Z" fill={color} />
      </Svg>
      {word && (
        <Text style={{ fontFamily: font.display, fontSize: size, color: wordColor, letterSpacing: -0.5 }}>
          Servi
        </Text>
      )}
    </View>
  );
}

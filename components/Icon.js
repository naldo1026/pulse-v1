import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";

// Small stroke icon set, 24-unit grid. Add shapes here rather than reaching
// for unicode glyphs, which render differently on every platform.
const SHAPES = {
  settings: (
    <>
      <Path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <Circle cx={16} cy={8} r={2} />
      <Circle cx={8} cy={16} r={2} />
    </>
  ),
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
  back: <Path d="M15 6l-6 6 6 6" />,
  music: (
    <>
      <Path d="M9 17.5V6l10-2v11.5" />
      <Circle cx={6.5} cy={17.5} r={2.5} />
      <Circle cx={16.5} cy={15.5} r={2.5} />
    </>
  ),
  // tab bar
  battery: (
    <>
      <Rect x={7} y={4.5} width={10} height={16} rx={3} />
      <Path d="M10.5 2.5h3M10 14h4M10 17h4" />
    </>
  ),
  circle: (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Circle cx={12} cy={12} r={2.5} />
      <Circle cx={12} cy={4} r={1.6} fill="currentColor" />
    </>
  ),
  week: <Path d="M6 19v-5M10 19V8M14 19v-7M18 19V11" />,
};

export default function Icon({ name, size = 20, color, strokeWidth = 1.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[name]}
    </Svg>
  );
}

import React, { useId } from "react";
import Svg, { Defs, G, Mask, Path, Rect } from "react-native-svg";
import { doodleById } from "../lib/doodles";

// Chalk grain on a 100-unit box: specks and short dry drags where the board
// shows through. One shared path, because the picker draws 60 of these and a
// shape per speck would mean thousands of nodes. Seeded so it never changes.
const GRAIN = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = (v) => v.toFixed(1);
  let d = "";
  for (let i = 0; i < 300; i++) {
    const x = rnd() * 100, y = rnd() * 100, s = 0.35 + rnd() * 0.5;
    d += `M${n(x)} ${n(y)}h${n(s)}v${n(s)}h${n(-s)}z`;
  }
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 100, y = rnd() * 100, l = 1.2 + rnd() * 2.2;
    d += `M${n(x)} ${n(y)}l${n(l)} ${n(-l * 0.6)}l.4 .4l${n(-l)} ${n(l * 0.6)}z`;
  }
  return d;
})();

// A doodle drawn in chalk: faint dust behind, grainy strokes on top. Uses a
// mask rather than an SVG filter so it also works on native and iOS Safari.
export default function Doodle({ id, size, color }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const x = doodleById(id);
  if (!x) return null;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${x.w} ${x.h}`}>
      <Defs>
        <Mask id={uid} maskUnits="userSpaceOnUse" x={0} y={0} width={x.w} height={x.h}>
          <Rect x={0} y={0} width={x.w} height={x.h} fill="#fff" />
          <G transform={`scale(${x.w / 100} ${x.h / 100})`}>
            <Path d={GRAIN} fill="#000" />
          </G>
        </Mask>
      </Defs>
      <Path d={x.d} fill={color} opacity={0.22} transform={`translate(${x.w * 0.008} ${x.h * 0.008})`} />
      <G mask={`url(#${uid})`}>
        <Path d={x.d} fill={color} opacity={0.94} />
      </G>
    </Svg>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { useTheme, onColor, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";
import { formatDuration, WEEKDAYS } from "../lib/insights";
import { Label, Panel, Display } from "./primitives";
import { CompareBars, MiniBars, Diverging, Gauge } from "./WeekCharts";

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const UP = () => colorFor(75);
const DOWN = () => colorFor(25);

function Card({ title, note, children, style }) {
  const t = useTheme();
  return (
    <Panel style={[{ marginTop: 12 }, style]}>
      <View style={{ marginBottom: 14 }}>
        <Label color={t.ink}>{title}</Label>
        {note ? <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{note}</Text> : null}
      </View>
      {children}
    </Panel>
  );
}

// A card that hasn't unlocked yet: its title and the module's hint, muted.
function Locked({ title, hint }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: t.lineStrong }}>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted }}>{title}</Text>
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{`${hint[0].toUpperCase()}${hint.slice(1)}`}</Text>
    </View>
  );
}

const Muted = ({ children }) => {
  const t = useTheme();
  return <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{children}</Text>;
};

function Moves({ data }) {
  const t = useTheme();
  if (data.locked) return <Locked title="What moves your battery" hint={data.hint} />;
  const max = Math.max(...data.factors.map((f) => Math.abs(f.diff)), 1);
  return (
    <Card title="What moves your battery" note="points between answers">
      {data.factors.length ? data.factors.map((f, i) => (
        <View key={f.question} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.ink }}>{f.short}</Text>
            <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint }}>{`vs ${f.vs}`}</Text>
          </View>
          <Diverging value={f.diff} max={max} up={UP()} down={DOWN()} width={84} />
          <Text style={{ width: 34, textAlign: "right", fontFamily: FONTS.bold, fontSize: T.body, color: t.ink }}>{signed(f.diff)}</Text>
        </View>
      )) : <Muted>No answer moves it by 5 or more yet.</Muted>}
    </Card>
  );
}

const WIN = { average: "Average", lows: "Daily low", bounceBack: "Bounce-back" };

function Wins({ data }) {
  const t = useTheme();
  if (data.locked || !data.wins.length) return null;
  return (
    <Card title="Small wins" note="vs the 4 weeks before">
      <View style={{ flexDirection: "row", gap: 10 }}>
        {data.wins.map((w) => {
          const bounce = w.id === "bounceBack";
          return (
            <View key={w.id} style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: t.sunk }}>
              <Display size={24} color={t.ink}>{bounce ? formatDuration(w.to) : signed(w.to - w.from)}</Display>
              <Text style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: t.ink, marginTop: 4 }}>{WIN[w.id]}</Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint }}>{bounce ? `was ${formatDuration(w.from)}` : `${w.from} → ${w.to}`}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const RECORDS = [
  ["fastestBounceBack", "Fastest bounce-back", (r) => r.display],
  ["steadiestWeek", "Steadiest week (range)", (r) => String(r.value)],
  ["longestStretchAboveHigh", "Longest at 60+", (r) => r.display],
  ["mostDaysInARow", "Days in a row", (r) => String(r.value)],
];

function Records({ data }) {
  const t = useTheme();
  if (data.locked) return <Locked title="Personal records" hint={data.hint} />;
  return (
    <Card title="Personal records">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {RECORDS.map(([key, label, show]) => {
          const r = data[key];
          const fresh = r?.setThisWeek;
          return (
            <View key={key} style={{ flexGrow: 1, flexBasis: "45%", padding: 12, borderRadius: 16, backgroundColor: fresh ? colorFor(85) : t.sunk }}>
              <Display size={22} color={fresh ? onColor(colorFor(85)) : t.ink}>{r ? show(r) : "–"}</Display>
              <Text style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: fresh ? onColor(colorFor(85)) : t.ink, marginTop: 4 }}>
                {label}
                {fresh && <Text style={{ fontFamily: FONTS.bold }}>{"  · NEW"}</Text>}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const CHANGE = { lowestWeekday: "Lowest day", topDrain: "Top drain", topBoost: "Top boost", dipTime: "Dip time" };
const PART = { night: "Night", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

function Changes({ data }) {
  const t = useTheme();
  if (data.locked || !data.changes.length) return null;
  const name = (c, v) => (c.id === "dipTime" ? PART[v] : c.id === "lowestWeekday" ? v.slice(0, 3) : v);
  return (
    <Card title="How your patterns have changed" note="vs the 4 weeks before">
      {data.changes.map((c, i) => (
        <View key={c.id} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
          <Text style={{ width: 84, fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>{CHANGE[c.id]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink }}>{name(c, c.now)}</Text>
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint }}>{`was ${name(c, c.before)}`}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function Pair({ title, data, hi, lo, note }) {
  if (data.locked) return <Locked title={title} hint={data.hint} />;
  return (
    <Card title={title} note={note}>
      <CompareBars items={[
        { label: hi, value: data.high.avg, sub: `${data.high.answers} days` },
        { label: lo, value: data.low.avg, sub: `${data.low.answers} days` },
      ]} />
    </Card>
  );
}

function Rhythm({ data }) {
  if (data.locked) return <Locked title="When you dip" hint={data.hint} />;
  const max = Math.max(...data.byPart.map((p) => p.drops), 1);
  return (
    <Card title="When you dip" note="drops, last 4 weeks">
      <MiniBars max={max} items={data.byPart.map((p) => ({ label: p.label, value: p.drops, display: String(p.drops), color: DOWN(), on: p.part === data.part }))} />
    </Card>
  );
}

// Monday first, like a calendar week.
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

function Weekdays({ data }) {
  if (data.locked) return <Locked title="Day of the week" hint={data.hint} />;
  return (
    <Card title="Day of the week" note="average, last 4 weeks">
      <MiniBars max={100} height={72} items={MON_FIRST.map((w) => {
        const d = data.byWeekday[w];
        return { label: WEEKDAYS[w].slice(0, 3), value: d.avg, display: d.avg == null ? "–" : String(d.avg), color: d.avg == null ? null : colorFor(d.avg), on: d.weekday === data.lowest.weekday || d.weekday === data.highest.weekday };
      })} />
    </Card>
  );
}

function Social({ data }) {
  const t = useTheme();
  if (data.locked) return <Locked title="Your social activity" hint={data.hint} />;
  return (
    <Card title="Your social activity" note="last 4 weeks">
      <CompareBars items={[
        { label: "Social days", value: data.social.avg, sub: `${data.social.days} days` },
        { label: "Quiet days", value: data.quiet.avg, sub: `${data.quiet.days} days` },
      ]} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 14 }}>
        {[[data.pulses, "pulses sent"], [data.nudges, "nudges received"]].map(([n, what]) => (
          <Text key={what} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>
            <Text style={{ fontFamily: FONTS.bold, color: t.ink }}>{n}</Text>{` ${what}`}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function Personality({ data }) {
  const t = useTheme();
  if (!data) return null;
  return (
    <Card title="Your type">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, backgroundColor: t.sunk }}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: T.small, color: t.ink, letterSpacing: 0.6 }}>{data.type}</Text>
        </View>
        <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted }}>{data.text}</Text>
      </View>
    </Card>
  );
}

function Consistency({ data }) {
  const t = useTheme();
  if (data.locked) return <Locked title="Logging" hint={data.hint} />;
  const pct = Math.round((data.daysLogged / data.of) * 100);
  return (
    <Card title="Logging" note={data.of === 28 ? "last 4 weeks" : "since you started"}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <Gauge value={pct} color={UP()} size={96} stroke={10}>
          <Display size={22}>{`${data.daysLogged}/${data.of}`}</Display>
        </Gauge>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{`You logged ${data.daysLogged} of ${data.of} days`}</Text>
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{`${data.checkIns} check-ins`}</Text>
        </View>
      </View>
    </Card>
  );
}

// "Your patterns": the last 28 days, in the order PUL-15 lists them.
export default function Patterns({ p }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Display size={22}>Your patterns</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>Last 4 weeks</Text>
      </View>
      <Moves data={p.moves} />
      <Wins data={p.wins} />
      <Records data={p.records} />
      <Changes data={p.changes} />
      <Pair title="Sleep" data={p.sleep} hi={`Slept ${p.sleep.high?.label ?? ""}`} lo={`Slept ${p.sleep.low?.label ?? ""}`} note="average that day" />
      <Pair title="Social hangover" data={p.hangover} hi="After a social day" lo="After a quiet one" note="average next day" />
      <Rhythm data={p.rhythm} />
      <Weekdays data={p.weekdays} />
      <Social data={p.social} />
      <Personality data={p.type} />
      <Consistency data={p.consistency} />
    </View>
  );
}

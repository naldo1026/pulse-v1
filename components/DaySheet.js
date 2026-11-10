import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { colorFor, GROUPS } from "../lib/data";
import { Label, Display } from "./primitives";
import Sheet from "./Sheet";

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");
const dayMonth = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const groupNames = (ids) => GROUPS.filter((g) => ids.includes(g.id)).map((g) => g.label).join(", ");

function Stat({ value, label }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 16, backgroundColor: t.sunk }}>
      <Display size={22}>{value == null ? "–" : String(value)}</Display>
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// One level set: time, a dot in its colour on a thread, before → after, the
// change, and the reason you gave.
function Change({ c, last }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Text style={{ width: 42, fontFamily: FONTS.medium, fontSize: T.small, color: t.muted, paddingTop: 1 }}>{c.time}</Text>
      <View style={{ alignItems: "center", width: 12 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, backgroundColor: colorFor(c.to) }} />
        {!last && <View style={{ flex: 1, width: 2, backgroundColor: t.line, marginVertical: 2 }} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{c.from == null ? `Set to ${c.to}` : `${c.from} → ${c.to}`}</Text>
          {c.change != null && (
            <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 100, backgroundColor: t.sunk }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: T.caption, color: t.ink }}>{signed(c.change)}</Text>
            </View>
          )}
        </View>
        {c.reason && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 2 }}>{`“${c.reason}”`}</Text>}
      </View>
    </View>
  );
}

function Row({ left, right }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 7 }}>
      <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>{left}</Text>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, textAlign: "right" }}>{right}</Text>
    </View>
  );
}

// What happened on one day of My Week: dayTimeline() from lib/insights.js.
export default function DaySheet({ day, today, onDismiss }) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const title = day.date === today ? "Today" : day.weekday;

  return (
    <Sheet onDismiss={onDismiss} swipeToClose>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Display size={26}>{title}</Display>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{dayMonth(day.date)}</Text>
      </View>

      <ScrollView style={{ maxHeight: height * 0.62, marginTop: 16 }} contentContainerStyle={{ paddingBottom: 4 }}>
        {day.avg != null && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            <Stat value={day.avg} label="Average" />
            <Stat value={day.low} label="Low" />
            <Stat value={day.high} label="High" />
          </View>
        )}

        {day.empty ? (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>Nothing logged this day.</Text>
            {day.avg != null && (
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 4 }}>{`Your level stayed at ${day.avg} from the day before.`}</Text>
            )}
          </View>
        ) : (
          <>
            {day.changes.length > 0 && (
              <View>
                <Label style={{ marginBottom: 12 }}>{day.changes.length === 1 ? "1 level change" : `${day.changes.length} level changes`}</Label>
                {day.changes.map((c, i) => <Change key={c.id} c={c} last={i === day.changes.length - 1} />)}
              </View>
            )}

            {day.checkIn && (
              <View style={{ marginTop: day.changes.length ? 24 : 0 }}>
                <Label style={{ marginBottom: 4 }}>{day.checkIn.status === "skipped" ? "Check-in (skipped)" : "Check-in"}</Label>
                {day.checkIn.answers.length
                  ? day.checkIn.answers.map((a) => <Row key={a.question} left={a.prompt} right={a.label} />)
                  : <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint, paddingVertical: 7 }}>No answers.</Text>}
              </View>
            )}

            {day.pulses.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Label style={{ marginBottom: 4 }}>{day.pulses.length === 1 ? "Pulse sent" : `${day.pulses.length} pulses sent`}</Label>
                {day.pulses.map((p, i) => (
                  <Row key={i} left={`${p.time}${p.groups.length ? ` · ${groupNames(p.groups)}` : ""}`} right={p.level == null ? "" : `at ${p.level}`} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

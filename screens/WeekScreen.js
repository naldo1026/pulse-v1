import React, { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, rgba, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";
import {
  prepare, thisWeek, headline, biggestMoves, weekComparison, drainsAndBoosts, thisWeekDays, baseline, firstDay,
  addDays, THRESHOLDS, LOW,
} from "../lib/insights";
import { Label, Panel, Display } from "../components/primitives";
import LightStreak from "../components/LightStreak";
import WeekChart from "../components/WeekChart";

// A local calendar date, at noon so no time zone can move it to another day.
const asDate = (date) => new Date(`${date}T12:00:00`);
const short = (date, opts) => asDate(date).toLocaleDateString("en-GB", opts);
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

function dateRange(from, to) {
  const [a, b] = [asDate(from), asDate(to)];
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${short(to, { month: "short" })}`
    : `${short(from, { day: "numeric", month: "short" })} – ${short(to, { day: "numeric", month: "short" })}`;
}

// Everything on this screen, worked out from the 56 days App loads.
function useInsights(history) {
  return useMemo(() => {
    if (!history) return null;
    const ctx = prepare(history);
    const usual = baseline(ctx);
    return {
      today: ctx.today,
      week: thisWeek(ctx),
      headline: headline(ctx),
      moves: biggestMoves(ctx),
      compare: weekComparison(ctx),
      tags: drainsAndBoosts(ctx, thisWeekDays(ctx)),
      usual: usual.locked ? null : usual,
      first: firstDay(ctx),
      days: thisWeekDays(ctx),
    };
  }, [history]);
}

function Section({ title, children }) {
  return (
    <View style={{ marginTop: 28 }}>
      <Label style={{ marginLeft: 4, marginBottom: 8 }}>{title}</Label>
      {children}
    </View>
  );
}

// What's still to come, as progress rather than a gap.
function Hint({ children }) {
  const t = useTheme();
  return <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.faint, marginHorizontal: 4 }}>{children}</Text>;
}

// A big figure with a line or two beside it.
function Row({ big, color, first, children }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderColor: t.line }}>
      <Display size={26} color={color} style={{ minWidth: 52 }}>{big}</Display>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function Line({ children, muted }) {
  const t = useTheme();
  return <Text style={{ fontFamily: FONTS.sans, fontSize: muted ? T.small : T.body, lineHeight: muted ? 18 : 21, color: muted ? t.muted : t.ink, marginTop: muted ? 2 : 0 }}>{children}</Text>;
}

function Move({ move, what, today, first }) {
  const when = move.date === today ? "today" : move.date === addDays(today, -1) ? "yesterday" : `on ${move.weekday}`;
  return (
    <Row big={signed(move.change)} first={first}>
      <Line>{`Biggest ${what}: ${move.from} → ${move.to} ${when}`}</Line>
      {move.reason && <Line muted>{`Tagged “${move.reason}”`}</Line>}
      {move.vsUsual && <Line muted>{`That day averaged ${move.dayAvg}, ${move.vsUsual.text}`}</Line>}
    </Row>
  );
}

function Tags({ title, items, what, empty }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 220 }}>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted, marginBottom: 6 }}>{title}</Text>
      {items.length ? items.map((g) => (
        <View key={g.reason} style={{ paddingVertical: 8 }}>
          <Line>{`“${g.reason}”`}</Line>
          <Line muted>{`${g.count} ${what}, ${g.avgChange} points on average`}</Line>
        </View>
      )) : <Line muted>{empty}</Line>}
    </View>
  );
}

export default function WeekScreen({ level, history }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const w = useInsights(history);

  const header = (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
      <Display size={24}>My Week</Display>
      {w && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{dateRange(w.days[0].date, w.today)}</Text>}
    </View>
  );

  if (!w) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <LightStreak level={level} intensity={0.8} />
        {header}
        <ActivityIndicator color={t.faint} style={{ marginTop: 64 }} />
      </View>
    );
  }

  const { week, moves, compare, tags } = w;
  const open = !week.locked;
  const loggedDays = w.days.filter((d) => d.logged).length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={level} intensity={0.8} />
      {header}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 32 }}>
        {open ? (
          <>
            <Display size={30}>{w.headline.text}</Display>

            <Panel style={{ marginTop: 24, paddingBottom: 16 }}>
              <WeekChart days={week.days} usual={w.usual?.overall} lowestDate={week.lowest.date} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6, marginTop: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorFor(week.average) }} />
                  <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>Daily average and range</Text>
                </View>
                {w.usual && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 14, height: 10, borderRadius: 3, backgroundColor: rgba(t.ink, t.scheme === "dark" ? 0.14 : 0.1) }} />
                    <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>{`Your usual, ${w.usual.overall.low}–${w.usual.overall.high}`}</Text>
                  </View>
                )}
              </View>
            </Panel>
            {!w.usual && <View style={{ marginTop: 8 }}><Hint>{`Your usual range shows here after ${THRESHOLDS.baselineDays} days of levels.`}</Hint></View>}
          </>
        ) : (
          <>
            <Display size={30}>{w.first ? w.first.text : "Your week starts with your first level."}</Display>
            <Panel style={{ marginTop: 24 }}>
              <Label>Your week</Label>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                {[...Array(THRESHOLDS.weekDays)].map((_, i) => (
                  <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < loggedDays ? colorFor(level) : t.sunk }} />
                ))}
              </View>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, lineHeight: 21, color: t.ink, marginTop: 14 }}>
                {`${week.hint[0].toUpperCase()}${week.hint.slice(1)}.`}
              </Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted, marginTop: 4 }}>
                Set it on Me whenever it changes. Any days this week count.
              </Text>
            </Panel>
          </>
        )}

        {(open || !moves.locked) && (
          <Section title="Biggest moves">
            {moves.locked ? <Hint>{`${moves.hint}.`}</Hint> : (
              <Panel style={{ paddingVertical: 4 }}>
                {moves.drop && <Move move={moves.drop} what="drop" today={w.today} first />}
                {moves.recharge && <Move move={moves.recharge} what="recharge" today={w.today} first={!moves.drop} />}
              </Panel>
            )}
          </Section>
        )}

        {open && (
          <Section title="Compared with last week">
            {compare.locked ? <Hint>{`${compare.hint[0].toUpperCase()}${compare.hint.slice(1)}.`}</Hint> : (
              <Panel style={{ paddingVertical: 4 }}>
                <Row big={compare.pct == null ? signed(compare.diff) : `${signed(compare.pct)}%`} first>
                  <Line>Average</Line>
                  <Line muted>{`${compare.lastWeek} last week, ${compare.thisWeek} this week`}</Line>
                </Row>
                <Row big={String(compare.lowDays.thisWeek)}>
                  <Line>{compare.lowDays.thisWeek === 1 ? "Low day" : "Low days"}</Line>
                  <Line muted>{`${compare.lowDays.lastWeek} last week. A low day averages ${LOW} or under.`}</Line>
                </Row>
              </Panel>
            )}
          </Section>
        )}

        {open && (
          <Section title="Drains and boosts">
            {tags.locked ? <Hint>{`${tags.hint[0].toUpperCase()}${tags.hint.slice(1)}. Tag a change when Pulse asks what made it.`}</Hint> : (
              <Panel>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  <Tags title="What drained you" items={tags.drains} what="drops" empty="No tag has come up twice on a drop this week." />
                  <Tags title="What boosted you" items={tags.boosts} what="recharges" empty="No tag has come up twice on a recharge this week." />
                </View>
              </Panel>
            )}
          </Section>
        )}

        <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 28 }}>
          Only you see this. It's built from the levels and tags you've set.
        </Text>
      </ScrollView>
    </View>
  );
}

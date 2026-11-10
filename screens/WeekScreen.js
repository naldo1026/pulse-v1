import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, FONTS, T } from "../theme";
import { colorFor } from "../lib/data";
import {
  prepare, thisWeek, weekComparison, biggestMoves, drainsAndBoosts, thisWeekDays, weekMoods, sawPeople, personalityLink, firstDay,
  whatMovesYourBattery, smallWins, records, patternChanges, sleepVsBattery, socialYesterdayVsToday, dailyRhythm, dayOfWeek,
  socialActivity, personalityReflection, consistency, dayTimeline,
  WEEKDAYS, THRESHOLDS, LOW,
} from "../lib/insights";
import DaySheet from "../components/DaySheet";
import { Label, Panel, Display } from "../components/primitives";
import LightStreak from "../components/LightStreak";
import { DayBars, Gauge, Donut } from "../components/WeekCharts";
import Patterns from "../components/Patterns";

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

// Each state's colour: the middle of its band on your colour ramp.
const MOOD_LEVEL = { drained: 10, low: 30, okay: 50, good: 70, full: 90 };

// Everything on this screen, worked out from the 56 days App loads.
function useInsights(history, mbti) {
  return useMemo(() => {
    if (!history) return null;
    const ctx = prepare({ ...history, mbti });
    const days = thisWeekDays(ctx);
    return {
      ctx,
      today: ctx.today,
      bars: days.map((d) => ({ date: d.date, weekday: WEEKDAYS[d.weekday], avg: d.avg == null ? null : Math.round(d.avg) })),
      logged: days.filter((d) => d.logged).length,
      week: thisWeek(ctx),
      compare: weekComparison(ctx),
      moves: biggestMoves(ctx),
      tags: drainsAndBoosts(ctx, days),
      moods: weekMoods(ctx),
      people: sawPeople(ctx),
      type: personalityLink(ctx),
      first: firstDay(ctx),
      patterns: {
        moves: whatMovesYourBattery(ctx),
        wins: smallWins(ctx),
        records: records(ctx),
        changes: patternChanges(ctx),
        sleep: sleepVsBattery(ctx),
        hangover: socialYesterdayVsToday(ctx),
        rhythm: dailyRhythm(ctx),
        weekdays: dayOfWeek(ctx),
        social: socialActivity(ctx),
        type: personalityReflection(ctx),
        consistency: consistency(ctx),
      },
    };
  }, [history, mbti]);
}

function Pill({ children, color }) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, backgroundColor: color || t.sunk }}>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.caption, color: t.ink }}>{children}</Text>
    </View>
  );
}

// One of the three gauges, with your type's badge on the one it speaks to.
function Meter({ label, value, big, unit, color, badge }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View style={{ height: 22, justifyContent: "center" }}>{badge && <Pill>{badge}</Pill>}</View>
      <Gauge value={value} color={color} size={70} stroke={8}>
        <Display size={20}>{big}</Display>
      </Gauge>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, marginTop: 8, textAlign: "center" }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 1, textAlign: "center" }}>{unit}</Text>
    </View>
  );
}

function Tile({ big, label, sub, color }) {
  const t = useTheme();
  return (
    <Panel style={{ flexGrow: 1, flexBasis: "45%", padding: 16 }}>
      <Display size={28} color={color}>{big}</Display>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink, marginTop: 4 }}>{label}</Text>
      {sub ? <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, marginTop: 2 }}>{sub}</Text> : null}
    </Panel>
  );
}

function Tags({ title, items, color }) {
  const t = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 10 }}>
      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted, width: 52, paddingTop: 7 }}>{title}</Text>
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((g) => (
        <View key={g.reason} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.ink }}>{g.reason}</Text>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.faint }}>{`×${g.count}`}</Text>
        </View>
      ))}
      </View>
    </View>
  );
}

export default function WeekScreen({ level, history, mbti }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const w = useInsights(history, mbti);
  // The date whose timeline sheet is open, or null.
  const [openDay, setOpenDay] = useState(null);

  const header = (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
      <Display size={24}>My Week</Display>
      {w && <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{dateRange(w.bars[0].date, w.today)}</Text>}
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

  const { week, compare, moves, tags, moods, people, type } = w;
  const open = !week.locked;
  const need = THRESHOLDS.weekDays - Math.min(w.logged, THRESHOLDS.weekDays);
  // Before the week unlocks: the average of the days that have a level.
  const known = w.bars.filter((d) => d.avg != null);
  const soFar = known.length ? Math.round(known.reduce((a, d) => a + d.avg, 0) / known.length) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LightStreak level={level} intensity={0.8} />
      {header}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 32 }}>
        {/* The week, day by day. */}
        <Panel style={{ paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <View>
              <Display size={44}>{open ? String(week.average) : soFar == null ? "–" : String(soFar)}</Display>
              <Label style={{ marginTop: 2 }}>{open ? "Average this week" : soFar == null ? "No levels yet" : "Average so far"}</Label>
            </View>
            {open && !compare.locked && compare.pct != null && <Pill>{`${signed(compare.pct)}% vs last week`}</Pill>}
            {!open && <Pill>{`${Math.min(w.logged, THRESHOLDS.weekDays)} of ${THRESHOLDS.weekDays} days`}</Pill>}
          </View>
          <DayBars days={w.bars} lowestDate={open ? week.lowest.date : null} onPressDay={setOpenDay} />
          <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 12 }}>Tap a day to see what happened</Text>
        </Panel>

        {!open && (
          <View style={{ marginTop: 24 }}>
            {w.first && <Display size={22}>{w.first.text}</Display>}
            <Text style={{ fontFamily: FONTS.sans, fontSize: T.body, color: t.muted, marginTop: 8 }}>
              {w.first ? `${need} more ${need === 1 ? "day" : "days"} of levels to unlock your week.` : "Set your level on Me to start your week."}
            </Text>
          </View>
        )}

        {open && (
          <>
            {/* How you were: three gauges, with your type's link. */}
            <Panel style={{ marginTop: 14, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: "row" }}>
                <Meter
                  label="Saw people" color={colorFor(90)} badge={type?.focus === "people" ? type.type : null}
                  value={people.locked ? null : people.pct} big={people.locked ? "–" : `${people.days}/${people.of}`}
                  unit={people.locked ? "check in to see" : "days"}
                />
                <Meter label="Alone time" color={colorFor(30)} badge={type?.focus === "alone" ? type.type : null} value={moods.alone} big={`${moods.alone}%`} unit="of your week" />
                <Meter label="Up for chill" color={colorFor(70)} value={moods.chill} big={`${moods.chill}%`} unit="of your week" />
              </View>
              {type && (
                <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted, marginTop: 14, marginHorizontal: 8, textAlign: "center" }}>
                  {type.text}
                </Text>
              )}
            </Panel>

            {/* Where the week's hours went. */}
            <Panel style={{ marginTop: 14 }}>
              <Label>How your week felt</Label>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginTop: 14 }}>
                <Donut segments={moods.bands.map((b) => ({ id: b.id, pct: b.pct, color: colorFor(MOOD_LEVEL[b.id]) }))}>
                  <Display size={22}>{`${moods.bands.find((b) => b.id === moods.top).pct}%`}</Display>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.muted }}>{moods.bands.find((b) => b.id === moods.top).label}</Text>
                </Donut>
                <View style={{ flex: 1, gap: 6 }}>
                  {[...moods.bands].reverse().map((b) => (
                    <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, opacity: b.pct ? 1 : 0.45 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorFor(MOOD_LEVEL[b.id]) }} />
                      <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: T.small, color: t.ink }}>{b.label}</Text>
                      <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.ink }}>{`${b.pct}%`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Panel>

            {/* The week in four numbers. */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              <Tile big={moves.drop ? signed(moves.drop.change) : "0"} label="Biggest drop" sub={moves.drop?.reason || (moves.drop ? `${moves.drop.weekday}` : "None this week")} />
              <Tile big={moves.recharge ? signed(moves.recharge.change) : "0"} label="Biggest recharge" sub={moves.recharge?.reason || (moves.recharge ? `${moves.recharge.weekday}` : "None this week")} />
              <Tile big={compare.locked ? String(week.days.filter((d) => d.avg != null && d.avg <= LOW).length) : String(compare.lowDays.thisWeek)} label="Low days" sub={compare.locked ? null : `${compare.lowDays.lastWeek} last week`} />
              <Tile big={`${w.logged}/7`} label="Days logged" />
            </View>

            {/* Tags you gave, counted. */}
            {!tags.locked && (tags.drains.length > 0 || tags.boosts.length > 0) && (
              <View style={{ marginTop: 14 }}>
                <Tags title="Drains" items={tags.drains} color={colorFor(30)} />
                <Tags title="Boosts" items={tags.boosts} color={colorFor(70)} />
              </View>
            )}

            <Patterns p={w.patterns} />
          </>
        )}

        <Text style={{ fontFamily: FONTS.sans, fontSize: T.caption, color: t.faint, textAlign: "center", marginTop: 28 }}>Only you see this.</Text>
      </ScrollView>

      {openDay && <DaySheet day={dayTimeline(w.ctx, openDay)} today={w.today} onDismiss={() => setOpenDay(null)} />}
    </View>
  );
}

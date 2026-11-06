import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import { Display } from "./primitives";
import MorningPrompt from "./MorningPrompt";
import Sheet from "./Sheet";

const PAYOFF_MS = 2000;
// Answers move straight on, so a double tap would otherwise land on the next
// question and save an answer nobody chose.
const TAP_GUARD_MS = 250;

// Questions can change in the dashboard, so the layout goes by their labels.
// Short ones share a row. Anything longer gets its own line.
const fitsInRow = (options) => Math.max(...options.map((o) => o.label.length)) * options.length <= 24;

// One sheet, so "How are you feeling?" and the questions read as one flow.
// morning: ask for the level first. checkIn: { date, questions }.
// Nothing saves until the last answer or a skip.
export default function CheckInSheet({ morning, checkIn, onPick, onLater, onSave, onClose }) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [logged, setLogged] = useState(false);

  const shownAt = useRef(0);
  useEffect(() => { shownAt.current = Date.now(); }, [step, morning]);

  useEffect(() => {
    if (!logged) return;
    const timer = setTimeout(onClose, PAYOFF_MS);
    return () => clearTimeout(timer);
  }, [logged]);

  const skip = () => {
    onSave("skipped", answers);
    onClose();
  };

  const answer = (q, option) => {
    if (Date.now() - shownAt.current < TAP_GUARD_MS) return;
    const given = [...answers, { question_id: q.id, option_id: option.id }];
    setAnswers(given);
    if (step + 1 < checkIn.questions.length) setStep(step + 1);
    else {
      onSave("done", given);
      setLogged(true);
    }
  };

  if (morning) {
    return (
      <Sheet onDismiss={onLater}>
        <MorningPrompt onPick={onPick} onLater={onLater} />
      </Sheet>
    );
  }

  if (logged) {
    return (
      <Sheet onDismiss={onClose}>
        {/* TODO(PUL-13): take this line from the insights module once it's merged. */}
        <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink, textAlign: "center", paddingVertical: 16 }}>Logged.</Text>
      </Sheet>
    );
  }

  const q = checkIn.questions[step];
  const row = fitsInRow(q.options);
  return (
    <Sheet onDismiss={skip}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.faint }}>{step + 1} of {checkIn.questions.length}</Text>
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: T.small, color: t.muted }}>Skip</Text>
        </Pressable>
      </View>

      <Display size={26} style={{ marginTop: 8, marginBottom: 20 }}>{q.prompt}</Display>

      <View style={{ flexDirection: row ? "row" : "column", gap: 8 }}>
        {q.options.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => answer(q, o)}
            style={{ flex: row ? 1 : undefined, alignItems: row ? "center" : "flex-start", paddingVertical: 16, paddingHorizontal: row ? 4 : 18, borderRadius: 20, borderWidth: 1, borderColor: t.line }}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

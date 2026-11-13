import React, { useState } from "react";
import { View, Text } from "react-native";
import { useTheme, FONTS, T } from "../theme";
import * as api from "../lib/api";
import { shareOrCopy } from "../lib/pwa";
import { Btn, Label, Panel } from "./primitives";
import UsernameField from "./UsernameField";

const SMALL = { paddingVertical: 9, paddingHorizontal: 16 };

const SHARED = {
  copied: "Copied. Paste it into a message.",
  failed: "Couldn't share from here. Tell them your username instead.",
};

const failure = (e) => (/too many requests/.test(e?.message)
  ? "That's a lot of asks for one day. Try again tomorrow."
  : "That didn't work. Check your connection and try again.");

function Note({ children, style }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: FONTS.sans, fontSize: T.small, lineHeight: 18, color: t.muted, marginTop: 10, marginHorizontal: 4 }, style]}>{children}</Text>;
}

// p: { n, u }. children sit on the right, or under the name with `below`.
function PersonRow({ p, first, below, children }) {
  const t = useTheme();
  const name = (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text numberOfLines={1} style={{ fontFamily: FONTS.medium, fontSize: T.body, color: t.ink }}>{p.n}</Text>
      <Text numberOfLines={1} style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted, marginTop: 2 }}>@{p.u}</Text>
    </View>
  );
  return (
    <View style={{ paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderColor: t.line }}>
      {below ? (
        <>
          {name}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>{children}</View>
        </>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {name}
          {children}
        </View>
      )}
    </View>
  );
}

// Your own username, and a button to send it to someone with the link.
export function ShareUsername({ username }) {
  const t = useTheme();
  const [note, setNote] = useState(null);
  // shareOrCopy runs straight from the tap, so iOS opens its share sheet.
  const share = () => shareOrCopy(`I'm on Pulse. Add me: @${username}`).then((r) => setNote(SHARED[r] || null));
  return (
    <View>
      <Panel style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingRight: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.medium, fontSize: T.title, color: t.ink }}>@{username}</Text>
        <Btn variant="secondary" onPress={share} style={SMALL}>Share</Btn>
      </Panel>
      <Note>{note || "Send it to people so they can add you."}</Note>
    </View>
  );
}

// Find someone by their exact username and ask to add them, then the
// requests waiting either way. requests: api.myRequests()'s list.
// onChanged refetches requests and your circle after anything changes.
export default function FindPeople({ requests, onChanged }) {
  const t = useTheme();
  const [query, setQuery] = useState("");
  // undefined before a search, null when nobody has that username.
  const [found, setFound] = useState(undefined);
  // The id being acted on, or "find", so a double tap can't send twice.
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);

  const incoming = requests.filter((r) => r.incoming);
  const outgoing = requests.filter((r) => !r.incoming);
  const canFind = api.usernameOk(query) && !busy;

  const find = async () => {
    if (!canFind) return;
    setBusy("find");
    setNote(null);
    try {
      setFound(await api.findPerson(query));
    } catch {
      setNote("Couldn't search. Check your connection and try again.");
    }
    setBusy(null);
  };

  // One action for one person. state is what the search result becomes.
  const act = async (p, fn, state) => {
    if (busy) return;
    setBusy(p.id);
    setNote(null);
    try {
      const res = await fn(p.id);
      setFound((f) => (f?.id === p.id ? { ...f, state: state === undefined ? res : state } : f));
      onChanged();
    } catch (e) {
      setNote(failure(e));
    }
    setBusy(null);
  };
  // Asking someone who's asked you accepts.
  const ask = (p) => act(p, api.askToConnect);
  const decline = (p) => act(p, api.declineRequest, null);
  const cancel = (p) => act(p, api.cancelRequest, null);

  const status = (text) => <Text style={{ fontFamily: FONTS.sans, fontSize: T.small, color: t.muted }}>{text}</Text>;

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <UsernameField
          value={query} onChangeText={(v) => { setQuery(v); setFound(undefined); setNote(null); }} onSubmitEditing={find}
          placeholder="their username" style={{ flex: 1 }}
        />
        <Btn variant="secondary" onPress={find} disabled={!canFind} style={{ paddingVertical: 14 }}>Find</Btn>
      </View>

      {found === null && <Note>Nobody's called @{query}. Check the spelling with them.</Note>}
      {found && (
        <Panel style={{ marginTop: 12, paddingVertical: 0 }}>
          <PersonRow p={found} first>
            {found.state === "connected" ? status("In your circle")
              : found.state === "asked" ? status("Requested")
                : (
                  <Btn onPress={() => ask(found)} disabled={!!busy} style={SMALL} textStyle={{ fontSize: T.small }}>
                    {found.state === "asked_you" ? "Accept" : "Add"}
                  </Btn>
                )}
          </PersonRow>
        </Panel>
      )}
      {note && <Note>{note}</Note>}

      {incoming.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Label style={{ marginLeft: 4, marginBottom: 8 }}>Asked to add you</Label>
          <Panel style={{ paddingVertical: 0 }}>
            {incoming.map((r, i) => (
              <PersonRow key={r.id} p={r} first={!i} below>
                <Btn onPress={() => ask(r)} disabled={!!busy} style={{ ...SMALL, flex: 1 }} textStyle={{ fontSize: T.small }}>Accept</Btn>
                <Btn variant="secondary" onPress={() => decline(r)} disabled={!!busy} style={{ ...SMALL, flex: 1 }} textStyle={{ fontSize: T.small }}>Decline</Btn>
              </PersonRow>
            ))}
          </Panel>
          <Note>Accepting means you both see each other's levels. Declining doesn't tell them.</Note>
        </View>
      )}

      {outgoing.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Label style={{ marginLeft: 4, marginBottom: 8 }}>Waiting for them</Label>
          <Panel style={{ paddingVertical: 0 }}>
            {outgoing.map((r, i) => (
              <PersonRow key={r.id} p={r} first={!i}>
                <Btn variant="ghost" onPress={() => cancel(r)} disabled={!!busy} style={{ ...SMALL, paddingHorizontal: 8 }} textStyle={{ fontSize: T.small }}>Cancel</Btn>
              </PersonRow>
            ))}
          </Panel>
        </View>
      )}
    </View>
  );
}

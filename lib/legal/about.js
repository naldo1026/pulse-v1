// "About Pulse", shown in Settings. Plain text in structured sections so it
// can be reviewed on its own; components/LegalDoc.js draws it. Blocks are a
// paragraph string, { h }, { list }, { table: { head, rows } }, { note } or
// { columns: [{ head, items }] }.
// **Double asterisks** make bold. Keep the "who sees what" table in step
// with section 6 of lib/legal/privacy.js.

export default {
  id: "about",
  title: "About Pulse",
  version: "1.0",
  updated: "13 November 2026",
  intro: [
    "Pulse is a social battery app. You set how much energy you have for people, from 0 to 100, and the people close to you can see it. No explaining, no awkward texts: just a quick way to say \"not today\" or \"I'm up for something\", and to see when your friends are too.",
  ],
  sections: [
    {
      id: "why",
      heading: "Why Pulse exists",
      blocks: [
        "Everyone's social energy goes up and down. Some days you'd love company; some days even a text feels like a lot. Saying so can be hard, and guessing how friends feel is harder.",
        "Pulse makes that easy. Your level speaks for you, so the people who care about you know whether to invite you out, give you space, or just check in. And over time, Pulse shows you your own patterns, privately, so you can understand what lifts you and what drains you.",
      ],
    },
    {
      id: "battery",
      heading: "Your battery",
      blocks: [
        "The battery on the **Me** tab is the heart of Pulse. Drag it to set your level whenever it changes. If you're not sure, tap **Not sure?** and answer two quick questions.",
        { table: {
          head: ["Level", "State", "What it tells people"],
          rows: [
            ["0–20", "Drained", "Running on empty. Back soon."],
            ["21–40", "Low", "Texting's fine. Plans aren't."],
            ["41–60", "Okay", "Steady. Ask me nearer the time."],
            ["61–80", "Good", "Down for something chill."],
            ["81–100", "Full", "Up for anything."],
          ],
        } },
        "When you're Low or Drained, you can add a short status from **What's going on?** (for example \"Long day\" or \"Need quiet\") and turn on **Open to a chat** if you'd still like to hear from people. When you're above 60, you can say you're **around** for an hour, until 10, or all evening.",
      ],
    },
    {
      id: "pulses",
      heading: "Pulses",
      blocks: [
        "A pulse sends your current level to the groups in your Circle you choose (**Home**, **Family** and/or **Friends**) as a notification on their phones. You can send one pulse an hour. You'll see who has seen it.",
        "If someone in your Circle is around and at a similar level, Pulse may suggest meeting up.",
      ],
    },
    {
      id: "circle",
      heading: "Your Circle",
      blocks: [
        "The **Circle** tab shows the people in your Circle, arranged by the groups you've put them in: Home, Family and Friends. Anyone you haven't sorted counts as a friend. Groups are your own private labels; nobody sees which group you've put them in.",
        "**Adding people:** everyone on Pulse picks a username. To add someone, tap the add-person button on the Circle tab, type their exact username and ask. They get a notification and can accept or decline. Once they accept, you both see each other's levels. Nobody is told if you decline their request or remove them later. You can share your own username from the same screen.",
        { list: [
          "**Doodles:** give someone a little chalk doodle instead of their initial. Only you see it.",
          "**Nudges:** tap someone to **Ask** how they are, or reply **I'm in** or **Maybe** when they're around. They get a notification.",
          "**WhatsApp:** if you've added your number, people in your Circle can message you on WhatsApp straight from your Circle when you're open to a chat or around.",
        ] },
      ],
    },
    {
      id: "checkin",
      heading: "The morning check-in",
      blocks: [
        "After you set your first level of the day, Pulse asks three quick questions: how you slept, how social yesterday was, and one rotating question (such as whether you exercised, how busy today looks, or how stressed you feel). Every question is a tap, and you can skip any or all of them.",
        "If you like, Pulse can send you a morning notification at a time you choose to remind you to set your level. On Mondays it lets you know your week is in. You can turn it off in Settings.",
        "**Your check-in answers are private to you.** Nobody else on Pulse can see them.",
      ],
    },
    {
      id: "reasons",
      heading: "\"What made this change?\"",
      blocks: [
        "When your level moves a lot, Pulse may ask what made the change, with a few one-tap options or up to three words of your own. It asks at most once every half hour, and you can always skip. **These reasons are private to you.** They're separate from the \"What's going on?\" status, which others can see.",
      ],
    },
    {
      id: "week",
      heading: "My Week",
      blocks: [
        "**My Week** turns what you've logged into a picture of your week, for your eyes only.",
        { list: [
          "**The week chart:** your average level each day. Tap a day to see every change, your check-in and any pulses you sent.",
          "**Gauges:** how many days you saw people, how much of the week you were Low or Drained (wanting time alone), and how much you were up for something chill.",
          "**How your week felt:** the share of your week spent in each state.",
          "**Your patterns** (last 4 weeks): what lines up with higher or lower battery, small wins, personal records, how your patterns have changed, sleep, the day after being social, when you tend to dip, your week's shape, social activity and how often you've logged.",
        ] },
        "Insights unlock as you log. Until there's enough data, a card tells you how close you are. Every number comes from your own data, and insights compare rather than explain: \"after nights you rated 4–5, you averaged 68\", never \"poor sleep drains you\".",
      ],
    },
    {
      id: "type",
      heading: "Personality type",
      blocks: [
        "You can add your four-letter personality type in Settings (or choose \"Don't know\", or take a free test). Pulse uses it only to add reflective notes to My Week, such as \"people with your type often recharge on their own, and your data fits\". It's never a diagnosis, it's optional, and only you see it.",
      ],
    },
    {
      id: "visibility",
      heading: "What's shared and what's private",
      blocks: [
        { columns: [
          { head: "People in your Circle see", items: [
            "Your name and username",
            "Your current level and state",
            "When you last changed it",
            "Your \"What's going on?\" status",
            "\"Open to a chat\" and \"I'm around\"",
            "Your WhatsApp number, if you add one",
            "Pulses you send them",
            "Nudges between you and them",
          ] },
          { head: "Only you see", items: [
            "Your email address",
            "Your level history",
            "Your check-in answers",
            "Your \"What made this change?\" reasons",
            "My Week and all your insights",
            "Your personality type",
            "Your groups and doodles",
            "Who you've declined or removed",
            "Your settings",
          ] },
        ] },
        "Anyone on Pulse who types your exact username sees your name and username, so they can ask to add you. Nothing else.",
        "The full detail is in the **Privacy** tab.",
      ],
    },
    {
      id: "not",
      heading: "What Pulse isn't",
      blocks: [
        "Pulse is a way to share and reflect on your social energy. It isn't a medical device or a mental-health service, it doesn't diagnose anything, and it isn't monitored. Nobody will see your level and come to help.",
        { note: "If you're struggling, please talk to someone. In the UK you can call **NHS 111**, or **Samaritans on 116 123** (free, any time; also in Ireland). In an emergency, call **999** (UK) or **112** (EU). Elsewhere, findahelpline.com lists free services near you." },
      ],
    },
    {
      id: "who",
      heading: "Who makes Pulse",
      blocks: [
        "Pulse is made by **Roken Holdings Limited**. You can reach us at **rokenholdingsltd@gmail.com**.",
        "Pulse is in an **early test**. Things will change, some features will be rough around the edges, and your feedback genuinely shapes what comes next. Tell us what you think.",
      ],
    },
  ],
};

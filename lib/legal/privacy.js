// Privacy policy, shown in Settings and before sign-in. DRAFT: to be signed
// off by a solicitor before release. [●] marks facts still to confirm. It
// describes circles you both accept (PUL-25), open sign-up (PUL-26) and the
// 3-year deletion from PUL-22, all of which must ship before this is published. Format notes are in lib/legal/about.js.

const EMAIL = "rokenholdingsltd@gmail.com";

export default {
  id: "privacy",
  title: "Privacy policy",
  version: "1.0 (draft)",
  updated: "13 November 2026",
  intro: [
    { note: `**The short version.** Pulse is run by Roken Holdings Limited. We use your data to run Pulse for you and the people you choose, and for nothing else. We don't sell it, we don't advertise, and we don't use analytics or tracking. Your check-ins, private reasons, level history and insights are visible only to you. Your current level and status are visible to the people in your Circle, because that's what Pulse is for. Nobody joins your Circle unless you've both agreed. We treat your battery levels and check-in answers as health-related data and only use them with your explicit consent, which you can withdraw. We keep data for 3 years, and delete everything when you close your account. To use any of your rights, email ${EMAIL}.` },
    "This policy explains what personal data we collect when you use Pulse, why, what we do with it, who we share it with, how long we keep it, and your rights. It applies to the Pulse app and website. Please read it alongside our Terms of use.",
  ],
  sections: [
    {
      id: "who",
      heading: "1. Who we are",
      blocks: [
        `Pulse is provided by **Roken Holdings Limited**, a company registered in [●England and Wales] with company number [●], whose registered office is at 43 Oakmead Rd, [●town, postcode] ("**we**", "**us**", "**our**").`,
        "We are the **controller** of your personal data for the purposes of the UK General Data Protection Regulation (**UK GDPR**), the Data Protection Act 2018, the Privacy and Electronic Communications Regulations 2003 (**PECR**) and, for people in the European Union or European Economic Area, the EU General Data Protection Regulation (**EU GDPR**).",
        `**Contact.** For anything about this policy or your data, email **${EMAIL}**, or write to us at the address above. We are registered with the Information Commissioner's Office (ICO) under registration number [●].`,
        "**Data protection officer.** We are not required to appoint a data protection officer and have not done so. Our contact above handles all data protection matters.",
        "**EU representative.** Because we are not established in the EU but offer Pulse to people there, we have appointed [●name] as our representative under Article 27 of the EU GDPR. You can contact them at [●address, email] about anything relating to your data.",
      ],
    },
    {
      id: "summary",
      heading: "2. Summary",
      blocks: [
        { list: [
          "**What we collect:** your account details, what you set and log in Pulse (levels, statuses, your Circle, pulses, nudges, check-ins, reasons, settings), the technical details needed to send notifications, and basic technical data our hosting providers record.",
          "**Why:** to run Pulse for you, to share what you choose with the people you choose, to show you your own insights, and to keep Pulse secure.",
          "**Health-related data:** your levels, check-in answers and reasons may reveal information about your health. We only process these with your explicit consent.",
          "**Who sees it:** people in your Circle, meaning people you've both agreed to connect with, see your name, username, current level, status and availability. Someone who types your exact username sees only your name, so they can ask to add you. Everything else is private to you, apart from pulses, nudges and requests to add someone, which the people involved can see.",
          "**Who else:** our service providers (hosting and database) process data on our behalf under contract. We never sell your data or use it for advertising.",
          "**How long:** each record is deleted 3 years after it's created, and everything is deleted when you close your account.",
          `**Your rights:** you can access, correct, delete, export or restrict your data, object to some uses, and withdraw consent at any time. Email ${EMAIL}.`,
          "**Complaints:** you can complain to the ICO, or to the data protection authority where you live in the EU.",
        ] },
      ],
    },
    {
      id: "collect",
      heading: "3. The data we collect",
      blocks: [
        "We collect only what you give us by using Pulse, and a small amount of technical data our providers record automatically. We don't buy data about you or collect it from other sources.",
        { h: "Account" },
        { list: [
          "**Email address and password.** You give us these when you create an account; your password is stored only in a secure, irreversibly hashed form. We use them to sign you in.",
        ] },
        { h: "Profile (visible to people in your Circle)" },
        { list: [
          "**Your name** as you'd like it to appear.",
          "**Your username**, which you choose. Someone who types it exactly can see your name and username, so they can ask to add you.",
          "**Your current battery level** (0–100) and when you last changed it.",
          "**Your \"What's going on?\" status** (one of a few set phrases), which Pulse shows to your Circle when your level is 40 or under.",
          "**\"Open to a chat\"** and **\"I'm around\"** (with when your window ends).",
          "**Your WhatsApp number**, if you choose to add one.",
          "Whether you've finished setting up, and when your account was created.",
        ] },
        { h: "Activity with other people" },
        { list: [
          "**Pulses:** the level and status you sent, which groups you sent them to, who received them, when, and who has seen them.",
          "**Nudges:** \"Ask\", \"I'm in\" and \"Maybe\", who sent them, to whom and when.",
          "**Your Circle:** who's in it. Someone joins your Circle when one of you asks to add the other by username and the other accepts. Either of you can remove the other at any time.",
          "**Requests to add someone:** who asked whom, and when. If you decline a request, or remove someone from your Circle, we keep a private note of it so they can't keep notifying you. They aren't told.",
          "**Groups and doodles:** which group (Home, Family or Friends) you've put each person in, and the doodle you've given them. These are private to you.",
        ] },
        { h: "Private to you" },
        { list: [
          "**Level history:** every level you set, with the time.",
          "**Check-ins:** each day's check-in (done or skipped) and your answers: how you slept (1–5), how social the previous day was, and one rotating question such as how busy your day looks, whether you have time alone or social plans, your stress (1–5), whether you exercised, or your screen time.",
          "**\"What made this change?\" reasons:** the level before and after, the reason you chose or typed (up to three words), or that you skipped.",
          "**Insights:** My Week is calculated on your device from the data above each time you open it. We don't store the results.",
          "**Personality type:** your four-letter type or \"Don't know\", if you set one.",
          "**Settings:** morning check-in time (or off), time zone, colour theme, song choices and whether you've turned on Spotify (not yet active), and the date of your last morning notification.",
        ] },
        { h: "Notifications" },
        { list: [
          "If you allow notifications, your browser gives us a **push subscription** for each device: a web address at your browser's push service and the keys used to encrypt messages to it. We use it only to send you Pulse notifications.",
        ] },
        { h: "Technical data" },
        { list: [
          "Our hosting and database providers automatically record technical information when your device connects, such as **IP address**, browser type, time and the page or service requested. This is used for security and to keep the service running, and is kept by them for short periods (see section 9).",
        ] },
        { h: "On your device" },
        { list: [
          "See section 12 for what Pulse stores in your browser.",
        ] },
        "We do **not** collect your location, contacts, photos, microphone or camera, and we don't use analytics, advertising or tracking tools of any kind.",
      ],
    },
    {
      id: "health",
      heading: "4. Health-related data",
      blocks: [
        "Some of what you log in Pulse may reveal information about your physical or mental health, in particular your **battery levels and history**, your **check-in answers** (sleep, stress, exercise and similar), your **\"What made this change?\" reasons** and your **insights**. The law treats health data as a \"special category\" that needs extra protection (Article 9 UK GDPR and EU GDPR).",
        "We process this data only with your **explicit consent** (Article 9(2)(a)), which we ask for clearly and separately [●before your first check-in and when you set up Pulse]. Sharing your current level with the people in your Circle is the core of the service, and your explicit consent covers that too.",
        "**You can withdraw your consent at any time** by emailing us [●or in Settings]. Withdrawing doesn't affect what we did before. If you withdraw consent for check-ins and reasons, we stop asking and delete your past answers. Because Pulse can't work without sharing a level, withdrawing consent to that means closing your account.",
        "We never use health-related data for advertising, never sell it, and never use it to make decisions about you.",
      ],
    },
    {
      id: "use",
      heading: "5. How we use your data, and our lawful basis",
      blocks: [
        "We may only use your data where the law allows. This table sets out each purpose, the data involved, and the lawful basis we rely on.",
        { table: {
          head: ["Purpose", "Data", "Lawful basis"],
          rows: [
            ["Creating and running your account, signing you in", "Account", "Contract: needed to provide Pulse to you (Art. 6(1)(b))"],
            ["Showing your level, status and availability to your Circle; finding people by username and asking to add them; pulses, nudges and seen receipts", "Profile, activity", "Contract (Art. 6(1)(b)); for levels, explicit consent (Art. 9(2)(a))"],
            ["Asking and storing check-ins and reasons; level history; My Week insights", "Private data, levels", "Consent (Art. 6(1)(a)) and explicit consent (Art. 9(2)(a))"],
            ["Reflective notes based on your personality type", "Personality type", "Consent (Art. 6(1)(a)); optional, and you can remove it any time"],
            ["Sending notifications you've allowed (pulses, nudges, the morning check-in)", "Push subscription, profile", "Consent, given in your browser and Settings (Art. 6(1)(a))"],
            ["Keeping Pulse secure, preventing misuse, fixing faults", "Technical data, account", "Legitimate interests (Art. 6(1)(f))"],
            ["Responding to your rights requests and keeping necessary records", "Any relevant data", "Legal obligation (Art. 6(1)(c))"],
            ["Dealing with legal claims", "Any relevant data", "Legitimate interests (Art. 6(1)(f)); for health data, Art. 9(2)(f)"],
          ],
        } },
        "**Legitimate interests.** Where we rely on legitimate interests, our interest is keeping Pulse safe, secure and working. We've weighed this against your interests: the data involved is limited technical data, kept briefly, used only for that purpose, and it's what you'd reasonably expect. You can object (section 10).",
        "We don't use your data for any other purpose. If we ever want to, we'll tell you first and, where needed, ask for your consent.",
      ],
    },
    {
      id: "see",
      heading: "6. Who can see your data",
      blocks: [
        "Only people with a Pulse account can see anything, and nobody sees your level until you've both agreed to be in each other's Circle. Here's exactly who sees what:",
        { table: {
          head: ["Who", "What they can see"],
          rows: [
            ["Anyone on Pulse who types your exact username", "Your name and username, so they can ask to add you. Nothing else. There's no way to list or browse everyone on Pulse."],
            ["Someone you've asked to add, or who has asked to add you", "Your name and username, while the request is waiting. If you decline it, they aren't told."],
            ["People in your Circle", "Your name and username; current level and state; when you last changed it; your \"What's going on?\" status; \"Open to a chat\"; \"I'm around\" and until when; your WhatsApp number, if you've added one"],
            ["People in your Circle you send a pulse to", "That pulse (level, status, time) and, to you, whether they've seen it"],
            ["The person you nudge, or who nudges you", "That nudge. Only people in each other's Circle can nudge."],
            ["Only you", "Your email, level history, check-ins and answers, private reasons, insights, personality type, groups and doodles, who you've declined or removed, settings and push subscriptions"],
            ["Us", "Our staff can access data only where needed to run, support or secure Pulse, or to respond to you, and are bound by confidentiality"],
          ],
        } },
        "Notifications show on the recipient's device and may be visible on their lock screen, including your name, state and status.",
        "We may also disclose data where the law requires it (for example, to comply with a court order), to protect someone's vital interests, or to a buyer if our business is sold, in which case this policy will continue to apply to your data.",
      ],
    },
    {
      id: "processors",
      heading: "7. Our service providers",
      blocks: [
        "We use trusted providers to run Pulse. They act as our **processors**: they can only use your data on our instructions, under a written contract that meets the requirements of Article 28, and must keep it secure.",
        { table: {
          head: ["Provider", "What they do", "Where"],
          rows: [
            ["Supabase, Inc.", "Database, sign-in, and the functions that send notifications. Stores all the data in section 3.", "[●region]; company in the USA"],
            ["Vercel, Inc.", "Hosts and delivers the Pulse app to your browser. Records technical data.", "Global network; company in the USA [●plan, region]"],
            ["Your browser's push service (Apple, Google or Mozilla, depending on your device)", "Delivers notifications to your device. Message content is end-to-end encrypted, so they can't read it; they see technical delivery data.", "Varies by provider"],
            ["[●Email provider, AI provider]", "[●Monthly email summary, if introduced. This policy will be updated before it is.]", "[●]"],
          ],
        } },
        "**Links that take you elsewhere.** If you tap a WhatsApp button, WhatsApp opens with a message you can edit and send; what happens next is governed by WhatsApp's own terms and privacy policy. The \"Take the free test\" link opens 16Personalities in your browser; we don't send them anything. We're not responsible for those services.",
        "We **never sell** your personal data, and we don't share it with advertisers or data brokers.",
      ],
    },
    {
      id: "transfers",
      heading: "8. International transfers",
      blocks: [
        "Pulse is available worldwide, and our providers operate internationally, so your data may be processed outside the UK and the EU/EEA.",
        { list: [
          "**Between the UK and EU/EEA**, data flows under the UK's and EU's adequacy decisions for each other.",
          "**To the USA and other countries**, we rely on: the UK Extension to the EU–US Data Privacy Framework or the EU–US Data Privacy Framework where the provider is certified; or the International Data Transfer Agreement (IDTA) or the International Data Transfer Addendum to the EU Standard Contractual Clauses, with any extra measures needed.",
        ] },
        "You can ask us for more information about these safeguards, and a copy of the relevant documents, by emailing us.",
      ],
    },
    {
      id: "retention",
      heading: "9. How long we keep your data",
      blocks: [
        { table: {
          head: ["Data", "How long"],
          rows: [
            ["Level history, check-ins and answers, private reasons, pulses, seen receipts, nudges", "3 years from when each record is created, then deleted automatically"],
            ["Account, profile, settings, your Circle, who you've declined or removed, groups and doodles, push subscriptions", "Until you close your account (a push subscription is also removed when your browser tells us it's no longer valid)"],
            ["Requests to add someone", "Until the request is accepted or cancelled, or either account is closed"],
            ["Everything, when you close your account", "Deleted from our live systems straight away; removed from our providers' backups within [●days] as backups expire"],
            ["Technical logs kept by our providers", "[●Short periods set by each provider, typically days to weeks]"],
            ["Records of your rights requests and consents", "As long as needed to show we've met our legal obligations, and no longer than 6 years"],
          ],
        } },
        "We may keep data for longer only where the law requires it, or where it's needed to establish or defend a legal claim, and then only the data needed.",
      ],
    },
    {
      id: "rights",
      heading: "10. Your rights",
      blocks: [
        "You have the following rights over your personal data. To use any of them, email **" + EMAIL + "**. It's free, and we'll respond within **one month**. If a request is complex, we may extend that by up to two further months and will tell you why. We may need to confirm your identity first. We can refuse or charge a reasonable fee only if a request is manifestly unfounded or excessive, and we'll explain why.",
        { list: [
          "**Access:** get a copy of your data and information about how we use it.",
          "**Rectification:** have inaccurate data corrected. You can change your name, number, type and settings in Pulse yourself.",
          "**Erasure:** have your data deleted, including closing your account.",
          "**Restriction:** ask us to pause using your data, for example while we check its accuracy.",
          "**Portability:** receive the data you gave us in a structured, machine-readable format, or have it sent to another provider.",
          "**Objection:** object to our use of your data based on legitimate interests. We'll stop unless we have compelling grounds.",
          "**Withdraw consent:** at any time, without affecting what we did before. See section 4.",
          "**Automated decisions:** not be subject to decisions based solely on automated processing that have legal or similarly significant effects. We don't make any (section 11).",
        ] },
      ],
    },
    {
      id: "automated",
      heading: "11. Automated processing and profiling",
      blocks: [
        "My Week calculates insights automatically from your own data: averages, comparisons, patterns and records. This happens on your device, the results are shown only to you, and they're reflections, not judgements or diagnoses. They aren't used to make any decision about you and have no legal or similarly significant effect. We don't profile you for advertising or any other purpose.",
      ],
    },
    {
      id: "device",
      heading: "12. Storage on your device",
      blocks: [
        "Pulse doesn't use cookies. It stores two things in your browser's local storage:",
        { table: {
          head: ["What", "Why", "How long"],
          rows: [
            ["Your sign-in session", "Strictly necessary to keep you signed in", "Until you sign out"],
            ["What you last saw on My Week", "To show a dot when something new appears, a feature you use", "Until you clear your browser data"],
          ],
        } },
        "Pulse also registers a service worker, which lets it work as a home-screen app and receive notifications. It doesn't store your personal data. Under PECR, storage that's strictly necessary for a service you've asked for doesn't need consent. [●Confirm the \"last seen\" record falls within this exemption, or ask for consent.] There are no analytics, advertising or third-party tracking technologies in Pulse.",
      ],
    },
    {
      id: "security",
      heading: "13. Security",
      blocks: [
        { list: [
          "All data travels over encrypted connections (HTTPS/TLS), and our providers encrypt stored data.",
          "Passwords are stored only as secure hashes.",
          "Database access rules (row-level security) make sure each account can only read what this policy says it can.",
          "Notifications are end-to-end encrypted to your device.",
          "Access by our staff is limited to what's needed, and protected by strong authentication.",
        ] },
        "No system is perfectly secure, but we take appropriate technical and organisational measures for the nature of the data, including its health-related parts. Please keep your password private and tell us straight away if you think your account has been misused.",
      ],
    },
    {
      id: "children",
      heading: "14. Children and young people",
      blocks: [
        "You must be **15 or over** to use Pulse. If we learn that someone under 15 has an account, we'll close it and delete their data.",
        "We've designed Pulse with the ICO's Age Appropriate Design Code in mind: the most private settings are the default, check-ins and reasons are private, there's no advertising or tracking, no location data, and nothing is shared beyond what Pulse shows on screen. [●We have carried out a data protection impact assessment.]",
        "In some EU countries the age at which you can consent to online services yourself is 16. If you're 15 and live in one of those countries, [●we'll need consent from your parent or guardian, which we'll ask for before you start].",
      ],
    },
    {
      id: "breaches",
      heading: "15. If something goes wrong",
      blocks: [
        "If a personal data breach happens, we'll report it to the ICO (and, where relevant, the competent EU authority) within 72 hours of becoming aware of it where the law requires. If it's likely to result in a high risk to you, we'll tell you without undue delay, explaining what happened and what you can do.",
      ],
    },
    {
      id: "changes",
      heading: "16. Changes to this policy",
      blocks: [
        "We'll update this policy when Pulse changes, for example before introducing the monthly email summary. The version number and date at the top show when it last changed. We'll tell you in Pulse before any significant change takes effect, and where a change needs your consent, we'll ask for it again rather than assume it.",
      ],
    },
    {
      id: "complaints",
      heading: "17. Complaints",
      blocks: [
        `If you're unhappy with how we've handled your data, please contact us first at **${EMAIL}** and we'll try to put it right.`,
        "You also have the right to complain to the **Information Commissioner's Office**: ico.org.uk/make-a-complaint, 0303 123 1113, or Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF. If you live in the EU/EEA, you can complain to the data protection authority in your country.",
      ],
    },
    {
      id: "version",
      heading: "18. Version",
      blocks: [
        "Version 1.0 (draft), 13 November 2026.",
      ],
    },
  ],
};

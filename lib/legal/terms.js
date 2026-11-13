// Terms of use, shown in Settings and before sign-in. DRAFT: to be signed
// off by a solicitor before release. [●] marks facts still to confirm.
// Format notes are in lib/legal/about.js.

const EMAIL = "rokenholdingsltd@gmail.com";

export default {
  id: "terms",
  title: "Terms of use",
  version: "1.0 (draft)",
  updated: "13 November 2026",
  intro: [
    { note: "**The short version.** Pulse is free while it's being tested. Be kind and use it as intended. Your level and status are visible to the people in your Circle. Pulse isn't medical advice or an emergency service. We'll try to keep it running well but can't promise it always will. You can stop using it whenever you like. These terms don't take away any of your legal rights as a consumer." },
    "These terms set out the agreement between you and us when you use Pulse. Please read them carefully. By using Pulse, you agree to them. If you don't agree, please don't use Pulse. Our Privacy policy explains how we use your personal data and forms part of these terms.",
  ],
  sections: [
    {
      id: "who",
      heading: "1. Who we are",
      blocks: [
        `Pulse is provided by **Roken Holdings Limited**, a company registered in [●England and Wales] with company number [●], whose registered office is at 43 Oakmead Rd, [●town, postcode] ("**we**", "**us**", "**our**"). You can contact us at **${EMAIL}**.`,
        "These terms are a contract between you and us. No one else has any rights under them.",
      ],
    },
    {
      id: "eligibility",
      heading: "2. Who can use Pulse",
      blocks: [
        { list: [
          "You must be **15 or over**.",
          "If you're under 18, please make sure a parent or guardian knows you're using Pulse and has read these terms with you. [●In EU countries where the age of digital consent is 16, a 15-year-old needs a parent's or guardian's consent before using Pulse.]",
          "You must use Pulse for personal, non-commercial purposes only.",
        ] },
        "If we find that someone doesn't meet these requirements, we may close their account.",
      ],
    },
    {
      id: "accounts",
      heading: "3. Your account",
      blocks: [
        { list: [
          "You create your account with an email address and a password, and choose a username. You can change your password and username in Settings.",
          "Each account is for **one person**. Don't share your account or let anyone else use it.",
          "Keep your password private. You're responsible for activity on your account unless it happened because of something we did wrong.",
          `Tell us straight away at ${EMAIL} if you think someone else has accessed your account.`,
          "Make sure the details you give us, such as your name and username, are accurate and don't impersonate anyone.",
        ] },
      ],
    },
    {
      id: "service",
      heading: "4. The service",
      blocks: [
        { list: [
          "Pulse is **free** while it's being tested. If we ever plan to charge, we'll tell you clearly in advance, and you won't be charged unless you agree.",
          "Pulse is a test version. Features may change, be added or be removed, and things may not always work perfectly. We'll take reasonable care and skill in providing it, and try to give notice of significant changes.",
          "We may suspend Pulse briefly for maintenance, updates or security reasons. We may also end the test or stop providing Pulse, giving you reasonable notice where we can, so you can ask for a copy of your data first.",
          "Pulse needs a compatible device and internet connection, which you're responsible for. Notifications depend on your device and browser settings.",
        ] },
      ],
    },
    {
      id: "medical",
      heading: "5. Pulse isn't medical advice",
      blocks: [
        "Pulse helps you share and reflect on your social energy. It is **not** a medical device, a diagnostic tool, a mental-health service or a substitute for professional advice. Insights and personality notes are reflections on your own data, not diagnoses, and aren't intended to be relied on for decisions about your health.",
        "**Pulse isn't monitored and isn't an emergency service.** Setting a low level, choosing a status or sending a pulse doesn't alert anyone to help you.",
        { note: "If you're struggling, please talk to someone. In the UK you can call **NHS 111** or **Samaritans on 116 123** (free, any time; also in Ireland). In an emergency, call **999** (UK) or **112** (EU). Elsewhere, findahelpline.com lists free services near you." },
      ],
    },
    {
      id: "use",
      heading: "6. Using Pulse responsibly",
      blocks: [
        "Pulse works because people trust each other with how they're feeling. When you use it, you agree **not** to:",
        { list: [
          "harass, bully, threaten, pressure or embarrass anyone, including through repeated requests to add them, nudges or pulses;",
          "use someone's level, status or WhatsApp number for anything they wouldn't expect, such as sharing it outside Pulse without their permission;",
          "impersonate anyone, or use a misleading name or username;",
          "use Pulse for anything unlawful, or to send spam or advertising;",
          "try to access anyone else's account or data, or get around Pulse's privacy controls;",
          "scrape, copy, collect or harvest data from Pulse, or access it by automated means;",
          "probe, scan or test Pulse's security, or reverse engineer or decompile it, except as the law allows. If you find a security problem, please tell us privately at " + EMAIL + ";",
          "interfere with or disrupt Pulse, or overload its systems.",
        ] },
      ],
    },
    {
      id: "sharing",
      heading: "7. What you share",
      blocks: [
        { list: [
          "**Your level, state, status and availability are visible to the people in your Circle:** people who accepted your request to add them, and people whose request you accepted. Pulses go to the groups in your Circle you choose, and your WhatsApp number, if you add one, is visible to your Circle too. Only share what you're comfortable with.",
          "Anyone who knows your username can find your name and ask to add you. It's up to you whether to accept, and you can remove someone from your Circle at any time.",
          "You're responsible for what you choose to share, including any words you type.",
          "Be thoughtful about other people's privacy. What you see in Pulse is shared with you in confidence.",
          "Your check-ins, private reasons and insights are private to you, as explained in the Privacy policy.",
        ] },
      ],
    },
    {
      id: "third-party",
      heading: "8. Other services",
      blocks: [
        "Some features link to services we don't control: **WhatsApp** (to message people in your Circle), **16Personalities** (the free personality test) and your browser's **push notification service**. Your use of those services is governed by their own terms and privacy policies, and we're not responsible for them.",
      ],
    },
    {
      id: "ip",
      heading: "9. Intellectual property",
      blocks: [
        { list: [
          "Pulse, including its design, software, text and graphics, belongs to us or our licensors. We give you a personal, non-exclusive, non-transferable, revocable licence to use Pulse in line with these terms.",
          "Anything you add to Pulse (such as your name and the words you type) stays yours. You give us a non-exclusive, royalty-free licence to store and display it in Pulse, to the people you share it with, only so we can provide Pulse to you. This licence ends when the content is deleted.",
          "The doodles are Doodle Icons by Khushmeen Sidhu, released under CC0. Other third-party components are used under their own licences.",
        ] },
      ],
    },
    {
      id: "ending",
      heading: "10. Ending your use of Pulse",
      blocks: [
        { list: [
          `**You can stop using Pulse at any time.** To close your account and have your data deleted, email ${EMAIL}.`,
          "We may suspend or close your account if you seriously or repeatedly break these terms, if we must do so by law, or to protect other people or Pulse. Where reasonable, we'll tell you why first and give you a chance to put things right.",
          "If we close Pulse or your account, we'll delete your data as explained in the Privacy policy. Sections 5, 9, 11 and 13 continue to apply.",
        ] },
      ],
    },
    {
      id: "liability",
      heading: "11. Our responsibility to you",
      blocks: [
        { list: [
          "**Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for anything else that can't be limited or excluded by law,** including your rights as a consumer under the Consumer Rights Act 2015.",
          "If we break these terms or fail to use reasonable care and skill, we're responsible for loss or damage you suffer that is a foreseeable result. Loss is foreseeable if it's obvious it will happen, or if we both knew it might happen when you started using Pulse.",
          "Pulse is for personal use. We're not responsible for business losses, such as lost profits, business or opportunity.",
          "We're not responsible for: what other people choose to do with what you share with them; services we don't control (section 8); delays or failures caused by events outside our reasonable control; or decisions you make based on insights, which aren't medical advice (section 5).",
          "Because Pulse is free, our total liability to you for anything arising under these terms, other than liability we can't limit by law, is limited to [●£100].",
        ] },
      ],
    },
    {
      id: "changes",
      heading: "12. Changes to these terms",
      blocks: [
        "We may update these terms, for example to reflect changes to Pulse or the law. The version number and date at the top show when they last changed. We'll tell you in Pulse before significant changes take effect. If you don't agree with the changes, you can stop using Pulse and close your account; if you keep using it after they take effect, the new terms will apply.",
      ],
    },
    {
      id: "law",
      heading: "13. Law and disputes",
      blocks: [
        `If you have a concern, please contact us first at **${EMAIL}**. We'll try to resolve it quickly and fairly.`,
        { list: [
          "These terms are governed by the **law of England and Wales**, and the courts of England and Wales have jurisdiction.",
          "If you live in **Scotland** or **Northern Ireland**, you can also bring proceedings in your local courts, and your local law's mandatory protections apply.",
          "If you live in the **EU/EEA** or elsewhere, you keep the protection of the mandatory consumer laws of the country where you live, and you can bring proceedings in your local courts.",
          "If any part of these terms is found to be unenforceable, the rest still applies. If we don't enforce a term straight away, we can still do so later.",
        ] },
      ],
    },
    {
      id: "version",
      heading: "14. Version",
      blocks: [
        "Version 1.0 (draft), 13 November 2026.",
      ],
    },
  ],
};

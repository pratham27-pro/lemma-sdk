import { getClient, TABLE } from './lemma';

interface SeedSignal {
  type: 'bug' | 'feature' | 'ux' | 'churn' | 'positive';
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  feature_area: string;
  quote: string;
  summary: string;
}

interface SeedTicket {
  raw_text: string;
  source: 'email' | 'slack' | 'form' | 'chat' | 'upload';
  signals: SeedSignal[];
}

const DEMO_TICKETS: SeedTicket[] = [
  // ── Charging Case ────────────────────────────────────────────────────────────
  {
    source: 'email',
    raw_text: `Hi, I've had my ProBuds X for about three weeks now and the charging case is already falling apart. The hinge feels completely loose and the lid won't stay shut. I keep finding the case open in my bag with the earbuds uncharged. This is unacceptable for a $150 product. I'd like a replacement case urgently.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Charging Case', quote: 'The hinge feels completely loose and the lid won\'t stay shut', summary: 'Charging case hinge loose and lid fails to stay closed after 3 weeks' },
      { type: 'churn', severity: 'P1', feature_area: 'Charging Case', quote: 'This is unacceptable for a $150 product', summary: 'Customer expressing frustration at build quality relative to price point' },
      { type: 'feature', severity: 'P2', feature_area: 'Warranty/Returns', quote: 'I\'d like a replacement case urgently', summary: 'Customer requests replacement charging case' },
    ],
  },
  {
    source: 'form',
    raw_text: `Product: ProBuds X. Issue: The charging case lid pops open on its own. I put the earbuds in my jacket pocket and by the time I reached the gym they had fallen out because the case was open. Nearly lost them. The magnetic closure is way too weak. Please fix this or send me a new case.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Charging Case', quote: 'The charging case lid pops open on its own', summary: 'Charging case lid opens spontaneously due to weak magnetic closure' },
      { type: 'bug', severity: 'P0', feature_area: 'Charging Case', quote: 'the earbuds had fallen out because the case was open', summary: 'Earbuds fell out of open case — risk of loss' },
      { type: 'feature', severity: 'P2', feature_area: 'Charging Case', quote: 'The magnetic closure is way too weak', summary: 'Magnetic case closure requires stronger magnet design' },
    ],
  },
  {
    source: 'chat',
    raw_text: `Customer: My charging case stopped charging completely. The LED doesn't light up at all when I plug in USB-C. I've tried three different cables. The earbuds are at 5% and I can't charge them. This is a total brick situation. Agent: Can you try a different power adapter? Customer: Yes tried that too. Still nothing. I need this resolved today.`,
    signals: [
      { type: 'bug', severity: 'P0', feature_area: 'Charging Case', quote: 'The LED doesn\'t light up at all when I plug in USB-C', summary: 'Charging case completely unresponsive to USB-C input, no LED indicator' },
      { type: 'bug', severity: 'P0', feature_area: 'Charging Case', quote: 'The earbuds are at 5% and I can\'t charge them', summary: 'Earbuds effectively bricked due to charging case failure' },
      { type: 'ux', severity: 'P2', feature_area: 'Customer Support', quote: 'I need this resolved today', summary: 'Customer urgency not met by support response speed' },
    ],
  },

  // ── Bluetooth / Connectivity ──────────────────────────────────────────────────
  {
    source: 'email',
    raw_text: `I've been using the ProBuds X for a month and the Bluetooth keeps cutting out randomly. It happens at least 5–6 times per hour, even when my phone is in my pocket. Music just drops for a second then reconnects. It's making them unusable during workouts. I've tried re-pairing multiple times but the problem persists.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Bluetooth', quote: 'the Bluetooth keeps cutting out randomly. It happens at least 5–6 times per hour', summary: 'Bluetooth drops 5-6 times per hour even with phone in pocket' },
      { type: 'bug', severity: 'P1', feature_area: 'Bluetooth', quote: 'I\'ve tried re-pairing multiple times but the problem persists', summary: 'Re-pairing does not fix intermittent Bluetooth dropout issue' },
      { type: 'churn', severity: 'P2', feature_area: 'Bluetooth', quote: 'It\'s making them unusable during workouts', summary: 'Bluetooth instability rendering product unusable for core use case' },
    ],
  },
  {
    source: 'slack',
    raw_text: `hey support team — ProBuds X won't connect to my Windows 11 laptop at all. They pair fine with my iPhone but the laptop just says "connection failed" every time. I've updated my Bluetooth drivers, removed and re-added the device, nothing works. This is urgent for me because I use them for remote meetings all day.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Bluetooth', quote: 'the laptop just says "connection failed" every time', summary: 'ProBuds X fails to connect to Windows 11 despite successful iPhone pairing' },
      { type: 'ux', severity: 'P2', feature_area: 'Bluetooth', quote: 'I\'ve updated my Bluetooth drivers, removed and re-added the device, nothing works', summary: 'Standard troubleshooting steps ineffective for Windows connectivity issue' },
      { type: 'churn', severity: 'P1', feature_area: 'Bluetooth', quote: 'I use them for remote meetings all day', summary: 'Connectivity failure blocking primary professional use case' },
    ],
  },
  {
    source: 'form',
    raw_text: `The left earbud randomly disconnects from the right one. They work fine together for about 10 minutes and then the left goes silent. I have to put them back in the case and re-open it to fix it. This happens every single listening session. Model: ProBuds X. Firmware: 2.1.4.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Bluetooth', quote: 'the left earbud randomly disconnects from the right one', summary: 'Left earbud disconnects from right earbud every ~10 minutes' },
      { type: 'bug', severity: 'P2', feature_area: 'Bluetooth', quote: 'I have to put them back in the case and re-open it to fix it', summary: 'Only workaround for inter-earbud disconnect is case reset cycle' },
      { type: 'feature', severity: 'P2', feature_area: 'Firmware', quote: 'Firmware: 2.1.4', summary: 'Firmware 2.1.4 may be related to inter-earbud Bluetooth stability regression' },
    ],
  },

  // ── Battery Life ──────────────────────────────────────────────────────────────
  {
    source: 'email',
    raw_text: `I bought the ProBuds X based on the advertised 8-hour battery life. In reality I'm getting maybe 3–4 hours max. I primarily listen at 60–70% volume without ANC. I did a full charge cycle twice and the issue persists. This feels like false advertising. Is this a known defect or do I just have a bad unit?`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Battery', quote: 'I\'m getting maybe 3–4 hours max', summary: 'Battery life 50-60% below advertised 8-hour spec at moderate volume without ANC' },
      { type: 'churn', severity: 'P1', feature_area: 'Battery', quote: 'This feels like false advertising', summary: 'Customer perceiving battery discrepancy as deceptive marketing' },
      { type: 'ux', severity: 'P2', feature_area: 'Battery', quote: 'Is this a known defect or do I just have a bad unit?', summary: 'No public documentation about battery performance expectations or defect acknowledgment' },
    ],
  },
  {
    source: 'chat',
    raw_text: `Support chat: My ProBuds X say they're fully charged but after 2 hours they're dead. The case also doesn't seem to hold a charge — I charged it overnight and the indicator shows full but then it only charges the buds once before dying. Something is wrong with the battery system overall.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Battery', quote: 'after 2 hours they\'re dead', summary: 'Earbuds losing full charge within 2 hours despite showing 100%' },
      { type: 'bug', severity: 'P1', feature_area: 'Charging Case', quote: 'it only charges the buds once before dying', summary: 'Charging case depleting after single charge cycle rather than the rated 3 cycles' },
      { type: 'bug', severity: 'P2', feature_area: 'Battery', quote: 'the indicator shows full but then', summary: 'Battery percentage indicator inaccurate — reports full when capacity is degraded' },
    ],
  },

  // ── App / Software ────────────────────────────────────────────────────────────
  {
    source: 'form',
    raw_text: `The ProBuds companion app crashes immediately on launch on my iPhone 15 Pro (iOS 17.4). I reinstalled it twice. Without the app I can't change EQ settings, check battery levels, or update firmware. Other users on Reddit are reporting the same crash. Please fix this ASAP.`,
    signals: [
      { type: 'bug', severity: 'P0', feature_area: 'iOS App', quote: 'The ProBuds companion app crashes immediately on launch on my iPhone 15 Pro (iOS 17.4)', summary: 'App crashes on launch on iOS 17.4 / iPhone 15 Pro — complete feature loss' },
      { type: 'bug', severity: 'P1', feature_area: 'Firmware', quote: 'Without the app I can\'t update firmware', summary: 'App crash blocks firmware updates, leaving devices on potentially buggy versions' },
      { type: 'ux', severity: 'P2', feature_area: 'iOS App', quote: 'Other users on Reddit are reporting the same crash', summary: 'iOS 17.4 crash is widespread per user-reported community posts' },
    ],
  },
  {
    source: 'email',
    raw_text: `The app never shows accurate battery levels for either earbud. It shows 100% when they're clearly low, or sometimes shows one bud at 0% when they're both working fine. I've given it all the Bluetooth permissions. The core reason I downloaded the app was to monitor battery and it doesn't even do that right.`,
    signals: [
      { type: 'bug', severity: 'P2', feature_area: 'iOS App', quote: 'The app never shows accurate battery levels for either earbud', summary: 'Battery percentage display in app consistently inaccurate for both earbuds' },
      { type: 'ux', severity: 'P2', feature_area: 'iOS App', quote: 'The core reason I downloaded the app was to monitor battery and it doesn\'t even do that right', summary: 'Primary app use case (battery monitoring) is broken, undermining app value proposition' },
    ],
  },
  {
    source: 'slack',
    raw_text: `Quick bug report — the EQ presets in the ProBuds app reset to default every time I restart the earbuds. I set up a custom bass boost, close the app, next day it's flat again. Android 14, app version 3.2.1. Would love it if EQ settings persisted on the device itself.`,
    signals: [
      { type: 'bug', severity: 'P2', feature_area: 'Android App', quote: 'the EQ presets in the ProBuds app reset to default every time I restart the earbuds', summary: 'Custom EQ settings not persisted across earbud restarts on Android' },
      { type: 'feature', severity: 'P3', feature_area: 'Android App', quote: 'Would love it if EQ settings persisted on the device itself', summary: 'Request for on-device EQ storage so settings survive app/earbud restarts' },
    ],
  },

  // ── Sound / ANC / Hardware ────────────────────────────────────────────────────
  {
    source: 'email',
    raw_text: `The active noise cancellation on my ProBuds X is basically non-functional. I'm in an open office and I can hear every conversation clearly even with ANC on max. My previous $80 earbuds did a much better job. Either the ANC is broken on my unit or the specs are massively overstated. Very disappointed.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'ANC', quote: 'I can hear every conversation clearly even with ANC on max', summary: 'ANC providing no meaningful noise reduction in office environment' },
      { type: 'churn', severity: 'P1', feature_area: 'ANC', quote: 'My previous $80 earbuds did a much better job', summary: 'Customer comparing ANC unfavorably to cheaper competing product' },
      { type: 'churn', severity: 'P2', feature_area: 'ANC', quote: 'Very disappointed', summary: 'Strong dissatisfaction signal — churn risk' },
    ],
  },
  {
    source: 'form',
    raw_text: `Right earbud stopped producing sound after 6 weeks. Left one works fine. I've cleaned the contacts, reset the earbuds, re-paired — nothing. Paid $150 and half of it is dead. I work in audio production and relied on these as backup monitors. Need warranty replacement immediately.`,
    signals: [
      { type: 'bug', severity: 'P0', feature_area: 'Hardware', quote: 'Right earbud stopped producing sound after 6 weeks', summary: 'Right earbud complete audio failure after 6 weeks — total unit defect' },
      { type: 'churn', severity: 'P0', feature_area: 'Hardware', quote: 'Paid $150 and half of it is dead', summary: 'High-value customer with total hardware failure — immediate churn risk' },
      { type: 'feature', severity: 'P1', feature_area: 'Warranty/Returns', quote: 'Need warranty replacement immediately', summary: 'Warranty replacement needed for dead right earbud' },
    ],
  },

  // ── Positive / Mixed ─────────────────────────────────────────────────────────
  {
    source: 'email',
    raw_text: `Just wanted to say the sound quality on the ProBuds X is genuinely outstanding. The bass is punchy without being muddy and the mids are crystal clear. I use them during my daily run and they stay in perfectly. The only thing I wish was better is the touch control sensitivity — sometimes I have to tap twice before it registers.`,
    signals: [
      { type: 'positive', severity: 'P3', feature_area: 'Audio Quality', quote: 'the sound quality on the ProBuds X is genuinely outstanding', summary: 'Customer highly satisfied with overall audio quality' },
      { type: 'positive', severity: 'P3', feature_area: 'Fit', quote: 'I use them during my daily run and they stay in perfectly', summary: 'Positive feedback on earbud fit stability during physical activity' },
      { type: 'ux', severity: 'P3', feature_area: 'Touch Controls', quote: 'sometimes I have to tap twice before it registers', summary: 'Touch control sensitivity too low — requires multiple taps to register' },
    ],
  },
  {
    source: 'chat',
    raw_text: `Hi! I love my ProBuds X overall — the call quality is crystal clear and everyone says they can hear me perfectly. My only issue is the microphone picks up a lot of wind noise when I'm outside. Even a slight breeze ruins the call. Can you recommend a wind reduction setting or is this something that can be fixed in a firmware update?`,
    signals: [
      { type: 'positive', severity: 'P3', feature_area: 'Microphone', quote: 'the call quality is crystal clear and everyone says they can hear me perfectly', summary: 'Customer satisfied with indoor microphone and call clarity' },
      { type: 'bug', severity: 'P2', feature_area: 'Microphone', quote: 'Even a slight breeze ruins the call', summary: 'Microphone picks up excessive wind noise outdoors degrading call quality' },
      { type: 'feature', severity: 'P2', feature_area: 'Firmware', quote: 'Can you recommend a wind reduction setting or is this something that can be fixed in a firmware update?', summary: 'Request for wind noise reduction feature via firmware or app setting' },
    ],
  },
  {
    source: 'form',
    raw_text: `The firmware update I installed yesterday (v2.2.0) seems to have broken the transparency mode. It used to let ambient sound through clearly but now it sounds like everything is underwater — a weird digital distortion on all ambient audio. Please roll back or push a fix.`,
    signals: [
      { type: 'bug', severity: 'P1', feature_area: 'Firmware', quote: 'everything is underwater — a weird digital distortion on all ambient audio', summary: 'Firmware v2.2.0 introduced audio distortion in transparency mode' },
      { type: 'bug', severity: 'P1', feature_area: 'Transparency Mode', quote: 'The firmware update I installed yesterday (v2.2.0) seems to have broken the transparency mode', summary: 'Transparency mode regressed in firmware v2.2.0' },
      { type: 'feature', severity: 'P1', feature_area: 'Firmware', quote: 'Please roll back or push a fix', summary: 'Customer requesting firmware rollback option or hotfix for v2.2.0 regression' },
    ],
  },
];

export async function seedDemoData(
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<{ tickets: number; signals: number }> {
  const client = getClient();
  let totalSignals = 0;

  for (let i = 0; i < DEMO_TICKETS.length; i++) {
    const { raw_text, source, signals } = DEMO_TICKETS[i];
    onProgress?.(i, DEMO_TICKETS.length, `Creating ticket ${i + 1}/${DEMO_TICKETS.length}…`);

    const ticket = await client.records.create(TABLE.TICKETS, {
      raw_text,
      source,
      status: 'done',
      signal_count: signals.length,
    });

    for (const sig of signals) {
      await client.records.create(TABLE.SIGNALS, {
        ticket_id: ticket.id as string,
        ...sig,
      });
    }

    totalSignals += signals.length;
  }

  onProgress?.(DEMO_TICKETS.length, DEMO_TICKETS.length, 'Done!');
  return { tickets: DEMO_TICKETS.length, signals: totalSignals };
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { ROLE_POWERS } from "@/lib/roles";
import { DEV_LEVELS, ROLE_INFO, ZONE_INFO } from "@/lib/constants";

type Section =
  | "quickstart"
  | "play"
  | "board"
  | "transport"
  | "devs"
  | "roles"
  | "standoffs"
  | "trading"
  | "sidedeals"
  | "chat"
  | "winning"
  | "tips";

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: "quickstart", label: "Quick Start",   emoji: "⚡" },
  { id: "play",       label: "How to Play",   emoji: "🎲" },
  { id: "board",      label: "The Board",     emoji: "🗺️" },
  { id: "transport",  label: "Transport",     emoji: "🚇" },
  { id: "devs",       label: "Buy & Develop", emoji: "🏗️" },
  { id: "roles",      label: "Roles",         emoji: "👑" },
  { id: "standoffs",  label: "Standoffs",     emoji: "🃏" },
  { id: "trading",    label: "Trade & Auction", emoji: "💼" },
  { id: "sidedeals",  label: "Side Deals",    emoji: "🤝" },
  { id: "chat",       label: "Chat",          emoji: "💬" },
  { id: "winning",    label: "Winning",       emoji: "🏆" },
  { id: "tips",       label: "Tips",          emoji: "💡" },
];

export default function RulesPage() {
  const [active, setActive] = useState<Section>("quickstart");

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-navy-950/85 backdrop-blur border-b border-gold-400/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link href="/" className="btn-ghost">← Back</Link>
          <h1 className="heading text-lg sm:text-xl gold-shimmer font-bold">Rules</h1>
          <Link href="/" className="btn-gold text-sm">Play</Link>
        </div>
        {/* Nav chips */}
        <nav className="overflow-x-auto no-scrollbar border-t border-gold-400/10">
          <div className="flex gap-2 px-4 py-2 max-w-6xl mx-auto whitespace-nowrap">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActive(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`chip px-3 py-1.5 rounded-full border transition-all ${
                  active === s.id
                    ? "bg-gold-400 text-navy-950 border-gold-400"
                    : "border-gold-400/30 text-gold-200 hover:bg-gold-400/10"
                }`}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8 space-y-14 text-gold-100/90">
        <Section id="quickstart" title="⚡ Quick Start">
          <ol className="list-decimal ml-5 space-y-2">
            <li>Create a room, share the 6-char code with friends.</li>
            <li>Everyone picks a role. Tycoon, Judge, Minister, BMC, or MHADA.</li>
            <li>Host clicks Start. All players begin at Borivali with ₹30Cr.</li>
            <li>Each turn: pick transport → roll → land → act (buy/develop/deal).</li>
            <li>Win by being the last solvent player, or hitting ₹200Cr net worth, or best score after 30 rounds.</li>
          </ol>
        </Section>

        <Section id="play" title="🎲 How to Play">
          <p>The game runs as a loop through 7 phases every turn:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li><b>Turn Start</b> — collect role salary, expire stays.</li>
            <li><b>Transport Choice</b> — pick how you move.</li>
            <li><b>Movement</b> — roll dice (or teleport).</li>
            <li><b>Landing</b> — pay rent, draw card, pay tax, or option to buy.</li>
            <li><b>Action</b> — develop, trade, use powers, challenge.</li>
            <li><b>Committee</b> (if triggered) — governance vote.</li>
            <li><b>Standoff</b> (if triggered) — Teen Patti card game.</li>
            <li><b>End Turn</b> — pass to next player.</li>
          </ol>
          <p className="text-gold-100/60 italic">Only the current player can move. But everyone can chat, trade side-deals, bid in auctions, and vote.</p>
        </Section>

        <Section id="board" title="🗺️ The Board">
          <p>43 tiles shaped as a serpentine path — Borivali at the top, Cuffe Parade Penthouse at the bottom, then loops back. Collect ₹2Cr salary every time you pass GO.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(ZONE_INFO).map(([id, z]) => (
              <div key={id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5">
                <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: z.color }} />
                <div>
                  <div className="font-semibold text-sm">{z.name}</div>
                  <div className="text-xs text-gold-100/50">{z.tag}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3">Own all tiles in a zone to lock <b>Zone Monopoly</b> — rent doubles in that zone.</p>
        </Section>

        <Section id="transport" title="🚇 Transport">
          <p>Before rolling dice, pick how you move. Each mode has availability rules and a cost.</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead className="text-gold-200">
                <tr>
                  <th className="text-left py-2">Mode</th>
                  <th className="text-left py-2">Effect</th>
                  <th className="text-right py-2">Cost</th>
                </tr>
              </thead>
              <tbody className="text-gold-100/80 divide-y divide-white/5">
                <tr><td className="py-2">🚶 Walk</td><td>Normal dice roll</td><td className="text-right money">Free</td></tr>
                <tr><td className="py-2">🛺 Auto Rickshaw</td><td>Dice +1 (north of Bandra). Doubles → no bonus.</td><td className="text-right money">₹10L</td></tr>
                <tr><td className="py-2">🚌 BEST Bus</td><td>Dice +2 (only at bus stops).</td><td className="text-right money">₹20L</td></tr>
                <tr><td className="py-2">🚇 Metro</td><td>Jump to next metro station. Roll 1 = breakdown.</td><td className="text-right money">₹50L</td></tr>
                <tr><td className="py-2">🚂 Local Train</td><td>Teleport between Borivali / Bandra / Central / Churchgate.</td><td className="text-right money">₹30L</td></tr>
                <tr><td className="py-2">🛣️ Coastal Road</td><td>Worli ↔ Marine Drive jump. Brutal shortcut.</td><td className="text-right money">₹2Cr</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-gold-100/60 italic">Rush Hour: 2+ players at railway stations → everyone at a station pays ₹20L surcharge.</p>
        </Section>

        <Section id="devs" title="🏗️ Buy & Develop">
          <p>Land on an unowned property → pay the price to buy, or let it go to auction.</p>
          <p>Once you own a tile, you can develop it up to 6 levels. Each level costs a fraction of the tile price and multiplies rent.</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead className="text-gold-200">
                <tr>
                  <th className="text-left py-2">Level</th>
                  <th>Cost</th>
                  <th>Rent ×</th>
                  <th>Requires</th>
                </tr>
              </thead>
              <tbody className="text-gold-100/80 divide-y divide-white/5">
                {DEV_LEVELS.map((l) => (
                  <tr key={l.level}>
                    <td className="py-2">{l.emoji} {l.name}</td>
                    <td className="money">{l.costMultiplier === 0 ? "—" : `${(l.costMultiplier * 100).toFixed(0)}%`}</td>
                    <td className="money">{l.rentMultiplier}×</td>
                    <td className="text-xs text-gold-100/60">
                      {l.requiresCommittee ? "BMC + Minister + Committee" :
                       l.requiresMinister ? "BMC + Minister" :
                       l.requiresBmc ? "BMC approval" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">FSI caps development — you can only go as high as a tile's FSI allows. The Minister can raise/lower FSI.</p>
          <p><b>Redevelop</b> any Apartment+ property to reset it to Empty Plot and permanently add +1.0 FSI. You get 30% of price as compensation.</p>
        </Section>

        <Section id="roles" title="👑 Roles & Powers">
          <p>Every player picks a role. Roles grant superpowers that shape how you play.</p>
          <div className="space-y-4 mt-4">
            {Object.values(ROLE_INFO).map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-gold-100/60">{r.theme}</div>
                  </div>
                </div>
                <ul className="space-y-1 text-sm">
                  {ROLE_POWERS[r.id].map((p) => (
                    <li key={p.id} className="flex gap-2">
                      <span className="text-gold-400">▸</span>
                      <span><b>{p.name}</b> — <span className="text-gold-100/75">{p.description}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="standoffs" title="🃏 Standoffs (Teen Patti)">
          <p>When disputes happen — stay order appeals, auction ties, trade impasses, bankruptcy — they're resolved by a 3-card Teen Patti game.</p>
          <ol className="list-decimal ml-5 space-y-1 mt-2">
            <li>Both players ante up → pot is built.</li>
            <li>Each dealt 3 cards. Choose <b>Blind</b> (don't look, 1.5× bluff) or <b>Seen</b>.</li>
            <li>3 betting rounds: <b>Call</b>, <b>Raise</b>, or <b>Fold</b>.</li>
            <li>Showdown. Higher hand wins the pot + disputed asset.</li>
          </ol>
          <div className="mt-3">
            <h4 className="font-semibold text-gold-200 mb-1">Hand Rankings (low → high)</h4>
            <p className="text-sm text-gold-100/75">High Card → Pair → Flush → Sequence → Pure Sequence → Trail (three of a kind).</p>
          </div>
        </Section>

        <Section id="trading" title="💼 Trading & Auctions">
          <p>You can propose trades with any player — money for property, property for property, with or without favor tokens.</p>
          <p>When a property is refused, it goes to auction: every eligible player bids in real-time, highest wins.</p>
          <p className="text-gold-100/60 italic">The Judge cannot participate in auctions (conflict of interest).</p>
        </Section>

        <Section id="sidedeals" title="🤝 Side Deals (the Mumbai layer)">
          <p>Mumbai runs on side deals. Negotiate anything with anyone — <b>off the main turn</b>. No queue needed.</p>
          <ul className="list-disc ml-5 space-y-1 mt-2 text-sm">
            <li><b>Max ₹20Cr cash</b> per deal, max <b>2 properties per side</b>, up to <b>3 favor tokens</b>.</li>
            <li><b>Deals ≥ ₹10Cr are auto-public</b> — everyone sees them.</li>
            <li>Deals expire after <b>3 rounds</b>.</li>
            <li>Max <b>3 active proposals</b> per player (stops spam).</li>
            <li><b>Judge</b> can <i>flag</i> any deal that looks corrupt — triggers a standoff to resolve.</li>
            <li><b>Minister/BMC</b> cannot accept deals in zones where they used their powers in the last 3 turns.</li>
            <li>Both parties must <b>explicitly accept</b>. Assets transfer atomically.</li>
          </ul>
          <p className="mt-3 text-gold-100/60 italic">Favor tokens are IOUs — they have no mechanical effect but are public. Breaking a favor hurts your reputation (and your Teen Patti draw odds, courtesy of the other players).</p>
        </Section>

        <Section id="chat" title="💬 Chat">
          <p>Every room has a public chat. All players — including <b>spectators and eliminated players</b> — can post.</p>
          <p>You can also send <b>private DMs</b> when negotiating a side deal. Whispers are logged but not visible to others (unless Judge investigates).</p>
          <p>Be chill. It's a community game.</p>
        </Section>

        <Section id="winning" title="🏆 Winning">
          <ul className="list-disc ml-5 space-y-2">
            <li><b>Last Tycoon Standing</b> — all others bankrupt.</li>
            <li><b>Mumbai Ka Raja</b> — first to ₹200Cr net worth (cash + property value + dev investment).</li>
            <li><b>Fixed Rounds</b> — after 30 rounds, highest net worth wins. Host picks at game start.</li>
          </ul>
        </Section>

        <Section id="tips" title="💡 Tips & Strategy">
          <ul className="list-disc ml-5 space-y-2">
            <li>Early game, walk slowly and buy everything you land on in the Western Suburbs.</li>
            <li>Zone monopolies 2× rent. Focus on cheap zones first — easier to complete.</li>
            <li>If the Judge is in play and you're a Tycoon, keep a Teen Patti war chest.</li>
            <li>The Coastal Road is insane value — if you're going to buy Colaba, the ₹2Cr jump pays for itself.</li>
            <li>Side deals are your best friend when you're cash-poor but property-rich. Don't be afraid to trade in the chat.</li>
            <li>Governance roles earn passive income. You don't need to win every property — you need to tax everyone else's.</li>
          </ul>
        </Section>

        <footer className="text-center text-gold-100/40 text-xs pt-10 pb-4">
          Ab khel shuru. — <Link href="/" className="underline hover:text-gold-200">Start a game</Link>
        </footer>
      </article>
    </main>
  );
}

function Section(props: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={props.id} className="scroll-mt-32">
      <h2 className="heading text-2xl sm:text-3xl font-bold text-gold-200 mb-4">{props.title}</h2>
      <div className="space-y-3 text-base leading-relaxed">{props.children}</div>
    </section>
  );
}

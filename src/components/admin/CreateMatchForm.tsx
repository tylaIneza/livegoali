"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Radio, Wand2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSlug } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

const SPORT_TYPES = [
  { value: "football", label: "⚽ Football" },
  { value: "basketball", label: "🏀 Basketball" },
  { value: "volleyball", label: "🏐 Volleyball" },
  { value: "formula1", label: "🏎 Formula 1" },
  { value: "ufc", label: "🥊 UFC Fight Night" },
  { value: "boxing", label: "🥊 Boxing" },
  { value: "tennis", label: "🎾 Tennis" },
  { value: "cricket", label: "🏏 Cricket" },
] as const;

type SportType = typeof SPORT_TYPES[number]["value"];

const SESSION_TYPES = [
  "Practice 1", "Practice 2", "Practice 3",
  "Sprint Qualifying", "Sprint Race", "Qualifying", "Race",
];

interface Props {
  leagues: Array<{ id: string; name: string; country: string }>;
  sports: Array<{ id: string; name: string; slug: string; icon: string }>;
}

export function CreateMatchForm({ leagues, sports }: Props) {
  const router = useRouter();

  // Sport type
  const [sportType, setSportType] = useState<SportType>("football");

  // Football fields
  const [leagueId, setLeagueId] = useState("");
  const [homeTeamName, setHomeTeamName] = useState("");
  const [homeTeamLogo, setHomeTeamLogo] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [awayTeamLogo, setAwayTeamLogo] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");
  const [round, setRound] = useState("");

  // Basketball
  const [bkLeague, setBkLeague] = useState("");
  const [bkHome, setBkHome] = useState("");
  const [bkAway, setBkAway] = useState("");
  const [bkArena, setBkArena] = useState("");
  const [bkDate, setBkDate] = useState("");
  const [bkRound, setBkRound] = useState("");

  // Volleyball
  const [vbTournament, setVbTournament] = useState("");
  const [vbTeamA, setVbTeamA] = useState("");
  const [vbTeamB, setVbTeamB] = useState("");
  const [vbVenue, setVbVenue] = useState("");
  const [vbDate, setVbDate] = useState("");
  const [vbRound, setVbRound] = useState("");

  // Formula 1
  const [f1Championship, setF1Championship] = useState("");
  const [f1GrandPrix, setF1GrandPrix] = useState("");
  const [f1Circuit, setF1Circuit] = useState("");
  const [f1SessionType, setF1SessionType] = useState("Race");
  const [f1Country, setF1Country] = useState("");
  const [f1Date, setF1Date] = useState("");

  // UFC
  const [ufcEventName, setUfcEventName] = useState("");
  const [ufcRedCorner, setUfcRedCorner] = useState("");
  const [ufcBlueCorner, setUfcBlueCorner] = useState("");
  const [ufcWeightClass, setUfcWeightClass] = useState("");
  const [ufcRounds, setUfcRounds] = useState("5");
  const [ufcVenue, setUfcVenue] = useState("");
  const [ufcDate, setUfcDate] = useState("");

  // Boxing
  const [boxPromotion, setBoxPromotion] = useState("");
  const [boxFighterA, setBoxFighterA] = useState("");
  const [boxFighterB, setBoxFighterB] = useState("");
  const [boxWeightClass, setBoxWeightClass] = useState("");
  const [boxRounds, setBoxRounds] = useState("12");
  const [boxVenue, setBoxVenue] = useState("");
  const [boxDate, setBoxDate] = useState("");

  // Tennis
  const [tenTournament, setTenTournament] = useState("");
  const [tenPlayerA, setTenPlayerA] = useState("");
  const [tenPlayerB, setTenPlayerB] = useState("");
  const [tenVenue, setTenVenue] = useState("");
  const [tenDate, setTenDate] = useState("");
  const [tenRound, setTenRound] = useState("");

  // Cricket
  const [cktTournament, setCktTournament] = useState("");
  const [cktTeamA, setCktTeamA] = useState("");
  const [cktTeamB, setCktTeamB] = useState("");
  const [cktVenue, setCktVenue] = useState("");
  const [cktDate, setCktDate] = useState("");
  const [cktRound, setCktRound] = useState("");

  // Shared
  const [isFeatured, setIsFeatured] = useState(false);
  const [enableComments, setEnableComments] = useState(true);
  const [enableChat, setEnableChat] = useState(true);
  const [enablePrediction, setEnablePrediction] = useState(sportType === "football");

  // Global stream
  const [streamUrl, setStreamUrl] = useState("");
  const [streamType, setStreamType] = useState<"IFRAME" | "HLS" | "DASH">("IFRAME");
  const [streamQuality, setStreamQuality] = useState("HD");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);

  const getSportId = () => sports.find((s) => s.slug === sportType)?.id ?? null;

  const buildPayload = () => {
    const sportId = getSportId();

    if (sportType === "football") {
      const slug = generateSlug(`${homeTeamName}-vs-${awayTeamName}-${scheduledAt.slice(0, 10)}`);
      return {
        slug, leagueId, sportId,
        homeTeamName: homeTeamName.trim(),
        homeTeamLogo: homeTeamLogo.trim() || undefined,
        awayTeamName: awayTeamName.trim(),
        awayTeamLogo: awayTeamLogo.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        venue, round,
        isFeatured, enableComments, enableChat, enablePrediction,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
      };
    }

    if (sportType === "basketball") {
      const slug = generateSlug(`${bkHome}-vs-${bkAway}-${bkDate.slice(0, 10)}`);
      return {
        slug, sportId,
        participant1: bkHome.trim(), participant2: bkAway.trim(),
        title: bkLeague.trim() || undefined,
        venue: bkArena.trim() || undefined, round: bkRound.trim() || undefined,
        scheduledAt: new Date(bkDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ league: bkLeague }),
      };
    }

    if (sportType === "volleyball") {
      const slug = generateSlug(`${vbTeamA}-vs-${vbTeamB}-${vbDate.slice(0, 10)}`);
      return {
        slug, sportId,
        participant1: vbTeamA.trim(), participant2: vbTeamB.trim(),
        title: vbTournament.trim() || undefined,
        venue: vbVenue.trim() || undefined, round: vbRound.trim() || undefined,
        scheduledAt: new Date(vbDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ tournament: vbTournament }),
      };
    }

    if (sportType === "formula1") {
      const slug = generateSlug(`f1-${f1GrandPrix}-${f1SessionType}-${f1Date.slice(0, 10)}`);
      return {
        slug, sportId,
        title: `${f1GrandPrix} — ${f1SessionType}`,
        participant1: "Formula 1", participant2: f1Championship.trim() || "FIA",
        venue: f1Circuit.trim() || undefined, round: f1SessionType,
        scheduledAt: new Date(f1Date).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ championship: f1Championship, grandPrix: f1GrandPrix, circuit: f1Circuit, sessionType: f1SessionType, country: f1Country }),
      };
    }

    if (sportType === "ufc") {
      const slug = generateSlug(`${ufcRedCorner}-vs-${ufcBlueCorner}-${ufcDate.slice(0, 10)}`);
      return {
        slug, sportId,
        title: ufcEventName.trim() || undefined,
        participant1: ufcRedCorner.trim(), participant2: ufcBlueCorner.trim(),
        venue: ufcVenue.trim() || undefined, round: `${ufcRounds} Rounds`,
        scheduledAt: new Date(ufcDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ eventName: ufcEventName, weightClass: ufcWeightClass, rounds: ufcRounds }),
      };
    }

    if (sportType === "boxing") {
      const slug = generateSlug(`${boxFighterA}-vs-${boxFighterB}-${boxDate.slice(0, 10)}`);
      return {
        slug, sportId,
        title: boxPromotion.trim() || undefined,
        participant1: boxFighterA.trim(), participant2: boxFighterB.trim(),
        venue: boxVenue.trim() || undefined, round: `${boxRounds} Rounds`,
        scheduledAt: new Date(boxDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ promotion: boxPromotion, weightClass: boxWeightClass, rounds: boxRounds }),
      };
    }

    if (sportType === "tennis") {
      const slug = generateSlug(`${tenPlayerA}-vs-${tenPlayerB}-${tenDate.slice(0, 10)}`);
      return {
        slug, sportId,
        title: tenTournament.trim() || undefined,
        participant1: tenPlayerA.trim(), participant2: tenPlayerB.trim(),
        venue: tenVenue.trim() || undefined, round: tenRound.trim() || undefined,
        scheduledAt: new Date(tenDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ tournament: tenTournament }),
      };
    }

    if (sportType === "cricket") {
      const slug = generateSlug(`${cktTeamA}-vs-${cktTeamB}-${cktDate.slice(0, 10)}`);
      return {
        slug, sportId,
        title: cktTournament.trim() || undefined,
        participant1: cktTeamA.trim(), participant2: cktTeamB.trim(),
        venue: cktVenue.trim() || undefined, round: cktRound.trim() || undefined,
        scheduledAt: new Date(cktDate).toISOString(),
        isFeatured, enableComments, enableChat, enablePrediction: false,
        streamUrl: streamUrl.trim() || undefined, streamType, streamQuality,
        metadata: JSON.stringify({ tournament: cktTournament }),
      };
    }

    return null;
  };

  const validatePayload = (): boolean => {
    if (sportType === "football") {
      if (!leagueId || !homeTeamName.trim() || !awayTeamName.trim() || !scheduledAt) {
        toast.error("League, both team names and kickoff time are required");
        return false;
      }
      if (homeTeamName.trim().toLowerCase() === awayTeamName.trim().toLowerCase()) {
        toast.error("Home and away teams must be different");
        return false;
      }
    } else if (sportType === "basketball") {
      if (!bkHome.trim() || !bkAway.trim() || !bkDate) {
        toast.error("Both teams and match date are required");
        return false;
      }
    } else if (sportType === "volleyball") {
      if (!vbTeamA.trim() || !vbTeamB.trim() || !vbDate) {
        toast.error("Both teams and match date are required");
        return false;
      }
    } else if (sportType === "formula1") {
      if (!f1GrandPrix.trim() || !f1Date) {
        toast.error("Grand Prix name and race date are required");
        return false;
      }
    } else if (sportType === "ufc") {
      if (!ufcRedCorner.trim() || !ufcBlueCorner.trim() || !ufcDate) {
        toast.error("Both fighters and fight date are required");
        return false;
      }
    } else if (sportType === "boxing") {
      if (!boxFighterA.trim() || !boxFighterB.trim() || !boxDate) {
        toast.error("Both fighters and fight date are required");
        return false;
      }
    } else if (sportType === "tennis") {
      if (!tenPlayerA.trim() || !tenPlayerB.trim() || !tenDate) {
        toast.error("Both players and match date are required");
        return false;
      }
    } else if (sportType === "cricket") {
      if (!cktTeamA.trim() || !cktTeamB.trim() || !cktDate) {
        toast.error("Both teams and match date are required");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayload()) return;

    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create event");
      const match = await res.json();

      if (sportType === "football" && enablePrediction) {
        setIsGeneratingPrediction(true);
        await fetch("/api/predictions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, generate: true }),
        });
      }

      toast.success("Event created!");
      router.push("/admin/matches");
    } catch {
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingPrediction(false);
    }
  };

  const selectClass = "w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50";
  const labelClass = "text-sm text-white/75 mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Sport Type — always first */}
          <div>
            <label className={labelClass}>Sport Type *</label>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value as SportType)}
              className={selectClass}
            >
              {SPORT_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* ---- FOOTBALL ---- */}
          {sportType === "football" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-white/75">League *</label>
                  <Link href="/admin/leagues" className="flex items-center gap-1 text-xs text-[#00FF84] hover:underline">
                    <Settings className="w-3 h-3" /> Manage Leagues
                  </Link>
                </div>
                <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)} required className={selectClass}>
                  <option value="">Select league...</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.country})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/75 block">Home Team *</label>
                  <div className="flex items-center gap-3">
                    {homeTeamLogo ? (
                      <img src={homeTeamLogo} alt="Home logo" className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-lg">⚽</div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <Input placeholder="Team name (e.g. Arsenal) *" value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)} required />
                      <Input placeholder="Logo URL (https://...)" value={homeTeamLogo} onChange={(e) => setHomeTeamLogo(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/60">Team created automatically if new. Logo saved to team.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/75 block">Away Team *</label>
                  <div className="flex items-center gap-3">
                    {awayTeamLogo ? (
                      <img src={awayTeamLogo} alt="Away logo" className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-lg">⚽</div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <Input placeholder="Team name (e.g. Chelsea) *" value={awayTeamName} onChange={(e) => setAwayTeamName(e.target.value)} required />
                      <Input placeholder="Logo URL (https://...)" value={awayTeamLogo} onChange={(e) => setAwayTeamLogo(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/60">Team created automatically if new. Logo saved to team.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Kickoff Date & Time *</label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="Stadium name..." value={venue} onChange={(e) => setVenue(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Round</label>
                  <Input placeholder="Matchday 1, Group A..." value={round} onChange={(e) => setRound(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Featured Match", value: isFeatured, set: setIsFeatured },
                  { label: "Comments", value: enableComments, set: setEnableComments },
                  { label: "Live Chat", value: enableChat, set: setEnableChat },
                  { label: "Predictions", value: enablePrediction, set: setEnablePrediction },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={item.value} onChange={(e) => item.set(e.target.checked)} className="accent-[#00FF84] w-4 h-4" />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* ---- BASKETBALL ---- */}
          {sportType === "basketball" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>League</label>
                  <Input placeholder="NBA, EuroLeague..." value={bkLeague} onChange={(e) => setBkLeague(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Round</label>
                  <Input placeholder="Week 12, Quarter-Final..." value={bkRound} onChange={(e) => setBkRound(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Home Team *</label>
                  <Input placeholder="e.g. LA Lakers" value={bkHome} onChange={(e) => setBkHome(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Away Team *</label>
                  <Input placeholder="e.g. Boston Celtics" value={bkAway} onChange={(e) => setBkAway(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Arena</label>
                  <Input placeholder="Crypto.com Arena..." value={bkArena} onChange={(e) => setBkArena(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Match Date & Time *</label>
                  <Input type="datetime-local" value={bkDate} onChange={(e) => setBkDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- VOLLEYBALL ---- */}
          {sportType === "volleyball" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tournament</label>
                  <Input placeholder="FIVB World Championship..." value={vbTournament} onChange={(e) => setVbTournament(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Round</label>
                  <Input placeholder="Pool A, Semi-Final..." value={vbRound} onChange={(e) => setVbRound(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Team A *</label>
                  <Input placeholder="e.g. Brazil" value={vbTeamA} onChange={(e) => setVbTeamA(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Team B *</label>
                  <Input placeholder="e.g. Poland" value={vbTeamB} onChange={(e) => setVbTeamB(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="Arena name..." value={vbVenue} onChange={(e) => setVbVenue(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Match Date & Time *</label>
                  <Input type="datetime-local" value={vbDate} onChange={(e) => setVbDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- FORMULA 1 ---- */}
          {sportType === "formula1" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Championship</label>
                  <Input placeholder="FIA Formula One World Championship" value={f1Championship} onChange={(e) => setF1Championship(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Grand Prix *</label>
                  <Input placeholder="Austrian Grand Prix" value={f1GrandPrix} onChange={(e) => setF1GrandPrix(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Circuit</label>
                  <Input placeholder="Red Bull Ring" value={f1Circuit} onChange={(e) => setF1Circuit(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Session Type</label>
                  <select value={f1SessionType} onChange={(e) => setF1SessionType(e.target.value)} className={selectClass}>
                    {SESSION_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <Input placeholder="Austria" value={f1Country} onChange={(e) => setF1Country(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Race Date & Time *</label>
                  <Input type="datetime-local" value={f1Date} onChange={(e) => setF1Date(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- UFC ---- */}
          {sportType === "ufc" && (
            <>
              <div>
                <label className={labelClass}>Event Name</label>
                <Input placeholder="UFC Fight Night 249" value={ufcEventName} onChange={(e) => setUfcEventName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Red Corner Fighter *</label>
                  <Input placeholder="e.g. Jon Jones" value={ufcRedCorner} onChange={(e) => setUfcRedCorner(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Blue Corner Fighter *</label>
                  <Input placeholder="e.g. Stipe Miocic" value={ufcBlueCorner} onChange={(e) => setUfcBlueCorner(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Weight Class</label>
                  <Input placeholder="Heavyweight, Middleweight..." value={ufcWeightClass} onChange={(e) => setUfcWeightClass(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Number of Rounds</label>
                  <Input type="number" min={1} max={15} value={ufcRounds} onChange={(e) => setUfcRounds(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="T-Mobile Arena, Las Vegas" value={ufcVenue} onChange={(e) => setUfcVenue(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fight Date & Time *</label>
                  <Input type="datetime-local" value={ufcDate} onChange={(e) => setUfcDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- BOXING ---- */}
          {sportType === "boxing" && (
            <>
              <div>
                <label className={labelClass}>Promotion</label>
                <Input placeholder="Top Rank, Matchroom..." value={boxPromotion} onChange={(e) => setBoxPromotion(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fighter A *</label>
                  <Input placeholder="e.g. Canelo Álvarez" value={boxFighterA} onChange={(e) => setBoxFighterA(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Fighter B *</label>
                  <Input placeholder="e.g. Dmitry Bivol" value={boxFighterB} onChange={(e) => setBoxFighterB(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Weight Class</label>
                  <Input placeholder="Super Middleweight..." value={boxWeightClass} onChange={(e) => setBoxWeightClass(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Number of Rounds</label>
                  <Input type="number" min={1} max={15} value={boxRounds} onChange={(e) => setBoxRounds(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="Arena name..." value={boxVenue} onChange={(e) => setBoxVenue(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fight Date & Time *</label>
                  <Input type="datetime-local" value={boxDate} onChange={(e) => setBoxDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- TENNIS ---- */}
          {sportType === "tennis" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tournament</label>
                  <Input placeholder="Wimbledon, Australian Open..." value={tenTournament} onChange={(e) => setTenTournament(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Round</label>
                  <Input placeholder="Quarter-Final, Semi-Final..." value={tenRound} onChange={(e) => setTenRound(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Player A *</label>
                  <Input placeholder="e.g. Carlos Alcaraz" value={tenPlayerA} onChange={(e) => setTenPlayerA(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Player B *</label>
                  <Input placeholder="e.g. Novak Djokovic" value={tenPlayerB} onChange={(e) => setTenPlayerB(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="Centre Court, Wimbledon..." value={tenVenue} onChange={(e) => setTenVenue(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Match Date & Time *</label>
                  <Input type="datetime-local" value={tenDate} onChange={(e) => setTenDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

          {/* ---- CRICKET ---- */}
          {sportType === "cricket" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tournament</label>
                  <Input placeholder="ICC World Cup, IPL..." value={cktTournament} onChange={(e) => setCktTournament(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Round</label>
                  <Input placeholder="Group Stage, Final..." value={cktRound} onChange={(e) => setCktRound(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Team A *</label>
                  <Input placeholder="e.g. India" value={cktTeamA} onChange={(e) => setCktTeamA(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Team B *</label>
                  <Input placeholder="e.g. Australia" value={cktTeamB} onChange={(e) => setCktTeamB(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Venue</label>
                  <Input placeholder="Melbourne Cricket Ground..." value={cktVenue} onChange={(e) => setCktVenue(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Match Date & Time *</label>
                  <Input type="datetime-local" value={cktDate} onChange={(e) => setCktDate(e.target.value)} required />
                </div>
              </div>
              <SharedToggles isFeatured={isFeatured} setIsFeatured={setIsFeatured} enableComments={enableComments} setEnableComments={setEnableComments} enableChat={enableChat} setEnableChat={setEnableChat} />
            </>
          )}

        </CardContent>
      </Card>

      {/* Global Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00FF84]" />
            Global Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-white/8 bg-[#0B0F14] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Global Stream</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="https://embed.example.com/stream/..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                />
              </div>
              <select
                value={streamType}
                onChange={(e) => setStreamType(e.target.value as "IFRAME" | "HLS" | "DASH")}
                className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
              >
                <option value="IFRAME">Iframe Embed</option>
                <option value="HLS">HLS (.m3u8)</option>
                <option value="DASH">DASH (.mpd)</option>
              </select>
              <select
                value={streamQuality}
                onChange={(e) => setStreamQuality(e.target.value)}
                className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
              >
                <option value="4K">4K</option>
                <option value="FHD">Full HD</option>
                <option value="HD">HD</option>
                <option value="SD">SD</option>
              </select>
            </div>
            <p className="text-[11px] text-white/50">Store the embed URL only — the iframe is auto-generated on the frontend.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            isGeneratingPrediction ? (
              <><Wand2 className="w-4 h-4 animate-spin" /> Generating AI Prediction...</>
            ) : "Creating..."
          ) : (
            <><Plus className="w-4 h-4" /> Create Event</>
          )}
        </Button>
      </div>
    </form>
  );
}

function SharedToggles({
  isFeatured, setIsFeatured,
  enableComments, setEnableComments,
  enableChat, setEnableChat,
}: {
  isFeatured: boolean; setIsFeatured: (v: boolean) => void;
  enableComments: boolean; setEnableComments: (v: boolean) => void;
  enableChat: boolean; setEnableChat: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {[
        { label: "Featured Event", value: isFeatured, set: setIsFeatured },
        { label: "Comments", value: enableComments, set: setEnableComments },
        { label: "Live Chat", value: enableChat, set: setEnableChat },
      ].map((item) => (
        <label key={item.label} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={item.value} onChange={(e) => item.set(e.target.checked)} className="accent-[#00FF84] w-4 h-4" />
          <span className="text-sm text-gray-300">{item.label}</span>
        </label>
      ))}
    </div>
  );
}

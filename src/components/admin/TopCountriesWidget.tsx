import { Globe } from "lucide-react";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", NG: "Nigeria", GH: "Ghana",
  KE: "Kenya", ZA: "South Africa", ET: "Ethiopia", TZ: "Tanzania",
  UG: "Uganda", RW: "Rwanda", CM: "Cameroon", CI: "Ivory Coast",
  SN: "Senegal", EG: "Egypt", MA: "Morocco", DZ: "Algeria",
  TN: "Tunisia", FR: "France", DE: "Germany", ES: "Spain",
  IT: "Italy", PT: "Portugal", NL: "Netherlands", BE: "Belgium",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", RU: "Russia", TR: "Turkey", IN: "India",
  PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", PH: "Philippines",
  ID: "Indonesia", MY: "Malaysia", SG: "Singapore", TH: "Thailand",
  VN: "Vietnam", JP: "Japan", KR: "South Korea", CN: "China",
  AU: "Australia", NZ: "New Zealand", CA: "Canada", MX: "Mexico",
  BR: "Brazil", AR: "Argentina", CO: "Colombia", PE: "Peru",
  CL: "Chile", AE: "UAE", SA: "Saudi Arabia", QA: "Qatar",
  KW: "Kuwait", BH: "Bahrain", OM: "Oman", IQ: "Iraq",
  IR: "Iran", IL: "Israel", JO: "Jordan", LB: "Lebanon",
};

const BAR_COLORS: [string, string][] = [
  ["#00FF84", "#00CC6A"],
  ["#3B82F6", "#2563EB"],
  ["#A855F7", "#9333EA"],
  ["#F97316", "#EA580C"],
  ["#EC4899", "#DB2777"],
  ["#EAB308", "#CA8A04"],
  ["#EF4444", "#DC2626"],
  ["#06B6D4", "#0891B2"],
  ["#8B5CF6", "#7C3AED"],
  ["#14B8A6", "#0D9488"],
];

const RANK_COLORS = ["text-yellow-400", "text-white/50", "text-orange-400/70"];

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6));
}

interface Props {
  countries: { code: string; count: number }[];
}

export function TopCountriesWidget({ countries }: Props) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00FF84]/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#00FF84]" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">Audience Countries</span>
            <span className="text-[10px] text-white/40">{countries.length} countries tracked</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {countries.length === 0 ? (
          <div className="py-10 text-center">
            <Globe className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No visit data yet</p>
            <p className="text-xs text-white/25 mt-1">Countries appear once visitors load the site</p>
          </div>
        ) : (
          <div className="space-y-3">
            {countries.map((c, i) => {
              const max = countries[0].count;
              const pct = Math.max(4, Math.round((c.count / max) * 100));
              const name = COUNTRY_NAMES[c.code] ?? c.code;
              const [from, to] = BAR_COLORS[i % BAR_COLORS.length];
              const rankColor = RANK_COLORS[i] ?? "text-white/25";
              return (
                <div key={c.code} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-xs font-black w-4 shrink-0 text-center ${rankColor}`}>{i + 1}</span>
                    <span className="text-xl leading-none shrink-0">{countryFlag(c.code)}</span>
                    <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
                      <span className="text-sm font-semibold text-white truncate">{name}</span>
                      <span className="text-xs font-bold shrink-0" style={{ color: from }}>
                        {c.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-7 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                        boxShadow: `0 0 8px ${from}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

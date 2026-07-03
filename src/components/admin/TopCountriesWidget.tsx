import { Globe, ArrowUpRight } from "lucide-react";

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

const BAR_COLORS = [
  "from-[#00FF84] to-[#00CC6A]",
  "from-blue-500 to-blue-400",
  "from-purple-500 to-purple-400",
  "from-orange-500 to-orange-400",
  "from-pink-500 to-pink-400",
  "from-yellow-500 to-yellow-400",
  "from-red-500 to-red-400",
  "from-cyan-500 to-cyan-400",
  "from-indigo-500 to-indigo-400",
  "from-teal-500 to-teal-400",
];

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
          <span className="font-bold text-white text-sm">Audience Countries</span>
        </div>
        {countries.length > 0 && (
          <span className="text-xs text-white/40 font-semibold">{countries.length} countries</span>
        )}
      </div>

      <div className="p-4">
        {countries.length === 0 ? (
          <div className="py-10 text-center">
            <Globe className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No visit data yet</p>
            <p className="text-xs text-white/25 mt-1">Countries appear once visitors load the site</p>
          </div>
        ) : (
          <div className="space-y-3">
            {countries.map((c, i) => {
              const max = countries[0].count;
              const pct = Math.round((c.count / max) * 100);
              const name = COUNTRY_NAMES[c.code] ?? c.code;
              const barColor = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={c.code} className="group flex items-center gap-3">
                  <span className="text-[10px] text-white/30 w-4 shrink-0 font-bold">{i + 1}</span>
                  <span className="text-xl leading-none shrink-0">{countryFlag(c.code)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white font-medium truncate">{name}</span>
                      <span className="text-xs font-bold text-white/60 ml-2 shrink-0">
                        {c.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
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

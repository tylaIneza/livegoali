export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audience Countries — Admin" };

const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AD: "Andorra", AO: "Angola",
  AG: "Antigua and Barbuda", AR: "Argentina", AM: "Armenia", AU: "Australia",
  AT: "Austria", AZ: "Azerbaijan", BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh",
  BB: "Barbados", BY: "Belarus", BE: "Belgium", BZ: "Belize", BJ: "Benin",
  BT: "Bhutan", BO: "Bolivia", BA: "Bosnia and Herzegovina", BW: "Botswana",
  BR: "Brazil", BN: "Brunei", BG: "Bulgaria", BF: "Burkina Faso", BI: "Burundi",
  CV: "Cape Verde", KH: "Cambodia", CM: "Cameroon", CA: "Canada", CF: "Central African Republic",
  TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia", KM: "Comoros",
  CG: "Congo", CD: "DR Congo", CR: "Costa Rica", CI: "Ivory Coast", HR: "Croatia",
  CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", DJ: "Djibouti",
  DM: "Dominica", DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt",
  SV: "El Salvador", GQ: "Equatorial Guinea", ER: "Eritrea", EE: "Estonia",
  SZ: "Eswatini", ET: "Ethiopia", FJ: "Fiji", FI: "Finland", FR: "France",
  GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana",
  GR: "Greece", GD: "Grenada", GT: "Guatemala", GN: "Guinea", GW: "Guinea-Bissau",
  GY: "Guyana", HT: "Haiti", HN: "Honduras", HU: "Hungary", IS: "Iceland",
  IN: "India", ID: "Indonesia", IR: "Iran", IQ: "Iraq", IE: "Ireland",
  IL: "Israel", IT: "Italy", JM: "Jamaica", JP: "Japan", JO: "Jordan",
  KZ: "Kazakhstan", KE: "Kenya", KI: "Kiribati", KP: "North Korea", KR: "South Korea",
  KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos", LV: "Latvia", LB: "Lebanon",
  LS: "Lesotho", LR: "Liberia", LY: "Libya", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives",
  ML: "Mali", MT: "Malta", MH: "Marshall Islands", MR: "Mauritania", MU: "Mauritius",
  MX: "Mexico", FM: "Micronesia", MD: "Moldova", MC: "Monaco", MN: "Mongolia",
  ME: "Montenegro", MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NA: "Namibia",
  NR: "Nauru", NP: "Nepal", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua",
  NE: "Niger", NG: "Nigeria", MK: "North Macedonia", NO: "Norway", OM: "Oman",
  PK: "Pakistan", PW: "Palau", PA: "Panama", PG: "Papua New Guinea", PY: "Paraguay",
  PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RO: "Romania", RU: "Russia", RW: "Rwanda", KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia", VC: "Saint Vincent", WS: "Samoa", SM: "San Marino",
  ST: "Sao Tome and Principe", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia",
  SC: "Seychelles", SL: "Sierra Leone", SG: "Singapore", SK: "Slovakia",
  SI: "Slovenia", SB: "Solomon Islands", SO: "Somalia", ZA: "South Africa",
  SS: "South Sudan", ES: "Spain", LK: "Sri Lanka", SD: "Sudan", SR: "Suriname",
  SE: "Sweden", CH: "Switzerland", SY: "Syria", TW: "Taiwan", TJ: "Tajikistan",
  TZ: "Tanzania", TH: "Thailand", TL: "Timor-Leste", TG: "Togo", TO: "Tonga",
  TT: "Trinidad and Tobago", TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan",
  TV: "Tuvalu", UG: "Uganda", UA: "Ukraine", AE: "UAE", GB: "United Kingdom",
  US: "United States", UY: "Uruguay", UZ: "Uzbekistan", VU: "Vanuatu",
  VE: "Venezuela", VN: "Vietnam", YE: "Yemen", ZM: "Zambia", ZW: "Zimbabwe",
};

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6));
}

export default async function CountriesPage() {
  const rows = await prisma.settings.findMany({
    where: { key: { startsWith: "country_visits_" } },
  });

  const countries = rows
    .map((r) => ({
      code: r.key.replace("country_visits_", "").toUpperCase(),
      count: parseInt(r.value) || 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = countries.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#121821] to-[#0D1117] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,132,0.07),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00FF84]/10 border border-[#00FF84]/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#00FF84]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Audience Countries</h1>
              <p className="text-white/50 text-sm mt-0.5">Every country that has visited LiveGoali</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-5 py-3 rounded-xl bg-white/4 border border-white/8">
              <div className="text-2xl font-black text-[#00FF84]">{countries.length}</div>
              <div className="text-xs text-white/50 mt-0.5">Countries</div>
            </div>
            <div className="text-center px-5 py-3 rounded-xl bg-white/4 border border-white/8">
              <div className="text-2xl font-black text-white">{total.toLocaleString()}</div>
              <div className="text-xs text-white/50 mt-0.5">Total Visits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {countries.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#121821] py-20 text-center">
          <Globe className="w-14 h-14 text-white/10 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">No visit data yet</p>
          <p className="text-white/40 text-sm">Countries will appear here once visitors load the site</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_60px_1fr_120px_100px] gap-3 px-5 py-3 border-b border-white/6 bg-white/2">
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">#</div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Flag</div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Country</div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider text-right">Visits</div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider text-right">Share</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/4">
            {countries.map((c, i) => {
              const name = COUNTRY_NAMES[c.code] ?? c.code;
              const share = total > 0 ? ((c.count / total) * 100) : 0;
              const barWidth = Math.max(2, Math.round(share));
              const rankColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-white/60" : i === 2 ? "text-orange-400" : "text-white/25";

              return (
                <div
                  key={c.code}
                  className="grid grid-cols-[40px_60px_1fr_120px_100px] gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors items-center"
                >
                  {/* Rank */}
                  <div className={`text-sm font-black ${rankColor}`}>{i + 1}</div>

                  {/* Flag */}
                  <div className="text-2xl leading-none">{countryFlag(c.code)}</div>

                  {/* Country name + bar */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-white truncate">{name}</span>
                      <span className="text-[10px] text-white/30 font-mono shrink-0">{c.code}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00FF84] to-[#00CC6A]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Visit count */}
                  <div className="text-sm font-black text-[#00FF84] text-right tabular-nums">
                    {c.count.toLocaleString()}
                  </div>

                  {/* Share % */}
                  <div className="text-sm font-bold text-white/50 text-right tabular-nums">
                    {share < 0.1 ? "<0.1" : share.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/6 bg-white/2 flex items-center justify-between">
            <span className="text-xs text-white/40">{countries.length} countries total</span>
            <span className="text-xs text-white/40">{total.toLocaleString()} visits recorded</span>
          </div>
        </div>
      )}
    </div>
  );
}

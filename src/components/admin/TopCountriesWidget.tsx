import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6));
}

interface Props {
  countries: { code: string; count: number }[];
}

export function TopCountriesWidget({ countries }: Props) {
  if (countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-[#00FF84]" /> Audience Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/40 text-center py-6">
            No visits recorded yet. Country data will appear here once visitors load the site.
          </p>
        </CardContent>
      </Card>
    );
  }

  const max = countries[0].count;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="w-4 h-4 text-[#00FF84]" /> Audience Top Countries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {countries.map((c, i) => {
            const pct = Math.round((c.count / max) * 100);
            const name = COUNTRY_NAMES[c.code] ?? c.code;
            return (
              <div key={c.code} className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-4 shrink-0">{i + 1}</span>
                <span className="text-lg leading-none">{countryFlag(c.code)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{name}</span>
                    <span className="text-xs text-white/60 ml-2 shrink-0">
                      {c.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00FF84] to-[#00CC6A]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

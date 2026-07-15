// Maps a national-team display name (as it appears in sports feeds, not
// necessarily the official ISO short name) to a flagcdn.com country code.
// Used to auto-detect "this participant is a country" vs "this is a club" —
// clubs have no entry here and fall through to manual logo entry.
const COUNTRY_CODES: Record<string, string> = {
  "afghanistan": "af", "albania": "al", "algeria": "dz", "andorra": "ad", "angola": "ao",
  "antigua and barbuda": "ag", "argentina": "ar", "armenia": "am", "australia": "au",
  "austria": "at", "azerbaijan": "az", "bahamas": "bs", "bahrain": "bh", "bangladesh": "bd",
  "barbados": "bb", "belarus": "by", "belgium": "be", "belize": "bz", "benin": "bj",
  "bermuda": "bm", "bhutan": "bt", "bolivia": "bo", "bosnia and herzegovina": "ba",
  "botswana": "bw", "brazil": "br", "brunei": "bn", "bulgaria": "bg", "burkina faso": "bf",
  "burundi": "bi", "cambodia": "kh", "cameroon": "cm", "canada": "ca", "cape verde": "cv",
  "cabo verde": "cv", "central african republic": "cf", "chad": "td", "chile": "cl",
  "china": "cn", "chinese taipei": "tw", "taiwan": "tw", "colombia": "co", "comoros": "km",
  "congo": "cg", "dr congo": "cd", "democratic republic of the congo": "cd",
  "costa rica": "cr", "croatia": "hr", "cuba": "cu", "curacao": "cw", "cyprus": "cy",
  "czech republic": "cz", "czechia": "cz", "denmark": "dk", "djibouti": "dj",
  "dominica": "dm", "dominican republic": "do", "ecuador": "ec", "egypt": "eg",
  "el salvador": "sv", "england": "gb-eng", "equatorial guinea": "gq", "eritrea": "er",
  "estonia": "ee", "eswatini": "sz", "ethiopia": "et", "fiji": "fj", "finland": "fi",
  "france": "fr", "gabon": "ga", "gambia": "gm", "georgia": "ge", "germany": "de",
  "ghana": "gh", "gibraltar": "gi", "greece": "gr", "grenada": "gd", "guam": "gu",
  "guatemala": "gt", "guinea": "gn", "guinea-bissau": "gw", "guyana": "gy", "haiti": "ht",
  "honduras": "hn", "hong kong": "hk", "hungary": "hu", "iceland": "is", "india": "in",
  "indonesia": "id", "iran": "ir", "iraq": "iq", "ireland": "ie", "republic of ireland": "ie",
  "israel": "il", "italy": "it", "ivory coast": "ci", "cote d'ivoire": "ci", "jamaica": "jm",
  "japan": "jp", "jordan": "jo", "kazakhstan": "kz", "kenya": "ke", "kosovo": "xk",
  "kuwait": "kw", "kyrgyzstan": "kg", "laos": "la", "latvia": "lv", "lebanon": "lb",
  "lesotho": "ls", "liberia": "lr", "libya": "ly", "liechtenstein": "li", "lithuania": "lt",
  "luxembourg": "lu", "macau": "mo", "madagascar": "mg", "malawi": "mw", "malaysia": "my",
  "maldives": "mv", "mali": "ml", "malta": "mt", "mauritania": "mr", "mauritius": "mu",
  "mexico": "mx", "moldova": "md", "monaco": "mc", "mongolia": "mn", "montenegro": "me",
  "morocco": "ma", "mozambique": "mz", "myanmar": "mm", "namibia": "na", "nepal": "np",
  "netherlands": "nl", "holland": "nl", "new zealand": "nz", "nicaragua": "ni",
  "niger": "ne", "nigeria": "ng", "north korea": "kp", "north macedonia": "mk",
  "macedonia": "mk", "northern ireland": "gb-nir", "norway": "no", "oman": "om",
  "pakistan": "pk", "palestine": "ps", "panama": "pa", "papua new guinea": "pg",
  "paraguay": "py", "peru": "pe", "philippines": "ph", "poland": "pl", "portugal": "pt",
  "puerto rico": "pr", "qatar": "qa", "romania": "ro", "russia": "ru", "rwanda": "rw",
  "san marino": "sm", "saudi arabia": "sa", "senegal": "sn", "serbia": "rs",
  "sierra leone": "sl", "singapore": "sg", "slovakia": "sk", "slovenia": "si",
  "somalia": "so", "south africa": "za", "south korea": "kr", "korea republic": "kr",
  "korea": "kr", "south sudan": "ss", "spain": "es", "sri lanka": "lk", "sudan": "sd",
  "suriname": "sr", "sweden": "se", "switzerland": "ch", "syria": "sy", "tajikistan": "tj",
  "tanzania": "tz", "thailand": "th", "togo": "tg", "tonga": "to", "trinidad and tobago": "tt",
  "tunisia": "tn", "turkey": "tr", "turkiye": "tr", "turkmenistan": "tm", "uganda": "ug",
  "ukraine": "ua", "united arab emirates": "ae", "uae": "ae", "united kingdom": "gb",
  "uk": "gb", "great britain": "gb", "scotland": "gb-sct", "wales": "gb-wls",
  "united states": "us", "usa": "us", "united states of america": "us", "us": "us",
  "uruguay": "uy", "uzbekistan": "uz", "vanuatu": "vu", "venezuela": "ve", "vietnam": "vn",
  "yemen": "ye", "zambia": "zm", "zimbabwe": "zw",
};

// Unicode combining diacritical marks (U+0300-U+036F) — stripping these after
// NFD decomposition turns an accented name into plain ASCII (e.g. Turkey's
// own spelling "Turkiye" with a diaeresis) so lookups match regardless of
// how the provider spells a name.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(str: string): string {
  return str.normalize("NFD").replace(COMBINING_MARKS, "").trim().toLowerCase();
}

export function getFlagUrl(participantName: string): string | null {
  const code = COUNTRY_CODES[normalize(participantName)];
  return code ? `https://flagcdn.com/w320/${code}.png` : null;
}

export interface PhoneCountry {
  iso2: string;
  dialCode: string;
  flag: string;
  name: { fr: string; en: string };
}

const PINNED_ISO2 = ["CM", "SN", "CI", "FR"] as const;

const COUNTRIES: PhoneCountry[] = [
  {
    iso2: "CM",
    dialCode: "237",
    flag: "🇨🇲",
    name: { fr: "Cameroun", en: "Cameroon" },
  },
  {
    iso2: "SN",
    dialCode: "221",
    flag: "🇸🇳",
    name: { fr: "Sénégal", en: "Senegal" },
  },
  {
    iso2: "CI",
    dialCode: "225",
    flag: "🇨🇮",
    name: { fr: "Côte d'Ivoire", en: "Côte d'Ivoire" },
  },
  {
    iso2: "FR",
    dialCode: "33",
    flag: "🇫🇷",
    name: { fr: "France", en: "France" },
  },

  {
    iso2: "DZ",
    dialCode: "213",
    flag: "🇩🇿",
    name: { fr: "Algérie", en: "Algeria" },
  },
  {
    iso2: "AO",
    dialCode: "244",
    flag: "🇦🇴",
    name: { fr: "Angola", en: "Angola" },
  },
  {
    iso2: "BE",
    dialCode: "32",
    flag: "🇧🇪",
    name: { fr: "Belgique", en: "Belgium" },
  },
  {
    iso2: "BJ",
    dialCode: "229",
    flag: "🇧🇯",
    name: { fr: "Bénin", en: "Benin" },
  },
  {
    iso2: "BW",
    dialCode: "267",
    flag: "🇧🇼",
    name: { fr: "Botswana", en: "Botswana" },
  },
  {
    iso2: "BF",
    dialCode: "226",
    flag: "🇧🇫",
    name: { fr: "Burkina Faso", en: "Burkina Faso" },
  },
  {
    iso2: "BI",
    dialCode: "257",
    flag: "🇧🇮",
    name: { fr: "Burundi", en: "Burundi" },
  },
  {
    iso2: "CV",
    dialCode: "238",
    flag: "🇨🇻",
    name: { fr: "Cap-Vert", en: "Cabo Verde" },
  },
  {
    iso2: "CA",
    dialCode: "1",
    flag: "🇨🇦",
    name: { fr: "Canada", en: "Canada" },
  },
  {
    iso2: "CN",
    dialCode: "86",
    flag: "🇨🇳",
    name: { fr: "Chine", en: "China" },
  },
  {
    iso2: "KM",
    dialCode: "269",
    flag: "🇰🇲",
    name: { fr: "Comores", en: "Comoros" },
  },
  {
    iso2: "CG",
    dialCode: "242",
    flag: "🇨🇬",
    name: { fr: "Congo-Brazzaville", en: "Congo (Brazzaville)" },
  },
  {
    iso2: "CD",
    dialCode: "243",
    flag: "🇨🇩",
    name: { fr: "Congo-Kinshasa (RDC)", en: "DR Congo" },
  },
  {
    iso2: "DJ",
    dialCode: "253",
    flag: "🇩🇯",
    name: { fr: "Djibouti", en: "Djibouti" },
  },
  {
    iso2: "EG",
    dialCode: "20",
    flag: "🇪🇬",
    name: { fr: "Égypte", en: "Egypt" },
  },
  {
    iso2: "ER",
    dialCode: "291",
    flag: "🇪🇷",
    name: { fr: "Érythrée", en: "Eritrea" },
  },
  {
    iso2: "SZ",
    dialCode: "268",
    flag: "🇸🇿",
    name: { fr: "Eswatini", en: "Eswatini" },
  },
  {
    iso2: "ET",
    dialCode: "251",
    flag: "🇪🇹",
    name: { fr: "Éthiopie", en: "Ethiopia" },
  },
  {
    iso2: "GA",
    dialCode: "241",
    flag: "🇬🇦",
    name: { fr: "Gabon", en: "Gabon" },
  },
  {
    iso2: "GM",
    dialCode: "220",
    flag: "🇬🇲",
    name: { fr: "Gambie", en: "Gambia" },
  },
  {
    iso2: "GH",
    dialCode: "233",
    flag: "🇬🇭",
    name: { fr: "Ghana", en: "Ghana" },
  },
  {
    iso2: "GN",
    dialCode: "224",
    flag: "🇬🇳",
    name: { fr: "Guinée", en: "Guinea" },
  },
  {
    iso2: "GQ",
    dialCode: "240",
    flag: "🇬🇶",
    name: { fr: "Guinée équatoriale", en: "Equatorial Guinea" },
  },
  {
    iso2: "GW",
    dialCode: "245",
    flag: "🇬🇼",
    name: { fr: "Guinée-Bissau", en: "Guinea-Bissau" },
  },
  {
    iso2: "IT",
    dialCode: "39",
    flag: "🇮🇹",
    name: { fr: "Italie", en: "Italy" },
  },
  {
    iso2: "KE",
    dialCode: "254",
    flag: "🇰🇪",
    name: { fr: "Kenya", en: "Kenya" },
  },
  {
    iso2: "LS",
    dialCode: "266",
    flag: "🇱🇸",
    name: { fr: "Lesotho", en: "Lesotho" },
  },
  {
    iso2: "LR",
    dialCode: "231",
    flag: "🇱🇷",
    name: { fr: "Libéria", en: "Liberia" },
  },
  {
    iso2: "LY",
    dialCode: "218",
    flag: "🇱🇾",
    name: { fr: "Libye", en: "Libya" },
  },
  {
    iso2: "MG",
    dialCode: "261",
    flag: "🇲🇬",
    name: { fr: "Madagascar", en: "Madagascar" },
  },
  {
    iso2: "MW",
    dialCode: "265",
    flag: "🇲🇼",
    name: { fr: "Malawi", en: "Malawi" },
  },
  { iso2: "ML", dialCode: "223", flag: "🇲🇱", name: { fr: "Mali", en: "Mali" } },
  {
    iso2: "MA",
    dialCode: "212",
    flag: "🇲🇦",
    name: { fr: "Maroc", en: "Morocco" },
  },
  {
    iso2: "MU",
    dialCode: "230",
    flag: "🇲🇺",
    name: { fr: "Maurice", en: "Mauritius" },
  },
  {
    iso2: "MR",
    dialCode: "222",
    flag: "🇲🇷",
    name: { fr: "Mauritanie", en: "Mauritania" },
  },
  {
    iso2: "MZ",
    dialCode: "258",
    flag: "🇲🇿",
    name: { fr: "Mozambique", en: "Mozambique" },
  },
  {
    iso2: "NA",
    dialCode: "264",
    flag: "🇳🇦",
    name: { fr: "Namibie", en: "Namibia" },
  },
  {
    iso2: "NE",
    dialCode: "227",
    flag: "🇳🇪",
    name: { fr: "Niger", en: "Niger" },
  },
  {
    iso2: "NG",
    dialCode: "234",
    flag: "🇳🇬",
    name: { fr: "Nigéria", en: "Nigeria" },
  },
  {
    iso2: "UG",
    dialCode: "256",
    flag: "🇺🇬",
    name: { fr: "Ouganda", en: "Uganda" },
  },
  {
    iso2: "CF",
    dialCode: "236",
    flag: "🇨🇫",
    name: { fr: "République centrafricaine", en: "Central African Republic" },
  },
  {
    iso2: "GB",
    dialCode: "44",
    flag: "🇬🇧",
    name: { fr: "Royaume-Uni", en: "United Kingdom" },
  },
  {
    iso2: "RW",
    dialCode: "250",
    flag: "🇷🇼",
    name: { fr: "Rwanda", en: "Rwanda" },
  },
  {
    iso2: "ST",
    dialCode: "239",
    flag: "🇸🇹",
    name: { fr: "Sao Tomé-et-Principe", en: "São Tomé and Príncipe" },
  },
  {
    iso2: "SC",
    dialCode: "248",
    flag: "🇸🇨",
    name: { fr: "Seychelles", en: "Seychelles" },
  },
  {
    iso2: "SL",
    dialCode: "232",
    flag: "🇸🇱",
    name: { fr: "Sierra Leone", en: "Sierra Leone" },
  },
  {
    iso2: "SO",
    dialCode: "252",
    flag: "🇸🇴",
    name: { fr: "Somalie", en: "Somalia" },
  },
  {
    iso2: "SD",
    dialCode: "249",
    flag: "🇸🇩",
    name: { fr: "Soudan", en: "Sudan" },
  },
  {
    iso2: "SS",
    dialCode: "211",
    flag: "🇸🇸",
    name: { fr: "Soudan du Sud", en: "South Sudan" },
  },
  {
    iso2: "ZA",
    dialCode: "27",
    flag: "🇿🇦",
    name: { fr: "Afrique du Sud", en: "South Africa" },
  },
  {
    iso2: "TZ",
    dialCode: "255",
    flag: "🇹🇿",
    name: { fr: "Tanzanie", en: "Tanzania" },
  },
  {
    iso2: "TD",
    dialCode: "235",
    flag: "🇹🇩",
    name: { fr: "Tchad", en: "Chad" },
  },
  { iso2: "TG", dialCode: "228", flag: "🇹🇬", name: { fr: "Togo", en: "Togo" } },
  {
    iso2: "TN",
    dialCode: "216",
    flag: "🇹🇳",
    name: { fr: "Tunisie", en: "Tunisia" },
  },
  {
    iso2: "US",
    dialCode: "1",
    flag: "🇺🇸",
    name: { fr: "États-Unis", en: "United States" },
  },
  {
    iso2: "ZM",
    dialCode: "260",
    flag: "🇿🇲",
    name: { fr: "Zambie", en: "Zambia" },
  },
  {
    iso2: "ZW",
    dialCode: "263",
    flag: "🇿🇼",
    name: { fr: "Zimbabwe", en: "Zimbabwe" },
  },
];

export const PHONE_COUNTRIES = COUNTRIES;
export const DEFAULT_PHONE_COUNTRY_ISO2 = "CM";

export function getPhoneCountry(iso2: string): PhoneCountry | undefined {
  return COUNTRIES.find((c) => c.iso2 === iso2);
}

export function isPinnedPhoneCountry(iso2: string): boolean {
  return (PINNED_ISO2 as readonly string[]).includes(iso2);
}

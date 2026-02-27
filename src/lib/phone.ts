export type PhoneCountry = "MK" | "AL" | "XK" | "RS" | "BG" | "GR" | "DE" | "IT" | "AT" | "US";

type PhoneCountryOption = {
  code: PhoneCountry;
  dialCode: string;
  label: string;
  flag: string;
  minNationalDigits: number;
  maxNationalDigits: number;
  localExample: string;
};

export const PHONE_COUNTRIES: PhoneCountryOption[] = [
  {
    code: "MK",
    dialCode: "389",
    label: "North Macedonia",
    flag: "🇲🇰",
    minNationalDigits: 8,
    maxNationalDigits: 8,
    localExample: "070418392",
  },
  {
    code: "AL",
    dialCode: "355",
    label: "Albania",
    flag: "🇦🇱",
    minNationalDigits: 8,
    maxNationalDigits: 9,
    localExample: "0691234567",
  },
  {
    code: "XK",
    dialCode: "383",
    label: "Kosovo",
    flag: "🇽🇰",
    minNationalDigits: 8,
    maxNationalDigits: 8,
    localExample: "044123456",
  },
  {
    code: "RS",
    dialCode: "381",
    label: "Serbia",
    flag: "🇷🇸",
    minNationalDigits: 8,
    maxNationalDigits: 9,
    localExample: "0611234567",
  },
  {
    code: "BG",
    dialCode: "359",
    label: "Bulgaria",
    flag: "🇧🇬",
    minNationalDigits: 8,
    maxNationalDigits: 9,
    localExample: "0888123456",
  },
  {
    code: "GR",
    dialCode: "30",
    label: "Greece",
    flag: "🇬🇷",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    localExample: "6912345678",
  },
  {
    code: "DE",
    dialCode: "49",
    label: "Germany",
    flag: "🇩🇪",
    minNationalDigits: 9,
    maxNationalDigits: 11,
    localExample: "015112345678",
  },
  {
    code: "IT",
    dialCode: "39",
    label: "Italy",
    flag: "🇮🇹",
    minNationalDigits: 9,
    maxNationalDigits: 10,
    localExample: "3471234567",
  },
  {
    code: "AT",
    dialCode: "43",
    label: "Austria",
    flag: "🇦🇹",
    minNationalDigits: 9,
    maxNationalDigits: 11,
    localExample: "06641234567",
  },
  {
    code: "US",
    dialCode: "1",
    label: "United States",
    flag: "🇺🇸",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    localExample: "2025550123",
  },
];

const DEFAULT_COUNTRY: PhoneCountry = "MK";

function cleanDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toCompact(value: string) {
  const noSpaces = value.replace(/[\s\-()]/g, "");
  return noSpaces.startsWith("00") ? `+${noSpaces.slice(2)}` : noSpaces;
}

function toLocalDisplay(country: PhoneCountryOption, nationalDigits: string) {
  if (country.code === "MK") return `0${nationalDigits}`;
  return nationalDigits;
}

function getCountryByCode(countryCode: string): PhoneCountryOption {
  return (
    PHONE_COUNTRIES.find((country) => country.code === countryCode) ||
    PHONE_COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY)!
  );
}

export function normalizePhoneInput(rawPhone: string, countryCodeRaw: string) {
  const country = getCountryByCode(countryCodeRaw);
  const compact = toCompact(rawPhone.trim());

  if (!compact) {
    return {
      ok: false as const,
      error: "Phone number is required.",
    };
  }

  let nationalDigits = "";
  if (compact.startsWith("+")) {
    const intlDigits = cleanDigits(compact.slice(1));
    if (!intlDigits.startsWith(country.dialCode)) {
      return {
        ok: false as const,
        error: `Phone must match selected country prefix +${country.dialCode}.`,
      };
    }
    nationalDigits = intlDigits.slice(country.dialCode.length);
  } else {
    const digits = cleanDigits(compact);
    if (digits.startsWith(country.dialCode)) {
      nationalDigits = digits.slice(country.dialCode.length);
    } else if (digits.startsWith("0")) {
      nationalDigits = digits.slice(1);
    } else {
      nationalDigits = digits;
    }
  }

  if (country.code === "MK") {
    if (!/^7\d{7}$/.test(nationalDigits)) {
      return {
        ok: false as const,
        error:
          "Macedonian phone must start with 07 in local format, or use +389 / 00389.",
      };
    }
  } else if (
    nationalDigits.length < country.minNationalDigits ||
    nationalDigits.length > country.maxNationalDigits
  ) {
    return {
      ok: false as const,
      error: `${country.label} phone must be ${country.minNationalDigits}-${country.maxNationalDigits} digits.`,
    };
  }

  const e164 = `+${country.dialCode}${nationalDigits}`;
  return {
    ok: true as const,
    countryCode: country.code,
    e164,
    localPhone: toLocalDisplay(country, nationalDigits),
  };
}

export function parseStoredPhone(rawPhone: string | null | undefined) {
  if (!rawPhone) {
    const country = getCountryByCode(DEFAULT_COUNTRY);
    return { countryCode: country.code, localPhone: "" };
  }

  const compact = toCompact(rawPhone.trim());
  if (!compact.startsWith("+")) {
    const normalized = normalizePhoneInput(compact, DEFAULT_COUNTRY);
    if (normalized.ok) {
      return {
        countryCode: normalized.countryCode,
        localPhone: normalized.localPhone,
      };
    }
    return { countryCode: DEFAULT_COUNTRY, localPhone: compact };
  }

  const digits = cleanDigits(compact.slice(1));
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => digits.startsWith(country.dialCode));

  if (!match) {
    return { countryCode: DEFAULT_COUNTRY, localPhone: compact };
  }

  const nationalDigits = digits.slice(match.dialCode.length);
  return {
    countryCode: match.code,
    localPhone: toLocalDisplay(match, nationalDigits),
  };
}

export function getPhoneExample(countryCode: string) {
  return getCountryByCode(countryCode).localExample;
}

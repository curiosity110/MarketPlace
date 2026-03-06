import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHONE_COUNTRIES } from "@/lib/phone";

type ProfileSettingsSectionProps = {
  locale: "en" | "mk";
  userRecord: {
    name: string | null;
    email: string | null;
    company: string | null;
    website: string | null;
    address: string | null;
    bio: string | null;
  } | null;
  accountEmail: string;
  parsedPhone: {
    countryCode: string;
    localPhone: string;
  };
  storedPhoneE164: string;
  updateProfileAction: (formData: FormData) => Promise<void>;
  text: {
    profileSettings: string;
    profileSettingsDesc: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    phoneCountry: string;
    publicPhone: string;
    phonePlaceholder: string;
    companyOptional: string;
    companyPlaceholder: string;
    websiteOptional: string;
    addressOptional: string;
    addressPlaceholder: string;
    bioOptional: string;
    bioPlaceholder: string;
    phoneSavedHint: string;
    saveProfile: string;
  };
};

export function ProfileSettingsSection({
  locale,
  userRecord,
  accountEmail,
  parsedPhone,
  storedPhoneE164,
  updateProfileAction,
  text,
}: ProfileSettingsSectionProps) {
  void text.profileSettingsDesc;
  void text.phoneSavedHint;
  return (
    <details className="max-w-full min-w-0 overflow-x-hidden rounded-2xl bg-card/70 p-4 ring-1 ring-black/5 dark:ring-white/10">
      <summary className="cursor-pointer list-none text-sm font-semibold">
        {text.profileSettings}
      </summary>
      <div className="mt-4 space-y-4">
        <form
          action={updateProfileAction}
          className="space-y-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <div className="grid max-w-full min-w-0 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{text.fullName}</span>
              <Input
                name="name"
                defaultValue={userRecord?.name || ""}
                placeholder={text.fullNamePlaceholder}
                maxLength={80}
                autoComplete="name"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">{text.email}</span>
              <Input name="email" value={userRecord?.email || accountEmail} readOnly autoComplete="email" />
            </label>

            <div className="grid max-w-full min-w-0 gap-3 sm:col-span-2 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.phoneCountry}</span>
                <select
                  name="phoneCountry"
                  defaultValue={parsedPhone.countryCode}
                  className="h-10 rounded-xl border border-border bg-input px-3 text-sm"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.label} (+{country.dialCode})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.publicPhone}</span>
                <Input
                  name="phone"
                  defaultValue={parsedPhone.localPhone}
                  placeholder={text.phonePlaceholder}
                  required
                  minLength={6}
                  maxLength={20}
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+()\\-\\s]{6,20}"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{text.companyOptional}</span>
              <Input
                name="company"
                defaultValue={userRecord?.company || ""}
                placeholder={text.companyPlaceholder}
                maxLength={80}
                autoComplete="organization"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{text.websiteOptional}</span>
              <Input
                name="website"
                defaultValue={userRecord?.website || ""}
                placeholder="https://example.com"
                type="url"
                inputMode="url"
                maxLength={180}
                autoComplete="url"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">{text.addressOptional}</span>
              <Input
                name="address"
                defaultValue={userRecord?.address || ""}
                placeholder={text.addressPlaceholder}
                maxLength={180}
                autoComplete="street-address"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">{text.bioOptional}</span>
              <textarea
                name="bio"
                defaultValue={userRecord?.bio || ""}
                placeholder={text.bioPlaceholder}
                className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                maxLength={500}
              />
            </label>
          </div>

          {storedPhoneE164 ? (
            <div className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-foreground ring-1 ring-black/5 dark:ring-white/10">
              {storedPhoneE164}
            </div>
          ) : null}
          <Button type="submit">{text.saveProfile}</Button>
        </form>
      </div>
    </details>
  );
}

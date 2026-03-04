import { Fuel, Gauge, Calendar, Cog, CarFront, Route, DoorOpen, Users } from "lucide-react";

type Locale = "mk" | "en" | string;

function label(locale: Locale) {
  const isMk = locale === "mk";
  return {
    specs: isMk ? "Спецификации" : "Specs",
    make: isMk ? "Марка" : "Make",
    model: isMk ? "Модел" : "Model",
    year: isMk ? "Година" : "Year",
    km: isMk ? "Километри" : "Mileage",
    fuel: isMk ? "Гориво" : "Fuel",
    transmission: isMk ? "Менувач" : "Transmission",
    body: isMk ? "Каросерија" : "Body",
    engine: isMk ? "Мотор" : "Engine",
    power: isMk ? "Моќност" : "Power",
    drive: isMk ? "Погон" : "Drive",
    doors: isMk ? "Врати" : "Doors",
    seats: isMk ? "Седишта" : "Seats",
  };
}

function fmtKm(v: string) {
  const n = Number(String(v).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return v;
  return new Intl.NumberFormat("en-US").format(n) + " km";
}

function SpecRow({
  icon,
  k,
  v,
}: {
  icon: React.ReactNode;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {k}
        </div>
        <div className="truncate text-sm font-semibold">{v}</div>
      </div>
    </div>
  );
}

/**
 * valuesByKey is your map: { key: value }
 * This component only renders known car keys if present.
 */
export function CarSpecBento({
  locale,
  valuesByKey,
}: {
  locale: Locale;
  valuesByKey: Record<string, string | undefined>;
}) {
  const t = label(locale);

  // Accept multiple key names (because templates vary)
  const make = valuesByKey.make || valuesByKey.brand || valuesByKey.car_make;
  const model = valuesByKey.model || valuesByKey.car_model;
  const year = valuesByKey.year || valuesByKey.car_year;
  const kmRaw = valuesByKey.kilometers || valuesByKey.km || valuesByKey.mileage;
  const fuel = valuesByKey.fuel || valuesByKey.fuel_type;
  const transmission = valuesByKey.transmission || valuesByKey.gearbox;
  const body = valuesByKey.body || valuesByKey.body_type;
  const engine = valuesByKey.engine || valuesByKey.engine_cc || valuesByKey.displacement;
  const power = valuesByKey.power || valuesByKey.hp || valuesByKey.kw;
  const drive = valuesByKey.drive || valuesByKey.drivetrain;
  const doors = valuesByKey.doors;
  const seats = valuesByKey.seats;

  const items: Array<{ k: string; v?: string; icon: React.ReactNode }> = [
    { k: t.make, v: make, icon: <CarFront size={18} /> },
    { k: t.model, v: model, icon: <CarFront size={18} /> },
    { k: t.year, v: year, icon: <Calendar size={18} /> },
    { k: t.km, v: kmRaw ? fmtKm(kmRaw) : undefined, icon: <Gauge size={18} /> },
    { k: t.fuel, v: fuel, icon: <Fuel size={18} /> },
    { k: t.transmission, v: transmission, icon: <Cog size={18} /> },
    { k: t.body, v: body, icon: <CarFront size={18} /> },
    { k: t.engine, v: engine, icon: <Route size={18} /> },
    { k: t.power, v: power, icon: <Route size={18} /> },
    { k: t.drive, v: drive, icon: <Route size={18} /> },
    { k: t.doors, v: doors, icon: <DoorOpen size={18} /> },
    { k: t.seats, v: seats, icon: <Users size={18} /> },
  ].filter((x) => x.v && String(x.v).trim().length > 0);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.specs}</h2>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {items.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <SpecRow key={it.k} icon={it.icon} k={it.k} v={it.v!} />
        ))}
      </div>
    </div>
  );
}
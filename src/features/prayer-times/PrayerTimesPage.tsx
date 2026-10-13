import { useEffect, useMemo, useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { ErrorState } from "../../components/StateViews";
import { CITIES, findCity } from "../../lib/cityData";
import { getPrayerSettings, setPrayerSettings } from "../../lib/settings";
import {
  CALCULATION_METHODS,
  CALCULATION_METHOD_LABELS_AR,
  PRAYER_LABELS_AR,
  computePrayerTimes,
  findNextPrayer,
  formatClock,
  formatRemaining,
  type PrayerName,
} from "./prayerLib";
import type { PrayerSettings } from "../../lib/types";

export function PrayerTimesPage() {
  const [settings, setSettings] = useState<PrayerSettings>(() => getPrayerSettings());
  const [now, setNow] = useState(() => new Date());
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Update the clock/countdown periodically without hammering the device
  // (spec 8.2: avoid unnecessary resource use) — once per 20 seconds is
  // smooth enough for a minutes-granularity countdown.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(interval);
  }, []);

  function update(next: PrayerSettings) {
    setSettings(next);
    setPrayerSettings(next);
  }

  function requestDeviceLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        update({
          ...settings,
          useGeolocation: true,
          cityId: null,
          customLat: pos.coords.latitude,
          customLng: pos.coords.longitude,
          customLabel: "موقعي الحالي",
        });
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "تم رفض إذن الوصول إلى الموقع. يمكنك اختيار مدينة يدويًا بدلًا من ذلك."
            : "تعذر تحديد الموقع الجغرافي. يمكنك اختيار مدينة يدويًا بدلًا من ذلك.",
        );
      },
    );
  }

  const coords = useMemo(() => {
    if (settings.useGeolocation && settings.customLat != null && settings.customLng != null) {
      return { lat: settings.customLat, lng: settings.customLng, label: settings.customLabel ?? "موقعي" };
    }
    const city = findCity(settings.cityId ?? "");
    if (city) return { lat: city.lat, lng: city.lng, label: city.nameAr };
    return null;
  }, [settings]);

  const times = useMemo(() => {
    if (!coords) return null;
    try {
      const today = computePrayerTimes(coords.lat, coords.lng, now, settings.calculationMethod as never, settings.madhab);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = computePrayerTimes(
        coords.lat,
        coords.lng,
        tomorrow,
        settings.calculationMethod as never,
        settings.madhab,
      );
      const next = findNextPrayer(today, tomorrowTimes.fajr, now);
      return { today, next };
    } catch {
      return null;
    }
  }, [coords, now, settings.calculationMethod, settings.madhab]);

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="مواقيت الصلاة" subtitle={coords?.label} />

      <GlassCard className="p-4 my-3 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-brand-500 shrink-0" />
          <select
            value={settings.useGeolocation ? "__geo__" : (settings.cityId ?? "")}
            onChange={(e) => {
              if (e.target.value === "__geo__") return requestDeviceLocation();
              update({ ...settings, useGeolocation: false, cityId: e.target.value });
            }}
            className="flex-1 bg-transparent outline-none text-sm py-1"
          >
            <option value="__geo__">استخدام موقعي الحالي…</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr} — {c.country}
              </option>
            ))}
          </select>
          <button
            onClick={requestDeviceLocation}
            disabled={geoLoading}
            aria-label="تحديد موقعي"
            className="glass-btn p-2 rounded-full text-brand-600 disabled:opacity-50"
          >
            <LocateFixed size={16} />
          </button>
        </div>
        {geoError && <p className="text-xs text-amber-600">{geoError}</p>}

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-ink-muted flex flex-col gap-1">
            طريقة الحساب
            <select
              value={settings.calculationMethod}
              onChange={(e) => update({ ...settings, calculationMethod: e.target.value })}
              className="glass rounded-xl px-2 py-1.5 text-ink text-xs"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {CALCULATION_METHOD_LABELS_AR[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-muted flex flex-col gap-1">
            مذهب حساب العصر
            <select
              value={settings.madhab}
              onChange={(e) => update({ ...settings, madhab: e.target.value as "shafi" | "hanafi" })}
              className="glass rounded-xl px-2 py-1.5 text-ink text-xs"
            >
              <option value="shafi">الجمهور (شافعي ومالكي وحنبلي)</option>
              <option value="hanafi">حنفي</option>
            </select>
          </label>
        </div>
      </GlassCard>

      {!coords && (
        <ErrorState
          title="يرجى اختيار مدينة أو تفعيل تحديد الموقع"
          description="لحساب مواقيت الصلاة محليًا نحتاج إحداثيات الموقع."
        />
      )}

      {coords && !times && (
        <ErrorState title="تعذر حساب المواقيت لهذا الموقع" description="قد تكون الإحداثيات غير صالحة." />
      )}

      {times && (
        <>
          <GlassCard className="p-5 mb-3 text-center bg-brand-50/40">
            <p className="text-xs text-ink-muted">الصلاة القادمة</p>
            <p className="text-2xl font-bold text-brand-600 mt-1">
              {times.next.name ? PRAYER_LABELS_AR[times.next.name] : "—"}
            </p>
            {times.next.time && (
              <p className="text-sm text-ink-muted mt-1 tabular-ltr">
                {formatClock(times.next.time)} · بعد{" "}
                {formatRemaining(times.next.msRemaining ?? 0)}
              </p>
            )}
          </GlassCard>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                ["fajr", times.today.fajr],
                ["sunrise", times.today.sunrise],
                ["dhuhr", times.today.dhuhr],
                ["asr", times.today.asr],
                ["maghrib", times.today.maghrib],
                ["isha", times.today.isha],
              ] as [PrayerName, Date][]
            ).map(([name, time]) => (
              <GlassCard
                key={name}
                className={`p-3 text-center ${times.next.name === name ? "ring-2 ring-brand-400" : ""}`}
              >
                <p className="text-xs text-ink-muted">{PRAYER_LABELS_AR[name]}</p>
                <p className="font-bold tabular-ltr mt-1">{formatClock(time)}</p>
              </GlassCard>
            ))}
          </div>

          <p className="text-[11px] text-ink-muted text-center mt-4 leading-5">
            المواقيت محسوبة محليًا على جهازك بطريقة حساب فلكية قياسية، وقد تختلف بدقائق قليلة عن
            الجهات الرسمية في بعض المدن. تعمل هذه الصفحة دون إنترنت بعد تحديد الموقع لأول مرة.
          </p>
        </>
      )}
    </div>
  );
}

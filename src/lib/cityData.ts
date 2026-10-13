/**
 * cityData.ts
 * ------------
 * A curated (NOT exhaustive) list of major cities so prayer times can be
 * calculated locally without requiring geolocation permission. Coordinates
 * are city-center approximations, sufficient for prayer-time calculation
 * (which is not sensitive to small distances) but not survey-grade.
 *
 * This list is intentionally small and documented as incomplete — see
 * README "القيود المعروفة". Geolocation (with the user's permission)
 * covers any city not listed here; a custom lat/long entry is also
 * offered in Settings.
 */
export interface CityOption {
  id: string;
  nameAr: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string; // IANA timezone id
}

export const CITIES: CityOption[] = [
  { id: "makkah", nameAr: "مكة المكرمة", country: "السعودية", lat: 21.4225, lng: 39.8262, timezone: "Asia/Riyadh" },
  { id: "madinah", nameAr: "المدينة المنورة", country: "السعودية", lat: 24.4672, lng: 39.6111, timezone: "Asia/Riyadh" },
  { id: "riyadh", nameAr: "الرياض", country: "السعودية", lat: 24.7136, lng: 46.6753, timezone: "Asia/Riyadh" },
  { id: "jeddah", nameAr: "جدة", country: "السعودية", lat: 21.4858, lng: 39.1925, timezone: "Asia/Riyadh" },
  { id: "dammam", nameAr: "الدمام", country: "السعودية", lat: 26.4207, lng: 50.0888, timezone: "Asia/Riyadh" },
  { id: "cairo", nameAr: "القاهرة", country: "مصر", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
  { id: "alexandria", nameAr: "الإسكندرية", country: "مصر", lat: 31.2001, lng: 29.9187, timezone: "Africa/Cairo" },
  { id: "giza", nameAr: "الجيزة", country: "مصر", lat: 30.0131, lng: 31.2089, timezone: "Africa/Cairo" },
  { id: "amman", nameAr: "عمّان", country: "الأردن", lat: 31.9454, lng: 35.9284, timezone: "Asia/Amman" },
  { id: "baghdad", nameAr: "بغداد", country: "العراق", lat: 33.3152, lng: 44.3661, timezone: "Asia/Baghdad" },
  { id: "basra", nameAr: "البصرة", country: "العراق", lat: 30.5085, lng: 47.7804, timezone: "Asia/Baghdad" },
  { id: "damascus", nameAr: "دمشق", country: "سوريا", lat: 33.5138, lng: 36.2765, timezone: "Asia/Damascus" },
  { id: "aleppo", nameAr: "حلب", country: "سوريا", lat: 36.2021, lng: 37.1343, timezone: "Asia/Damascus" },
  { id: "beirut", nameAr: "بيروت", country: "لبنان", lat: 33.8938, lng: 35.5018, timezone: "Asia/Beirut" },
  { id: "jerusalem", nameAr: "القدس", country: "فلسطين", lat: 31.7683, lng: 35.2137, timezone: "Asia/Hebron" },
  { id: "gaza", nameAr: "غزة", country: "فلسطين", lat: 31.5017, lng: 34.4668, timezone: "Asia/Gaza" },
  { id: "ramallah", nameAr: "رام الله", country: "فلسطين", lat: 31.9038, lng: 35.2034, timezone: "Asia/Hebron" },
  { id: "kuwait", nameAr: "مدينة الكويت", country: "الكويت", lat: 29.3759, lng: 47.9774, timezone: "Asia/Kuwait" },
  { id: "doha", nameAr: "الدوحة", country: "قطر", lat: 25.2854, lng: 51.531, timezone: "Asia/Qatar" },
  { id: "manama", nameAr: "المنامة", country: "البحرين", lat: 26.2285, lng: 50.586, timezone: "Asia/Bahrain" },
  { id: "abudhabi", nameAr: "أبوظبي", country: "الإمارات", lat: 24.4539, lng: 54.3773, timezone: "Asia/Dubai" },
  { id: "dubai", nameAr: "دبي", country: "الإمارات", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" },
  { id: "muscat", nameAr: "مسقط", country: "عُمان", lat: 23.588, lng: 58.3829, timezone: "Asia/Muscat" },
  { id: "sanaa", nameAr: "صنعاء", country: "اليمن", lat: 15.3694, lng: 44.191, timezone: "Asia/Aden" },
  { id: "aden", nameAr: "عدن", country: "اليمن", lat: 12.7855, lng: 45.0187, timezone: "Asia/Aden" },
  { id: "khartoum", nameAr: "الخرطوم", country: "السودان", lat: 15.5007, lng: 32.5599, timezone: "Africa/Khartoum" },
  { id: "tripoli", nameAr: "طرابلس", country: "ليبيا", lat: 32.8872, lng: 13.1913, timezone: "Africa/Tripoli" },
  { id: "tunis", nameAr: "تونس", country: "تونس", lat: 36.8065, lng: 10.1815, timezone: "Africa/Tunis" },
  { id: "algiers", nameAr: "الجزائر", country: "الجزائر", lat: 36.7538, lng: 3.0588, timezone: "Africa/Algiers" },
  { id: "rabat", nameAr: "الرباط", country: "المغرب", lat: 34.0209, lng: -6.8416, timezone: "Africa/Casablanca" },
  { id: "casablanca", nameAr: "الدار البيضاء", country: "المغرب", lat: 33.5731, lng: -7.5898, timezone: "Africa/Casablanca" },
  { id: "nouakchott", nameAr: "نواكشوط", country: "موريتانيا", lat: 18.0735, lng: -15.9582, timezone: "Africa/Nouakchott" },
  { id: "mogadishu", nameAr: "مقديشو", country: "الصومال", lat: 2.0469, lng: 45.3182, timezone: "Africa/Mogadishu" },
  { id: "djibouti", nameAr: "جيبوتي", country: "جيبوتي", lat: 11.8251, lng: 42.5903, timezone: "Africa/Djibouti" },
  { id: "istanbul", nameAr: "إسطنبول", country: "تركيا", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul" },
  { id: "ankara", nameAr: "أنقرة", country: "تركيا", lat: 39.9334, lng: 32.8597, timezone: "Europe/Istanbul" },
  { id: "tehran", nameAr: "طهران", country: "إيران", lat: 35.6892, lng: 51.389, timezone: "Asia/Tehran" },
  { id: "islamabad", nameAr: "إسلام آباد", country: "باكستان", lat: 33.6844, lng: 73.0479, timezone: "Asia/Karachi" },
  { id: "karachi", nameAr: "كراتشي", country: "باكستان", lat: 24.8607, lng: 67.0011, timezone: "Asia/Karachi" },
  { id: "lahore", nameAr: "لاهور", country: "باكستان", lat: 31.5204, lng: 74.3587, timezone: "Asia/Karachi" },
  { id: "dhaka", nameAr: "دكّا", country: "بنغلاديش", lat: 23.8103, lng: 90.4125, timezone: "Asia/Dhaka" },
  { id: "jakarta", nameAr: "جاكرتا", country: "إندونيسيا", lat: -6.2088, lng: 106.8456, timezone: "Asia/Jakarta" },
  { id: "kualalumpur", nameAr: "كوالالمبور", country: "ماليزيا", lat: 3.139, lng: 101.6869, timezone: "Asia/Kuala_Lumpur" },
  { id: "london", nameAr: "لندن", country: "المملكة المتحدة", lat: 51.5072, lng: -0.1276, timezone: "Europe/London" },
  { id: "paris", nameAr: "باريس", country: "فرنسا", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  { id: "berlin", nameAr: "برلين", country: "ألمانيا", lat: 52.52, lng: 13.405, timezone: "Europe/Berlin" },
  { id: "newyork", nameAr: "نيويورك", country: "الولايات المتحدة", lat: 40.7128, lng: -74.006, timezone: "America/New_York" },
  { id: "toronto", nameAr: "تورونتو", country: "كندا", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
];

export function findCity(id: string): CityOption | undefined {
  return CITIES.find((c) => c.id === id);
}

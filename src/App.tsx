import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./app/Layout";
import { UpdatePrompt } from "./app/UpdatePrompt";
import { HomePage } from "./features/home/HomePage";
import { SurahListPage } from "./features/quran/SurahListPage";
import { SurahReaderPage } from "./features/quran/SurahReaderPage";
import { SearchPage } from "./features/search/SearchPage";
import { TafsirPage } from "./features/tafsir/TafsirPage";
import { PrayerTimesPage } from "./features/prayer-times/PrayerTimesPage";
import { RelaxationPage } from "./features/relaxation/RelaxationPage";
import { SettingsPage } from "./features/settings/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quran" element={<SurahListPage />} />
          <Route path="/quran/:surahId" element={<SurahReaderPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tafsir/:surahId/:ayahId" element={<TafsirPage />} />
          <Route path="/prayer-times" element={<PrayerTimesPage />} />
          <Route path="/relaxation" element={<RelaxationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <UpdatePrompt />
    </BrowserRouter>
  );
}

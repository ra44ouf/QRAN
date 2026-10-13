import type { Ayah, ChapterMeta, TafsirEntry } from "./types";

const cache = new Map<string, unknown>();

async function getJSON<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`تعذر تحميل البيانات (${res.status}): ${url}`);
  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

export function loadChapters(): Promise<ChapterMeta[]> {
  return getJSON<ChapterMeta[]>("/data/meta/chapters.json");
}

export function loadSurah(id: number): Promise<Ayah[]> {
  return getJSON<Ayah[]>(`/data/quran/${id}.json`);
}

export function loadTafsirForSurah(id: number): Promise<TafsirEntry[]> {
  return getJSON<TafsirEntry[]>(`/data/tafsir/${id}.json`);
}

export interface SourceMeta {
  id: string;
  nameAr: string;
  [key: string]: unknown;
}

export function loadQuranSourceMeta(): Promise<SourceMeta> {
  return getJSON<SourceMeta>("/data/meta/quran-source.json");
}

export function loadTafsirSourceMeta(): Promise<SourceMeta> {
  return getJSON<SourceMeta>("/data/meta/tafsir-source.json");
}

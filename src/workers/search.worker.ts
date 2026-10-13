/// <reference lib="webworker" />
/**
 * search.worker.ts
 * -----------------
 * Runs the search engine off the main thread so typing never freezes the
 * UI (spec 6.3). The index (6236 ayat with precomputed normalized text,
 * built at build-time by scripts/build-data.mts) is fetched once on
 * startup and kept in memory for the worker's lifetime.
 *
 * The actual matching logic lives in ../lib/searchEngine.ts (pure,
 * unit-tested); this file is just the postMessage plumbing.
 */
import { searchIndex } from "../lib/searchEngine";
import type { SearchIndexEntry, SearchResult } from "../lib/types";

let index: SearchIndexEntry[] = [];
let ready = false;

type InMessage =
  | { type: "init" }
  | { type: "query"; query: string; limit?: number; requestId: number };

type OutMessage =
  | { type: "ready"; count: number }
  | { type: "error"; message: string }
  | {
      type: "results";
      requestId: number;
      query: string;
      results: SearchResult[];
      elapsedMs: number;
    };

function post(msg: OutMessage) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);
}

async function init() {
  try {
    const res = await fetch("/data/search-index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    index = (await res.json()) as SearchIndexEntry[];
    ready = true;
    post({ type: "ready", count: index.length });
  } catch (err) {
    post({ type: "error", message: `تعذر تحميل فهرس البحث: ${String(err)}` });
  }
}

self.addEventListener("message", (event: MessageEvent<InMessage>) => {
  const msg = event.data;
  if (msg.type === "init") {
    void init();
    return;
  }
  if (msg.type === "query") {
    if (!ready) {
      post({ type: "error", message: "الفهرس لم يكتمل تحميله بعد" });
      return;
    }
    const start = performance.now();
    const results = searchIndex(index, msg.query, msg.limit ?? 50);
    const elapsedMs = performance.now() - start;
    post({ type: "results", requestId: msg.requestId, query: msg.query, results, elapsedMs });
  }
});

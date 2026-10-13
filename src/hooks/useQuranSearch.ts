import { useEffect, useRef, useState, useCallback } from "react";
import type { SearchResult } from "../lib/types";

type WorkerOutMessage =
  | { type: "ready"; count: number }
  | { type: "error"; message: string }
  | {
      type: "results";
      requestId: number;
      query: string;
      results: SearchResult[];
      elapsedMs: number;
    };

export interface SearchState {
  status: "loading-index" | "ready" | "error";
  errorMessage: string | null;
  indexSize: number;
  results: SearchResult[];
  lastQuery: string;
  elapsedMs: number | null;
  isSearching: boolean;
}

/**
 * Hook around the search Web Worker. Search runs truly "as you type": we
 * do not debounce artificially — the worker answers in well under a
 * millisecond for this dataset size (see README benchmarks), so adding a
 * debounce would only make the UI feel less instant without any real
 * performance benefit.
 */
export function useQuranSearch() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<SearchState>({
    status: "loading-index",
    errorMessage: null,
    indexSize: 0,
    results: [],
    lastQuery: "",
    elapsedMs: null,
    isSearching: false,
  });

  useEffect(() => {
    const worker = new Worker(new URL("../workers/search.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        setState((s) => ({ ...s, status: "ready", indexSize: msg.count }));
      } else if (msg.type === "error") {
        setState((s) => ({ ...s, status: "error", errorMessage: msg.message }));
      } else if (msg.type === "results") {
        setState((s) => {
          // ignore stale responses from superseded requests
          if (msg.requestId !== requestIdRef.current) return s;
          return {
            ...s,
            results: msg.results,
            lastQuery: msg.query,
            elapsedMs: msg.elapsedMs,
            isSearching: false,
          };
        });
      }
    });

    worker.postMessage({ type: "init" });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const search = useCallback((query: string, limit = 50) => {
    const worker = workerRef.current;
    if (!worker) return;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (query.trim().length === 0) {
      setState((s) => ({ ...s, results: [], lastQuery: "", isSearching: false }));
      return;
    }
    setState((s) => ({ ...s, isSearching: true }));
    worker.postMessage({ type: "query", query, limit, requestId });
  }, []);

  return { ...state, search };
}

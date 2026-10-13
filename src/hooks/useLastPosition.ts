import { useCallback, useEffect, useState } from "react";
import { getLastPosition, setLastPosition } from "../lib/db";
import type { LastPosition } from "../lib/types";

export function useLastPosition() {
  const [position, setPosition] = useState<LastPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setPosition(await getLastPosition());
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (surah: number, ayah: number, scrollOffset?: number) => {
    await setLastPosition({ surah, ayah, scrollOffset });
    setPosition({ id: "current", surah, ayah, scrollOffset, updatedAt: Date.now() });
  }, []);

  return { position, loading, save };
}

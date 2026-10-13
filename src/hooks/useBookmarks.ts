import { useCallback, useEffect, useState } from "react";
import { addBookmark, listBookmarks, removeBookmark } from "../lib/db";
import type { Bookmark } from "../lib/types";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listBookmarks();
    setBookmarks(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (surah: number, ayah: number, surahName: string) => {
      const id = `${surah}:${ayah}`;
      const exists = bookmarks.some((b) => b.id === id);
      if (exists) {
        await removeBookmark(id);
      } else {
        await addBookmark({ id, surah, ayah, surahName, createdAt: Date.now() });
      }
      await refresh();
    },
    [bookmarks, refresh],
  );

  const isBookmarked = useCallback(
    (surah: number, ayah: number) => bookmarks.some((b) => b.id === `${surah}:${ayah}`),
    [bookmarks],
  );

  return { bookmarks, loading, toggle, isBookmarked, refresh };
}

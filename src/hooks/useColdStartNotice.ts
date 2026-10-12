import { useEffect, useState } from "react";

const COLD_START_DELAY_MS = 3000;

/**
 * True bila `active` masih true setelah 3 detik — dipakai untuk pesan
 * cold-start "Server sedang bangun...". Timer dibersihkan saat selesai.
 */
export function useColdStartNotice(active: boolean, delayMs = COLD_START_DELAY_MS): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setShow(true), delayMs);
    return () => {
      window.clearTimeout(t);
      setShow(false);
    };
  }, [active, delayMs]);

  return show;
}

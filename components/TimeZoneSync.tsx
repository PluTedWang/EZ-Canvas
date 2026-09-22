"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveTimeZone } from "@/lib/set-time-zone";

// Days, deadlines and study hours are computed on the server in this zone, so it follows the
// student when they travel or move between home and campus.
export function TimeZoneSync({ saved }: { saved: string }) {
  const router = useRouter();
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && zone !== saved) saveTimeZone(zone).then(() => router.refresh());
  }, [saved, router]);
  return null;
}

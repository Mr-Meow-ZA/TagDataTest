"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RealtimeRefreshProps = {
  householdId: string;
  tables: string[];
};

export function RealtimeRefresh({ householdId, tables }: RealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`love-hub-${householdId}-${tables.join("-")}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `household_id=eq.${householdId}`,
        },
        () => router.refresh(),
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, router, tables]);

  return null;
}

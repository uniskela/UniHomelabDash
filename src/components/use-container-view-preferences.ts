"use client";

import { useCallback, useState } from "react";
import { saveContainerViewPreferencesAction } from "@/lib/providers/container-preferences-actions";
import type { ContainerViewPreferences } from "@/lib/providers/container-preferences";

/**
 * Keeps view preferences responsive locally while persisting them for the
 * single admin user, so hidden containers and layout survive reloads and are
 * shared between phone and desktop.
 */
export function useContainerViewPreferences(initial: ContainerViewPreferences) {
  const [preferences, setPreferences] = useState(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  const update = useCallback((next: ContainerViewPreferences) => {
    setPreferences(next);

    saveContainerViewPreferencesAction(next)
      .then((result) => setSaveError(result.ok ? null : result.message))
      .catch(() => setSaveError("Could not save view preferences."));
  }, []);

  return { preferences, saveError, update };
}

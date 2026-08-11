"use client";

import { useCallback, useState } from "react";
import { saveContainerViewPreferencesAction } from "@/lib/providers/container-preferences-actions";
import type { ContainerWorkspacePreferences } from "@/lib/providers/container-preferences";

/**
 * Keeps workspace preferences responsive locally while persisting them for the
 * single admin user, so hidden containers and saved views survive reloads.
 */
export function useContainerViewPreferences(initial: ContainerWorkspacePreferences) {
  const [preferences, setPreferences] = useState(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  const update = useCallback((next: ContainerWorkspacePreferences) => {
    setPreferences(next);

    saveContainerViewPreferencesAction(next)
      .then((result) => setSaveError(result.ok ? null : result.message))
      .catch(() => setSaveError("Could not save view preferences."));
  }, []);

  return { preferences, saveError, update };
}

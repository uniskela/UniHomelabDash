import "server-only";
import {
  defaultContainerViewPreferences,
  parseContainerViewPreferences,
  serializeContainerViewPreferences,
  type ContainerViewPreferences,
} from "@/lib/providers/container-preferences";
import { SETTING_KEYS } from "@/lib/settings/keys";
import { getSetting, setSetting } from "@/lib/settings/store";

export function readContainerViewPreferences(): ContainerViewPreferences {
  try {
    return parseContainerViewPreferences(getSetting(SETTING_KEYS.containerView));
  } catch {
    // Preferences are cosmetic: never block the Containers page on them.
    return defaultContainerViewPreferences;
  }
}

export function writeContainerViewPreferences(value: ContainerViewPreferences) {
  setSetting(SETTING_KEYS.containerView, serializeContainerViewPreferences(value));
}

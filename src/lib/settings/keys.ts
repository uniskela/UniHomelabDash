export const SETTING_KEYS = {
  setupComplete: "setup_complete",
  containerView: "container_view_prefs",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

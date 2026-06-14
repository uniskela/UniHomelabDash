export const SETTING_KEYS = {
  setupComplete: "setup_complete",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

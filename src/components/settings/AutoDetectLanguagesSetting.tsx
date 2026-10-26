import { X } from "../icons";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import registry from "../../config/languageRegistry.json";
import { getLanguageLabel } from "../../utils/languageSupport";
import { SettingsPanelRow, SettingsRow } from "../ui/SettingsSection";
import LanguageSelector from "../ui/LanguageSelector";

const LANGUAGE_OPTIONS = registry.languages
  .filter((l) => l.code !== "auto" && l.whisper)
  .map(({ code, label, flag }) => ({ value: code, label, flag }));

const OPTION_BY_CODE = new Map(LANGUAGE_OPTIONS.map((o) => [o.value, o]));

export default function AutoDetectLanguagesSetting() {
  const { t } = useTranslation();
  const autoDetectLanguages = useSettingsStore((s) => s.autoDetectLanguages);
  const setAutoDetectLanguages = useSettingsStore((s) => s.setAutoDetectLanguages);

  const availableOptions = LANGUAGE_OPTIONS.filter((o) => !autoDetectLanguages.includes(o.value));

  const addLanguage = (code: string) => {
    if (code && !autoDetectLanguages.includes(code)) {
      setAutoDetectLanguages([...autoDetectLanguages, code]);
    }
  };

  const removeLanguage = (code: string) => {
    setAutoDetectLanguages(autoDetectLanguages.filter((c) => c !== code));
  };

  return (
    <SettingsPanelRow>
      <SettingsRow
        label={t("settings.language.autoDetectLanguagesLabel")}
        description={t("settings.language.autoDetectLanguagesDescription")}
      >
        <div className="flex flex-col items-end gap-2">
          {autoDetectLanguages.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {autoDetectLanguages.map((code) => {
                const label = OPTION_BY_CODE.get(code)?.label ?? getLanguageLabel(code);
                const flag = OPTION_BY_CODE.get(code)?.flag ?? "";
                return (
                  <div
                    key={code}
                    className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 ps-2 pe-1 text-xs font-medium text-muted-foreground"
                  >
                    {flag && <span aria-hidden="true">{flag}</span>}
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => removeLanguage(code)}
                      aria-label={t("settings.language.autoDetectLanguagesRemove", {
                        language: label,
                      })}
                      className="rounded-full p-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <LanguageSelector
            value=""
            onChange={addLanguage}
            options={availableOptions}
            placeholder={t("settings.language.autoDetectLanguagesAdd")}
          />
        </div>
      </SettingsRow>
    </SettingsPanelRow>
  );
}

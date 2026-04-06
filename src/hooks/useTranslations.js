import { useApp } from "../context/AppContext";
import { translations } from "../data/translations";

export function useTranslations() {
  const { state } = useApp();
  return translations[state.language] ?? translations.hiligaynon;
}

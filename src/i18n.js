import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'

export const i18n = createI18n({
  legacy: false, // use Composition API
  locale: 'de', // default locale
  fallbackLocale: 'en',
  messages: {
    en,
    de
  }
})

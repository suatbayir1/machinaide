import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_en from './translations/en.json';
import common_tr from './translations/tr.json';

const resources = {
    en: {
        translation: common_en
    },
    tr: {
        translation: common_tr
    }
}

i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    keySeparator: '.',
    interpolation: {
        escapeValue: false
    }
});

export default i18n;
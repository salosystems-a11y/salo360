import React, { createContext, useContext, useState, useEffect } from 'react';
import ptTranslations from '@/locales/pt.json';
import enTranslations from '@/locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  pt: ptTranslations,
  en: enTranslations,
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language');
    return savedLang && (savedLang === 'pt' || savedLang === 'en') ? savedLang : 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, params = {}) => {
    let translation = translations[language][key] || key;
    Object.keys(params).forEach(paramKey => {
      translation = translation.replace(`{${paramKey}}`, params[paramKey]);
    });
    return translation;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
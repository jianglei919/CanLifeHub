import { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../src/utils/translations';

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Default to Chinese if not set
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

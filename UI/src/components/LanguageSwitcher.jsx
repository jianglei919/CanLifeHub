import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher({ className }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage}
      className={`language-btn ${className || ''}`}
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '20px',
        padding: '4px 12px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--text-main, #334155)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s'
      }}
    >
      <span>🌐</span>
      <span>{language === 'zh' ? 'EN' : '中'}</span>
    </button>
  );
}

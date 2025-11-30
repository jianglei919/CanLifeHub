import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../styles/Home.css';

export default function Home() {
  const { user } = useContext(UserContext);
  const { t } = useLanguage();

  const resourceCategories = [
    {
      title: t('immigration'),
      icon: "🍁",
      description: t('immigrationDesc'),
      links: [
        { name: t('ircc'), url: "https://www.canada.ca/en/services/immigration-citizenship.html" },
        { name: t('eeScore'), url: "https://www.cic.gc.ca/english/immigrate/skilled/crs-tool.asp" },
        { name: t('visaStatus'), url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-status.html" }
      ]
    },
    {
      title: t('jobs'),
      icon: "💼",
      description: t('jobsDesc'),
      links: [
        { name: t('jobBank'), url: "https://www.jobbank.gc.ca/home" },
        { name: t('indeed'), url: "https://ca.indeed.com/" },
        { name: t('linkedin'), url: "https://www.linkedin.com/jobs/" }
      ]
    },
    {
      title: t('housing'),
      icon: "🏠",
      description: t('housingDesc'),
      links: [
        { name: t('realtor'), url: "https://www.realtor.ca/" },
        { name: t('kijiji'), url: "https://www.kijiji.ca/" },
        { name: t('craigslist'), url: "https://www.craigslist.org/about/sites#CA" }
      ]
    },
    {
      title: t('news'),
      icon: "📰",
      description: t('newsDesc'),
      links: [
        { name: t('cbc'), url: "https://www.cbc.ca/news" },
        { name: t('weather'), url: "https://www.theweathernetwork.com/ca" },
        { name: t('ctv'), url: "https://www.ctvnews.ca/" }
      ]
    }
  ];

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-nav-wrapper">
          <Link to="/" className="home-logo">🍁 CanLifeHub</Link>
          
          <div className="home-nav-links">
            <LanguageSwitcher />
            {!user && (
              <>
                <Link to="/login" className="nav-btn btn-outline">{t('login')}</Link>
                <Link to="/register" className="nav-btn btn-primary">{t('register')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">{t('heroTitle')}</h1>
        <p className="hero-subtitle">
          {t('heroSubtitle')}
        </p>
        <div className="hero-actions">
          <Link to="/forum" className="hero-btn btn-primary" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
            {t('enterForum')}
          </Link>
          <a href="#resources" className="hero-btn btn-outline" style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            {t('exploreResources')}
          </a>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="resources-section">
        <h2 className="section-title">{t('resourcesTitle')}</h2>
        <div className="resources-grid">
          {resourceCategories.map((category, index) => (
            <div key={index} className="resource-card">
              <div className="card-icon">{category.icon}</div>
              <h3 className="card-title">{category.title}</h3>
              <p className="card-desc">{category.description}</p>
              <div className="card-links">
                {category.links.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="link-item"
                  >
                    🔗 {link.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>{t('footerRights')}</p>
      </footer>
    </div>
  );
}

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import '../styles/Home.css';

export default function Home() {
  const { user } = useContext(UserContext);

  const resourceCategories = [
    {
      title: "移民与签证",
      icon: "🍁",
      description: "加拿大官方移民指南、签证申请入口及最新政策解读。",
      links: [
        { name: "IRCC 官网 (移民局)", url: "https://www.canada.ca/en/services/immigration-citizenship.html" },
        { name: "EE 快速通道打分", url: "https://www.cic.gc.ca/english/immigrate/skilled/crs-tool.asp" },
        { name: "签证申请状态查询", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-status.html" }
      ]
    },
    {
      title: "求职与就业",
      icon: "💼",
      description: "寻找加拿大本地工作机会，了解职场文化与薪资水平。",
      links: [
        { name: "Job Bank (政府招聘)", url: "https://www.jobbank.gc.ca/home" },
        { name: "Indeed Canada", url: "https://ca.indeed.com/" },
        { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/" }
      ]
    },
    {
      title: "住房与生活",
      icon: "🏠",
      description: "租房买房、二手交易及日常生活必备工具。",
      links: [
        { name: "Realtor.ca (房产)", url: "https://www.realtor.ca/" },
        { name: "Kijiji (二手/租房)", url: "https://www.kijiji.ca/" },
        { name: "Craigslist", url: "https://www.craigslist.org/about/sites#CA" }
      ]
    },
    {
      title: "新闻与资讯",
      icon: "📰",
      description: "实时掌握加拿大本地新闻、天气及社区动态。",
      links: [
        { name: "CBC News", url: "https://www.cbc.ca/news" },
        { name: "The Weather Network", url: "https://www.theweathernetwork.com/ca" },
        { name: "CTV News", url: "https://www.ctvnews.ca/" }
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
            {!user && (
              <>
                <Link to="/login" className="nav-btn btn-outline">登录</Link>
                <Link to="/register" className="nav-btn btn-primary">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">连接你的加拿大生活</h1>
        <p className="hero-subtitle">
          一站式加拿大生活分享平台。在这里分享经历、获取资讯、结识朋友，让移民生活不再孤单。
        </p>
        <div className="hero-actions">
          <Link to="/forum" className="hero-btn btn-primary" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
            进入社区论坛
          </Link>
          <a href="#resources" className="hero-btn btn-outline" style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            探索实用资源
          </a>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="resources-section">
        <h2 className="section-title">🇨🇦 实用资源导航</h2>
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
        <p>© 2025 CanLifeHub. All rights reserved.</p>
      </footer>
    </div>
  );
}

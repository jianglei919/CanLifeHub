import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../api/http';
import AdManager from '../components/AdManager';
import '../styles/AdminDashboard.css';

const MOCK_ORDERS = [
  { _id: 'ORD-MOCK1', title: 'Summer Sale Campaign', advertiser: { contactName: 'Nike Inc.', contactEmail: 'marketing@nike.com' }, billing: { totalDue: 5000 }, schedule: { dailyBudget: 200 }, status: 'running', createdAt: new Date().toISOString() },
  { _id: 'ORD-MOCK2', title: 'New App Launch', advertiser: { contactName: 'TechStart', contactEmail: 'hello@techstart.io' }, billing: { totalDue: 12000 }, schedule: { dailyBudget: 500 }, status: 'pending_review', createdAt: new Date().toISOString() },
  { _id: 'ORD-MOCK3', title: 'Holiday Special', advertiser: { contactName: 'Local Shop', contactEmail: 'owner@shop.com' }, billing: { totalDue: 1500 }, schedule: { dailyBudget: 50 }, status: 'draft', createdAt: new Date().toISOString() },
  { _id: 'ORD-MOCK4', title: 'Brand Awareness', advertiser: { contactName: 'Coca Cola', contactEmail: 'ads@coke.com' }, billing: { totalDue: 8000 }, schedule: { dailyBudget: 300 }, status: 'approved', createdAt: new Date().toISOString() },
  { _id: 'ORD-MOCK5', title: 'Recruitment Drive', advertiser: { contactName: 'HR Dept', contactEmail: 'hr@company.com' }, billing: { totalDue: 2000 }, schedule: { dailyBudget: 100 }, status: 'paused', createdAt: new Date().toISOString() },
];

export default function AdminDashboard() {
  const { user } = useContext(UserContext);
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [adSearch, setAdSearch] = useState('');
  const [adStatus, setAdStatus] = useState('');

  const [usersData, setUsersData] = useState({ items: [], page: 1, pageSize: 8, total: 0, search: '' });
  const [usersLoading, setUsersLoading] = useState(false);

  const [postsData, setPostsData] = useState({ items: [], page: 1, pageSize: 8, total: 0, search: '' });
  const [postsLoading, setPostsLoading] = useState(false);

  const [reportsData, setReportsData] = useState({ userGrowth: [], topPosts: [] });
  const [loadingReports, setLoadingReports] = useState(false);

  const sideNav = [
    { id: 'overview', icon: '📊', label: t('dashboard') },
    { id: 'users', icon: '👥', label: t('userManagement') },
    { id: 'posts', icon: '📝', label: t('contentModeration') },
    { id: 'ads', icon: '📢', label: t('adCampaigns') },
    { id: 'reports', icon: '📈', label: t('dataReports') },
  ];

  const postStatuses = [
    { value: 'active', label: t('statusActive') },
    { value: 'pending', label: t('statusPending') },
    { value: 'hidden', label: t('statusHidden') },
    { value: 'deleted', label: t('statusDeleted') },
  ];

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const { data } = await adminApi.getOverview();
      if (data.ok) {
        setOverview(data);
      }
    } catch (error) {
      toast.error(error.message || t('loadReportsFailed'));
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchUsers = useCallback(async (overrides = {}) => {
    const params = {
      page: overrides.page ?? usersData.page,
      pageSize: overrides.pageSize ?? usersData.pageSize,
      search: overrides.search ?? usersData.search,
    };
    try {
      setUsersLoading(true);
      const { data } = await adminApi.listUsers(params);
      if (data.ok) {
        setUsersData({
          ...params,
          items: data.items || [],
          total: data.total || 0,
        });
      }
    } catch (error) {
      toast.error(error.message || t('loadUsersFailed'));
    } finally {
      setUsersLoading(false);
    }
  }, [usersData.page, usersData.pageSize, usersData.search, t]);

  const fetchPosts = useCallback(async (overrides = {}) => {
    const params = {
      page: overrides.page ?? postsData.page,
      pageSize: overrides.pageSize ?? postsData.pageSize,
      search: overrides.search ?? postsData.search,
      status: overrides.status ?? postsData.status,
    };
    try {
      setPostsLoading(true);
      const { data } = await adminApi.listPosts(params);
      if (data.ok) {
        setPostsData({
          ...params,
          items: data.items || [],
          total: data.total || 0,
        });
      }
    } catch (error) {
      toast.error(error.message || t('loadPostsFailed'));
    } finally {
      setPostsLoading(false);
    }
  }, [postsData.page, postsData.pageSize, postsData.search, postsData.status, t]);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const { data } = await adminApi.getReports();
      if (data.ok) {
        setReportsData({
          userGrowth: data.userGrowth || [],
          topPosts: data.topPosts || [],
        });
      }
    } catch (error) {
      toast.error(error.message || t('loadReportsFailed'));
    } finally {
      setLoadingReports(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeSection === 'users' && usersData.items.length === 0) {
      fetchUsers();
    }
    if (activeSection === 'posts' && postsData.items.length === 0) {
      fetchPosts();
    }
    if (activeSection === 'reports' && reportsData.userGrowth.length === 0) {
      fetchReports();
    }
  }, [activeSection, fetchUsers, fetchPosts, fetchReports, postsData.items.length, usersData.items.length, reportsData.userGrowth.length]);

  const handleRoleChange = async (userId, role) => {
    try {
      await adminApi.updateUserRole(userId, { role });
      toast.success(t('roleUpdated'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('roleUpdateFailed'));
    }
  };

  const handlePostStatusChange = async (postId, status) => {
    try {
      await adminApi.updatePostStatus(postId, { status });
      toast.success(t('postStatusUpdated'));
      fetchPosts();
    } catch (error) {
      toast.error(error.message || t('postStatusUpdateFailed'));
    }
  };

  const renderHero = () => (
    <section className="admin-hero">
      <div className="hero-card">
        <p className="hero-label">{t('totalUsers')}</p>
        <h3>{overview?.overview?.userCount || 0}</h3>
        <span className="hero-meta">{t('registeredUsers')}</span>
      </div>
      <div className="hero-card">
        <p className="hero-label">{t('totalPosts')}</p>
        <h3>{overview?.overview?.postCount || 0}</h3>
        <span className="hero-meta">{t('communityContent')}</span>
      </div>
      <div className="hero-card">
        <p className="hero-label">{t('activeCampaigns')}</p>
        <h3>{overview?.overview?.runningAds || 0}</h3>
        <span className="hero-meta">{overview?.overview?.pendingAds || 0} {t('pendingAdsCount')}</span>
      </div>
    </section>
  );

  const renderOverview = () => {
    const realOrders = overview?.recent?.ads || [];
    const orders = realOrders.length > 0 ? realOrders : MOCK_ORDERS;
    
    const filtered = orders.filter((item) => {
      const matchSearch = adSearch
        ? (item.title || '').toLowerCase().includes(adSearch.toLowerCase()) ||
          (item.advertiser?.contactName || '').toLowerCase().includes(adSearch.toLowerCase())
        : true;
      const matchStatus = adStatus ? item.status === adStatus : true;
      return matchSearch && matchStatus;
    });

    return (
      <>
        <section className="admin-section admin-orders">
          <div className="admin-section-header">
            <div>
              <p className="breadcrumb">{t('breadcrumbOrders')}</p>
              <h2>{t('ordersTitle')}</h2>
              <small>{t('ordersSubtitle')}</small>
            </div>
          </div>
          <div className="filter-toolbar">
            <input
              type="text"
              placeholder={t('searchOrdersPlaceholder')}
              value={adSearch}
              onChange={(e) => setAdSearch(e.target.value)}
              className="search-input"
            />
            <select value={adStatus} onChange={(e) => setAdStatus(e.target.value)}>
              <option value="">{t('allStatus')}</option>
              <option value="draft">{t('statusDraft')}</option>
              <option value="pending_review">{t('statusPendingReview')}</option>
              <option value="approved">{t('statusApproved')}</option>
              <option value="running">{t('statusRunning')}</option>
              <option value="paused">{t('statusPaused')}</option>
              <option value="rejected">{t('statusRejected')}</option>
            </select>
          </div>
          {loadingOverview ? (
            <div className="admin-skeleton" />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t('colOrder')}</th>
                    <th>{t('colClient')}</th>
                    <th>{t('colCreative')}</th>
                    <th>{t('colBilling')}</th>
                    <th>{t('colBudget')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('colCreatedAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ad) => (
                    <tr key={ad._id}>
                      <td className="font-mono">ORD-{ad._id.slice(-5).toUpperCase()}</td>
                      <td>
                        <div className="cell-title">{ad.advertiser?.contactName || 'Unknown'}</div>
                        <small className="muted-text">{ad.advertiser?.contactEmail || '-'}</small>
                      </td>
                      <td>{ad.title || t('untitled')}</td>
                      <td>¥{ad.billing?.totalDue || 0}</td>
                      <td>¥{ad.schedule?.dailyBudget || 0}</td>
                      <td>
                        <span className={`status-pill status-${ad.status}`}>{ad.status || 'draft'}</span>
                      </td>
                      <td>{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={7} className="muted-text">{t('noAdsFound')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  };

  const renderUsers = () => (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <p className="eyebrow">{t('userAssets')}</p>
          <h2>{t('userAccessControl')}</h2>
        </div>
        <div className="filter-tools">
          <input
            type="text"
            placeholder={t('searchUsersPlaceholder')}
            value={usersData.search}
            onChange={(e) => setUsersData((prev) => ({ ...prev, search: e.target.value }))}
          />
          <button className="ghost-btn" onClick={() => fetchUsers({ page: 1 })}>{t('searchBtn')}</button>
        </div>
      </div>
      {usersLoading ? (
        <div className="admin-skeleton" />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colEmail')}</th>
                <th>{t('colRole')}</th>
                <th>{t('colFollowers')}</th>
                <th>{t('colFollowing')}</th>
                <th>{t('colJoinDate')}</th>
              </tr>
            </thead>
            <tbody>
              {usersData.items.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <select value={item.role} onChange={(e) => handleRoleChange(item._id, e.target.value)}>
                      <option value="user">{t('roleUser')}</option>
                      <option value="admin">{t('roleAdmin')}</option>
                    </select>
                  </td>
                  <td>{item.followersCount || 0}</td>
                  <td>{item.followingCount || 0}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!usersData.items.length && (
                <tr>
                  <td colSpan={6} className="muted-text">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPosts = () => (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <p className="eyebrow">{t('contentLibrary')}</p>
          <h2>{t('postModeration')}</h2>
        </div>
        <div className="filter-tools">
          <input
            type="text"
            placeholder={t('searchPostsPlaceholder')}
            value={postsData.search || ''}
            onChange={(e) => setPostsData((prev) => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={postsData.status || ''}
            onChange={(e) => setPostsData((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">{t('allStatuses')}</option>
            {postStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <button className="ghost-btn" onClick={() => fetchPosts({ page: 1 })}>{t('filterBtn')}</button>
        </div>
      </div>
      {postsLoading ? (
        <div className="admin-skeleton" />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('colTitle')}</th>
                <th>{t('colAuthor')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colInteraction')}</th>
                <th>{t('colPublishDate')}</th>
              </tr>
            </thead>
            <tbody>
              {postsData.items.map((post) => (
                <tr key={post._id}>
                  <td>{post.title || (post.content || '').slice(0, 20) || t('untitled')}</td>
                  <td>{post.authorId?.name || '-'}</td>
                  <td>
                    <select value={post.status} onChange={(e) => handlePostStatusChange(post._id, e.target.value)}>
                      {postStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    👍 {post.likesCount || 0} · 💬 {post.commentsCount || 0}
                  </td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!postsData.items.length && (
                <tr>
                  <td colSpan={5} className="muted-text">{t('noPostsFound')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAds = () => (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <p className="eyebrow">{t('adEngine')}</p>
          <h2>{t('adScheduleBilling')}</h2>
        </div>
      </div>
      <AdManager />
    </div>
  );

  const renderReports = () => {
    // Calculate max values for scaling
    const maxUserCount = Math.max(...reportsData.userGrowth.map(d => d.count), 10);
    const maxLikes = Math.max(...reportsData.topPosts.map(d => d.likesCount), 10);

    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <p className="eyebrow">{t('opsInsights')}</p>
            <h2>{t('dataReportsTitle')}</h2>
          </div>
        </div>
        {loadingReports ? (
          <div className="admin-skeleton" />
        ) : (
          <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
            {/* User Growth Chart */}
            <div className="panel-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '300px' }}>
              <h3>{t('userGrowthTitle')}</h3>
              {reportsData.userGrowth.length > 0 ? (
                <div className="chart-container">
                  {reportsData.userGrowth.map((item) => (
                    <div key={item._id} className="bar-group">
                      <div className="bar-value">{item.count}</div>
                      <div 
                        className="bar" 
                        style={{ height: `${(item.count / maxUserCount) * 100}%` }}
                        title={`${item._id}: ${item.count} users`}
                      />
                      <div className="bar-label">{item._id.slice(5)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>
                  {t('noData')}
                </div>
              )}
            </div>

            {/* Top Posts Chart */}
            <div className="panel-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '300px' }}>
              <h3>{t('topPostsTitle')}</h3>
              {reportsData.topPosts.length > 0 ? (
                <div className="horizontal-chart">
                  {reportsData.topPosts.map((post) => (
                    <div key={post._id} className="h-bar-group">
                      <div className="h-bar-info">
                        <span className="h-bar-title">{post.title || t('untitled')}</span>
                        <span style={{ fontWeight: 600 }}>{post.likesCount} likes</span>
                      </div>
                      <div className="h-bar-track">
                        <div 
                          className="h-bar-fill" 
                          style={{ width: `${(post.likesCount / maxLikes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>
                  {t('noData')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return renderUsers();
      case 'posts':
        return renderPosts();
      case 'ads':
        return renderAds();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  const handleBackToApp = () => {
    navigate('/forum');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-shell dashboard-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">A</div>
            <div>
              <p className="eyebrow">{t('workspace')}</p>
              <h1>{t('managementConsole')}</h1>
            </div>
          </div>
          <span className="mock-pill">{t('previewTag')}</span>
        </div>
        <nav className="sidebar-nav">
          {sideNav.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="ghost-btn" onClick={handleBackToApp}>{t('backToApp')}</button>
          <button 
            className="ghost-btn" 
            onClick={toggleLanguage} 
            style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}
          >
            {language === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <div className="body-toolbar">
          <div className="toolbar-search">
            <span className="search-icon" role="img" aria-label="search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <input type="text" placeholder={t('globalSearchPlaceholder')} />
          </div>
        </div>
        <div className="admin-body">
          {activeSection === 'overview' && renderHero()}
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

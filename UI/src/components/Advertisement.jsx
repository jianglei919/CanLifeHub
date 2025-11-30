import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';
import { useLanguage } from "../../context/LanguageContext";
import AdSubmissionModal from './AdSubmissionModal';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Advertisement({ isAuthenticated }) {
  const { t } = useLanguage();
  const [ads, setAds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [placement] = useState('sidebar');

  const activeAd = useMemo(() => ads[activeIndex], [ads, activeIndex]);

  useEffect(() => {
    let isMounted = true;
    const fetchAds = async () => {
      try {
        setLoading(true);
        const { data } = await adsApi.getActive({ placement });
        if (!isMounted) return;
        setAds(data.items || []);
        setActiveIndex(0);
      } catch (error) {
        console.error('加载广告失败', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAds();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  useEffect(() => {
    if (!ads.length) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => ((prev + 1) % ads.length));
    }, 8000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const impressionId = activeAd?._id;
  useEffect(() => {
    if (!impressionId) return;
    adsApi.trackMetric(impressionId, { type: 'impression' }).catch(() => {});
  }, [impressionId]);

  const handleCtaClick = (ad) => {
    adsApi.trackMetric(ad._id, { type: 'click' }).catch(() => {});
    window.open(ad.creative.ctaLink, '_blank', 'noopener');
  };

  const handleOpenForm = () => {
    if (!isAuthenticated) {
      toast.error(t('loginToAdvertise'));
      return;
    }
    setShowForm(true);
  };

  return (
    <div className="advertisement">
      <div className="ad-header">
        <div>
          <p className="ad-eyebrow">{t('brandZone')}</p>
          <h5>{t('preciseTargeting')}</h5>
        </div>
        <button className="ad-banner-btn" onClick={handleOpenForm}>
          {t('iWantToAdvertise')}
        </button>
      </div>

      {loading && <div className="ad-skeleton" />}

      {!loading && activeAd && (
        <div className="ad-card">
          <span className="ad-placement-tag">{activeAd.placement === 'feed' ? t('feedAd') : activeAd.placement === 'interstitial' ? t('splashAd') : t('sidebarAd')}</span>
          <img src={activeAd.creative.mediaUrl} alt={activeAd.creative.headline} className="ad-media" />
          <div className="ad-content">
            <h4>{activeAd.creative.headline}</h4>
            <p>{activeAd.creative.body || activeAd.description}</p>
          </div>
          <button className="ad-cta" onClick={() => handleCtaClick(activeAd)}>
            {activeAd.creative.ctaLabel || t('learnMore')}
          </button>
        </div>
      )}

      {!loading && !activeAd && (
        <div className="ad-empty">
          <p>{t('noAds')}</p>
          <button className="ad-banner-btn" onClick={handleOpenForm}>
            {t('bookSlot')}
          </button>
        </div>
      )}

      <AdSubmissionModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        defaultPlacement={placement}
      />
    </div>
  );
}

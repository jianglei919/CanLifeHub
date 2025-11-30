import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';
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
      toast.error('请先登录，再提交广告投放申请');
      return;
    }
    setShowForm(true);
  };

  return (
    <div className="advertisement">
      <div className="ad-header">
        <div>
          <p className="ad-eyebrow">品牌合作专区</p>
          <h5>精准投放 · 预约排期</h5>
        </div>
        <button className="ad-banner-btn" onClick={handleOpenForm}>
          我要投放
        </button>
      </div>

      {loading && <div className="ad-skeleton" />}

      {!loading && activeAd && (
        <div className="ad-card">
          <span className="ad-placement-tag">{activeAd.placement === 'feed' ? '信息流' : activeAd.placement === 'interstitial' ? '开屏' : '侧边栏'}</span>
          <img src={activeAd.creative.mediaUrl} alt={activeAd.creative.headline} className="ad-media" />
          <div className="ad-content">
            <h4>{activeAd.creative.headline}</h4>
            <p>{activeAd.creative.body || activeAd.description}</p>
          </div>
          <div className="ad-meta">
            <div>
              <small>投放时间</small>
              <strong>
                {formatDate(activeAd.schedule?.startAt)} - {formatDate(activeAd.schedule?.endAt)}
              </strong>
            </div>
            <div>
              <small>预估曝光</small>
              <strong>{activeAd.billing?.estimatedImpressions?.toLocaleString?.() || '—'} 次</strong>
            </div>
          </div>
          <button className="ad-cta" onClick={() => handleCtaClick(activeAd)}>
            {activeAd.creative.ctaLabel || '了解详情'}
          </button>
        </div>
      )}

      {!loading && !activeAd && (
        <div className="ad-empty">
          <p>目前暂无正在投放的广告，欢迎成为第一位投放者。</p>
          <button className="ad-banner-btn" onClick={handleOpenForm}>
            预约档期
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';
import { useLanguage } from '../../context/LanguageContext';

const pad = (num) => String(num).padStart(2, '0');
const toDatetimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—';
  return `¥${value.toFixed(2)}`;
};

export default function AdManager() {
  const { t, language } = useLanguage();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [refreshToken, setRefreshToken] = useState(0);

  const STATUS_OPTIONS = [
    { value: 'all', label: t('statusAll') },
    { value: 'pending_review', label: t('statusPendingReview') },
    { value: 'changes_requested', label: t('statusChangesRequested') },
    { value: 'approved', label: t('statusApproved') },
    { value: 'scheduled', label: t('adScheduled') },
    { value: 'running', label: t('statusRunning') },
    { value: 'paused', label: t('statusPaused') },
    { value: 'rejected', label: t('statusRejected') },
    { value: 'completed', label: t('statusCompleted') },
  ];

  const PAYMENT_OPTIONS = [
    { value: 'pending', label: t('payPending') },
    { value: 'processing', label: t('payProcessing') },
    { value: 'paid', label: t('payPaid') },
    { value: 'failed', label: t('payFailed') },
    { value: 'refunded', label: t('payRefunded') },
  ];

  const STATUS_LABELS = {
    pending_review: t('statusPendingReview'),
    changes_requested: t('statusChangesRequested'),
    approved: t('statusApproved'),
    scheduled: t('adScheduled'),
    running: t('statusRunning'),
    paused: t('statusPaused'),
    rejected: t('statusRejected'),
    completed: t('statusCompleted'),
  };

  const PLACEMENT_LABELS = {
    sidebar: t('placeSidebar'),
    feed: t('placeFeed'),
    interstitial: t('placeSplash'),
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const { data } = await adsApi.list(params);
      const list = data.items || [];
      setAds(list);
      const drafts = {};
      list.forEach((ad) => {
        drafts[ad._id] = {
          startAt: toDatetimeLocal(ad.schedule?.startAt),
          endAt: toDatetimeLocal(ad.schedule?.endAt),
        };
      });
      setScheduleDrafts(drafts);
    } catch (error) {
      toast.error(error.message || t('adLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds, refreshToken]);

  const summary = useMemo(() => {
    return ads.reduce(
      (acc, ad) => {
        acc.total += 1;
        acc[ad.status] = (acc[ad.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [ads]);

  const notifyAndRefresh = (message) => {
    toast.success(message);
    setRefreshToken((token) => token + 1);
  };

  const handleStatusChange = async (adId, status) => {
    const auditNotes = window.prompt(t('adAuditNote'), '');
    try {
      await adsApi.updateStatus(adId, { status, auditNotes });
      notifyAndRefresh(t('adStatusUpdated'));
    } catch (error) {
      toast.error(error.message || t('adStatusUpdateFailed'));
    }
  };

  const handlePaymentChange = async (adId, paymentStatus) => {
    try {
      await adsApi.updateBilling(adId, { paymentStatus });
      notifyAndRefresh(t('adBillingUpdated'));
    } catch (error) {
      toast.error(error.message || t('adBillingUpdateFailed'));
    }
  };

  const handleScheduleUpdate = async (adId) => {
    const draft = scheduleDrafts[adId];
    if (!draft?.startAt || !draft?.endAt) {
      toast.error(t('adScheduleIncomplete'));
      return;
    }
    if (draft.endAt <= draft.startAt) {
      toast.error(t('adScheduleInvalid'));
      return;
    }
    try {
      await adsApi.updateSchedule(adId, {
        startAt: new Date(draft.startAt).toISOString(),
        endAt: new Date(draft.endAt).toISOString(),
      });
      notifyAndRefresh(t('adScheduleUpdated'));
    } catch (error) {
      toast.error(error.message || t('adScheduleUpdateFailed'));
    }
  };

  return (
    <div className="ad-manager">
      <div className="ad-manager-header">
        <div>
          <p className="ad-eyebrow">{t('adConsole')}</p>
          <h3>{t('adReviewSchedule')}</h3>
        </div>
        <select className="ad-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="ad-status-summary">
        <div className="ad-status-card">
          <span>{t('adTotal')}</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="ad-status-card">
          <span>{t('adPendingReview')}</span>
          <strong>{summary.pending_review || 0}</strong>
        </div>
        <div className="ad-status-card">
          <span>{t('adRunning')}</span>
          <strong>{summary.running || 0}</strong>
        </div>
        <div className="ad-status-card">
          <span>{t('adScheduled')}</span>
          <strong>{summary.scheduled || 0}</strong>
        </div>
      </div>

      {loading && <div className="ad-skeleton" />}

      {!loading && ads.length === 0 && (
        <div className="ad-empty">
          {t('adNoAds')}
        </div>
      )}

      {!loading && ads.length > 0 && (
        <div className="ad-list">
          {ads.map((ad) => (
            <article className="ad-card" key={ad._id}>
              <div className="ad-card-header">
                <div>
                  <span className="ad-placement-tag">{PLACEMENT_LABELS[ad.placement]}</span>
                  <h4>{ad.title}</h4>
                  <p>{ad.advertiser?.company}</p>
                </div>
                <div className="ad-chip">{STATUS_LABELS[ad.status] || ad.status}</div>
              </div>

              <div className="ad-card-body">
                <div>
                  <small>{t('adWindow')}</small>
                  <strong>{formatDate(ad.schedule?.startAt)} - {formatDate(ad.schedule?.endAt)}</strong>
                </div>
                <div>
                  <small>{t('adEstExposure')}</small>
                  <strong>{ad.billing?.estimatedImpressions?.toLocaleString?.() || '—'} {t('times')}</strong>
                </div>
                <div>
                  <small>{t('adAmountDue')}</small>
                  <strong>{formatCurrency(ad.billing?.totalDue)}</strong>
                </div>
                <div>
                  <small>{t('adPaymentStatus')}</small>
                  <strong>{PAYMENT_OPTIONS.find((option) => option.value === ad.billing?.paymentStatus)?.label || '—'}</strong>
                </div>
              </div>

              <div className="ad-card-controls">
                <label>
                  <span>{t('adReviewStatus')}</span>
                  <select value={ad.status} onChange={(e) => handleStatusChange(ad._id, e.target.value)}>
                    {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t('adBillingStatus')}</span>
                  <select value={ad.billing?.paymentStatus || 'pending'} onChange={(e) => handlePaymentChange(ad._id, e.target.value)}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <div className="ad-schedule-editor">
                  <span>{t('adSchedule')}</span>
                  <div className="ad-schedule-inputs">
                    <input type="datetime-local" value={scheduleDrafts[ad._id]?.startAt || ''} onChange={(e) => setScheduleDrafts((prev) => ({
                      ...prev,
                      [ad._id]: { ...prev[ad._id], startAt: e.target.value },
                    }))} />
                    <input type="datetime-local" value={scheduleDrafts[ad._id]?.endAt || ''} onChange={(e) => setScheduleDrafts((prev) => ({
                      ...prev,
                      [ad._id]: { ...prev[ad._id], endAt: e.target.value },
                    }))} />
                    <button type="button" className="ad-btn-update" onClick={() => handleScheduleUpdate(ad._id)}>
                      {t('adUpdate')}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

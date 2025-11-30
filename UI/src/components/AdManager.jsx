import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'pending_review', label: '待审核' },
  { value: 'changes_requested', label: '待补充' },
  { value: 'approved', label: '已审核' },
  { value: 'scheduled', label: '已排期' },
  { value: 'running', label: '投放中' },
  { value: 'paused', label: '已暂停' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'completed', label: '已完成' },
];

const PAYMENT_OPTIONS = [
  { value: 'pending', label: '待支付' },
  { value: 'processing', label: '核对中' },
  { value: 'paid', label: '已支付' },
  { value: 'failed', label: '失败' },
  { value: 'refunded', label: '已退款' },
];

const STATUS_LABELS = {
  pending_review: '待审核',
  changes_requested: '待补充',
  approved: '已审核',
  scheduled: '已排期',
  running: '投放中',
  paused: '已暂停',
  rejected: '已拒绝',
  completed: '已完成',
};

const PLACEMENT_LABELS = {
  sidebar: '侧边栏',
  feed: '信息流',
  interstitial: '开屏',
};

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

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdManager() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [refreshToken, setRefreshToken] = useState(0);

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
      toast.error(error.message || '加载广告失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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
    const auditNotes = window.prompt('审核备注（可选）', '');
    try {
      await adsApi.updateStatus(adId, { status, auditNotes });
      notifyAndRefresh('广告状态已更新');
    } catch (error) {
      toast.error(error.message || '更新状态失败');
    }
  };

  const handlePaymentChange = async (adId, paymentStatus) => {
    try {
      await adsApi.updateBilling(adId, { paymentStatus });
      notifyAndRefresh('收费状态已更新');
    } catch (error) {
      toast.error(error.message || '更新收费状态失败');
    }
  };

  const handleScheduleUpdate = async (adId) => {
    const draft = scheduleDrafts[adId];
    if (!draft?.startAt || !draft?.endAt) {
      toast.error('请完善排期时间');
      return;
    }
    if (draft.endAt <= draft.startAt) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }
    try {
      await adsApi.updateSchedule(adId, {
        startAt: new Date(draft.startAt).toISOString(),
        endAt: new Date(draft.endAt).toISOString(),
      });
      notifyAndRefresh('排期已更新');
    } catch (error) {
      toast.error(error.message || '更新排期失败');
    }
  };

  return (
    <div className="ad-manager">
      <div className="ad-manager-header">
        <div>
          <p className="ad-eyebrow">广告控制台</p>
          <h3>投放审核与排期</h3>
        </div>
        <select className="ad-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="ad-status-summary">
        <div className="ad-status-card">
          <span>总计</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="ad-status-card">
          <span>待审核</span>
          <strong>{summary.pending_review || 0}</strong>
        </div>
        <div className="ad-status-card">
          <span>投放中</span>
          <strong>{summary.running || 0}</strong>
        </div>
        <div className="ad-status-card">
          <span>已排期</span>
          <strong>{summary.scheduled || 0}</strong>
        </div>
      </div>

      {loading && <div className="ad-skeleton" />}

      {!loading && ads.length === 0 && (
        <div className="ad-empty">
          暂无符合条件的广告，稍后再来看看。
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
                  <small>投放窗口</small>
                  <strong>{formatDate(ad.schedule?.startAt)} - {formatDate(ad.schedule?.endAt)}</strong>
                </div>
                <div>
                  <small>预估曝光</small>
                  <strong>{ad.billing?.estimatedImpressions?.toLocaleString?.() || '—'} 次</strong>
                </div>
                <div>
                  <small>应收金额</small>
                  <strong>{formatCurrency(ad.billing?.totalDue)}</strong>
                </div>
                <div>
                  <small>支付状态</small>
                  <strong>{PAYMENT_OPTIONS.find((option) => option.value === ad.billing?.paymentStatus)?.label || '—'}</strong>
                </div>
              </div>

              <div className="ad-card-controls">
                <label>
                  <span>审核状态</span>
                  <select value={ad.status} onChange={(e) => handleStatusChange(ad._id, e.target.value)}>
                    {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>收费状态</span>
                  <select value={ad.billing?.paymentStatus || 'pending'} onChange={(e) => handlePaymentChange(ad._id, e.target.value)}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <div className="ad-schedule-editor">
                  <span>投放排期</span>
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
                      更新
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

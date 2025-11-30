import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';

const BILLING_PLANS = [
  { value: 'daily', label: '按日计费' },
  { value: 'flat', label: '整段买断' },
  { value: 'impression', label: '按曝光计费' },
];

const PLACEMENT_OPTIONS = [
  { value: 'sidebar', label: '侧边栏' },
  { value: 'feed', label: '信息流' },
  { value: 'interstitial', label: '开屏/弹窗' },
];

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultForm(placement = 'sidebar') {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
  return {
    title: '',
    objective: '品牌曝光',
    description: '',
    placement,
    billingPlan: 'daily',
    advertiser: {
      company: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      billingAddress: '',
    },
    creative: {
      headline: '',
      subHeadline: '',
      body: '',
      mediaUrl: '',
      mediaType: 'image',
      ctaLabel: '立即查看',
      ctaLink: '',
      fallbackText: '',
    },
    schedule: {
      startAt: toDatetimeLocal(start),
      endAt: toDatetimeLocal(end),
      timezone: 'Asia/Shanghai',
      preferredHoursInput: '9,12,20',
      dailyBudget: 0,
    },
    targeting: {
      regionsInput: '',
      interestsInput: '',
      keywordsInput: '',
    },
  };
}

export default function AdSubmissionModal({ isOpen, onClose, defaultPlacement }) {
  const [form, setForm] = useState(() => createDefaultForm(defaultPlacement));
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(createDefaultForm(defaultPlacement));
      setQuote(null);
    }
  }, [isOpen, defaultPlacement]);

  const preferredHours = useMemo(() => {
    return form.schedule.preferredHoursInput
      .split(',')
      .map((val) => Number(val.trim()))
      .filter((val) => !Number.isNaN(val) && val >= 0 && val <= 23);
  }, [form.schedule.preferredHoursInput]);

  const parseList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const handleChange = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const segments = path.split('.');
      let cursor = next;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const key = segments[i];
        cursor[key] = { ...cursor[key] };
        cursor = cursor[key];
      }
      cursor[segments[segments.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.creative.mediaUrl || !form.creative.ctaLink) {
      toast.error('请完整填写广告标题、素材与跳转链接');
      return;
    }
    setSubmitting(true);
    try {
      const startDate = new Date(form.schedule.startAt);
      const endDate = new Date(form.schedule.endAt);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        toast.error('请提供合法的投放时间');
        setSubmitting(false);
        return;
      }
      if (startDate >= endDate) {
        toast.error('结束时间必须晚于开始时间');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: form.title,
        objective: form.objective,
        description: form.description,
        placement: form.placement,
        billingPlan: form.billingPlan,
        advertiser: form.advertiser,
        creative: form.creative,
        targeting: {
          regions: parseList(form.targeting.regionsInput),
          interests: parseList(form.targeting.interestsInput),
          keywords: parseList(form.targeting.keywordsInput),
        },
        schedule: {
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          timezone: form.schedule.timezone,
          preferredHours,
          dailyBudget: Number(form.schedule.dailyBudget) || 0,
        },
      };

      const { data } = await adsApi.submit(payload);
      setQuote(data.quote);
      toast.success('投放申请已提交，等待审核');
    } catch (error) {
      toast.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ad-modal-backdrop">
      <div className="ad-modal">
        <button className="ad-modal-close" onClick={onClose} aria-label="关闭">×</button>
        <h3>提交广告投放需求</h3>
        <p className="ad-modal-desc">填写投放目标、预算与素材，我们将在 1 个工作日内完成审核并反馈报价。</p>
        <form onSubmit={handleSubmit} className="ad-form">
          <div className="ad-form-grid">
            <label className="ad-form-group">
              <span>广告标题 *</span>
              <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
            </label>
            <label className="ad-form-group">
              <span>投放目的</span>
              <input type="text" value={form.objective} onChange={(e) => handleChange('objective', e.target.value)} />
            </label>
            <label className="ad-form-group">
              <span>投放位置 *</span>
              <select value={form.placement} onChange={(e) => handleChange('placement', e.target.value)}>
                {PLACEMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="ad-form-group">
              <span>计费方式</span>
              <select value={form.billingPlan} onChange={(e) => handleChange('billingPlan', e.target.value)}>
                {BILLING_PLANS.map((plan) => (
                  <option key={plan.value} value={plan.value}>{plan.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="ad-form-group">
            <span>广告摘要</span>
            <textarea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="简单描述推广亮点或素材规范" />
          </label>

          <div className="ad-form-section">
            <h4>投放排期</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>开始时间 *</span>
                <input type="datetime-local" value={form.schedule.startAt} onChange={(e) => handleChange('schedule.startAt', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>结束时间 *</span>
                <input type="datetime-local" value={form.schedule.endAt} onChange={(e) => handleChange('schedule.endAt', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>优先展示时段 (0-23)</span>
                <input type="text" value={form.schedule.preferredHoursInput} onChange={(e) => handleChange('schedule.preferredHoursInput', e.target.value)} placeholder="如：9,12,20" />
              </label>
              <label className="ad-form-group">
                <span>预计日预算 (可选)</span>
                <input type="number" value={form.schedule.dailyBudget} onChange={(e) => handleChange('schedule.dailyBudget', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-section">
            <h4>广告主信息</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>公司 / 品牌 *</span>
                <input type="text" value={form.advertiser.company} onChange={(e) => handleChange('advertiser.company', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>联系人 *</span>
                <input type="text" value={form.advertiser.contactName} onChange={(e) => handleChange('advertiser.contactName', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>邮箱 *</span>
                <input type="email" value={form.advertiser.contactEmail} onChange={(e) => handleChange('advertiser.contactEmail', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>电话</span>
                <input type="tel" value={form.advertiser.contactPhone} onChange={(e) => handleChange('advertiser.contactPhone', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-section">
            <h4>投放素材</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>主标题 *</span>
                <input type="text" value={form.creative.headline} onChange={(e) => handleChange('creative.headline', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>副标题</span>
                <input type="text" value={form.creative.subHeadline} onChange={(e) => handleChange('creative.subHeadline', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>封面图 URL *</span>
                <input type="url" value={form.creative.mediaUrl} onChange={(e) => handleChange('creative.mediaUrl', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>跳转链接 *</span>
                <input type="url" value={form.creative.ctaLink} onChange={(e) => handleChange('creative.ctaLink', e.target.value)} required />
              </label>
            </div>
            <label className="ad-form-group">
              <span>广告文案</span>
              <textarea rows={3} value={form.creative.body} onChange={(e) => handleChange('creative.body', e.target.value)} />
            </label>
          </div>

          <div className="ad-form-section">
            <h4>定向需求 (可选)</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>目标城市（逗号分隔）</span>
                <input type="text" value={form.targeting.regionsInput} onChange={(e) => handleChange('targeting.regionsInput', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>兴趣标签</span>
                <input type="text" value={form.targeting.interestsInput} onChange={(e) => handleChange('targeting.interestsInput', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>屏蔽关键词</span>
                <input type="text" value={form.targeting.keywordsInput} onChange={(e) => handleChange('targeting.keywordsInput', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-actions">
            <button type="button" className="ad-secondary-btn" onClick={onClose}>
              稍后再说
            </button>
            <button type="submit" className="ad-primary-btn" disabled={submitting}>
              {submitting ? '提交中...' : '提交审核'}
            </button>
          </div>
        </form>

        {quote && (
          <div className="ad-quote-panel">
            <h4>试算报价</h4>
            <div className="ad-quote-grid">
              <div>
                <small>投放天数</small>
                <strong>{quote.durationDays} 天</strong>
              </div>
              <div>
                <small>预计曝光</small>
                <strong>{quote.estimatedImpressions?.toLocaleString?.() || '-'} 次</strong>
              </div>
              <div>
                <small>服务费(含稅)</small>
                <strong>¥{quote.totalDue?.toFixed?.(2)}</strong>
              </div>
              <div>
                <small>计费说明</small>
                <strong>{quote.placementNotes || '按官方价目表执行'}</strong>
              </div>
            </div>
            <p className="ad-quote-tip">最终费用以审核通过后的合同为准，如需加急排期，请联系运营。</p>
          </div>
        )}
      </div>
    </div>
  );
}

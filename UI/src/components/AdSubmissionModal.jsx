import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adsApi } from '../api/http';
import { useLanguage } from '../../context/LanguageContext';

const BILLING_PLANS = [
  { value: 'daily', labelKey: 'planDaily' },
  { value: 'flat', labelKey: 'planFlat' },
  { value: 'impression', labelKey: 'planImpression' },
];

const PLACEMENT_OPTIONS = [
  { value: 'sidebar', labelKey: 'sidebarAd' },
  { value: 'feed', labelKey: 'feedAd' },
  { value: 'interstitial', labelKey: 'placeInterstitial' },
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
    objective: 'Brand Awareness',
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
      ctaLabel: 'Learn More',
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
  const { t } = useLanguage();
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
      toast.error(t('fillRequiredFields'));
      return;
    }
    setSubmitting(true);
    try {
      const startDate = new Date(form.schedule.startAt);
      const endDate = new Date(form.schedule.endAt);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        toast.error(t('invalidTime'));
        setSubmitting(false);
        return;
      }
      if (startDate >= endDate) {
        toast.error(t('endTimeError'));
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
      toast.success(t('submitSuccess'));
    } catch (error) {
      toast.error(error.message || t('submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ad-modal-backdrop">
      <div className="ad-modal">
        <button className="ad-modal-close" onClick={onClose} aria-label="关闭">×</button>
        <h3>{t('submitAdRequest')}</h3>
        <p className="ad-modal-desc">{t('adRequestDesc')}</p>
        <form onSubmit={handleSubmit} className="ad-form">
          <div className="ad-form-grid">
            <label className="ad-form-group">
              <span>{t('adTitle')}</span>
              <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
            </label>
            <label className="ad-form-group">
              <span>{t('adObjective')}</span>
              <input type="text" value={form.objective} onChange={(e) => handleChange('objective', e.target.value)} />
            </label>
            <label className="ad-form-group">
              <span>{t('adPlacement')}</span>
              <select value={form.placement} onChange={(e) => handleChange('placement', e.target.value)}>
                {PLACEMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </label>
            <label className="ad-form-group">
              <span>{t('adBillingPlan')}</span>
              <select value={form.billingPlan} onChange={(e) => handleChange('billingPlan', e.target.value)}>
                {BILLING_PLANS.map((plan) => (
                  <option key={plan.value} value={plan.value}>{t(plan.labelKey)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="ad-form-group">
            <span>{t('adSummary')}</span>
            <textarea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('adSummaryPlaceholder')} />
          </label>

          <div className="ad-form-section">
            <h4>{t('adScheduleSection')}</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>{t('adStartTime')}</span>
                <input type="datetime-local" value={form.schedule.startAt} onChange={(e) => handleChange('schedule.startAt', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('adEndTime')}</span>
                <input type="datetime-local" value={form.schedule.endAt} onChange={(e) => handleChange('schedule.endAt', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('adPreferredHours')}</span>
                <input type="text" value={form.schedule.preferredHoursInput} onChange={(e) => handleChange('schedule.preferredHoursInput', e.target.value)} placeholder={t('adPreferredHoursPlaceholder')} />
              </label>
              <label className="ad-form-group">
                <span>{t('adDailyBudget')}</span>
                <input type="number" value={form.schedule.dailyBudget} onChange={(e) => handleChange('schedule.dailyBudget', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-section">
            <h4>{t('advertiserInfoSection')}</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>{t('companyBrand')}</span>
                <input type="text" value={form.advertiser.company} onChange={(e) => handleChange('advertiser.company', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('contactPerson')}</span>
                <input type="text" value={form.advertiser.contactName} onChange={(e) => handleChange('advertiser.contactName', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('contactEmail')}</span>
                <input type="email" value={form.advertiser.contactEmail} onChange={(e) => handleChange('advertiser.contactEmail', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('contactPhone')}</span>
                <input type="tel" value={form.advertiser.contactPhone} onChange={(e) => handleChange('advertiser.contactPhone', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-section">
            <h4>{t('creativeSection')}</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>{t('adHeadline')}</span>
                <input type="text" value={form.creative.headline} onChange={(e) => handleChange('creative.headline', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('adSubHeadline')}</span>
                <input type="text" value={form.creative.subHeadline} onChange={(e) => handleChange('creative.subHeadline', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>{t('adCoverImage')}</span>
                <input type="url" value={form.creative.mediaUrl} onChange={(e) => handleChange('creative.mediaUrl', e.target.value)} required />
              </label>
              <label className="ad-form-group">
                <span>{t('adCtaLink')}</span>
                <input type="url" value={form.creative.ctaLink} onChange={(e) => handleChange('creative.ctaLink', e.target.value)} required />
              </label>
            </div>
            <label className="ad-form-group">
              <span>{t('adCopy')}</span>
              <textarea rows={3} value={form.creative.body} onChange={(e) => handleChange('creative.body', e.target.value)} />
            </label>
          </div>

          <div className="ad-form-section">
            <h4>{t('targetingSection')}</h4>
            <div className="ad-form-grid">
              <label className="ad-form-group">
                <span>{t('targetCities')}</span>
                <input type="text" value={form.targeting.regionsInput} onChange={(e) => handleChange('targeting.regionsInput', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>{t('targetInterests')}</span>
                <input type="text" value={form.targeting.interestsInput} onChange={(e) => handleChange('targeting.interestsInput', e.target.value)} />
              </label>
              <label className="ad-form-group">
                <span>{t('excludeKeywords')}</span>
                <input type="text" value={form.targeting.keywordsInput} onChange={(e) => handleChange('targeting.keywordsInput', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="ad-form-actions">
            <button type="button" className="ad-secondary-btn" onClick={onClose}>
              {t('maybeLater')}
            </button>
            <button type="submit" className="ad-primary-btn" disabled={submitting}>
              {submitting ? t('submitting') : t('submitReview')}
            </button>
          </div>
        </form>

        {quote && (
          <div className="ad-quote-panel">
            <h4>{t('estimatedQuote')}</h4>
            <div className="ad-quote-grid">
              <div>
                <small>{t('duration')}</small>
                <strong>{quote.durationDays} {t('daysUnit')}</strong>
              </div>
              <div>
                <small>{t('estImpressions')}</small>
                <strong>{quote.estimatedImpressions?.toLocaleString?.() || '-'} {t('viewsUnit')}</strong>
              </div>
              <div>
                <small>{t('serviceFee')}</small>
                <strong>¥{quote.totalDue?.toFixed?.(2)}</strong>
              </div>
              <div>
                <small>{t('billingNotes')}</small>
                <strong>{quote.placementNotes || t('standardPriceList')}</strong>
              </div>
            </div>
            <p className="ad-quote-tip">{t('quoteDisclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

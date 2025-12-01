const Advertisement = require('../models/advertisement');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const PLACEMENT_PRICING = {
  sidebar: {
    dailyRate: 80,
    reviewFee: 25,
    estimatedDailyReach: 1200,
    description: 'Right-side display, ideal for brand exposure',
  },
  feed: {
    dailyRate: 150,
    reviewFee: 40,
    estimatedDailyReach: 2600,
    description: '信息流原生广告，点击率更高',
  },
  interstitial: {
    dailyRate: 220,
    reviewFee: 60,
    estimatedDailyReach: 3400,
    description: '整屏弹窗，适合重大活动',
  },
};

function sanitizeHours(hours = []) {
  if (!Array.isArray(hours)) return [];
  const unique = new Set();
  hours.forEach((hour) => {
    const num = Number(hour);
    if (!Number.isNaN(num) && num >= 0 && num <= 23) {
      unique.add(num);
    }
  });
  return Array.from(unique.values()).sort((a, b) => a - b);
}

function calculateQuote({ placement, startAt, endAt, plan = 'daily' }) {
  const config = PLACEMENT_PRICING[placement];
  if (!config) {
    throw new Error('不支持的广告投放位置');
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new Error('请提供合法的投放时间范围');
  }

  const durationDays = Math.max(1, Math.ceil((end - start) / DAY_IN_MS));
  const baseCost = config.dailyRate * durationDays;
  const reviewFee = config.reviewFee;
  const tax = Number((baseCost * 0.06).toFixed(2));
  const totalDue = Number((baseCost + reviewFee + tax).toFixed(2));

  return {
    start,
    end,
    durationDays,
    currency: 'CNY',
    baseCost,
    reviewFee,
    tax,
    totalDue,
    estimatedImpressions: config.estimatedDailyReach * durationDays,
    placementNotes: config.description,
    plan,
  };
}

function resolveLifecycle(adDoc) {
  const ad = adDoc;
  if (!ad.schedule || !ad.schedule.startAt || !ad.schedule.endAt) {
    return ad.status;
  }

  if (['rejected', 'paused'].includes(ad.status)) {
    return ad.status;
  }

  const now = Date.now();
  const start = new Date(ad.schedule.startAt).getTime();
  const end = new Date(ad.schedule.endAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return ad.status;
  }

  if (now > end) {
    return 'completed';
  }

  const paymentReady = ad.billing?.paymentStatus === 'paid';
  if (!paymentReady) {
    return ad.status === 'running' ? 'approved' : ad.status;
  }

  if (now < start) {
    return 'scheduled';
  }

  return 'running';
}

exports.submitAd = async (req, res) => {
  try {
    const {
      title,
      objective,
      description,
      placement,
      advertiser = {},
      creative = {},
      targeting = {},
      schedule = {},
      billingPlan = 'daily',
      priorityWeight = 1,
    } = req.body;

    if (!title || !placement) {
      return res.status(400).json({ error: '标题和投放位置不能为空' });
    }
    if (!creative.mediaUrl || !creative.ctaLink || !creative.headline) {
      return res.status(400).json({ error: '请提供完整的广告素材与落地页信息' });
    }
    if (!advertiser.contactName || !advertiser.contactEmail) {
      return res.status(400).json({ error: '请提供广告主联系人信息' });
    }

    const quote = calculateQuote({
      placement,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      plan: billingPlan,
    });

    const ad = await Advertisement.create({
      title: title.trim(),
      objective: objective || '',
      description: description || '',
      placement,
      advertiser: {
        company: advertiser.company || '',
        contactName: advertiser.contactName,
        contactEmail: advertiser.contactEmail,
        contactPhone: advertiser.contactPhone || '',
        billingAddress: advertiser.billingAddress || '',
      },
      creative: {
        headline: creative.headline,
        subHeadline: creative.subHeadline || '',
        body: creative.body || '',
        mediaUrl: creative.mediaUrl,
        mediaType: creative.mediaType || 'image',
        ctaLabel: creative.ctaLabel || '了解详情',
        ctaLink: creative.ctaLink,
        fallbackText: creative.fallbackText || '',
      },
      targeting: {
        regions: targeting.regions || [],
        interests: targeting.interests || [],
        keywords: targeting.keywords || [],
      },
      schedule: {
        startAt: quote.start,
        endAt: quote.end,
        preferredHours: sanitizeHours(schedule.preferredHours),
        timezone: schedule.timezone || 'Asia/Shanghai',
        dailyBudget: schedule.dailyBudget || 0,
      },
      billing: {
        plan: billingPlan,
        currency: quote.currency,
        reviewFee: quote.reviewFee,
        baseCost: quote.baseCost,
        tax: quote.tax,
        totalDue: quote.totalDue,
        estimatedImpressions: quote.estimatedImpressions,
        paymentStatus: 'pending',
      },
      status: 'pending_review',
      priorityWeight: Number(priorityWeight) || 1,
      createdBy: req.user?._id,
    });

    res.status(201).json({ ok: true, ad, quote });
  } catch (error) {
    console.error('[ads#submit]', error);
    res.status(400).json({ error: error.message || '广告投放申请创建失败' });
  }
};

exports.listAds = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '请先登录' });
    }

    const isAdmin = req.user.role === 'admin';
    const filter = {};

    if (!isAdmin) {
      filter.createdBy = req.user._id;
    } else if (req.query.mine === 'true') {
      filter.createdBy = req.user._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.placement) {
      filter.placement = req.query.placement;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const ads = await Advertisement.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email role')
      .populate('audit.reviewerId', 'name email');

    res.json({ ok: true, items: ads, total: ads.length });
  } catch (error) {
    console.error('[ads#list]', error);
    res.status(500).json({ error: '获取广告列表失败' });
  }
};

exports.getActiveAds = async (req, res) => {
  try {
    const now = new Date();
    const placementFilter = req.query.placement;
    const query = {
      status: { $in: ['approved', 'scheduled', 'running'] },
      'billing.paymentStatus': 'paid',
      'schedule.startAt': { $lte: now },
      'schedule.endAt': { $gte: now },
    };
    if (placementFilter) {
      query.placement = placementFilter;
    }

    const ads = await Advertisement.find(query)
      .sort({ priorityWeight: -1, 'schedule.startAt': 1 })
      .limit(10)
      .lean();

    res.json({ ok: true, items: ads });
  } catch (error) {
    console.error('[ads#active]', error);
    res.status(500).json({ error: '获取待投放广告失败' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { adId } = req.params;
    const { status, auditNotes } = req.body;
    const allowed = [
      'pending_review',
      'changes_requested',
      'approved',
      'rejected',
      'paused',
      'running',
      'completed',
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: '非法的状态值' });
    }

    const ad = await Advertisement.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }

    ad.status = status;
    ad.audit = {
      reviewerId: req.user._id,
      notes: auditNotes || '',
      decidedAt: new Date(),
    };
    ad.status = resolveLifecycle(ad);

    await ad.save();
    res.json({ ok: true, ad });
  } catch (error) {
    console.error('[ads#status]', error);
    res.status(500).json({ error: '更新广告状态失败' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { adId } = req.params;
    const { startAt, endAt, preferredHours, timezone, dailyBudget } = req.body;

    const ad = await Advertisement.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }

    if (startAt) ad.schedule.startAt = new Date(startAt);
    if (endAt) ad.schedule.endAt = new Date(endAt);
    if (preferredHours) ad.schedule.preferredHours = sanitizeHours(preferredHours);
    if (timezone) ad.schedule.timezone = timezone;
    if (dailyBudget !== undefined) ad.schedule.dailyBudget = dailyBudget;

    const quote = calculateQuote({
      placement: ad.placement,
      startAt: ad.schedule.startAt,
      endAt: ad.schedule.endAt,
      plan: ad.billing.plan,
    });

    ad.billing.baseCost = quote.baseCost;
    ad.billing.reviewFee = quote.reviewFee;
    ad.billing.tax = quote.tax;
    ad.billing.totalDue = quote.totalDue;
    ad.billing.estimatedImpressions = quote.estimatedImpressions;

    ad.status = resolveLifecycle(ad);
    await ad.save();

    res.json({ ok: true, ad, quote });
  } catch (error) {
    console.error('[ads#schedule]', error);
    res.status(400).json({ error: error.message || '更新排期失败' });
  }
};

exports.updateBilling = async (req, res) => {
  try {
    const { adId } = req.params;
    const { paymentStatus, invoiceNumber } = req.body;

    const ad = await Advertisement.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }

    if (paymentStatus) {
      const allowed = ['pending', 'processing', 'paid', 'failed', 'refunded'];
      if (!allowed.includes(paymentStatus)) {
        return res.status(400).json({ error: '非法的支付状态' });
      }
      ad.billing.paymentStatus = paymentStatus;
      ad.billing.paidAt = paymentStatus === 'paid' ? new Date() : undefined;
    }

    if (invoiceNumber !== undefined) {
      ad.billing.invoiceNumber = invoiceNumber;
    }

    ad.status = resolveLifecycle(ad);
    await ad.save();

    res.json({ ok: true, ad });
  } catch (error) {
    console.error('[ads#billing]', error);
    res.status(500).json({ error: '更新收费信息失败' });
  }
};

exports.trackMetric = async (req, res) => {
  try {
    const { adId } = req.params;
    const { type } = req.body;
    if (!['impression', 'click'].includes(type)) {
      return res.status(400).json({ error: '非法的指标类型' });
    }

    const update =
      type === 'impression'
        ? {
            $inc: { 'metrics.impressions': 1 },
            $set: { 'metrics.lastImpressionAt': new Date() },
          }
        : {
            $inc: { 'metrics.clicks': 1 },
            $set: { 'metrics.lastClickAt': new Date() },
          };

    const ad = await Advertisement.findByIdAndUpdate(adId, update);
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[ads#metric]', error);
    res.status(500).json({ error: '记录广告数据失败' });
  }
};

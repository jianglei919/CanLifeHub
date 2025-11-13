// API/helpers/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// 验证JWT token的中间件
const requireAuth = async (req, res, next) => {
  try {
    // 从cookie中获取token
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: '账户未验证，请先验证邮箱' });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: '无效的token' });
  }
};

module.exports = { requireAuth };


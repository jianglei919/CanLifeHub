// API/controllers/authController.js
//负责告诉服务器"请求到达时要干什么", 业务逻辑（注册、登录、获取个人信息）
const User = require('../models/user');  //引入用户模型
const { hashPassword, comparePassword } = require('../helpers/auth'); //引入密码哈希函数, 用于加密密码与验证密码是否匹配
const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken，用于生成（sign）和验证（verify）JWT token
const { get } = require('mongoose');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../helpers/email'); // 引入邮件发送函数
const crypto = require('crypto'); // 用于生成随机token

// ===================== 测试用接口 =====================
const test = (req, res) => {   //定义一个名为 test 的函数，接收请求对象 req 和响应对象 res 作为参数
    res.json('test is working!')
}

// ===================== 注册接口 /register =====================
// Register Endpoint
const registerUser = async (req, res) => {
   try {
       const { name, email, password, confirmPassword } = req.body; // 从前端传来的请求体（req.body）中解构出 name、email、password、confirmPassword
       // Step 1. 检查是否填写了 name
       if (!name) {
           return res.json({
            error: '请输入姓名' 
        });
       }
       // Step 2. 检查密码合法性
         if (!password || password.length < 6) {
            return res.json({
                error: '密码长度至少为6位'
            })
         };
       // Step 2.5. 检查两次密码是否一致
         if (password !== confirmPassword) {
            return res.json({
                error: '两次输入的密码不一致'
            })
         };
       // Step 3. 检查邮箱是否已注册
       const exist = await User.findOne({ email });
       
       // Step 3.5. 如果邮箱已存在但未验证，允许更新信息并重新发送验证码
       if (exist && !exist.verified) {
           // 未验证用户，更新其信息
           const hashedPassword = await hashPassword(password);
           const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
           const expiry = Date.now() + 1000 * 60 * 10; // 10 分钟有效期

           exist.name = name;
           exist.password = hashedPassword;
           exist.verificationToken = verificationCode;
           exist.verificationTokenExpiry = expiry;
           await exist.save();

           // 发送验证邮件
           sendVerificationEmail(email, verificationCode).catch((err) => {
             console.error('send verification email failed', err);
           });

           const safeUser = { _id: exist._id, name: exist.name, email: exist.email, verified: exist.verified, role: exist.role };
           return res.json({ 
             ok: true, 
             user: safeUser, 
             isReregistration: true,
             message: '检测到该邮箱之前注册过但未验证，已为您更新信息并重新发送验证码' 
           });
       }
       
       // Step 3.6. 如果邮箱已存在且已验证，拒绝注册
       if (exist && exist.verified) {
        return res.json({
            error: '该邮箱已被注册并验证，请直接登录或使用其他邮箱注册'
        });
       }

       // Step 4. 哈希密码
       const hashedPassword = await hashPassword(password); // 使用 bcrypt 封装的 hashPassword 对明文密码进行加密

       // Step 5. 生成6位数字验证码
       const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
       const expiry = Date.now() + 1000 * 60 * 10; // 10 分钟有效期
       console.log('Generated verification code:', verificationCode);

       // Step 6. 创建并保存用户, 写入数据库（未验证状态）
       const user = await User.create({
           name, 
           email, 
           password: hashedPassword,
           verified: false,
           verificationToken: verificationCode,
           verificationTokenExpiry: expiry,
        });

       // Step 7. 发送验证邮件（异步，不阻塞响应）
       sendVerificationEmail(email, verificationCode).catch((err) => {
         console.error('send verification email failed', err);
       });
        
       // Step 8. 返回结果（不返回密码）
      const safeUser = { _id: user._id, name: user.name, email: user.email, verified: user.verified, role: user.role };
       return res.json({ ok: true, user: safeUser });

   } catch (error) {
       console.log(error);
   }
}


// ===================== 登录接口 /login =====================
// Login Endpoint
const loginUser = async (req, res) => {
 try {
    const { email, password } = req.body;  // 从请求体中解构出 email 和 password

    // Step 1. 检查邮箱是否存在
    const user = await User.findOne({ email }); // 在数据库中查找该邮箱用户
    if (!user) {
        return res.json({
            error: '该邮箱未注册，请先注册账号'
        });
    }
    
    // Step 1.5. 检查用户是否已验证邮箱
    if (!user.verified) {
        return res.json({
            error: '该账号尚未验证邮箱，请先完成邮箱验证'
        });
    }

    // Step 2. 检查密码是否正确
    const match = await comparePassword(password, user.password);

    if (match) {
      // Step 3. 密码正确则生成 JWT
      jwt.sign(
        { email: user.email, id: user._id, name: user.name },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          // Step 4. 返回完整用户信息
          const userProfile = {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio || '',
            avatar: user.avatar || '👤',
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            verified: user.verified,
            role: user.role || 'user'
          };
          res.cookie('token', token).json(userProfile);
        }
      );
    } else {
      // Step 5. 密码错误
      res.json({
        error: '密码错误，请检查后重新输入'
      });
    }
 } catch (error) {
    console.log(error);
 }

}

// ===================== 获取用户个人信息接口 /profile =====================
const getProfile = async (req, res) => {
  const {token} = req.cookies;
  if(token){
    try {
      // Step 1. 验证 JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Step 2. 从数据库获取完整用户信息
      const user = await User.findById(decoded.id).select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry');
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // Step 3. 返回完整用户信息
      const userProfile = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        avatar: user.avatar || '👤',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        verified: user.verified,
        role: user.role || 'user'
      };
      
      res.json({ user: userProfile });
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(401).json({ error: 'Token无效' });
    }
  } else {
    // Step 3. 未登录或无 token
    res.json(null);
  }
}

// ===================== 验证邮箱接口 /verify =====================
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.json({ error: '请提供邮箱和验证码' });

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ error: '该邮箱未注册' });
    }
    
    if (user.verified) {
      return res.json({ error: '该邮箱已验证，请直接登录' });
    }
    
    if (!user.verificationToken) {
      return res.json({ error: '验证码不存在，请重新发送验证码' });
    }
    
    if (user.verificationTokenExpiry < Date.now()) {
      return res.json({ error: '验证码已过期，请重新发送验证码' });
    }
    
    if (user.verificationToken !== code) {
      return res.json({ error: '验证码不正确，请检查后重新输入' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return res.json({ ok: true, message: '邮箱验证成功！' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
};

// ===================== 重发验证码接口 /resend-verification =====================
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: '请提供邮箱地址' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: '该邮箱未注册' });
    if (user.verified) return res.json({ error: '该邮箱已验证，请直接登录' });

    // 生成新的6位数字验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 1000 * 60 * 10; // 10 分钟
    
    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = expiry;
    await user.save();

    // 异步发送验证码
    sendVerificationEmail(email, verificationCode).catch((err) => {
      console.error('resend verification email failed', err);
    });
    
    return res.json({ ok: true, message: '验证码已重新发送至您的邮箱' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
};

// ===================== 请求重置密码接口 /forgot-password =====================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: '请提供邮箱地址' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: '该邮箱未注册' });
    
    if (!user.verified) {
      return res.json({ error: '该账号尚未验证邮箱，请先完成邮箱验证后再重置密码' });
    }

    // 生成随机重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 1000 * 60 * 60; // 1小时有效期
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = expiry;
    await user.save();

    // 生成重置链接（前端URL）
    const frontendURL = process.env.FRONTEND_URL || 'https://canlifehub-ui.onrender.com';
    const resetLink = `${frontendURL}/reset-password/${resetToken}`;

    // 异步发送重置邮件
    sendResetPasswordEmail(email, resetLink).catch((err) => {
      console.error('send reset password email failed', err);
    });
    
    return res.json({ ok: true, message: '密码重置链接已发送至您的邮箱，有效期1小时' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
};

// ===================== 重置密码接口 /reset-password =====================
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (!token || !password || !confirmPassword) {
      return res.json({ error: '请提供完整信息' });
    }
    
    if (password.length < 6) {
      return res.json({ error: '密码长度至少为6位' });
    }
    
    if (password !== confirmPassword) {
      return res.json({ error: '两次输入的密码不一致' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.json({ error: '重置链接无效或已过期，请重新申请' });
    }

    // 更新密码
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.json({ ok: true, message: '密码重置成功！请使用新密码登录' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
};

// ===================== 退出登录接口 /logout =====================
const logout = (req, res) => {
  try {
    // 清除 Cookie 中的 token
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/'
    });

    return res.json({ ok: true, message: '退出登录成功' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: '退出登录失败' });
  }
};

// ===================== 更新用户资料接口 /update-profile =====================
const updateProfile = async (req, res) => {
  try {
    console.log('[updateProfile] 收到请求:', req.body);
    
    const { token } = req.cookies;
    
    if (!token) {
      console.log('[updateProfile] 未找到token');
      return res.status(401).json({ error: '未登录，请先登录' });
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    console.log('[updateProfile] 用户ID:', userId);

    const { name, bio, avatar } = req.body;

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      console.log('[updateProfile] 用户不存在');
      return res.status(404).json({ error: '用户不存在' });
    }

    console.log('[updateProfile] 更新前:', { name: user.name, bio: user.bio, avatar: user.avatar });

    // 更新字段（只更新提供的字段）
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }
    
    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();
    
    console.log('[updateProfile] 更新后:', { name: user.name, bio: user.bio, avatar: user.avatar });

    // 如果修改了姓名，需要更新 JWT
    let newToken = token;
    if (name) {
      newToken = jwt.sign(
        { email: user.email, id: user._id, name: user.name },
        process.env.JWT_SECRET,
        {}
      );
    }

    // 返回更新后的用户信息（不包含密码）
    const updatedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      verified: user.verified,
      role: user.role || 'user'
    };

    console.log('[updateProfile] 返回用户信息:', updatedUser);

    res.cookie('token', newToken).json({ 
      ok: true, 
      user: updatedUser,
      message: '资料更新成功'
    });

  } catch (error) {
    console.error('[updateProfile] 错误:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token 无效，请重新登录' });
    }
    return res.status(500).json({ error: '更新资料失败' });
  }
};

// ===================== 上传头像接口 /upload-avatar =====================
const uploadAvatar = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }
    
    // 构建文件URL：Cloudinary 返回 https://...，本地存储返回绝对路径，需转成 /uploads/...
    let fileUrl = `/uploads/avatars/${req.file.filename}`;
    if (req.file.path && req.file.path.startsWith('http')) {
      fileUrl = req.file.path; // Cloudinary 完整 URL
    }

    console.log('[uploadAvatar] file.path=', req.file.path, '=> url:', fileUrl);
    
    res.json({ 
      ok: true, 
      url: fileUrl,
      message: '头像上传成功' 
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: '头像上传失败' });
  }
};

// ===================== 获取指定用户信息接口 /users/:id =====================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const user = await User.findById(id).select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry');
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const userProfile = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      avatar: user.avatar || '👤',
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      verified: user.verified,
      role: user.role || 'user'
    };

    res.json({ ok: true, user: userProfile });
  } catch (error) {
    console.error('[getUserById] 错误:', error);
    return res.status(500).json({ error: '获取用户信息失败' });
  }
};

module.exports = {             //把 test 函数导出，让其他文件可以使用
    test,
    registerUser,
    loginUser,
    getProfile,
    getUserById,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
    updateProfile,
    uploadAvatar,
}
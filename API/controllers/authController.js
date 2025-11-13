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

           const safeUser = { _id: exist._id, name: exist.name, email: exist.email, verified: exist.verified };
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
       const safeUser = { _id: user._id, name: user.name, email: user.email, verified: user.verified };
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
    // 生成包含 email、id、name 的 token (payload)
        jwt.sign(
         { email: user.email, id: user._id, name: user.name }, // payload
          process.env.JWT_SECRET,                              // 加密密钥，从 .env 文件读取
          {},                                                  // 可选配置 (如过期时间)
          (err, token) => {                                    // 回调函数，当 token 生成后执行
          if (err) throw err;                                  // 如果出错则抛出
    // Step 4. 设置 Cookie 并返回用户信息
          res.cookie('token', token).json(user)                // 把 token 存进浏览器 Cookie 中，以维持登录状态
    })
     }
    
    // Step 5. 密码错误
    if (!match) {
        res.json({
            error: '密码错误，请检查后重新输入'
        });
    }
 } catch (error) {
    console.log(error);
 }

}

// ===================== 获取用户个人信息接口 /profile =====================
const getProfile = (req, res) => {
const {token} = req.cookies               // 从请求头中读取 Cookie (前端 axios 请求带上了 withCredentials)
if(token){
    // Step 1. 验证 JWT
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) =>{
        if (err) throw err;
    // Step 2. 返回解码后的用户信息
        res.json(user)
    })
} else {
    // Step 3. 未登录或无 token
    res.json(null)
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
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
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

module.exports = {             //把 test 函数导出，让其他文件可以使用
    test,
    registerUser,
    loginUser,
    getProfile,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
}
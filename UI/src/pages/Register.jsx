// UI/src/pages/Register.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/http";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const registerUser = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = data;
    
    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      toast.error("两次密码输入不一致");
      return;
    }
    
    try {
      const { data: res } = await authApi.register({ name, email, password, confirmPassword });
      if (res.error) {
        toast.error(res.error);
      } else {
        setUserEmail(email);
        setVerificationStep(true);
        
        // 区分首次注册和重新注册
        if (res.isReregistration) {
          toast.success("该邮箱之前注册过但未验证，已为您更新信息并重新发送验证码", { duration: 5000 });
        } else {
          toast.success("注册成功！验证码已发送至您的邮箱");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("注册失败，请稍后重试");
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("请输入6位验证码");
      return;
    }

    try {
      const { data: res } = await authApi.verify({ email: userEmail, code: verificationCode });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("验证成功！请登录");
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
      toast.error("验证失败，请重试");
    }
  };

  const resendCode = async () => {
    try {
      const { data: res } = await authApi.resendVerification({ email: userEmail });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("验证码已重新发送");
      }
    } catch (error) {
      console.log(error);
      toast.error("重发失败，请稍后重试");
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* 左侧品牌展示区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-logo">📱</div>
          <h1 className="brand-title">CanLifeHub</h1>
          <p className="brand-slogan">连接加拿大华人，分享生活点滴</p>
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">🏡</div>
              <div className="feature-text">
                <h3>生活分享</h3>
                <p>记录并分享你在加拿大的精彩生活</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h3>社区互动</h3>
                <p>结识志同道合的朋友，建立社交圈</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💡</div>
              <div className="feature-text">
                <h3>经验交流</h3>
                <p>获取实用的生活建议和留学攻略</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧注册表单区 */}
      <div className="auth-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">{verificationStep ? "验证邮箱" : "创建账户"}</h2>
            <p className="form-subtitle">
              {verificationStep ? "请输入发送到您邮箱的验证码" : "加入 CanLifeHub 社区，开始你的旅程"}
            </p>
          </div>
          
          {!verificationStep ? (
            <form onSubmit={registerUser} className="login-form">
            <div className="form-group">
              <label className="label">姓名</label>
              <input
                className="input"
                type="text"
                placeholder="请输入姓名"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">邮箱地址</label>
              <input
                className="input"
                type="email"
                placeholder="请输入邮箱"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">密码</label>
              <input
                className="input"
                type="password"
                placeholder="至少 6 位密码"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">确认密码</label>
              <input
                className="input"
                type="password"
                placeholder="请再次输入密码"
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-login">创建账户</button>
          </form>
          ) : (
            <div className="verification-form">
              <div className="form-group">
                <label className="label">验证码</label>
                <input
                  className="input"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  style={{ fontSize: "24px", textAlign: "center", letterSpacing: "8px" }}
                />
              </div>
              
              <button 
                type="button" 
                className="btn btn-primary btn-login"
                onClick={verifyCode}
              >
                验证
              </button>
              
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button 
                  type="button" 
                  className="btn btn-link"
                  onClick={resendCode}
                  style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
                >
                  重新发送验证码
                </button>
              </div>
            </div>
          )}
          
          <div className="form-footer">
            <p className="footer-text">
              已有账号？<Link to="/login" className="footer-link">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// UI/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/http";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("请输入邮箱地址");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: res } = await authApi.forgotPassword({ email });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("密码重置链接已发送至您的邮箱，请查收", { duration: 5000 });
        // 3秒后跳转到登录页
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.log(error);
      toast.error("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* 左侧品牌展示区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-logo">🔐</div>
          <h1 className="brand-title">找回密码</h1>
          <p className="brand-slogan">我们将向您发送密码重置链接</p>
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">📧</div>
              <div className="feature-text">
                <h3>安全验证</h3>
                <p>通过邮箱验证确保账户安全</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⏱️</div>
              <div className="feature-text">
                <h3>有效期1小时</h3>
                <p>重置链接将在1小时后失效</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h3>加密保护</h3>
                <p>您的新密码将被安全加密存储</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="auth-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">忘记密码</h2>
            <p className="form-subtitle">
              输入您的邮箱地址，我们将向您发送密码重置链接
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="label">邮箱地址</label>
              <input
                className="input"
                type="email"
                placeholder="请输入注册时使用的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? "发送中..." : "发送重置链接"}
            </button>
          </form>
          
          <div className="form-footer">
            <p className="footer-text">
              想起密码了？<Link to="/login" className="footer-link">返回登录</Link>
            </p>
            <p className="footer-text">
              还没有账号？<Link to="/register" className="footer-link">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

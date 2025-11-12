// UI/src/pages/ResetPassword.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../api/http";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams(); // 从URL获取token
  const [data, setData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { password, confirmPassword } = data;
    
    if (!password || !confirmPassword) {
      toast.error("请填写完整信息");
      return;
    }
    
    if (password.length < 6) {
      toast.error("密码长度至少为6位");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: res } = await authApi.resetPassword({ 
        token, 
        password, 
        confirmPassword 
      });
      
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("密码重置成功！即将跳转到登录页...", { duration: 3000 });
        // 2秒后跳转到登录页
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      toast.error("重置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* 左侧品牌展示区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-logo">🔑</div>
          <h1 className="brand-title">设置新密码</h1>
          <p className="brand-slogan">请输入您的新密码</p>
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">💪</div>
              <div className="feature-text">
                <h3>强密码建议</h3>
                <p>使用字母、数字和符号的组合</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h3>安全加密</h3>
                <p>密码将被安全加密后存储</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <div className="feature-text">
                <h3>即时生效</h3>
                <p>重置后立即使用新密码登录</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="auth-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">重置密码</h2>
            <p className="form-subtitle">
              请输入您的新密码（至少6位）
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="label">新密码</label>
              <input
                className="input"
                type="password"
                placeholder="至少 6 位密码"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">确认新密码</label>
              <input
                className="input"
                type="password"
                placeholder="请再次输入新密码"
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? "重置中..." : "重置密码"}
            </button>
          </form>
          
          <div className="form-footer">
            <p className="footer-text">
              记起密码了？<Link to="/login" className="footer-link">返回登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

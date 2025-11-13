// UI/src/pages/Login.jsx
import { useState, useContext } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/http";
import { UserContext } from "../../context/userContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password } = data;
    try {
      const { data: res } = await authApi.login({ email, password });
      if (res.error) {
        toast.error(res.error);
      } else {
        setData({ email: "", password: "" });
        // 登录成功后立即获取用户信息并更新Context
        try {
          const { data: profile } = await authApi.profile();
          setUser(profile);
          toast.success("登录成功");
          navigate("/dashboard");
        } catch (err) {
          console.error("获取用户信息失败:", err);
          toast.error("获取用户信息失败");
        }
      }
    } catch (err) {
      console.error("登录失败:", err);
      toast.error("登录失败，请稍后重试");
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
                <p>记录并分享你在加拿大的精采生活</p>
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

      {/* 右侧登录表单区 */}
      <div className="auth-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">欢迎回来</h2>
            <p className="form-subtitle">登录你的 CanLifeHub 账号，继续你的旅程</p>
          </div>
          
          <form onSubmit={loginUser} className="login-form">
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
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "隐藏" : "显示"}
                </button>
              </div>
              <div style={{ marginTop: "8px", textAlign: "right" }}>
                <Link to="/forgot-password" className="footer-link" style={{ fontSize: "14px" }}>
                  忘记密码？
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-login">登录账户</button>
          </form>
          
          <div className="form-footer">
            <p className="footer-text">
              还没有账户？<Link to="/register" className="footer-link">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

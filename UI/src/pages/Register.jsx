import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const registerUser = async (e) => {
    e.preventDefault();
    const { name, email, password } = data;
    try {
      const { data: res } = await axios.post("/register", {
        name,
        email,
        password,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setData({ name: "", email: "", password: "" });
        toast.success("注册成功，欢迎加入！");
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
      toast.error("注册失败，请稍后重试");
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
            <h2 className="form-title">创建账户</h2>
            <p className="form-subtitle">加入 CanLifeHub 社区，开始你的旅程</p>
          </div>
          
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

            <button type="submit" className="btn btn-primary btn-login">创建账户</button>
          </form>
          
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
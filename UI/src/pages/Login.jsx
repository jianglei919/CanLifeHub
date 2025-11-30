// UI/src/pages/Login.jsx
import { useState, useContext } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/http";
import { UserContext } from "../../context/userContext";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const { t } = useLanguage();
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
          const { data: profileData } = await authApi.profile();
          setUser(profileData.user || profileData);
          toast.success(t('loginSuccess'));
          navigate("/forum");
        } catch (err) {
          console.error("获取用户信息失败:", err);
          toast.error("获取用户信息失败");
        }
      }
    } catch (err) {
      console.error("登录失败:", err);
      toast.error(t('loginFailed'));
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* 左侧品牌展示区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-logo">🍁</div>
          <h1 className="brand-title">CanLifeHub</h1>
          <p className="brand-slogan">{t('brandSlogan')}</p>
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">🏡</div>
              <div className="feature-text">
                <h3>{t('featureShare')}</h3>
                <p>{t('featureShareDesc')}</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h3>{t('featureCommunity')}</h3>
                <p>{t('featureCommunityDesc')}</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💡</div>
              <div className="feature-text">
                <h3>{t('featureTips')}</h3>
                <p>{t('featureTipsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="auth-form-section">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <LanguageSwitcher />
        </div>
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">{t('welcomeBack')}</h2>
            <p className="form-subtitle">{t('loginSubtitle')}</p>
          </div>
          
          <form onSubmit={loginUser} className="login-form">
            <div className="form-group">
              <label className="label">{t('emailLabel')}</label>
              <input
                className="input"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">{t('passwordLabel')}</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('passwordPlaceholder')}
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? t('hide') : t('show')}
                </button>
              </div>
              <div style={{ marginTop: "8px", textAlign: "right" }}>
                <Link to="/forgot-password" className="footer-link" style={{ fontSize: "14px" }}>
                  {t('forgotPassword')}
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-login">{t('loginBtn')}</button>
          </form>
          
          <div className="form-footer">
            <p className="footer-text">
              {t('noAccount')} <Link to="/register" className="footer-link">{t('registerNow')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

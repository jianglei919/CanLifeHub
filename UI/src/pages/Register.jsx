// UI/src/pages/Register.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/http";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      toast.error(t('passwordMismatch'));
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
          toast.success(t('registerSuccess'));
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(t('registerFailed'));
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
        toast.success(t('verifySuccess'));
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
      toast.error(t('verifyFailed'));
    }
  };

  const resendCode = async () => {
    try {
      const { data: res } = await authApi.resendVerification({ email: userEmail });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(t('codeResent'));
      }
    } catch (error) {
      console.log(error);
      toast.error(t('resendFailed'));
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* 左侧品牌展示区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-logo">📱</div>
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

      {/* 右侧注册表单区 */}
      <div className="auth-form-section">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <LanguageSwitcher />
        </div>
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">{verificationStep ? t('verifyEmail') : t('createAccount')}</h2>
            <p className="form-subtitle">
              {verificationStep ? t('verifySubtitle') : t('registerSubtitle')}
            </p>
          </div>
          
          {!verificationStep ? (
            <form onSubmit={registerUser} className="login-form">
            <div className="form-group">
              <label className="label">{t('nameLabel')}</label>
              <input
                className="input"
                type="text"
                placeholder={t('namePlaceholder')}
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
            </div>

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
              <input
                className="input"
                type="password"
                placeholder={t('passwordMinLength')}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">{t('confirmPasswordLabel')}</label>
              <input
                className="input"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-login">{t('createAccount')}</button>
          </form>
          ) : (
            <div className="verification-form">
              <div className="form-group">
                <label className="label">{t('verifyCodeLabel')}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={t('verifyCodePlaceholder')}
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
                {t('verifyBtn')}
              </button>
              
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button 
                  type="button" 
                  className="btn btn-link"
                  onClick={resendCode}
                  style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
                >
                  {t('resendCode')}
                </button>
              </div>
            </div>
          )}
          
          <div className="form-footer">
            <p className="footer-text">
              {t('hasAccount')} <Link to="/login" className="footer-link">{t('loginNow')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

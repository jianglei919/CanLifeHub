// UI/src/components/EditProfile.jsx
import { useState, useEffect } from 'react';
import { authApi } from '../api/http';
import toast from 'react-hot-toast';
import '../styles/EditProfile.css';
import { useLanguage } from '../../context/LanguageContext';

export default function EditProfile({ user, onClose, onUpdate }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      setPreviewUrl(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('imageSizeLimit'));
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 验证
    if (!formData.name.trim()) {
      setError(t('usernameRequired'));
      return;
    }

    if (formData.name.trim().length < 2) {
      setError(t('usernameMinLength'));
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = formData.avatar;

      // 如果选择了新图片，先上传
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('avatar', selectedFile);
        const uploadRes = await authApi.uploadAvatar(uploadData);
        
        if (uploadRes.data.ok) {
          avatarUrl = uploadRes.data.url;
        } else {
          throw new Error(uploadRes.data.error || t('avatarUploadFailed'));
        }
      }

      console.log('提交更新资料:', { name: formData.name.trim(), bio: formData.bio.trim(), avatar: avatarUrl });
      
      const response = await authApi.updateProfile({
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        avatar: avatarUrl
      });

      console.log('更新资料响应:', response.data);

      if (response.data.ok) {
        toast.success(response.data.message || t('profileUpdateSuccess'));
        
        // 通知父组件更新用户信息
        if (onUpdate) {
          onUpdate(response.data.user);
        }
        
        // 延迟关闭弹窗，让用户看到成功提示
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // 处理返回 ok: false 的情况
        setError(response.data.error || t('profileUpdateFailed'));
        toast.error(response.data.error || t('profileUpdateFailed'));
      }
    } catch (err) {
      console.error('更新资料失败:', err);
      console.error('错误详情:', err.response?.data);
      setError(err.response?.data?.error || err.message || t('profileUpdateError'));
      toast.error(err.response?.data?.error || err.message || t('profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Helper to determine if avatar is an image URL
  const isImageUrl = (url) => {
    return url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));
  };

  // Helper to get full image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Assuming backend is on localhost:8000 for dev, or relative if proxied
    // For now, let's assume we need to prepend the API base if it's relative and not data URI
    // But wait, if we use Vite proxy, /uploads/... should work relative to current page
    return url; 
  };

  return (
    <div className="edit-profile-overlay" onClick={handleOverlayClick}>
      <div className="edit-profile-modal">
        <div className="edit-profile-header">
          <h2>{t('editProfile')}</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-profile-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group avatar-upload-group">
              <label>{t('avatarLabel')}</label>
              <div className="avatar-preview-container">
                <div className="avatar-preview">
                  {isImageUrl(previewUrl) ? (
                    <img src={getImageUrl(previewUrl)} alt="Avatar Preview" />
                  ) : (
                    <span className="avatar-emoji">{previewUrl || "👤"}</span>
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => document.getElementById('avatar-upload').click()}
                  disabled={loading}
                >
                  {t('changeAvatarBtn')}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">{t('usernameLabel')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('namePlaceholder')}
                maxLength={30}
                disabled={loading}
              />
              <div className="form-hint">{t('usernameHint')}</div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">{t('bioLabel')}</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder={t('bioPlaceholder')}
                maxLength={200}
                rows={4}
                disabled={loading}
              />
              <div className="form-hint">
                {formData.bio.length}/200
              </div>
            </div>
          </div>

          <div className="edit-profile-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? t('savingBtn') : t('saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

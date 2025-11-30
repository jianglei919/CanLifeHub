// UI/src/components/EditProfile.jsx
import { useState, useEffect } from 'react';
import { authApi } from '../api/http';
import toast from 'react-hot-toast';
import '../styles/EditProfile.css';

export default function EditProfile({ user, onClose, onUpdate }) {
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
        toast.error('图片大小不能超过 2MB');
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
      setError('用户名不能为空');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('用户名至少2个字符');
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
          throw new Error(uploadRes.data.error || '头像上传失败');
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
        toast.success(response.data.message || '资料更新成功');
        
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
        setError(response.data.error || '更新失败');
        toast.error(response.data.error || '更新失败');
      }
    } catch (err) {
      console.error('更新资料失败:', err);
      console.error('错误详情:', err.response?.data);
      setError(err.response?.data?.error || err.message || '更新资料失败，请稍后重试');
      toast.error(err.response?.data?.error || err.message || '更新资料失败');
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
          <h2>编辑资料</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-profile-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group avatar-upload-group">
              <label>头像</label>
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
                  更换头像
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">用户名</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入用户名"
                maxLength={30}
                disabled={loading}
              />
              <div className="form-hint">2-30个字符，可包含中英文、数字</div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">个人简介</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="介绍一下自己吧..."
                maxLength={200}
                rows={4}
                disabled={loading}
              />
              <div className="form-hint">
                {formData.bio.length}/200 字符
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
              取消
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

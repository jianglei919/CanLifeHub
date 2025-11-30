// UI/src/components/UserModule.jsx
import { useState, useEffect, useContext } from "react";
import { postsApi, authApi, followApi } from "../api/http";
import { UserContext } from "../../context/userContext";
import { useLanguage } from "../../context/LanguageContext";
import EditProfile from "./EditProfile";
import DetailPost from "./DetailPost";

export default function UserModule() {
  const { t } = useLanguage();
  const { user: ctxUser, setUser: setCtxUser } = useContext(UserContext);
  const [selectedPostId, setSelectedPostId] = useState(null);
const [detailMode, setDetailMode] = useState('view');

  // 真实用户资料
  const [user, setUser] = useState({
    name: "",
    avatar: "👤",
    bio: "",
    followers: 0,
    following: 0,
    postsCount: 0,
    posts: [],
  });

  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 拉取当前用户资料（优先上下文，其次 /auth/profile）
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        setError(null);
        // 若上下文已有用户，直接用；否则向后端获取
        if (ctxUser) {
          if (!cancelled) {
            setUser((prev) => ({
              ...prev,
              name: ctxUser.name || ctxUser.username || "",
              avatar: ctxUser.avatar || "👤",
              bio: ctxUser.bio || "",
              followers: ctxUser.followersCount || 0,
              following: ctxUser.followingCount || 0,
            }));
          }
        } else {
          const resp = await authApi.profile();
          const data = resp?.data?.user || resp?.data || {};
          if (!cancelled) {
            setUser((prev) => ({
              ...prev,
              name: data.name || data.username || "",
              avatar: data.avatar || "👤",
              bio: data.bio || "",
              followers: data.followersCount || 0,
              following: data.followingCount || 0,
            }));
          }
        }
      } catch (e) {
        // 未登录时静默处理，由下方未登录提示兜底
        if (!cancelled) setError(null);
      }
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, [ctxUser]);

  // 获取用户帖子数据
  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 后端通常支持 "myself" 或具体 userId，这里优先使用别名以简化权限校验
      const currentUserId = ctxUser?.id || ctxUser?._id || "myself";

      const queryParams = { page: 1, pageSize: 10 };

      // 兼容 postsApi.listByUser 不存在的情况：后退到通用 GET
      let data;
      if (postsApi.listByUser) {
        ({ data } = await postsApi.listByUser(currentUserId, queryParams));
      } else {
        // 与后端路由 `/api/users/:id/posts` 对齐
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE || "/api"}/users/${currentUserId}/posts?page=${queryParams.page}&pageSize=${queryParams.pageSize}`,
          { credentials: "include" }
        );
        data = await res.json();
      }

      setUser((prevUser) => ({
        ...prevUser,
        posts: data?.items || [],
        postsCount: data?.total || (data?.items ? data.items.length : 0),
      }));
    } catch (err) {
      console.error("获取用户帖子失败:", err);
      setError(err?.response?.data?.error || err?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载或切换到"我的帖子"时获取数据
  useEffect(() => {
    if (activeTab === "posts" && ctxUser) {
      fetchUserPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ctxUser?.id]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // 处理资料更新
  const handleProfileUpdate = (updatedUser) => {
    // 更新本地用户信息
    setUser(prev => ({
      ...prev,
      name: updatedUser.name,
      bio: updatedUser.bio,
      followers: updatedUser.followersCount || prev.followers,
      following: updatedUser.followingCount || prev.following,
    }));
    
    // 更新全局用户上下文
    if (setCtxUser) {
      setCtxUser(updatedUser);
    }

    // 自动刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // 未登录状态下的兜底 UI
  if (!ctxUser) {
    return (
      <div className="user-module">
        <div className="empty-state">
          {t('unauthorized')} <a href="/login">{t('loginLink')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="user-module">
      <div className="user-header">
        <span className="user-avatar">{user.avatar || "👤"}</span>
        <div className="user-info">
          <h3>{user.name || ""}</h3>
          <p>{user.bio || t('lazyBio')}</p>
        </div>
      </div>

      <div className="user-stats">
        <div className="stat">
          <span className="stat-value">{user.followers}</span>
          <span className="stat-label">{t('followers')}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{user.following}</span>
          <span className="stat-label">{t('following')}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{user.postsCount}</span>
          <span className="stat-label">{t('posts')}</span>
        </div>
      </div>

      <button 
        className="edit-profile-btn"
        onClick={() => setShowEditModal(true)}
      >
        {t('editProfile')}
      </button>

      <div className="user-tabs">
        <button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => handleTabChange("posts")}
        >
          {t('myPosts')}
        </button>
        <button
          className={`tab-btn ${activeTab === "likes" ? "active" : ""}`}
          onClick={() => handleTabChange("likes")}
        >
          {t('myLikes')}
        </button>
      </div>

      <div className="user-content">
        {activeTab === "posts" && (
          <div className="posts-list">
            {loading && <div className="loading">{t('loading')}</div>}
            {error && <div className="error">{error}</div>}
            {!loading && !error && (
  <>
    {(!user.posts || user.posts.length === 0) ? (
      <div className="empty-state">{t('noPosts')}</div>
    ) : (
      user.posts.map((post) => (
        <div 
          key={post._id || post.id} 
          className="user-post-item clickable"
          onClick={() => {
            setSelectedPostId(post._id || post.id);
            setDetailMode('view');
          }}
          style={{ cursor: 'pointer' }}
        >
          {post.title && <h4>{post.title}</h4>}
          <p>{post.content}</p>
          <div className="post-meta">
            {post.createdAt && (
              <span className="post-date">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            )}
            <span className="post-likes">❤️ {post.likesCount ?? post.likes ?? 0}</span>
          </div>
        </div>
      ))
    )}
  </>
)}
          </div>
        )}
        {activeTab === "likes" && (
          <div className="likes-list">
            <p>{t('noLikes')}</p>
          </div>
        )}
      </div>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <EditProfile
          user={{
            name: user.name,
            bio: user.bio
          }}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

{selectedPostId && (
  <DetailPost
    postId={selectedPostId}
    mode={detailMode}
    onClose={() => {
      setSelectedPostId(null);
      setDetailMode('view');
    }}
    onUpdate={() => {
      // 帖子更新后刷新列表
      // fetchUserPosts();
      // setSelectedPostId(null);
      // setDetailMode('view');
      window.location.reload();
    }}
  />
)}
    </div>
  );
}

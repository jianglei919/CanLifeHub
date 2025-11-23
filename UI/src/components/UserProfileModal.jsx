// UI/src/components/UserProfileModal.jsx
import { useState, useEffect, useContext } from "react";
import { authApi, postsApi, followApi } from "../api/http";
import { UserContext } from "../../context/userContext";

export default function UserProfileModal({ userId, onClose }) {
  const { user: currentUser } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        console.log('[UserProfileModal] 获取用户信息, userId:', userId);
        
        // 获取用户基本信息和帖子
        const [userRes, postsRes, followStatusRes] = await Promise.all([
          authApi.getUserById(userId),
          postsApi.listByUser(userId, { page: 1, pageSize: 10 }),
          !isOwnProfile && currentUser ? followApi.checkStatus(userId) : Promise.resolve({ data: { isFollowing: false } })
        ]);

        console.log('[UserProfileModal] 用户信息响应:', userRes.data);
        console.log('[UserProfileModal] 帖子响应:', postsRes.data);

        // 使用专门的用户信息 API 获取数据
        const userData = userRes.data.user;
        
        setUser({
          id: userId,
          name: userData.name || "用户",
          avatar: userData.avatar || "👤",
          bio: userData.bio || "这个人很懒，什么都没写...",
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
        });
        
        setPosts(postsRes.data.items || []);
        setIsFollowing(followStatusRes.data?.isFollowing || false);
      } catch (err) {
        console.error("[UserProfileModal] 获取用户资料失败:", err);
        console.error("[UserProfileModal] 错误详情:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, currentUser, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (followLoading || isOwnProfile) return;
    
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await followApi.unfollow(userId);
        setIsFollowing(false);
        setUser(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev?.followersCount || 0) - 1)
        }));
      } else {
        await followApi.follow(userId);
        setIsFollowing(true);
        setUser(prev => ({
          ...prev,
          followersCount: (prev?.followersCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error("关注操作失败:", err);
      alert(err.response?.data?.error || "操作失败");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="user-profile-modal">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="user-profile-modal">
          <div className="error">用户不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="user-profile-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="user-profile-header">
          <span className="user-profile-avatar">{user.avatar}</span>
          <div className="user-profile-info">
            <h2>{user.name}</h2>
            <p>{user.bio}</p>
          </div>
        </div>

        <div className="user-profile-stats">
          <div className="stat">
            <span className="stat-value">{user.followersCount || 0}</span>
            <span className="stat-label">粉丝</span>
          </div>
          <div className="stat">
            <span className="stat-value">{user.followingCount || 0}</span>
            <span className="stat-label">关注</span>
          </div>
          <div className="stat">
            <span className="stat-value">{posts.length}</span>
            <span className="stat-label">帖子</span>
          </div>
        </div>

        {!isOwnProfile && currentUser && (
          <button
            className={`follow-btn ${isFollowing ? 'follow-btn-following' : 'follow-btn-follow'}`}
            onClick={handleFollowToggle}
            disabled={followLoading}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {followLoading ? '...' : isFollowing ? '✓ 已关注' : '+ 关注'}
          </button>
        )}

        <div className="user-profile-posts">
          <h3>最近帖子</h3>
          {posts.length === 0 ? (
            <div className="empty-state">暂无帖子</div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post._id} className="user-post-preview">
                  {post.title && <h4>{post.title}</h4>}
                  <p>{post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}</p>
                  <div className="post-meta">
                    <span>❤️ {post.likesCount || 0}</span>
                    <span>💬 {post.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

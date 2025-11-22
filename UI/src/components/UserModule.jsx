import { useState, useEffect } from "react";
import { postsApi } from "../api/http"; // 假设你的API文件路径

const mockUserProfile = {
  name: "Hello",
  avatar: "👨",
  bio: "加拿大生活分享者",
  followers: 1234,
  following: 567,
  postsCount: 89,
  posts: [
    { id: 1, content: "我发的第一篇帖子", likes: 45 },
    { id: 2, content: "我发的第二篇帖子", likes: 32 },
  ],
};

export default function UserModule() {
  const [user, setUser] = useState(mockUserProfile);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取用户帖子数据
  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户ID
      const currentUserId = "myself";

      // 构建查询参数
      const queryParams = {
        page: 1,
        pageSize: 10, // 限制最多10个帖子
        // 可以根据需要添加其他参数，如排序方式等
      };

      // 调用获取用户帖子列表的API
      const { data } = await postsApi.listByUser("myself", queryParams);

      // 更新用户数据，将获取到的帖子合并到用户信息中
      setUser(prevUser => ({
        ...prevUser,
        posts: data.items || [], // 使用API返回的帖子列表
        postsCount: data.total || 0 // 更新帖子总数
      }));

    } catch (err) {
      console.error('获取用户帖子失败:', err);
      setError(err.response?.data?.error || '获取帖子失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取帖子数据
  useEffect(() => {
    if (activeTab === "posts") {
      fetchUserPosts();
    }
  }, [activeTab]);

  // 处理标签切换
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "posts") {
      fetchUserPosts(); // 切换到帖子标签时重新获取数据
    }
  };

  return (
    <div className="user-module">
      <div className="user-header">
        <span className="user-avatar">{user.avatar}</span>
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.bio}</p>
        </div>
      </div>

      <div className="user-stats">
        <div className="stat">
          <span className="stat-value">{user.followers}</span>
          <span className="stat-label">粉丝</span>
        </div>
        <div className="stat">
          <span className="stat-value">{user.following}</span>
          <span className="stat-label">关注</span>
        </div>
        <div className="stat">
          <span className="stat-value">{user.postsCount}</span>
          <span className="stat-label">帖子</span>
        </div>
      </div>

      <button className="edit-profile-btn">编辑资料</button>

      <div className="user-tabs">
        <button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => handleTabChange("posts")}
        >
          我的帖子
        </button>
        <button
          className={`tab-btn ${activeTab === "likes" ? "active" : ""}`}
          onClick={() => handleTabChange("likes")}
        >
          我的赞
        </button>
      </div>

      <div className="user-content">
        {activeTab === "posts" && (
          <div className="posts-list">
            {loading && <div className="loading">加载中...</div>}
            {error && <div className="error">{error}</div>}
            {!loading && !error && (
              <>
                {user.posts.length === 0 ? (
                  <div className="empty-state">暂无帖子</div>
                ) : (
                  user.posts.map((post) => (
                    <div key={post._id || post.id} className="user-post-item">
                      {post.title && <h4>{post.title}</h4>}
                      <p>{post.content}</p>
                      <div className="post-meta">
                        {post.createdAt && (
                          <span className="post-date">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className="post-likes">{post.likes || 0}</span>
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
            <p>暂无赞过的内容</p>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";

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
  const [user] = useState(mockUserProfile);
  const [activeTab, setActiveTab] = useState("posts");

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
          onClick={() => setActiveTab("posts")}
        >
          我的帖子
        </button>
        <button
          className={`tab-btn ${activeTab === "likes" ? "active" : ""}`}
          onClick={() => setActiveTab("likes")}
        >
          我的赞
        </button>
      </div>

      <div className="user-content">
        {activeTab === "posts" && (
          <div className="posts-list">
            {user.posts.map((post) => (
              <div key={post.id} className="user-post-item">
                <p>{post.content}</p>
                <span className="post-likes">👍 {post.likes}</span>
              </div>
            ))}
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

import { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import PostList from "../components/PostList";
import CreatePost from "../components/CreatePost";
import UserModule from "../components/UserModule";
import Advertisement from "../components/Advertisement";
import Messages from "../components/Messages";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("feed");
  const [feedType, setFeedType] = useState("all");

  return (
    <div className="dashboard-container">
      {/* ... existing code ... */}
      <header className="dashboard-header">
        <div className="header-wrapper">
          <div className="logo-section">
            <span className="logo">📱 CanLifeHub</span>
          </div>
          
          <nav className="tab-navigation">
            <button
              className={`tab-item ${activeTab === "feed" ? "active" : ""}`}
              onClick={() => setActiveTab("feed")}
            >
              🏠 首页
            </button>
            <button
              className={`tab-item ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => setActiveTab("messages")}
            >
              💬 私信
            </button>
            <button
              className={`tab-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              👤 我的资料
            </button>
          </nav>

          <div className="user-section">
            <span className="greeting">{user?.name || "用户"}</span>
          </div>
        </div>
      </header>

      {/* ... existing code ... */}
      <main className="main-container">
        {/* 首页 - Feed */}
        {activeTab === "feed" && (
          <div className="feed-container">
            <div className="feed-main">
              <CreatePost />
              
              {/* 帖子分类 */}
              <div className="feed-type-selector">
                <button
                  className={`type-btn ${feedType === "all" ? "active" : ""}`}
                  onClick={() => setFeedType("all")}
                >
                  全部动态
                </button>
                <button
                  className={`type-btn ${feedType === "following" ? "active" : ""}`}
                  onClick={() => setFeedType("following")}
                >
                  关注的人
                </button>
              </div>
              
              <PostList feedType={feedType} />
            </div>
            <div className="feed-sidebar">
              <UserModule />
              <Advertisement />
            </div>
          </div>
        )}

        {/* 我的资料 */}
        {activeTab === "profile" && (
          <div className="profile-container">
            <UserModule />
          </div>
        )}

        {/* 私信 */}
        {activeTab === "messages" && (
          <div className="messages-container">
            <Messages />
          </div>
        )}
      </main>
    </div>
  );
}

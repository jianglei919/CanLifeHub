// UI/src/pages/Dashboard.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import { authApi, chatApi } from "../api/http";
import toast from "react-hot-toast";
import PostList from "../components/PostList";
import CreatePost from "../components/CreatePost";
import UserModule from "../components/UserModule";
import Advertisement from "../components/Advertisement";
import Messages from "../components/Messages";
import ChatbotWidget from "../components/ChatbotWidget";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");
  const [feedType, setFeedType] = useState("all");
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const unreadPollingRef = useRef(null);

  // 获取未读消息总数
  const fetchUnreadCount = async () => {
    try {
      const response = await chatApi.getConversations();
      if (response.data.ok) {
        const total = response.data.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnreadCount(total);
      }
    } catch (error) {
      console.error("获取未读消息数失败:", error);
    }
  };

  // 启动未读消息轮询 - 优化：仅在消息页面时轮询
  useEffect(() => {
    // 只在消息 tab 激活时才轮询
    if (activeTab === 'messages') {
      fetchUnreadCount(); // 立即获取一次
      unreadPollingRef.current = setInterval(fetchUnreadCount, 10000); // 10秒轮询一次
    } else {
      // 切换到其他 tab 时清除轮询
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
      }
    }

    return () => {
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
      }
    };
  }, [activeTab]); // 依赖 activeTab

  // 退出登录
  const handleLogout = async () => {
    // 确认对话框
    const confirmed = window.confirm(
      "确定要退出登录吗？\n\n退出后需要重新登录才能访问系统。"
    );

    if (!confirmed) {
      return; // 用户取消退出
    }

    try {
      await authApi.logout();
      setUser(null);
      toast.success("已退出登录");
      navigate("/login");
    } catch (err) {
      console.error("退出登录失败:", err);
      toast.error("退出登录失败");
    }
  };

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
              {totalUnreadCount > 0 && (
                <span className="unread-badge">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>
              )}
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
            <button className="logout-btn" onClick={handleLogout} title="退出登录">
              退出
            </button>
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

      {/* AI 聊天助手 - 仅登录后可见 */}
      {user && <ChatbotWidget />}
    </div>
  );
}

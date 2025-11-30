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
  const isAuthenticated = !!user;
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
    // 只在已登录且消息 tab 激活时才轮询
    if (isAuthenticated && activeTab === 'messages') {
      fetchUnreadCount(); // 立即获取一次
      unreadPollingRef.current = setInterval(fetchUnreadCount, 10000); // 10秒轮询一次
    } else {
      // 切换到其他 tab 或未登录时清除轮询
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
      }
    }

    return () => {
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
      }
    };
  }, [activeTab, isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) {
      setFeedType('all');
      if (activeTab !== 'feed') setActiveTab('feed');
    }
  }, [isAuthenticated]);

  // 退出登录
  const handleLogout = async () => {
    // 确认对话框
    const confirmed = window.confirm(
      "确定要退出登录吗？\n"
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
            {isAuthenticated && (
              <button
                className={`tab-item ${activeTab === "messages" ? "active" : ""}`}
                onClick={() => setActiveTab("messages")}
              >
                💬 私信
                {totalUnreadCount > 0 && (
                  <span className="unread-badge">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                className={`tab-item ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                👤 我的资料
              </button>
            )}
          </nav>

          <div className="user-section">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button className="admin-link-btn" onClick={() => navigate('/admin')}>
                    后台
                  </button>
                )}
                <span className="greeting">{user.name || "用户"}</span>
                <button className="logout-btn" onClick={handleLogout} title="退出登录">
                  退出
                </button>
              </>
            ) : (
              <button className="login-btn" onClick={() => navigate('/login')} title="登录">
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ... existing code ... */}
      <main className="main-container">
        {/* 首页 - Feed */}
        {activeTab === "feed" && (
          <div className="feed-container">
            <div className="feed-main">
              {isAuthenticated && <CreatePost />}

              {/* 帖子分类 */}
              <div className="feed-type-selector">
                <button
                  className={`type-btn ${feedType === "all" ? "active" : ""}`}
                  onClick={() => setFeedType("all")}
                >
                  全部动态
                </button>
                {isAuthenticated && (
                  <button
                    className={`type-btn ${feedType === "following" ? "active" : ""}`}
                    onClick={() => setFeedType("following")}
                  >
                    关注的人
                  </button>
                )}
              </div>

              <PostList feedType={feedType} />
            </div>
            <div className="feed-sidebar">
              {isAuthenticated && <UserModule />}
              <Advertisement isAuthenticated={isAuthenticated} />
            </div>
          </div>
        )}

        {/* 我的资料 */}
        {isAuthenticated && activeTab === "profile" && (
          <div className="profile-container">
            <UserModule />
          </div>
        )}

        {/* 私信 */}
        {isAuthenticated && activeTab === "messages" && (
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

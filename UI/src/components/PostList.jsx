import { useContext, useState, useEffect } from "react";
import { UserContext } from "../../context/userContext";
import CommentsBox from "./CommentsBox";
import { feedApi, postsApi } from "../api/http"; // 添加 postsApi 导入
import CreatePost from "./CreatePost"; // 导入 CreatePost 组件

const TEST_POST_ID = import.meta.env.VITE_TEST_POST_ID || '64c1f0e9f7c5a4b123456789';

export default function PostList({ feedType = "all" }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [showMenuForPost, setShowMenuForPost] = useState(null); // 控制菜单显示
  const [editingPost, setEditingPost] = useState(null); // 正在编辑的帖子

  // 转换 API 数据为组件需要的格式
  const transformPostData = (apiPost) => {
    return {
      id: apiPost._id,
      author: apiPost.authorId?.name || "匿名用户",
      authorId: apiPost.authorId?._id, // 添加作者ID用于权限判断
      avatar: apiPost.authorId?.avatar || "👤",
      timestamp: formatTime(apiPost.createdAt),
      content: apiPost.content || apiPost.title || "",
      media: apiPost.media || [],
      likes: apiPost.likesCount || 0,
      retweets: apiPost.sharesCount || 0,
      commentsCount: apiPost.commentsCount || 0,
      comments: [],
      isFollowing: true,
      type: apiPost.type,
      title: apiPost.title,
      rawData: apiPost
    };
  };

  // 时间格式化函数
  const formatTime = (isoString) => {
    const now = new Date();
    const postTime = new Date(isoString);
    const diffInHours = (now - postTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else {
      return `${Math.floor(diffInHours / 24)}天前`;
    }
  };

  // 获取帖子数据
  const fetchPosts = async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const cursor = loadMore ? nextCursor : null;
      let response;

      if (feedType === "all") {
        response = await feedApi.getRecommend({ cursor });
      } else if (feedType === "following") {
        response = await feedApi.getFollow({ cursor });
      }

      const newPosts = response.data.items.map(transformPostData);
      
      if (loadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setNextCursor(response.data.nextCursor);
      setHasMore(response.data.nextCursor !== null);

    } catch (err) {
      console.error('获取帖子失败:', err);
      setError(err.response?.data?.error || '获取帖子失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载更多
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(true);
    }
  };

  // 当 feedType 改变时重新获取数据
  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setExpandedComments({});
    fetchPosts(false);
  }, [feedType]);

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // 处理点赞
  const handleLike = async (postId) => {
    try {
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ));
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  // 处理转发
  const handleRetweet = async (postId) => {
    try {
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, retweets: post.retweets + 1 }
          : post
      ));
    } catch (err) {
      console.error('转发失败:', err);
    }
  };

  // 切换菜单显示
  const toggleMenu = (postId, event) => {
    event.stopPropagation();
    setShowMenuForPost(showMenuForPost === postId ? null : postId);
  };

  // 关闭菜单
  const closeMenu = () => {
    setShowMenuForPost(null);
  };

  // 删除帖子
  const handleDeletePost = async (postId) => {
    if (!window.confirm('确定要删除这条帖子吗？此操作不可撤销。')) {
      return;
    }

    try {
      await postsApi.delete(postId);
      
      // 从列表中移除已删除的帖子
      setPosts(posts.filter(post => post.id !== postId));
      setShowMenuForPost(null);
      
      // 可以添加成功提示
      console.log('帖子删除成功');
    } catch (err) {
      console.error('删除帖子失败:', err);
      // 可以添加错误提示
    }
  };

  // 编辑帖子
  const handleEditPost = (post) => {
    // setEditingPost(post);
    // setShowMenuForPost(null);
  };

  // 处理编辑完成
  const handleEditComplete = () => {
    // setEditingPost(null);
    // // 重新获取帖子列表以更新编辑后的内容
    // fetchPosts(false);
  };

  // 处理编辑取消
  const handleEditCancel = () => {
    setEditingPost(null);
  };

  // 检查是否是自己的帖子
  const isOwnPost = (post) => {
    const currentUserId = user?.id; // 替换为实际的当前用户ID获取方式
    return post.authorId === currentUserId;
  };

  // 渲染媒体内容
  const renderMedia = (mediaArray) => {
    if (!mediaArray || mediaArray.length === 0) return null;

    // 构建完整URL
    const getFullUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `http://localhost:8000${url}`;
    };

    return (
      <div className="post-media">
        {mediaArray.map((media, index) => (
          <div key={index} className="media-item">
            {media.type === 'image' ? (
              <img 
                src={getFullUrl(media.url)}
                alt={`帖子图片 ${index + 1}`}
                className="media-image"
                onClick={() => window.open(getFullUrl(media.url), '_blank')}
                style={{ cursor: 'pointer' }}
              />
            ) : media.type === 'video' ? (
              <video 
                controls 
                className="media-video"
                poster={getFullUrl(media.thumbnail)}
                style={{ width: '100%', maxHeight: '400px' }}
              >
                <source src={getFullUrl(media.url)} type="video/mp4" />
                您的浏览器不支持视频播放。
              </video>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuForPost(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="post-list">
      {loading && posts.length === 0 && (
        <div className="loading">加载中...</div>
      )}
      
      {error && (
        <div className="error">
          {error}
          <button onClick={() => fetchPosts(false)} className="retry-btn">
            重试
          </button>
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="empty-state">
          <p>没有内容了</p>
          <button onClick={() => fetchPosts(false)} className="retry-btn">
            刷新
          </button>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author-info">
                  <span className="post-avatar">{post.avatar}</span>
                  <div className="post-author-meta">
                    <div className="post-author-name">{post.author}</div>
                    <div className="post-timestamp">{post.timestamp}</div>
                  </div>
                </div>
                
                {/* 帖子菜单按钮 */}
                <div className="post-menu-container">
                  <button 
                    className="post-menu" 
                    onClick={(e) => toggleMenu(post.id, e)}
                  >
                    ···
                  </button>
                  
                  {/* 菜单下拉选项 */}
                  {showMenuForPost === post.id && (
                    <div className="post-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      {/* 如果是自己的帖子，显示编辑和删除选项 */}
                      {isOwnPost(post) && (
                        <>
                          <button 
                            className="menu-item" 
                            onClick={() => handleEditPost(post)}
                          >
                            编辑
                          </button>
                          <button 
                            className="menu-item delete" 
                            onClick={() => handleDeletePost(post.id)}
                          >
                            删除
                          </button>
                        </>
                      )}
                      {/* 通用选项 */}
                      <button className="menu-item">举报</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="post-content">
                {post.title && <h4 className="post-title">{post.title}</h4>}
                <p>{post.content}</p>
                {renderMedia(post.media)}
              </div>

              <div className="post-actions">
                <button 
                  className="post-action-btn" 
                  onClick={() => toggleComments(post.id)}
                >
                  💬 评论 (0)
                </button>
                
                <button 
                  className="post-action-btn" 
                  onClick={() => handleRetweet(post.id)}
                >
                  🔄 转发 (0)
                </button>
                
                <button 
                  className="post-action-btn" 
                  onClick={() => handleLike(post.id)}
                >
                  👍 赞 (0)
                </button>
              </div>

              {/* 评论框 */}
              {expandedComments[post.id] && (
                <div className="post-comments-section">
                  <CommentsBox 
                    targetType="post" 
                    targetId={post.id} 
                    key={`comments-${post.id}`}
                  />
                </div>
              )}
            </div>
          ))}
          
          {/* 加载更多 */}
          {hasMore && (
            <div className="load-more-container">
              <button 
                onClick={loadMore} 
                disabled={loading}
                className="load-more-btn"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="no-more-posts">
              <p>没有更多内容了</p>
            </div>
          )}
        </>
      )}

      {/* 编辑帖子模态框 */}
      {editingPost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreatePost 
              editMode={true}
              postData={editingPost}
              onComplete={handleEditComplete}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
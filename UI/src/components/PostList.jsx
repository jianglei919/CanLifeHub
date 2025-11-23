import { useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "../../context/userContext";
import CommentsBox from "./CommentsBox";
import { feedApi, postsApi } from "../api/http";
import CreatePost from "./CreatePost";

const TEST_POST_ID = import.meta.env.VITE_TEST_POST_ID || '64c1f0e9f7c5a4b123456789';

export default function PostList({ feedType = "all" }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [showMenuForPost, setShowMenuForPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const formatTime = (isoString) => {
    const now = new Date();
    const postTime = new Date(isoString);
    const diffInHours = (now - postTime) / (1000 * 60 * 60);
    if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}分钟前`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}小时前`;
    return `${Math.floor(diffInHours / 24)}天前`;
  };

  const transformPostData = (apiPost) => {
    return {
      id: apiPost._id,
      author: apiPost.authorId?.name || "匿名用户",
      authorId: apiPost.authorId?._id,
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
      isLiked: apiPost.isLiked || false, // 从后端获取的点赞状态
      rawData: apiPost
    };
  };

  const fetchPosts = useCallback(async (loadMore = false) => {
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

      const newPosts = (response.data.items || []).map(transformPostData);

      if (loadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setNextCursor(response.data.nextCursor ?? null);
      setHasMore(response.data.nextCursor != null);
    } catch (err) {
      console.error('获取帖子失败:', err);
      setError(err.response?.data?.error || '获取帖子失败');
    } finally {
      setLoading(false);
    }
  }, [feedType, nextCursor]);

  const loadMore = () => {
    if (hasMore && !loading) fetchPosts(true);
  };

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setExpandedComments({});
    fetchPosts(false);
  }, [feedType, fetchPosts]);

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // —— 新增：供 CommentsBox 回调，乐观更新某帖的评论数 ——
  const handleCommentCountChange = useCallback((postId) => (delta) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) + (delta || 0)) } : p)
    );
  }, []);

  const handleLike = async (postId) => {
    try {
      // 检查是否已经点赞
      const post = posts.find(p => p.id === postId);
      if (post?.isLiked) {
        // 取消点赞
        await postsApi.unreact(postId, 'like');
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, likes: Math.max(0, (p.likes || 0) - 1), isLiked: false }
            : p
        ));
      } else {
        // 点赞
        await postsApi.react(postId, 'like');
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, likes: (p.likes || 0) + 1, isLiked: true }
            : p
        ));
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
      alert(err.message || '点赞失败，请重试');
    }
  };

  const handleRetweet = async (postId) => {
    try {
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, retweets: (post.retweets || 0) + 1 }
          : post
      ));
    } catch (err) {
      console.error('转发失败:', err);
    }
  };

  const toggleMenu = (postId, event) => {
    event.stopPropagation();
    setShowMenuForPost(showMenuForPost === postId ? null : postId);
  };

  const closeMenu = () => setShowMenuForPost(null);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('确定要删除这条帖子吗？此操作不可撤销。')) return;
    try {
      await postsApi.delete(postId);
      setPosts(posts.filter(post => post.id !== postId));
      setShowMenuForPost(null);
    } catch (err) {
      console.error('删除帖子失败:', err);
    }
  };

  const handleEditPost = (post) => {
    // 预留编辑能力
    // setEditingPost(post);
    // setShowMenuForPost(null);
  };

  const handleEditComplete = () => {
    // setEditingPost(null);
    // fetchPosts(false);
  };

  const handleEditCancel = () => setEditingPost(null);

  const isOwnPost = (post) => {
    const currentUserId = user?.id;
    return post.authorId === currentUserId;
  };

  const renderMedia = (mediaArray) => {
    if (!mediaArray || mediaArray.length === 0) return null;

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

  useEffect(() => {
    const handleClickOutside = () => setShowMenuForPost(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

                <div className="post-menu-container">
                  <button
                    className="post-menu"
                    onClick={(e) => toggleMenu(post.id, e)}
                  >
                    ···
                  </button>

                  {showMenuForPost === post.id && (
                    <div className="post-menu-dropdown" onClick={(e) => e.stopPropagation()}>
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
                  {/* —— 这里由原来的 (0) 改为展示真实 commentsCount —— */}
                  💬 评论 ({post.commentsCount || 0})
                </button>

                <button
                  className="post-action-btn"
                  onClick={() => handleRetweet(post.id)}
                >
                  🔄 转发 ({post.retweets || 0})
                </button>

                <button
                  className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  {post.isLiked ? '❤️' : '👍'} 赞 ({post.likes || 0})
                </button>
              </div>

              {expandedComments[post.id] && (
                <div className="post-comments-section">
                  <CommentsBox
                    targetType="post"
                    targetId={post.id || TEST_POST_ID}
                    key={`comments-${post.id}`}
                    // —— 传入回调，子组件成功发布评论/回复后 +1 —— 
                    onCountChange={handleCommentCountChange(post.id)}
                  />
                </div>
              )}
            </div>
          ))}

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
import { useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "../../context/userContext";
import { useLanguage } from "../../context/LanguageContext";
import CommentsBox from "./CommentsBox";
import { feedApi, postsApi, followApi } from "../api/http";
import CreatePost from "./CreatePost";
import UserProfileModal from "./UserProfileModal";
import Swal from 'sweetalert2';
import DetailPost from "./DetailPost";
import { toast } from "react-hot-toast";

const TEST_POST_ID = import.meta.env.VITE_TEST_POST_ID || '64c1f0e9f7c5a4b123456789';

export default function PostList({ feedType = "all" }) {
  const { t } = useLanguage();
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [showMenuForPost, setShowMenuForPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [sortBy, setSortBy] = useState('time'); // 'time' 或 'hot'
  const [followingUsers, setFollowingUsers] = useState(new Set()); // 记录正在关注的用户
  const [followLoadingUsers, setFollowLoadingUsers] = useState(new Set()); // 记录正在操作的用户
  const [selectedUserId, setSelectedUserId] = useState(null); // 选中的用户ID用于显示资料
  const [selectedPostId, setSelectedPostId] = useState(null);
const [detailMode, setDetailMode] = useState('view'); // 'view' 或 'edit'

  const formatTime = (isoString) => {
    const now = new Date();
    const postTime = new Date(isoString);
    const diffInHours = (now - postTime) / (1000 * 60 * 60);
    if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}${t('minutesAgo')}`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}${t('hoursAgo')}`;
    return `${Math.floor(diffInHours / 24)}${t('daysAgo')}`;
  };

  const transformPostData = (apiPost) => {
    return {
      id: apiPost._id,
      author: apiPost.authorId?.name || t('anonymousUser'),
      authorId: apiPost.authorId?._id,
      avatar: apiPost.authorId?.avatar || "👤",
      timestamp: formatTime(apiPost.createdAt),
      content: apiPost.content || apiPost.title || "",
      media: apiPost.media || [],
      likes: apiPost.likesCount || 0,
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
        response = await feedApi.getRecommend({ cursor, sort: sortBy });
      } else if (feedType === "following") {
        response = await feedApi.getFollow({ cursor, sort: sortBy });
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
  }, [feedType, sortBy, nextCursor]);

  const loadMore = () => {
    if (hasMore && !loading) fetchPosts(true);
  };

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setExpandedComments({});
    fetchPosts(false);
  }, [feedType, sortBy, fetchPosts]);

  // 获取用户关注列表
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchFollowing = async () => {
      try {
        const response = await followApi.getFollowing(user.id, { pageSize: 1000 });
        const followedIds = response.data.users.map(u => u._id || u.id);
        setFollowingUsers(new Set(followedIds));
      } catch (err) {
        console.error('获取关注列表失败:', err);
      }
    };

    fetchFollowing();
  }, [user?.id]);

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
      alert(err.message || t('likeFailed'));
    }
  };

  const toggleMenu = (postId, event) => {
    event.stopPropagation();
    setShowMenuForPost(showMenuForPost === postId ? null : postId);
  };

  const closeMenu = () => setShowMenuForPost(null);

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: t('confirmDelete'),
      text: t('deleteWarning'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('delete'),
      cancelButtonText: t('cancel'),
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      }
    });
  
    if (result.isConfirmed) {
      try {
        await postsApi.delete(postId);
        setPosts(posts.filter(post => post.id !== postId));
        setShowMenuForPost(null);
        Swal.fire(t('deleted'), t('deleteSuccess'), 'success');
      } catch (err) {
        console.error('删除帖子失败:', err);
        Swal.fire(t('error'), t('deleteFailed'), 'error');
      }
    }
  };

  const handleEditPost = (post) => {
    setSelectedPostId(post.id);
    setDetailMode('edit');
    setShowMenuForPost(null);
  };

  // 修改帖子内容渲染部分
  const renderPostContent = (post) => (
    <div 
      className="post-content clickable" 
      onClick={() => {
        setSelectedPostId(post.id);
        setDetailMode('view');
      }}
      style={{ cursor: 'pointer' }}
    >
      {post.title && <h4 className="post-title">{post.title}</h4>}
      <p>{post.content}</p>
      {renderMedia(post.media)}
    </div>
  );

  // 简洁版举报函数
const handleReportPost = async (postId) => {
  const reportReasons = {
    spam: t('spam'),
    porn: t('porn'), 
    violence: t('violence'),
    harassment: t('harassment'),
    illegal: t('illegal'),
    false_info: t('false_info'),
    privacy: t('privacy'),
    other: t('other')
  };

  const { value: reason } = await Swal.fire({
    title: t('report'),
    input: 'select',
    inputOptions: reportReasons,
    inputPlaceholder: t('reportReason'),
    showCancelButton: true,
    confirmButtonText: t('submitReport'),
    cancelButtonText: t('cancel'),
    confirmButtonColor: '#dc3545',
    inputValidator: (value) => {
      if (!value) {
        return t('reportReason');
      }
    }
  });

  if (reason) {
    try {
      // 这里调用举报API
      // await postsApi.report(postId, reason);
      
      setShowMenuForPost(null);
      toast.success(t('reportSuccess'));
      
      console.log('举报信息:', {
        postId,
        reason: reportReasons[reason]
      });
      
    } catch (error) {
      console.error('举报失败:', error);
      toast.error(t('reportFailed'));
    }
  }
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

  // 处理关注/取关
  const handleFollowToggle = async (authorId, e) => {
    e.stopPropagation();
    if (!user) return;
    if (followLoadingUsers.has(authorId)) return;

    try {
      setFollowLoadingUsers(prev => new Set([...prev, authorId]));
      
      if (followingUsers.has(authorId)) {
        // 取消关注
        await followApi.unfollow(authorId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(authorId);
          return newSet;
        });
      } else {
        // 关注
        await followApi.follow(authorId);
        setFollowingUsers(prev => new Set([...prev, authorId]));
      }
    } catch (err) {
      console.error('关注操作失败:', err);
    } finally {
      setFollowLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(authorId);
        return newSet;
      });
    }
  };

  const handleAvatarClick = (authorId, e) => {
    e.stopPropagation();
    if (authorId) {
      setSelectedUserId(authorId);
    }
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
      {/* 排序选择器 */}
      <div className="sort-selector-container">
        <label className="sort-label">📊 {t('sortBy')}：</label>
        <select 
          className="sort-select" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          disabled={loading}
        >
          <option value="time">⏰ {t('latest')}</option>
          <option value="hot">🔥 {t('hottest')}</option>
        </select>
      </div>

      {loading && posts.length === 0 && (
        <div className="loading">{t('loading')}</div>
      )}

      {error && (
        <div className="error">
          {error}
          <button onClick={() => fetchPosts(false)} className="retry-btn">
            {t('retry')}
          </button>
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="empty-state">
          <p>{t('noMoreContent')}</p>
          <button onClick={() => fetchPosts(false)} className="retry-btn">
            {t('refresh')}
          </button>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author-info">
                  <span 
                    className="post-avatar clickable" 
                    onClick={(e) => handleAvatarClick(post.authorId, e)}
                    title={t('viewProfile')}
                  >
                    {post.avatar}
                  </span>
                  <div className="post-author-meta">
                    <div 
                      className="post-author-name clickable"
                      onClick={(e) => handleAvatarClick(post.authorId, e)}
                      title={t('viewProfile')}
                    >
                      {post.author}
                    </div>
                    <div className="post-timestamp">{post.timestamp}</div>
                  </div>
                  {/* 关注按钮 - 不显示在自己的帖子上 */}
                  {user && !isOwnPost(post) && (
                    <button
                      className={`follow-btn follow-btn-small ${
                        followingUsers.has(post.authorId) ? 'follow-btn-following' : 'follow-btn-follow'
                      }`}
                      onClick={(e) => handleFollowToggle(post.authorId, e)}
                      disabled={followLoadingUsers.has(post.authorId)}
                    >
                      {followLoadingUsers.has(post.authorId) ? (
                        '...'
                      ) : followingUsers.has(post.authorId) ? (
                        `✓ ${t('followed')}`
                      ) : (
                        `+ ${t('follow')}`
                      )}
                    </button>
                  )}
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
                            onClick={() => {
                              setSelectedPostId(post.id);
                              setDetailMode('edit');
                              setShowMenuForPost(null);
                            }}
                          >
                            {t('edit')}
                          </button>
                          <button
                            className="menu-item delete"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            {t('delete')}
                          </button>
                        </>
                      )}
                      <button 
                        className="menu-item"
                        onClick={() => handleReportPost(post.id)}
                      >
                        {t('report')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div 
                className="post-content clickable" 
                onClick={() => {
                  setSelectedPostId(post.id);
                  setDetailMode('view');
                }}
                style={{ cursor: 'pointer' }}
              >
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
                  💬 {t('comments')} ({post.commentsCount || 0})
                </button>

                <button
                  className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  {post.isLiked ? '❤️' : '👍'} {t('likes')} ({post.likes || 0})
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
                {loading ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="no-more-posts">
              <p>{t('noMoreContent')}</p>
            </div>
          )}
        </>
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
            fetchPosts(false);
            setSelectedPostId(null);
            setDetailMode('view');
          }}
        />
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

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
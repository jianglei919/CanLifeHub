import { useState } from "react";

const mockPosts = [
  {
    id: 1,
    author: "张三",
    avatar: "👨",
    timestamp: "2小时前",
    content: "今天天气真好，去多伦多湖边散步了一圈，看到了美丽的日落！",
    image: "🌅",
    likes: 42,
    retweets: 15,
    comments: [
      { id: 1, author: "李四", avatar: "👩", content: "好羡慕！", likes: 5 },
    ],
    isFollowing: true,
  },
  {
    id: 2,
    author: "李四",
    avatar: "👩",
    timestamp: "5小时前",
    content: "分享一下我最近学到的React Hooks技巧。大家都用useState吗？",
    image: "📱",
    likes: 128,
    retweets: 45,
    comments: [
      { id: 1, author: "王五", avatar: "👨", content: "我用useEffect比较多", likes: 8 },
    ],
    isFollowing: true,
  },
  {
    id: 3,
    author: "王五",
    avatar: "👨",
    timestamp: "1天前",
    content: "加拿大的三月已经需要加衣！快来分享你们的促会信息。",
    image: "📸",
    likes: 89,
    retweets: 32,
    comments: [],
    isFollowing: false,
  },
  {
    id: 4,
    author: "开放年代",
    avatar: "👴",
    timestamp: "2天前",
    content: "有没有人帮帮忙？有关于处理底批求股票的问题。",
    image: "💹",
    likes: 23,
    retweets: 8,
    comments: [],
    isFollowing: false,
  },
];

export default function PostList({ feedType = "all" }) {
  const [posts] = useState(mockPosts);
  const [expandedComments, setExpandedComments] = useState({});

  // 根据帖子类型筛选帖子
  const filteredPosts = feedType === "following"
    ? posts.filter(post => post.isFollowing)
    : posts;

  const toggleComments = (postId) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId],
    });
  };

  return (
    <div className="post-list">
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <p>没有内容了</p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-author-info">
                <span className="post-avatar">{post.avatar}</span>
                <div className="post-author-meta">
                  <div className="post-author-name">{post.author}</div>
                  <div className="post-timestamp">{post.timestamp}</div>
                </div>
              </div>
              <button className="post-menu">···</button>
            </div>

            <div className="post-content">
              <p>{post.content}</p>
              {post.image && <div className="post-image">{post.image}</div>}
            </div>

            <div className="post-stats">
              <span>👍 {post.likes}</span>
              <span>🔄 {post.retweets}</span>
              <span onClick={() => toggleComments(post.id)} style={{ cursor: "pointer" }}>
                💬 {post.comments.length}
              </span>
            </div>

            <div className="post-actions">
              <button className="post-action-btn">💬 评论</button>
              <button className="post-action-btn">🔄 转发</button>
              <button className="post-action-btn">👍 赞</button>
            </div>

            {expandedComments[post.id] && (
              <div className="post-comments-section">
                <h4>评论</h4>
                {post.comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <span className="comment-avatar">{comment.avatar}</span>
                    <div className="comment-info">
                      <div className="comment-author">{comment.author}</div>
                      <div className="comment-content">{comment.content}</div>
                      <span className="comment-likes">👍 {comment.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

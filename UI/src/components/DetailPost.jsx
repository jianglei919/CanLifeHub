import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { postsApi } from "../api/http";
import Swal from 'sweetalert2';
import '../styles/CreatePost.css';
import '../styles/DetailPost.css';

export default function DetailPost({ postId, mode = 'view', onClose, onUpdate }) {
  // 状态管理
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [visibility, setVisibility] = useState("public");
  const [location, setLocation] = useState("");
  const [topics, setTopics] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ["😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙"];

  // 加载帖子详情
  const loadPostDetail = useCallback(async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      const { data } = await postsApi.getById(postId);
      setPost(data);
      
      // 填充表单数据
      setTitle(data.title || "");
      setContent(data.content || "");
      setVisibility(data.visibility || "public");
      setLocation(data.location || "");
      setTopics(data.topics || []);
      setMentions(data.mentions || []);
      setCoverIndex(data.coverIndex || 0);
      
      // 处理媒体文件
      if (data.media && data.media.length > 0) {
        const mediaData = data.media.map(media => ({
          url: media.url,
          type: media.type,
          name: media.filename || `media_${media._id}`,
          _id: media._id
        }));
        setMediaFiles(mediaData);
      }
      
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      toast.error("加载帖子详情失败");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadPostDetail();
  }, [loadPostDetail]);

  // 处理文件选择（编辑模式下）
  const handleFileSelect = useCallback((files) => {
    if (!isEditing) return;
    
    const newMediaFiles = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newMediaFiles.push({
          file,
          url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name,
          isNew: true // 标记为新上传的文件
        });
      }
    });
    
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  }, [isEditing]);

  // 移除媒体文件（编辑模式下）
  const removeMediaFile = useCallback((index) => {
    if (!isEditing) return;
    
    setMediaFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (index === coverIndex && newFiles.length > 0) {
        setCoverIndex(0);
      } else if (newFiles.length === 0) {
        setCoverIndex(0);
      }
      return newFiles;
    });
  }, [coverIndex, isEditing]);

  // 各种操作函数（与CreatePost类似，但增加编辑模式检查）
  const addTopic = useCallback(() => {
    if (!isEditing) return;
    
    const topicText = prompt("请输入话题名称:");
    if (topicText && topicText.trim() && !topics.includes(topicText.trim())) {
      setTopics(prev => [...prev, topicText.trim()]);
      setContent(prev => prev + ` #${topicText.trim()}`);
    }
  }, [topics, isEditing]);

  const removeTopic = useCallback((index) => {
    if (!isEditing) return;
    setTopics(prev => prev.filter((_, i) => i !== index));
  }, [isEditing]);

  const addMention = useCallback(() => {
    if (!isEditing) return;
    
    const username = prompt("请输入用户名:");
    if (username && username.trim() && !mentions.includes(username.trim())) {
      setMentions(prev => [...prev, username.trim()]);
      setContent(prev => prev + ` @${username.trim()}`);
    }
  }, [mentions, isEditing]);

  const removeMention = useCallback((index) => {
    if (!isEditing) return;
    setMentions(prev => prev.filter((_, i) => i !== index));
  }, [isEditing]);

  const addLocation = useCallback(() => {
    if (!isEditing) return;
    
    const locationName = prompt("请输入位置名称:");
    if (locationName && locationName.trim()) {
      setLocation(locationName.trim());
    }
  }, [isEditing]);

  const removeLocation = useCallback(() => {
    if (!isEditing) return;
    setLocation("");
  }, [isEditing]);

  const insertEmoji = useCallback((emoji) => {
    if (!isEditing || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
    setShowEmojiPicker(false);
  }, [content, isEditing]);

  // 更新帖子
  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error("请输入标题！");
      return;
    }
    
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("内容和媒体文件不能都为空！");
      return;
    }

    setIsUpdating(true);

    try {
      let uploadedMediaUrls = [];
      
      // 上传新添加的媒体文件
      const newMediaFiles = mediaFiles.filter(media => media.isNew);
      if (newMediaFiles.length > 0) {
        const formData = new FormData();
        for (const media of newMediaFiles) {
          const response = await fetch(media.url);
          const blob = await response.blob();
          const file = new File([blob], media.name, { 
            type: media.type === 'image' ? 'image/jpeg' : 'video/mp4' 
          });
          formData.append('media', file);
        }
        const uploadResponse = await postsApi.uploadMedia(formData);
        uploadedMediaUrls = uploadResponse.data.mediaFiles;
      }

      // 构建更新数据
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        visibility,
        location,
        topics,
        mentions,
        coverIndex,
        // 保留原有的媒体文件ID，添加新的媒体文件URL
        mediaUrls: [
          ...mediaFiles.filter(media => !media.isNew).map(media => media.url),
          ...uploadedMediaUrls
        ]
      };

      await postsApi.update(postId, updateData);
      
      toast.success("帖子更新成功！");
      
      // 回调通知父组件
      if (onUpdate) {
        onUpdate();
      }
      
      // 退出编辑模式
      setIsEditing(false);
      
    } catch (error) {
      console.error('更新帖子失败:', error);
      toast.error("更新失败，请稍后再试。");
    } finally {
      setIsUpdating(false);
    }
  };

  // 删除帖子
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '确认删除？',
      text: "删除后无法恢复此帖子！",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await postsApi.delete(postId);
        toast.success("帖子删除成功！");
        
        if (onClose) {
          onClose();
        }
        
        // 可选：刷新页面或通知父组件
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('删除帖子失败:', error);
        Swal.fire('错误!', '删除失败，请重试。', 'error');
      }
    }
  };

  // 进入编辑模式
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (mode === 'edit') {
      // 如果是直接从编辑模式进入的，关闭整个组件
      if (onClose) onClose();
    } else {
      // 如果是从查看模式进入编辑的，恢复原始数据
      loadPostDetail();
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error">帖子不存在或已被删除</div>
        </div>
      </div>
    );
  }

  const canUpdate = title.trim() && (content.trim() || mediaFiles.length > 0) && !isUpdating;

  return (
    <div className="modal-overlay detail-post-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEditing ? '编辑帖子' : '帖子详情'}
            {post.canEdit && !isEditing && <span style={{color: '#666', fontSize: '14px', marginLeft: '10px'}}>(可编辑)</span>}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 作者信息 */}
          <div className="post-author">
            <img src={post.authorId?.avatar || "https://cn.cravatar.com/wp-content/uploads/sites/9/2021/07/4.png"} alt={post.authorId?.name} className="author-avatar" />
            <div className="author-info">
              <div className="author-name">{post.authorId?.name}</div>
              <div className="post-time">
                {new Date(post.createdAt).toLocaleString()}
                {post.updatedAt !== post.createdAt && ` (已编辑)`}
              </div>
            </div>
          </div>

          {/* 标题 */}
          {isEditing ? (
            <h2 className="post-title">{title}</h2>
          ) : (
            <h2 className="post-title">{title}</h2>
          )}

          {/* 内容 */}
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="post-textarea"
              placeholder="分享你的想法、照片或视频..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <div className="post-content">
              {content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {/* 媒体预览 */}
          {mediaFiles.length > 0 && (
            <>
              <div className="media-preview-grid">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="media-preview-item">
                    {media.type === 'image' ? (
                      <img src={`http://localhost:8000${media.url}`} alt={`媒体 ${index + 1}`} />
                    ) : (
                      <video src={`http://localhost:8000${media.url}`} controls />
                    )}
                    {false && (
                      <button 
                        className="media-remove-btn"
                        onClick={() => removeMediaFile(index)}
                      >
                        ✕
                      </button>
                    )}
                    <div className="media-type-badge">
                      {media.type === 'image' ? '图片' : '视频'}
                    </div>
                  </div>
                ))}
              </div>

              {/* 封面选择（仅编辑模式） */}
              {false && mediaFiles.length > 1 && (
                <div className="cover-selection">
                  <h4>选择封面：</h4>
                  <div className="cover-options">
                    {mediaFiles.map((media, index) => (
                      <div 
                        key={index}
                        className={`cover-option ${coverIndex === index ? 'selected' : ''}`}
                        onClick={() => setCoverIndex(index)}
                      >
                        {media.type === 'image' ? (
                          <img src={`http://localhost:8000${media.url}`} alt={`封面 ${index + 1}`} />
                        ) : (
                          <video src={`http://localhost:8000${media.url}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 标注信息 */}
          {(location || topics.length > 0 || mentions.length > 0) && (
            <div className="annotation-section">
              {location && (
                <div className="annotation-item">
                  📍 {location}
                  {isEditing && (
                    <button className="annotation-remove" onClick={removeLocation}>
                      ✕
                    </button>
                  )}
                </div>
              )}
              {topics.map((topic, index) => (
                <div key={index} className="annotation-item">
                  # {topic}
                  {isEditing && (
                    <button className="annotation-remove" onClick={() => removeTopic(index)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {mentions.map((mention, index) => (
                <div key={index} className="annotation-item">
                  @ {mention}
                  {isEditing && (
                    <button className="annotation-remove" onClick={() => removeMention(index)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 可见性（仅编辑模式） */}
          {isEditing && (
            <select 
              className="visibility-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="public">公开</option>
              <option value="followers">仅粉丝</option>
              <option value="private">私密</option>
            </select>
          )}

          {/* 工具栏（仅编辑模式） */}
          {false && (
            <>
              <div className="post-toolbar">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button 
                  className="toolbar-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 添加图片/视频
                </button>
                <button 
                  className="toolbar-btn" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  😊 表情
                </button>
                <button className="toolbar-btn" onClick={addLocation}>
                  📍 位置
                </button>
                <button className="toolbar-btn" onClick={addTopic}>
                  # 话题
                </button>
                <button className="toolbar-btn" onClick={addMention}>
                  @ 好友
                </button>
              </div>

              {/* 表情选择器 */}
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji, index) => (
                    <span
                      key={index}
                      className="emoji-item"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <div>
            {/* 操作按钮 */}
            {post.canDelete && (
              <button 
                className="btn-draft" 
                onClick={handleDelete}
                style={{ backgroundColor: '#dc3545' }}
              >
                🗑️ 删除帖子
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isEditing ? (
              <>
                <button 
                  className="btn-cancel" 
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  取消
                </button>
                <button 
                  className="btn-submit" 
                  onClick={handleUpdate}
                  disabled={!canUpdate}
                >
                  {isUpdating ? '更新中...' : '更新'}
                </button>
              </>
            ) : (
              <>
                <button className="btn-cancel" onClick={onClose}>
                  关闭
                </button>
                {post.canEdit && (
                  <button className="btn-submit" onClick={handleEdit}>
                    编辑
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
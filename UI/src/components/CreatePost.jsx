import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { postsApi } from "../api/http";
import { useLanguage } from "../../context/LanguageContext";
import '../styles/CreatePost.css';

export default function CreatePost() {
  const { t } = useLanguage();
  // 状态管理
  const [title, setTitle] = useState(""); // 新增标题状态
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [visibility, setVisibility] = useState("public");
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  
  // 位置、话题、@用户的状态
  const [location, setLocation] = useState("");
  const [topics, setTopics] = useState([]);
  const [mentions, setMentions] = useState([]);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ["😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙"];

  // 检查是否有草稿
  useEffect(() => {
    const draft = localStorage.getItem('postDraft');
    setHasDraft(!!draft);
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((files) => {
    const newMediaFiles = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newMediaFiles.push({
          file,
          url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        });
      }
    });
    
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  }, []);

  // 移除媒体文件
  const removeMediaFile = useCallback((index) => {
    setMediaFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // 如果移除的是封面，重置封面索引
      if (index === coverIndex && newFiles.length > 0) {
        setCoverIndex(0);
      } else if (newFiles.length === 0) {
        setCoverIndex(0);
      }
      return newFiles;
    });
  }, [coverIndex]);

  // 添加话题
  const addTopic = useCallback(() => {
    const topicText = prompt(t('enterTopic'));
    if (topicText && topicText.trim() && !topics.includes(topicText.trim())) {
      setTopics(prev => [...prev, topicText.trim()]);
      // 在文本内容中自动添加话题标签
      setContent(prev => prev + ` #${topicText.trim()}`);
    }
  }, [topics, t]);

  // 移除话题
  const removeTopic = useCallback((index) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 添加@用户
  const addMention = useCallback(() => {
    const username = prompt(t('enterUsername'));
    if (username && username.trim() && !mentions.includes(username.trim())) {
      setMentions(prev => [...prev, username.trim()]);
      // 在文本内容中自动添加@用户
      setContent(prev => prev + ` @${username.trim()}`);
    }
  }, [mentions, t]);

  // 移除@用户
  const removeMention = useCallback((index) => {
    setMentions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 添加位置
  const addLocation = useCallback(() => {
    const locationName = prompt(t('enterLocation'));
    if (locationName && locationName.trim()) {
      setLocation(locationName.trim());
    }
  }, [t]);

  // 移除位置
  const removeLocation = useCallback(() => {
    setLocation("");
  }, []);

  // 插入表情
  const insertEmoji = useCallback((emoji) => {
    if (textareaRef.current) {
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
    }
    setShowEmojiPicker(false);
  }, [content]);

  // 处理发布
  const handlePost = async () => {
    // 验证标题和内容
    if (!title.trim()) {
      toast.error(t('enterTitle'));
      return;
    }
    
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error(t('enterContent'));
      return;
    }

    setIsPosting(true);

    try {
      // 1. 先上传媒体文件
      let uploadedMediaUrls = [];
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        
        // 将 blob URL 转换回 File 对象并上传
        for (const media of mediaFiles) {
          const response = await fetch(media.url);
          const blob = await response.blob();
          const file = new File([blob], media.name, { type: media.type === 'image' ? 'image/jpeg' : 'video/mp4' });
          formData.append('media', file);
        }
        
        const uploadResponse = await postsApi.uploadMedia(formData);
        uploadedMediaUrls = uploadResponse.data.mediaFiles;
      }

      // 2. 创建帖子
      const postData = {
        title: title.trim(), // 添加标题
        content: content.trim(),
        visibility,
        location,
        topics,
        mentions,
        coverIndex,
        mediaUrls: uploadedMediaUrls // 使用上传后的文件信息
      };

      const { data } = await postsApi.create(postData);
      
      console.log("发布成功:", data);
      toast.success(t('postSuccess'));
      
      // 清除草稿
      localStorage.removeItem('postDraft');
      setHasDraft(false);
      
      // 重置表单
      handleCloseModal();
      
      // 延迟后刷新页面以显示新帖子
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('发布出错:', error);
      toast.error(t('postFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  // 保存草稿
  const saveDraft = () => {
    const draftData = {
      title, // 保存标题
      content,
      location,
      topics,
      mentions,
      visibility,
      savedAt: new Date().toISOString()
    };
    
    // 保存到本地存储
    localStorage.setItem('postDraft', JSON.stringify(draftData));
    setHasDraft(true);
    toast.success(t('draftSaved'));
    
    // 关闭模态框
    handleCloseModal();
  };

  // 加载草稿
  const loadDraft = () => {
    const draft = localStorage.getItem('postDraft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        setTitle(draftData.title || ""); // 加载标题
        setContent(draftData.content || "");
        setLocation(draftData.location || "");
        setTopics(draftData.topics || []);
        setMentions(draftData.mentions || []);
        setVisibility(draftData.visibility || "public");
        
        toast.success(t('draftLoaded'));
      } catch (error) {
        console.error("加载草稿失败:", error);
        toast.error(t('draftLoadFailed'));
      }
    }
  };

  // 删除草稿
  const deleteDraft = () => {
    localStorage.removeItem('postDraft');
    setHasDraft(false);
    toast.success(t('draftDeleted'));
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowModal(false);
    setTitle(""); // 重置标题
    setContent("");
    setMediaFiles([]);
    setCoverIndex(0);
    setVisibility("public");
    setLocation("");
    setTopics([]);
    setMentions([]);
    setShowEmojiPicker(false);
    setIsPosting(false);
  };

  // 打开模态框时检查是否有草稿
  const handleOpenModal = () => {
    setShowModal(true);
    
    // 如果有草稿，询问是否加载
    if (hasDraft) {
      setTimeout(() => {
        const shouldLoadDraft = window.confirm(t('loadDraftConfirm'));
        if (shouldLoadDraft) {
          loadDraft();
        }
      }, 100);
    }
  };

  const canPost = title.trim() && (content.trim() || mediaFiles.length > 0) && !isPosting;
  const canSaveDraft = (title.trim() || content.trim() || mediaFiles.length > 0) && !isPosting;

  return (
    <>
      <button className="create-post-btn" onClick={handleOpenModal}>
        ✏️ {t('createPost')} {hasDraft && "📝"}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('postTitle')} {hasDraft && <span style={{color: '#ffc107', fontSize: '14px'}}>{t('hasDraft')}</span>}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* 标题输入框 */}
              <input
                type="text"
                className="post-title-input"
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />

              <textarea
                ref={textareaRef}
                className="post-textarea"
                placeholder={t('contentPlaceholder')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {/* 媒体预览 */}
              {mediaFiles.length > 0 && (
                <>
                  <div className="media-preview-grid">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="media-preview-item">
                        {media.type === 'image' ? (
                          <img src={media.url} alt={`预览 ${index + 1}`} />
                        ) : (
                          <video src={media.url} />
                        )}
                        <button 
                          className="media-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaFile(index);
                          }}
                        >
                          ✕
                        </button>
                        <div className="media-type-badge">
                          {media.type === 'image' ? t('image') : t('video')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 封面选择 */}
                  {mediaFiles.length > 1 && (
                    <div className="cover-selection">
                      <h4>{t('selectCover')}</h4>
                      <div className="cover-options">
                        {mediaFiles.map((media, index) => (
                          <div 
                            key={index}
                            className={`cover-option ${coverIndex === index ? 'selected' : ''}`}
                            onClick={() => setCoverIndex(index)}
                          >
                            {media.type === 'image' ? (
                              <img src={media.url} alt={`封面 ${index + 1}`} />
                            ) : (
                              <video src={media.url} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 位置、话题、@用户标注区域 */}
              {(location || topics.length > 0 || mentions.length > 0) && (
                <div className="annotation-section">
                  {location && (
                    <div className="annotation-item">
                      📍 {location}
                      <button 
                        className="annotation-remove"
                        onClick={removeLocation}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {topics.map((topic, index) => (
                    <div key={index} className="annotation-item">
                      # {topic}
                      <button 
                        className="annotation-remove"
                        onClick={() => removeTopic(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {mentions.map((mention, index) => (
                    <div key={index} className="annotation-item">
                      @ {mention}
                      <button 
                        className="annotation-remove"
                        onClick={() => removeMention(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 可见范围 */}
              <select 
                className="visibility-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">{t('public')}</option>
                <option value="followers">{t('followersOnly')}</option>
                <option value="private">{t('private')}</option>
              </select>

              {/* 工具栏 */}
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
                  📷 {t('imageVideo')}
                </button>
                <button 
                  className="toolbar-btn" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  😊 {t('emoji')}
                </button>
                <button 
                  className="toolbar-btn"
                  onClick={addLocation}
                >
                  📍 {t('location')}
                </button>
                <button 
                  className="toolbar-btn"
                  onClick={addTopic}
                >
                  # {t('topic')}
                </button>
                <button 
                  className="toolbar-btn"
                  onClick={addMention}
                >
                  @ {t('mention')}
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
            </div>

            <div className="modal-footer">
              <div>
                <button 
                  className="btn-draft" 
                  onClick={saveDraft}
                  disabled={!canSaveDraft}
                >
                  💾 {t('saveDraft')}
                </button>
                {hasDraft && (
                  <button 
                    className="btn-draft" 
                    onClick={deleteDraft}
                    style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}
                  >
                    🗑️ {t('deleteDraft')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-cancel" 
                  onClick={handleCloseModal} 
                  disabled={isPosting}
                >
                  {t('cancel')}
                </button>
                <button 
                  className="btn-submit" 
                  onClick={handlePost} 
                  disabled={!canPost}
                >
                  {isPosting ? t('publishing') : t('publish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
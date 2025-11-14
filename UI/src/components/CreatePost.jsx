import { useState, useRef } from "react";
import '../styles/CreatePost.css';

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef(null);

  const emojis = ["😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙"];

  const handlePost = async () => {
    if (!content.trim() && !imageFile) {
      alert("内容和图片不能都为空！");
      return;
    }

    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', content.trim());
    
    if (imageFile) {
      formData.append('image', imageFile); 
    }
    
    const apiEndpoint = '/api/posts/create'; 

    try {
      alert(content.trim());
      // const response = await fetch(apiEndpoint, {
      //   method: 'POST',
      //   body: formData,
      // });

      // if (response.ok) {
      //   alert("发帖成功！");
      //   setContent("");
      //   setImageFile(null);
      //   setImagePreviewUrl(null);
      //   setShowModal(false);
      //   setShowEmojiPicker(false);
      // } else {
      //   const errorData = await response.json();
      //   alert("发帖失败：" + (errorData.message || response.statusText || '服务器错误'));
      // }
      
    } catch (error) {
      console.error('上传出错:', error);
      alert("网络请求失败，请稍后再试。");
    } finally {
      setIsPosting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
    e.target.value = null;
  };

  const triggerFileInput = () => {
    document.getElementById('imageUploadInput').click();
  };

  const insertEmoji = (emoji) => {
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
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setContent("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setShowEmojiPicker(false);
    setIsPosting(false);
  };

  const canPost = (content.trim() || imageFile) && !isPosting;

  return (
    <>
      <button className="create-post-btn" onClick={() => setShowModal(true)}>
        ✏️ 发帖
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布新帖</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <textarea
                ref={textareaRef}
                className="post-textarea"
                placeholder="分享你的想法、照片或视频..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {imagePreviewUrl && (
                <div className="post-image-preview">
                  <img src={imagePreviewUrl} alt="预览" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}

              <div className="post-toolbar">
                <input
                  type="file"
                  id="imageUploadInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <button className="toolbar-btn" onClick={triggerFileInput}>
                  📷 图片
                </button>
                <button className="toolbar-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  😊 表情
                </button>
              </div>

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
              <button className="btn-cancel" onClick={handleCloseModal} disabled={isPosting}>取消</button>
              <button className="btn-submit" onClick={handlePost} disabled={!canPost}>
                {isPosting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
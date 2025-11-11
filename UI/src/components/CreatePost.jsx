import { useState } from "react";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handlePost = () => {
    if (content.trim()) {
      alert("发帖成功！内容：" + content);
      setContent("");
      setImage(null);
      setShowModal(false);
    }
  };

  const handleImageUpload = () => {
    setImage("📸");
  };

  return (
    <>
      <button className="create-post-btn" onClick={() => setShowModal(true)}>
        ✏️ 发帖
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布新帖</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <textarea
                className="post-textarea"
                placeholder="分享你的想法、照片或视频..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {image && <div className="post-image-preview">{image}</div>}

              <div className="post-toolbar">
                <button className="toolbar-btn" onClick={handleImageUpload}>
                  🖼️ 图片
                </button>
                <button className="toolbar-btn">
                  😊 表情
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-submit" onClick={handlePost}>发布</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

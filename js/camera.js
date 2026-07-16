/**
 * ============================================================
 * CAMERA MODULE — 真实摄像头调用
 * V1.9 新增
 * 
 * 功能：
 *   - 调取设备摄像头实时预览
 *   - 拍照捕获 (base64 image)
 *   - 前后摄像头切换
 *   - 权限拒绝时的备选（文件上传）
 *   - 完整的模态弹窗 UI
 * 
 * 用法：
 *   Camera.open({ onCapture: (base64) => { ... } });
 * ============================================================
 */

// ============================================================
// Inject Camera CSS (once, on load)
// ============================================================
(function injectStyles() {
  if (document.getElementById('camera-module-styles')) return;
  var style = document.createElement('style');
  style.id = 'camera-module-styles';
  style.textContent = `
/* ===== Camera Overlay ===== */
.camera-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.75);
  z-index: 99999;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.camera-overlay.show { opacity: 1; }

.cam-modal {
  background: #1a1a2e;
  border-radius: 16px;
  width: 92vw;
  max-width: 520px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.cam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #16213e;
  flex-shrink: 0;
}
.cam-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e8e8;
}
.cam-close {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.cam-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

.cam-body {
  flex: 1;
  position: relative;
  min-height: 320px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* State: loading */
.cam-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.cam-state-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #5b86e5;
  border-radius: 50%;
  animation: cam-spin 0.8s linear infinite;
}
@keyframes cam-spin { to { transform: rotate(360deg); } }
.cam-state-text {
  font-size: 13px;
  color: #aaa;
}

/* State: error */
.cam-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}
.cam-error-icon { font-size: 40px; margin-bottom: 12px; }
.cam-error-msg {
  font-size: 13px;
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 16px;
  max-width: 300px;
}
.cam-error-actions { display: flex; gap: 8px; }
.cam-retry-btn, .cam-upload-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.cam-retry-btn:hover, .cam-upload-btn:hover {
  background: rgba(255,255,255,0.16);
  border-color: rgba(255,255,255,0.4);
}

/* State: live view */
.cam-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 320px;
}
.cam-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.cam-hint-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 8px 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #ccc;
  font-size: 11px;
  text-align: center;
}

/* Countdown flash */
.cam-countdown {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.cam-flash {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.85);
  animation: cam-flash 0.35s ease-out forwards;
}
@keyframes cam-flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* State: preview */
.cam-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #111;
  min-height: 320px;
  max-height: 60vh;
  overflow: hidden;
}
.cam-preview-img {
  max-width: 100%;
  max-height: calc(100% - 32px);
  object-fit: contain;
  border-radius: 4px;
}
.cam-preview-label {
  padding: 8px 16px;
  font-size: 11px;
  color: #888;
  text-align: center;
  flex-shrink: 0;
}

/* Footer */
.cam-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #16213e;
  gap: 10px;
  flex-shrink: 0;
}
.cam-flip-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.cam-flip-btn:hover { background: rgba(255,255,255,0.15); }
.cam-capture-btn {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}
.cam-capture-btn:hover { transform: scale(1.08); }
.cam-capture-btn:active { transform: scale(0.95); }
.cam-capture-icon {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: #fff;
}

.cam-retake-btn, .cam-confirm-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.cam-retake-btn {
  background: rgba(255,255,255,0.1);
  color: #ccc;
}
.cam-retake-btn:hover { background: rgba(255,255,255,0.2); }
.cam-confirm-btn {
  background: #3370FF;
  color: #fff;
}
.cam-confirm-btn:hover { background: #2563EB; }

.cam-footer-right {
  position: absolute;
  right: 16px;
}
.cam-file-input { display: none; }

.cam-canvas { display: none; }
`;
  document.head.appendChild(style);
})();

const Camera = (function() {
  'use strict';

  let stream = null;
  let facingMode = 'environment'; // 'environment' (后置) | 'user' (前置)
  let videoEl = null;
  let overlayEl = null;
  let onCaptureCallback = null;
  let onCancelCallback = null;
  let isOpen = false;

  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * 打开摄像头
   * @param {Object} options
   *   - onCapture(base64Image): 拍照后回调
   *   - onCancel(): 取消回调
   *   - title: 弹窗标题 (默认 "拍照采集")
   *   - hint: 提示文字
   *   - accept: 接受的图片格式 (默认 "image/*")
   */
  function open(options) {
    options = options || {};
    onCaptureCallback = options.onCapture || null;
    onCancelCallback = options.onCancel || null;
    const title = options.title || '拍照采集';
    const hint = options.hint || '请将单据平铺，确保文字清晰可见';
    const accept = options.accept || 'image/*';

    if (isOpen) close();

    // 创建模态弹窗
    overlayEl = document.createElement('div');
    overlayEl.className = 'camera-overlay';
    overlayEl.id = 'cameraOverlay';
    overlayEl.innerHTML = buildOverlayHTML(title, hint, accept);

    document.body.appendChild(overlayEl);

    // 绑定事件
    const closeBtn = overlayEl.querySelector('.cam-close');
    const captureBtn = overlayEl.querySelector('.cam-capture-btn');
    const flipBtn = overlayEl.querySelector('.cam-flip-btn');
    const fileInput = overlayEl.querySelector('.cam-file-input');
    const uploadBtn = overlayEl.querySelector('.cam-upload-btn');
    videoEl = overlayEl.querySelector('.cam-video');
    const canvas = overlayEl.querySelector('.cam-canvas');
    const countdownEl = overlayEl.querySelector('.cam-countdown');

    closeBtn.addEventListener('click', cancel);
    captureBtn.addEventListener('click', function() { capture(canvas, overlayEl); });
    flipBtn.addEventListener('click', flipCamera);
    fileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', function() { fileInput.click(); });

    // 点击遮罩关闭（点击内容区不关闭）
    overlayEl.addEventListener('click', function(e) {
      if (e.target === overlayEl) cancel();
    });

    // 键盘 ESC 关闭
    const escHandler = function(e) {
      if (e.key === 'Escape') { cancel(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
    overlayEl._escHandler = escHandler;

    // 启动摄像头
    overlayEl.style.display = 'flex';
    requestAnimationFrame(function() { overlayEl.classList.add('show'); });
    isOpen = true;
    startCamera();
  }

  /**
   * 关闭摄像头
   */
  function close() {
    stopMediaStream();
    if (overlayEl) {
      if (overlayEl._escHandler) {
        document.removeEventListener('keydown', overlayEl._escHandler);
      }
      overlayEl.classList.remove('show');
      setTimeout(function() {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        videoEl = null;
      }, 300);
    }
    isOpen = false;
  }

  /**
   * 是否正在运行
   */
  function isActive() {
    return isOpen;
  }

  // ============================================================
  // PRIVATE: Camera Operations
  // ============================================================

  function startCamera() {
    if (!overlayEl) return;

    const stateEl = overlayEl.querySelector('.cam-state');
    const viewEl = overlayEl.querySelector('.cam-view');
    const errorEl = overlayEl.querySelector('.cam-error');

    // Reset UI
    stateEl.style.display = 'flex';
    viewEl.style.display = 'none';
    errorEl.style.display = 'none';

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError('当前浏览器不支持摄像头调用');
      return;
    }

    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(s) {
        stream = s;
        if (!videoEl) return;
        videoEl.srcObject = s;
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('autoplay', '');
        videoEl.play();

        stateEl.style.display = 'none';
        viewEl.style.display = 'block';
        errorEl.style.display = 'none';
      })
      .catch(function(err) {
        console.error('[Camera] getUserMedia error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showCameraError('摄像头权限被拒绝，请允许浏览器使用摄像头后重试');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          showCameraError('未检测到摄像头设备');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          showCameraError('摄像头被其他应用占用');
        } else {
          showCameraError('摄像头启动失败: ' + err.message);
        }
      });
  }

  function flipCamera() {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    stopMediaStream();
    startCamera();
  }

  function stopMediaStream() {
    if (stream) {
      stream.getTracks().forEach(function(t) { t.stop(); });
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  function capture(canvas, overlay) {
    if (!videoEl || !stream) return;

    // Show countdown animation
    const countdownEl = overlay.querySelector('.cam-countdown');
    countdownEl.style.display = 'flex';

    // Brief delay for UI feedback, then capture
    setTimeout(function() {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      if (!vw || !vh) {
        countdownEl.style.display = 'none';
        if (typeof showToast === 'function') showToast('⚠️ 视频流未就绪，请稍后重试');
        return;
      }

      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, vw, vh);

      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      countdownEl.style.display = 'none';

      // Show captured preview
      showCapturePreview(overlay, imageData);
    }, 300);
  }

  function showCapturePreview(overlay, imageData) {
    // Stop live stream
    stopMediaStream();

    const viewEl = overlay.querySelector('.cam-view');
    const previewEl = overlay.querySelector('.cam-preview');
    const previewImg = overlay.querySelector('.cam-preview-img');
    const captureBtn = overlay.querySelector('.cam-capture-btn');
    const flipBtn = overlay.querySelector('.cam-flip-btn');
    const retakeBtn = overlay.querySelector('.cam-retake-btn');
    const confirmBtn = overlay.querySelector('.cam-confirm-btn');

    viewEl.style.display = 'none';
    previewEl.style.display = 'flex';
    previewImg.src = imageData;
    captureBtn.style.display = 'none';
    flipBtn.style.display = 'none';
    retakeBtn.style.display = 'flex';
    confirmBtn.style.display = 'flex';

    retakeBtn.onclick = function() {
      previewEl.style.display = 'none';
      viewEl.style.display = 'block';
      captureBtn.style.display = 'flex';
      flipBtn.style.display = 'flex';
      retakeBtn.style.display = 'none';
      confirmBtn.style.display = 'none';
      startCamera();
    };

    confirmBtn.onclick = function() {
      if (onCaptureCallback) {
        onCaptureCallback(imageData);
      }
      close();
    };
  }

  function cancel() {
    close();
    if (onCancelCallback) onCancelCallback();
  }

  // ============================================================
  // PRIVATE: File Upload Fallback
  // ============================================================

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
      const dataUrl = ev.target.result;
      // Show in preview then let user confirm
      if (!overlayEl) return;
      stopMediaStream();

      const viewEl = overlayEl.querySelector('.cam-view');
      const stateEl = overlayEl.querySelector('.cam-state');
      const previewEl = overlayEl.querySelector('.cam-preview');
      const previewImg = overlayEl.querySelector('.cam-preview-img');
      const captureBtn = overlayEl.querySelector('.cam-capture-btn');
      const flipBtn = overlayEl.querySelector('.cam-flip-btn');
      const retakeBtn = overlayEl.querySelector('.cam-retake-btn');
      const confirmBtn = overlayEl.querySelector('.cam-confirm-btn');

      stateEl.style.display = 'none';
      viewEl.style.display = 'none';
      previewEl.style.display = 'flex';
      previewImg.src = dataUrl;
      captureBtn.style.display = 'none';
      flipBtn.style.display = 'none';
      retakeBtn.style.display = 'flex';
      confirmBtn.style.display = 'flex';

      retakeBtn.onclick = function() {
        previewEl.style.display = 'none';
        viewEl.style.display = 'block';
        captureBtn.style.display = 'flex';
        flipBtn.style.display = 'flex';
        retakeBtn.style.display = 'none';
        confirmBtn.style.display = 'none';
        startCamera();
      };

      confirmBtn.onclick = function() {
        if (onCaptureCallback) onCaptureCallback(dataUrl);
        close();
      };

      // Reset file input so same file can be re-selected
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  // ============================================================
  // PRIVATE: Error Display
  // ============================================================

  function showCameraError(msg) {
    if (!overlayEl) return;

    const stateEl = overlayEl.querySelector('.cam-state');
    const errorEl = overlayEl.querySelector('.cam-error');
    const errorMsg = overlayEl.querySelector('.cam-error-msg');
    const viewEl = overlayEl.querySelector('.cam-view');

    stateEl.style.display = 'none';
    viewEl.style.display = 'none';
    errorEl.style.display = 'flex';
    errorMsg.textContent = msg;

    // Re-attach retry button
    const retryBtn = overlayEl.querySelector('.cam-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = function() {
        errorEl.style.display = 'none';
        startCamera();
      };
    }
  }

  // ============================================================
  // PRIVATE: HTML Template
  // ============================================================

  function buildOverlayHTML(title, hint, accept) {
    return `
<div class="cam-modal">
  <div class="cam-header">
    <span class="cam-title">${title}</span>
    <button class="cam-close" title="关闭 (ESC)">✕</button>
  </div>

  <div class="cam-body">
    <!-- 启动中 -->
    <div class="cam-state">
      <div class="cam-state-spinner"></div>
      <div class="cam-state-text">正在启动摄像头…</div>
    </div>

    <!-- 错误提示 -->
    <div class="cam-error" style="display:none;">
      <div class="cam-error-icon">⚠️</div>
      <div class="cam-error-msg"></div>
      <div class="cam-error-actions">
        <button class="cam-retry-btn">🔄 重试</button>
        <button class="cam-upload-btn" style="margin-left:8px;">📁 从相册选择</button>
      </div>
    </div>

    <!-- 实时预览 -->
    <div class="cam-view" style="display:none;">
      <video class="cam-video" autoplay playsinline muted></video>
      <div class="cam-countdown" style="display:none;">
        <div class="cam-flash"></div>
      </div>
      <div class="cam-hint-bar">${hint}</div>
    </div>

    <!-- 拍照预览 -->
    <div class="cam-preview" style="display:none;">
      <img class="cam-preview-img" src="" alt="拍摄结果">
      <div class="cam-preview-label">📷 拍照结果 — 请确认是否清晰可用</div>
    </div>

    <!-- 隐藏 canvas -->
    <canvas class="cam-canvas" style="display:none;"></canvas>
  </div>

  <div class="cam-footer">
    <button class="cam-flip-btn" title="切换前后摄像头">🔄</button>
    <button class="cam-capture-btn">
      <span class="cam-capture-icon"></span>
    </button>
    <button class="cam-retake-btn" style="display:none;">↩ 重新拍照</button>
    <button class="cam-confirm-btn" style="display:none;">✅ 确认使用</button>
    <div class="cam-footer-right">
      <button class="cam-upload-btn" title="从相册选择">📁 相册</button>
    </div>
    <input type="file" class="cam-file-input" accept="${accept}" style="display:none;">
  </div>
</div>`;
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    open: open,
    close: close,
    isActive: isActive
  };
})();

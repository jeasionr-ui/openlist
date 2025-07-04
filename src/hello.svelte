<!--
 AList 文件浏览器组件
 Author: OpenList Plugin
 Description: 在思源笔记侧边栏中显示 AList 文件管理器
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
export let plugin;

    let isLoading = false;
    let isLoggedIn = false;
    let currentPath = "/";
    let files = [];
    let error = "";
    let token = "";
    let showUpload = false;
    let uploadFiles = [];
    let uploadMode = "stream";
    let addAsTask = false;
    let overwriteExisting = false;
    let tryInstantUpload = true;
    let isUploading = false;
    let uploadProgress = 0;

    // 预览相关变量
    let showPreview = false;
    let previewContent = "";
    let previewFile = null;
    let isLoadingPreview = false;

    onMount(async () => {
        await initializeAList();
        setupFolderInput();
    });

    onDestroy(() => {
        console.log("AList file browser closed");
    });

    /**
     * 初始化 AList 连接
     */
    async function initializeAList() {
        const autoLogin = plugin.settingUtils.get("autoLogin");
        if (autoLogin) {
            await loginAndLoadFiles();
        }
    }

    /**
     * 登录并加载文件列表
     */
    async function loginAndLoadFiles() {
        const serverUrl = plugin.settingUtils.get("serverUrl");
        const username = plugin.settingUtils.get("username");
        const password = plugin.settingUtils.get("password");
        const rootPath = plugin.settingUtils.get("rootPath") || "/";

        if (!serverUrl || !username || !password) {
            error = "请先在设置中配置 AList 服务器信息";
            return;
        }

        isLoading = true;
        error = "";

        try {
            const loginResponse = await plugin.loginToAList(serverUrl, username, password);
            token = loginResponse.token;
            isLoggedIn = true;
            currentPath = rootPath;
            await loadFiles(currentPath);
        } catch (err) {
            console.error("Login failed:", err);
            error = `登录失败: ${err.message || '未知错误'}`;
            isLoggedIn = false;
        } finally {
            isLoading = false;
        }
    }

    /**
     * 加载指定路径的文件列表
     */
    async function loadFiles(path) {
        if (!isLoggedIn || !token) {
            error = "请先登录";
            return;
        }

        isLoading = true;
        error = "";

        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            const response = await fetch(`${serverUrl}/api/fs/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    path: path,
                    password: "",
                    page: 1,
                    per_page: 0,
                    refresh: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.code !== 200) {
                throw new Error(data.message || '获取文件列表失败');
            }

            files = data.data.content || [];
            currentPath = path;
        } catch (err) {
            console.error("Load files failed:", err);
            error = `加载文件失败: ${err.message || '未知错误'}`;
            if (err.message.includes('401') || err.message.includes('403')) {
                isLoggedIn = false;
                token = "";
            }
        } finally {
            isLoading = false;
        }
    }

    /**
     * 进入文件夹
     */
    async function enterFolder(folderName) {
        const newPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;
        await loadFiles(newPath);
    }

    /**
     * 返回上级目录
     */
    async function goBack() {
        if (currentPath === "/") return;
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
        await loadFiles(parentPath);
    }

    /**
     * 格式化文件大小
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化日期
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * 获取文件图标
     */
    function getFileIcon(file) {
        if (file.is_dir) {
            return "📁";
        }
        const ext = file.name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'txt': case 'md': case 'doc': case 'docx':
                return "📄";
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp':
                return "🖼️";
            case 'mp4': case 'avi': case 'mov': case 'wmv':
                return "🎬";
            case 'mp3': case 'wav': case 'flac': case 'aac':
                return "🎵";
            case 'zip': case 'rar': case '7z': case 'tar':
                return "📦";
            case 'pdf':
                return "📕";
            default:
                return "📄";
        }
    }

    /**
     * 显示上传对话框
     */
    function showUploadDialog() {
        showUpload = true;
        uploadFiles = [];
        uploadProgress = 0;
    }

    /**
     * 关闭上传对话框
     */
    function closeUploadDialog() {
        showUpload = false;
        uploadFiles = [];
        isUploading = false;
        uploadProgress = 0;
    }

    /**
     * 处理文件选择
     */
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        uploadFiles = [...uploadFiles, ...files];
    }

    /**
     * 处理文件夹选择
     */
    function handleFolderSelect(event) {
        const files = Array.from(event.target.files);
        uploadFiles = [...uploadFiles, ...files];
    }

    /**
     * 设置文件夹输入的属性
     */
    function setupFolderInput() {
        const folderInput = document.getElementById('folder-input');
        if (folderInput) {
            folderInput.setAttribute('webkitdirectory', '');
        }
    }

    /**
     * 移除选中的文件
     */
    function removeFile(index) {
        uploadFiles = uploadFiles.filter((_, i) => i !== index);
    }

    /**
     * 执行文件上传
     */
    async function uploadFilesToAList() {
        if (uploadFiles.length === 0) {
            error = "请选择要上传的文件";
            return;
        }

        isUploading = true;
        error = "";
        uploadProgress = 0;

        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            
            for (let i = 0; i < uploadFiles.length; i++) {
                const file = uploadFiles[i];
                const formData = new FormData();
                
                // 构建文件路径
                const filePath = file.webkitRelativePath || file.name;
                const fullPath = currentPath === "/" ? `/${filePath}` : `${currentPath}/${filePath}`;
                
                formData.append('file', file);
                formData.append('path', currentPath);
                formData.append('as_task', addAsTask.toString());
                
                const response = await fetch(`${serverUrl}/api/fs/put`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': token,
                        'File-Path': encodeURIComponent(fullPath),
                        'As-Task': addAsTask.toString(),
                        'Content-Length': file.size.toString()
                    },
                    body: file
                });

                if (!response.ok) {
                    throw new Error(`上传失败: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                if (result.code !== 200) {
                    throw new Error(result.message || '上传失败');
                }

                uploadProgress = Math.round(((i + 1) / uploadFiles.length) * 100);
            }

            // 上传完成后刷新文件列表
            await loadFiles(currentPath);
            closeUploadDialog();
            
        } catch (err) {
            console.error("Upload failed:", err);
            error = `上传失败: ${err.message || '未知错误'}`;
        } finally {
            isUploading = false;
        }
    }

    /**
     * 显示文件预览对话框
     */
    async function showFilePreview(file) {
        previewFile = file;
        showPreview = true;
        isLoadingPreview = true;
        previewContent = "";
        
        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            const filePath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
            
            // 首先尝试获取文件的直接下载链接
            const response = await fetch(`${serverUrl}/api/fs/get`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    path: filePath
                })
            });
            
            if (!response.ok) {
                throw new Error(`获取文件信息失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '获取文件信息失败');
            }
            
            const fileInfo = result.data;
            
            // 根据文件类型生成预览内容
            if (file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                // 图片预览
                const imageUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <img class="hope-image" src="${imageUrl}" alt="${file.name}" style="max-width: 100%; height: auto;" />
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
                // 视频预览
                const videoUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <video controls style="max-width: 100%; height: auto;">
                                <source src="${videoUrl}" type="video/mp4">
                                您的浏览器不支持视频播放。
                            </video>
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
                // 音频预览
                const audioUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <audio controls style="width: 100%;">
                                <source src="${audioUrl}" type="audio/mpeg">
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(txt|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i)) {
                // 文本文件预览
                try {
                    const textUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
                    const textResponse = await fetch(textUrl, {
                        headers: {
                            'Authorization': token
                        }
                    });
                    const textContent = await textResponse.text();
                    previewContent = `
                        <div class="obj-box hope-stack">
                            <div class="hope-stack">
                                <pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; padding: 16px; background: var(--b3-theme-surface); border-radius: 4px;">${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                            </div>
                        </div>
                    `;
                } catch (textErr) {
                    throw new Error('无法加载文本内容');
                }
            } else {
                // 不支持的文件类型
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack" style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                            <h3>${file.name}</h3>
                            <p>此文件类型暂不支持预览</p>
                            <p>文件大小: ${formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
            }
            
        } catch (err) {
            console.error("Preview failed:", err);
            previewContent = `<div class="preview-error">预览失败: ${err.message}</div>`;
        } finally {
            isLoadingPreview = false;
        }
    }

    /**
     * 关闭预览对话框
     */
    function closePreview() {
        showPreview = false;
        previewContent = "";
        previewFile = null;
        isLoadingPreview = false;
    }
</script>

<div class="alist-browser">
    <!-- 头部工具栏 -->
    <div class="alist-header">
        <div class="alist-path">
            <button class="b3-button b3-button--small" on:click={goBack} disabled={currentPath === "/" || isLoading}>
                ⬅️ 返回
            </button>
            <span class="alist-current-path">{currentPath}</span>
        </div>
        <div class="alist-actions">
            {#if !isLoggedIn}
                <button class="b3-button b3-button--small" on:click={loginAndLoadFiles} disabled={isLoading}>
                    🔑 登录
                </button>
            {:else}
                <button class="b3-button b3-button--small" on:click={() => loadFiles(currentPath)} disabled={isLoading}>
                    🔄 刷新
                </button>
                <button class="b3-button b3-button--small" on:click={showUploadDialog} disabled={isLoading}>
                    📤 上传
                </button>
            {/if}
        </div>
    </div>

    <!-- 内容区域 -->
    <div class="alist-content">
        {#if isLoading}
            <div class="alist-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            </div>
        {:else if error}
            <div class="alist-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">{error}</div>
                <button class="b3-button b3-button--small" on:click={loginAndLoadFiles}>
                    重试
                </button>
            </div>
        {:else if !isLoggedIn}
            <div class="alist-welcome">
                <div class="welcome-icon">📁</div>
                <h3>AList 文件浏览器</h3>
                <p>请先在设置中配置 AList 服务器信息，然后点击登录按钮。</p>
                <button class="b3-button" on:click={loginAndLoadFiles}>
                    🔑 立即登录
                </button>
            </div>
        {:else if files.length === 0}
            <div class="alist-empty">
                <div class="empty-icon">📂</div>
                <p>此目录为空</p>
            </div>
        {:else}
            <div class="alist-file-list">
                {#each files as file}
                    <div class="alist-file-item" class:is-directory={file.is_dir}>
                        <div class="file-icon">{getFileIcon(file)}</div>
                        <div class="file-info">
                            <div class="file-name" 
                                 on:click={() => file.is_dir ? enterFolder(file.name) : null}
                                 class:clickable={file.is_dir}>
                                {file.name}
                            </div>
                            <div class="file-meta">
                                {#if !file.is_dir}
                                    <span class="file-size">{formatFileSize(file.size)}</span>
                                {/if}
                                <span class="file-date">{formatDate(file.modified)}</span>
                            </div>
                        </div>
                        {#if !file.is_dir}
                            <div class="file-actions">
                                <button 
                                    class="b3-button b3-button--small preview-btn" 
                                    on:click={() => showFilePreview(file)}
                                    title="预览文件"
                                >
                                    👁️ 预览
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- 上传对话框 -->
    {#if showUpload}
        <div class="upload-overlay" on:click={closeUploadDialog}>
            <div class="upload-dialog" on:click|stopPropagation>
                <div class="upload-header">
                    <h3>📤 上传文件到 {currentPath}</h3>
                    <button class="close-btn" on:click={closeUploadDialog}>✕</button>
                </div>
                
                <div class="upload-body">
                    <!-- 文件选择区域 -->
                    <div class="upload-drop-zone">
                        <input 
                            type="file" 
                            multiple 
                            id="file-input" 
                            style="display: none;" 
                            on:change={handleFileSelect}
                        />
                        <input 
                            type="file" 
                            multiple 
                            id="folder-input" 
                            style="display: none;" 
                            on:change={handleFolderSelect}
                        />
                        
                        <h4>拖动文件到此处以上传，或点击：</h4>
                        
                        <!-- 文件选择按钮 -->
                        <div class="upload-buttons">
                            <button 
                                class="upload-btn folder-btn" 
                                on:click={() => document.getElementById('folder-input').click()}
                                title="选择文件夹"
                            >
                                📁
                            </button>
                            <button 
                                class="upload-btn file-btn" 
                                on:click={() => document.getElementById('file-input').click()}
                                title="选择文件"
                            >
                                📄
                            </button>
                        </div>
                        
                        <!-- 上传配置行 -->
                        <div class="upload-config-row">
                            <!-- 上传模式选择 -->
                            <div class="upload-mode">
                                <label for="upload-mode-select">模式:</label>
                                <select id="upload-mode-select" bind:value={uploadMode} class="b3-select">
                                    <option value="stream">Stream</option>
                                    <option value="form">Form</option>
                                </select>
                            </div>
                            
                            <!-- 上传选项 -->
                            <div class="upload-options">
                                <label class="upload-checkbox">
                                    <input type="checkbox" bind:checked={addAsTask} />
                                    <span>添加为任务</span>
                                </label>
                                <label class="upload-checkbox">
                                    <input type="checkbox" bind:checked={overwriteExisting} />
                                    <span>覆盖现有文件</span>
                                </label>
                                <label class="upload-checkbox">
                                    <input type="checkbox" bind:checked={tryInstantUpload} />
                                    <span>尝试秒传</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 选中的文件列表 -->
                    {#if uploadFiles.length > 0}
                        <div class="selected-files">
                            <h4>选中的文件 ({uploadFiles.length}):</h4>
                            <div class="file-list">
                                {#each uploadFiles as file, index}
                                    <div class="selected-file">
                                        <span class="file-name">{file.webkitRelativePath || file.name}</span>
                                        <span class="file-size">({formatFileSize(file.size)})</span>
                                        <button class="remove-btn" on:click={() => removeFile(index)}>✕</button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- 上传进度 -->
                    {#if isUploading}
                        <div class="upload-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {uploadProgress}%"></div>
                            </div>
                            <span class="progress-text">{uploadProgress}%</span>
                        </div>
                    {/if}
                    
                    <!-- 错误信息 -->
                    {#if error}
                        <div class="upload-error">{error}</div>
                    {/if}
                </div>
                
                <div class="upload-footer">
                    <button class="b3-button" on:click={closeUploadDialog} disabled={isUploading}>
                        取消
                    </button>
                    <button 
                        class="b3-button b3-button--primary" 
                        on:click={uploadFilesToAList} 
                        disabled={uploadFiles.length === 0 || isUploading}
                    >
                        {#if isUploading}
                            上传中...
                        {:else}
                            开始上传
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- 预览对话框 -->
    {#if showPreview}
        <div class="preview-overlay" on:click={closePreview}>
            <div class="preview-dialog" on:click|stopPropagation>
                <div class="preview-header">
                    <h3>👁️ 预览: {previewFile?.name}</h3>
                    <button class="close-btn" on:click={closePreview}>✕</button>
                </div>
                
                <div class="preview-body">
                    {#if isLoadingPreview}
                        <div class="preview-loading">
                            <div class="loading-spinner"></div>
                            <span>加载预览中...</span>
                        </div>
                    {:else}
                        <div class="preview-content">
                            {@html previewContent}
                        </div>
                    {/if}
                </div>
                
                <div class="preview-footer">
                    <button class="b3-button" on:click={closePreview}>
                        关闭
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .alist-browser {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--b3-theme-background);
    }

    .alist-header {
        padding: 8px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--b3-theme-surface);
    }

    .alist-path {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .alist-current-path {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        background: var(--b3-theme-surface-lighter);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: var(--b3-font-family-code);
    }

    .alist-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
    }

    .alist-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        gap: 12px;
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--b3-theme-surface-lighter);
        border-top: 2px solid var(--b3-theme-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .alist-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        gap: 12px;
        text-align: center;
    }

    .error-icon {
        font-size: 32px;
    }

    .error-message {
        color: var(--b3-theme-error);
        font-size: 14px;
    }

    .alist-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        gap: 16px;
        text-align: center;
    }

    .welcome-icon {
        font-size: 48px;
    }

    .alist-welcome h3 {
        margin: 0;
        color: var(--b3-theme-on-surface);
    }

    .alist-welcome p {
        margin: 0;
        color: var(--b3-theme-on-surface-light);
        font-size: 14px;
    }

    .alist-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        gap: 12px;
    }

    .empty-icon {
        font-size: 32px;
    }

    .alist-file-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .alist-file-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
            background: var(--b3-theme-surface-lighter);
            
            .file-actions {
                opacity: 1;
            }
        }

        &.is-directory {
            .file-name {
                color: var(--b3-theme-primary);
            }
        }
    }

    .file-actions {
        margin-left: auto;
        opacity: 0;
        transition: opacity 0.2s;
        
        .preview-btn {
            font-size: 12px;
            padding: 2px 6px;
        }
    }

    .file-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
    }

    .file-info {
        flex: 1;
        min-width: 0;
    }

    .file-name {
        font-size: 14px;
        color: var(--b3-theme-on-surface);
        word-break: break-all;
        line-height: 1.3;

        &.clickable {
            cursor: pointer;
            color: var(--b3-theme-primary);

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .file-meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: var(--b3-theme-on-surface-light);
        margin-top: 2px;
    }

    .file-size {
        font-family: var(--b3-font-family-code);
    }

    .file-date {
        font-family: var(--b3-font-family-code);
    }

    /* 上传对话框样式 */
    .upload-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .upload-dialog {
        background: var(--b3-theme-background);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .upload-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--b3-theme-surface);
    }

    .upload-header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--b3-theme-on-surface);
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--b3-theme-on-surface-light);
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
            background: var(--b3-theme-surface-lighter);
        }
    }

    .upload-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }

    .upload-drop-zone {
        border: 2px dashed var(--b3-theme-surface-lighter);
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        margin-bottom: 16px;
        transition: border-color 0.2s;

        &:hover {
            border-color: var(--b3-theme-primary);
        }
    }

    .upload-drop-zone h4 {
        margin: 0 0 16px 0;
        color: var(--b3-theme-on-surface);
        font-size: 14px;
    }

    .upload-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 16px;
    }

    .upload-btn {
        width: 60px;
        height: 60px;
        border: 2px solid var(--b3-theme-surface-lighter);
        border-radius: 8px;
        background: var(--b3-theme-surface);
        cursor: pointer;
        font-size: 24px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            border-color: var(--b3-theme-primary);
            background: var(--b3-theme-primary-lighter);
        }
    }

    .upload-config-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px;
        background: var(--b3-theme-surface);
        border-radius: 6px;
    }

    .upload-mode {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--b3-theme-on-surface);
        
        label {
            margin: 0;
            font-weight: 500;
        }
        
        .b3-select {
            min-width: 80px;
        }
    }

    .upload-options {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
    }

    .upload-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--b3-theme-on-surface);
        cursor: pointer;

        input[type="checkbox"] {
            margin: 0;
        }
    }

    .selected-files {
        margin-top: 16px;
        padding: 16px;
        background: var(--b3-theme-surface);
        border-radius: 6px;
    }

    .selected-files h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: var(--b3-theme-on-surface);
    }

    .file-list {
        max-height: 200px;
        overflow-y: auto;
    }

    .selected-file {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 4px;
        background: var(--b3-theme-background);
    }

    .selected-file .file-name {
        flex: 1;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
        word-break: break-all;
    }

    .selected-file .file-size {
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
        font-family: var(--b3-font-family-code);
    }

    .remove-btn {
        background: none;
        border: none;
        color: var(--b3-theme-error);
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        transition: background-color 0.2s;

        &:hover {
            background: var(--b3-theme-error-lighter);
        }
    }

    .upload-progress {
        margin-top: 16px;
        padding: 12px;
        background: var(--b3-theme-surface);
        border-radius: 6px;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--b3-theme-surface-lighter);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .progress-fill {
        height: 100%;
        background: var(--b3-theme-primary);
        transition: width 0.3s ease;
    }

    .progress-text {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        text-align: center;
        display: block;
    }

    .upload-error {
        margin-top: 12px;
        padding: 12px;
        background: var(--b3-theme-error-lighter);
        color: var(--b3-theme-error);
        border-radius: 6px;
        font-size: 14px;
        text-align: center;
    }

    .upload-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--b3-theme-surface-lighter);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: var(--b3-theme-surface);
    }

    // 预览对话框样式
    .preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .preview-dialog {
        background: var(--b3-theme-background);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 90vw;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .preview-header {
        padding: 16px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--b3-theme-surface);

        h3 {
            margin: 0;
            font-size: 16px;
            color: var(--b3-theme-on-surface);
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--b3-theme-on-surface);
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;

            &:hover {
                background: var(--b3-theme-surface-lighter);
            }
        }
    }

    .preview-body {
        flex: 1;
        padding: 16px;
        overflow: auto;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preview-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: var(--b3-theme-on-surface);
    }

    .preview-content {
        width: 100%;
        
        // 重置AList预览内容的样式以适应思源主题
        :global(.obj-box) {
            background: var(--b3-theme-surface) !important;
            border-radius: 8px;
            padding: 16px;
        }
        
        :global(.hope-image) {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        

    }

    .preview-footer {
        padding: 16px;
        border-top: 1px solid var(--b3-theme-surface-lighter);
        display: flex;
        justify-content: flex-end;
        background: var(--b3-theme-surface);
    }
</style>


<!--
 AList 文件浏览器组件
 Author: OpenList Plugin
 Description: 在思源笔记侧边栏中显示 AList 文件管理器
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { pushMsg } from "./api";
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

    // 功能组相关变量
    let showFunctionGroup = false;
    let activeTab = "folder";
    let newFolderName = "";
    let isCreatingFolder = false;
    let selectedFolders = new Set();
    let isDeletingFolders = false;
    let selectedFiles = new Set();
    let isDeletingFiles = false;

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
     * @param {string} path - 文件路径
     * @param {boolean} forceRefresh - 是否强制刷新，不使用缓存
     */
    async function loadFiles(path, forceRefresh = false) {
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
                    refresh: forceRefresh
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
            
            // 显示成功提示和刷新提醒
            await pushMsg(`成功上传 ${uploadFiles.length} 个文件！由于 AList 后台传输特性，如果文件未立即显示，请点击刷新按钮。`);
            closeUploadDialog();
            
        } catch (err) {
            console.error("Upload failed:", err);
            error = `上传失败: ${err.message || '未知错误'}`;
        } finally {
            isUploading = false;
        }
    }

    /**
     * 下载文件
     */
    async function downloadFile(file) {
        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            const filePath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
            
            // 获取文件的下载链接
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
            const downloadUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
            
            // 创建下载链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (err) {
            console.error("Download failed:", err);
            error = `下载失败: ${err.message || '未知错误'}`;
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
            } else if (file.name.match(/\.(pdf)$/i)) {
                // PDF 文件预览
                const fileUrl = encodeURIComponent(fileInfo.raw_url || `${serverUrl}/d${filePath}`);
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <iframe 
                                src="https://res.oplist.org/pdf.js/web/viewer.html?file=${fileUrl}" 
                                style="width: 100%; height: 600px; border: none;"
                                title="PDF 预览">
                            </iframe>
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                // Office 文档预览 - 使用 Microsoft 预览服务
                const fileUrl = encodeURIComponent(fileInfo.raw_url || `${serverUrl}/d${filePath}`);
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <iframe 
                                src="https://view.officeapps.live.com/op/view.aspx?src=${fileUrl}" 
                                style="width: 100%; height: 600px; border: none;"
                                title="Office 文档预览"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            </iframe>
                            <div style="display: none; text-align: center; padding: 40px; background: #f8f9fa; border-radius: 4px;">
                                <p style="margin-bottom: 16px; color: #6c757d;">预览服务暂时不可用，请尝试下载文件查看</p>
                            </div>
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(epub)$/i)) {
                // EPUB 电子书预览
                const fileUrl = encodeURIComponent(fileInfo.raw_url || `${serverUrl}/d${filePath}`);
                previewContent = `
                    <div class="obj-box hope-stack">
                        <div class="hope-stack">
                            <iframe 
                                src="https://res.oplist.org/epub.js/viewer.html?url=${fileUrl}" 
                                style="width: 100%; height: 600px; border: none;"
                                title="EPUB 预览">
                            </iframe>
                        </div>
                    </div>
                `;
            } else if (file.name.match(/\.(md)$/i)) {
                // Markdown 文件预览 - 渲染为 HTML
                try {
                    const textUrl = fileInfo.raw_url || `${serverUrl}/d${filePath}`;
                    const textResponse = await fetch(textUrl, {
                        headers: {
                            'Authorization': token
                        }
                    });
                    const markdownContent = await textResponse.text();
                    
                    // 简单的 Markdown 渲染
                    let htmlContent = markdownContent
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/## (.*)/g, '<h2>$1</h2>')
                        .replace(/# (.*)/g, '<h1>$1</h1>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code>$1</code>')
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
                        .replace(/^- (.*)/gm, '<li>$1</li>')
                        .replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.*)$/gm, function(match) {
                            if (match.startsWith('<h') || match.startsWith('<ul') || match.startsWith('<li') || match.trim() === '') {
                                return match;
                            }
                            return match;
                        });
                    
                    htmlContent = '<p>' + htmlContent + '</p>';
                    htmlContent = htmlContent.replace(/<p><\/p>/g, '').replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1');
                    
                    previewContent = `
                        <div class="obj-box hope-stack">
                            <div class="hope-stack">
                                <div style="max-height: 500px; overflow-y: auto; padding: 20px; background: var(--b3-theme-surface); border-radius: 4px; line-height: 1.6;">
                                    ${htmlContent}
                                </div>
                            </div>
                        </div>
                    `;
                } catch (textErr) {
                    throw new Error('无法加载 Markdown 内容');
                }
            } else if (file.name.match(/\.(txt|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i)) {
                // 其他文本文件预览
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

    /**
     * 显示功能组对话框
     */
    function showFunctionGroupDialog() {
        showFunctionGroup = true;
        activeTab = "folder";
        newFolderName = "";
        selectedFolders.clear();
    }

    /**
     * 关闭功能组对话框
     */
    function closeFunctionGroupDialog() {
        showFunctionGroup = false;
        activeTab = "folder";
        newFolderName = "";
        selectedFolders.clear();
    }

    /**
     * 切换功能组标签页
     */
    function switchTab(tab) {
        activeTab = tab;
    }

    /**
     * 新建文件夹
     */
    async function createFolder() {
        if (!newFolderName.trim()) {
            error = "请输入文件夹名称";
            return;
        }

        isCreatingFolder = true;
        error = "";

        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            const folderPath = currentPath === "/" ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
            
            const response = await fetch(`${serverUrl}/api/fs/mkdir`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    path: folderPath
                })
            });
            
            if (!response.ok) {
                throw new Error(`创建文件夹失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '创建文件夹失败');
            }
            
            // 刷新文件列表
            await loadFiles(currentPath);
            
            // 显示成功提示
            await pushMsg(`文件夹 "${newFolderName}" 创建成功！`);
            newFolderName = "";
            
        } catch (err) {
            console.error("Create folder failed:", err);
            error = `创建文件夹失败: ${err.message || '未知错误'}`;
        } finally {
            isCreatingFolder = false;
        }
    }

    /**
     * 切换文件夹选择状态
     */
    function toggleFolderSelection(folderName) {
        if (selectedFolders.has(folderName)) {
            selectedFolders.delete(folderName);
        } else {
            selectedFolders.add(folderName);
        }
        selectedFolders = selectedFolders; // 触发响应式更新
    }

    /**
     * 删除选中的文件夹
     */
    async function deleteSelectedFolders() {
        if (selectedFolders.size === 0) {
            error = "请选择要删除的文件夹";
            return;
        }

        if (!confirm(`确定要删除选中的 ${selectedFolders.size} 个文件夹吗？此操作不可恢复！`)) {
            return;
        }

        isDeletingFolders = true;
        error = "";

        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            
            for (const folderName of selectedFolders) {
                
                
                const response = await fetch(`${serverUrl}/api/fs/remove`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        names: [folderName],
                        dir: currentPath
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`删除文件夹 ${folderName} 失败: ${response.status}`);
                }
                
                const result = await response.json();
                if (result.code !== 200) {
                    throw new Error(result.message || `删除文件夹 ${folderName} 失败`);
                }
            }
            
            // 刷新文件列表
            await loadFiles(currentPath);
            
            // 显示成功提示
            await pushMsg(`成功删除 ${selectedFolders.size} 个文件夹！`);
            selectedFolders.clear();
            
        } catch (err) {
            console.error("Delete folders failed:", err);
            error = `删除文件夹失败: ${err.message || '未知错误'}`;
        } finally {
            isDeletingFolders = false;
        }
    }

    /**
     * 切换文件选择状态
     */
    function toggleFileSelection(fileName) {
        if (selectedFiles.has(fileName)) {
            selectedFiles.delete(fileName);
        } else {
            selectedFiles.add(fileName);
        }
        selectedFiles = selectedFiles; // 触发响应式更新
    }

    /**
     * 删除选中的文件
     */
    async function deleteSelectedFiles() {
        if (selectedFiles.size === 0) {
            error = "请选择要删除的文件";
            return;
        }

        if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？此操作不可恢复！`)) {
            return;
        }

        isDeletingFiles = true;
        error = "";

        try {
            const serverUrl = plugin.settingUtils.get("serverUrl");
            
            for (const fileName of selectedFiles) {
                const response = await fetch(`${serverUrl}/api/fs/remove`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        names: [fileName],
                        dir: currentPath
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`删除文件 ${fileName} 失败: ${response.status}`);
                }
                
                const result = await response.json();
                if (result.code !== 200) {
                    throw new Error(result.message || `删除文件 ${fileName} 失败`);
                }
            }
            
            // 刷新文件列表
            await loadFiles(currentPath);
            
            // 显示成功提示
            await pushMsg(`成功删除 ${selectedFiles.size} 个文件！`);
            selectedFiles.clear();
            
        } catch (err) {
            console.error("Delete files failed:", err);
            error = `删除文件失败: ${err.message || '未知错误'}`;
        } finally {
            isDeletingFiles = false;
        }
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
                <button class="b3-button b3-button--small" on:click={showFunctionGroupDialog} disabled={isLoading}>
                    ⚙️ 功能
                </button>
                <button class="b3-button b3-button--small" on:click={() => loadFiles(currentPath, true)} disabled={isLoading}>
                    🔄 刷新
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
                        {#if file.is_dir && selectedFolders.size > 0}
                            <div class="folder-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedFolders.has(file.name)}
                                    on:change={() => toggleFolderSelection(file.name)}
                                />
                            </div>
                        {/if}
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
                                <button 
                                    class="b3-button b3-button--small download-btn"
                                    on:click={() => downloadFile(file)}
                                    title="下载文件"
                                    style="margin-left: 4px;"
                                >
                                    📥 下载
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

    <!-- 功能组对话框 -->
    {#if showFunctionGroup}
        <div class="function-overlay" on:click={closeFunctionGroupDialog}>
            <div class="function-dialog" on:click|stopPropagation>
                <div class="function-header">
                    <h3>⚙️ 功能组</h3>
                    <button class="close-btn" on:click={closeFunctionGroupDialog}>✕</button>
                </div>
                
                <div class="function-tabs">
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === "folder"}
                        on:click={() => switchTab("folder")}
                    >
                        📁 文件夹管理
                    </button>
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === "file"}
                        on:click={() => switchTab("file")}
                    >
                        🗑️ 删除文件
                    </button>
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === "upload"}
                        on:click={() => switchTab("upload")}
                    >
                        📤 上传文件
                    </button>
                </div>
                
                <div class="function-body">
                    {#if activeTab === "folder"}
                        <div class="folder-management">
                            <!-- 新建文件夹 -->
                            <div class="function-section">
                                <h4>📁 新建文件夹</h4>
                                <div class="input-group">
                                    <input 
                                        type="text" 
                                        bind:value={newFolderName}
                                        placeholder="输入文件夹名称"
                                        class="b3-text-field"
                                        disabled={isCreatingFolder}
                                        on:keydown={(e) => e.key === 'Enter' && createFolder()}
                                    />
                                    <button 
                                        class="b3-button b3-button--primary"
                                        on:click={createFolder}
                                        disabled={isCreatingFolder || !newFolderName.trim()}
                                    >
                                        {#if isCreatingFolder}
                                            创建中...
                                        {:else}
                                            创建
                                        {/if}
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 删除文件夹 -->
                            <div class="function-section">
                                <h4>🗑️ 删除文件夹</h4>
                                <p class="section-desc">选择要删除的文件夹，然后点击删除按钮</p>
                                
                                <div class="folder-selection">
                                    {#if files.filter(f => f.is_dir).length === 0}
                                        <p class="no-folders">当前目录没有文件夹</p>
                                    {:else}
                                        <div class="folder-list">
                                            {#each files.filter(f => f.is_dir) as folder}
                                                <label class="folder-item">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFolders.has(folder.name)}
                                                        on:change={() => toggleFolderSelection(folder.name)}
                                                    />
                                                    <span class="folder-name">📁 {folder.name}</span>
                                                </label>
                                            {/each}
                                        </div>
                                        
                                        {#if selectedFolders.size > 0}
                                            <div class="delete-actions">
                                                <p class="selected-count">已选择 {selectedFolders.size} 个文件夹</p>
                                                <button 
                                                    class="b3-button b3-button--danger"
                                                    on:click={deleteSelectedFolders}
                                                    disabled={isDeletingFolders}
                                                >
                                                    {#if isDeletingFolders}
                                                        删除中...
                                                    {:else}
                                                        🗑️ 删除选中的文件夹
                                                    {/if}
                                                </button>
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else if activeTab === "file"}
                        <div class="file-management">
                            <!-- 删除文件 -->
                            <div class="function-section">
                                <h4>🗑️ 删除文件</h4>
                                <p class="section-desc">选择要删除的文件，然后点击删除按钮</p>
                                
                                <div class="file-selection">
                                    {#if files.filter(f => !f.is_dir).length === 0}
                                        <p class="no-files">当前目录没有文件</p>
                                    {:else}
                                        <div class="file-list">
                                            {#each files.filter(f => !f.is_dir) as file}
                                                <label class="file-item">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFiles.has(file.name)}
                                                        on:change={() => toggleFileSelection(file.name)}
                                                    />
                                                    <span class="file-icon">{getFileIcon(file)}</span>
                                                    <span class="file-name">{file.name}</span>
                                                    <span class="file-size">({formatFileSize(file.size)})</span>
                                                </label>
                                            {/each}
                                        </div>
                                        
                                        {#if selectedFiles.size > 0}
                                            <div class="delete-actions">
                                                <p class="selected-count">已选择 {selectedFiles.size} 个文件</p>
                                                <button 
                                                    class="b3-button b3-button--danger"
                                                    on:click={deleteSelectedFiles}
                                                    disabled={isDeletingFiles}
                                                >
                                                    {#if isDeletingFiles}
                                                        删除中...
                                                    {:else}
                                                        🗑️ 删除选中的文件
                                                    {/if}
                                                </button>
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else if activeTab === "upload"}
                        <div class="upload-management">
                            <!-- 文件选择区域 -->
                            <div class="function-section">
                                <h4>📤 上传文件到 {currentPath}</h4>
                                <div class="upload-drop-zone">
                                    <input 
                                        type="file" 
                                        multiple 
                                        id="function-file-input" 
                                        style="display: none;" 
                                        on:change={handleFileSelect}
                                    />
                                    <input 
                                        type="file" 
                                        multiple 
                                        id="function-folder-input" 
                                        style="display: none;" 
                                        on:change={handleFolderSelect}
                                    />
                                    
                                    <h5>拖动文件到此处以上传，或点击：</h5>
                                    
                                    <!-- 文件选择按钮 -->
                                    <div class="upload-buttons">
                                        <button 
                                            class="upload-btn folder-btn" 
                                            on:click={() => document.getElementById('function-folder-input').click()}
                                            title="选择文件夹"
                                        >
                                            📁
                                        </button>
                                        <button 
                                            class="upload-btn file-btn" 
                                            on:click={() => document.getElementById('function-file-input').click()}
                                            title="选择文件"
                                        >
                                            📄
                                        </button>
                                    </div>
                                    
                                    <!-- 上传配置行 -->
                                    <div class="upload-config-row">
                                        <!-- 上传模式选择 -->
                                        <div class="upload-mode">
                                            <label for="function-upload-mode-select">模式:</label>
                                            <select id="function-upload-mode-select" bind:value={uploadMode} class="b3-select">
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
                                        <h5>选中的文件 ({uploadFiles.length}):</h5>
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
                                
                                <!-- 上传按钮 -->
                                <div class="upload-actions">
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
                    
                    <!-- 错误信息 -->
                    {#if error}
                        <div class="function-error">{error}</div>
                    {/if}
                </div>
                
                <div class="function-footer">
                    <button class="b3-button" on:click={closeFunctionGroupDialog}>
                        关闭
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

    /* 功能组对话框样式 */
    .function-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .function-dialog {
        background: var(--b3-theme-background);
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--b3-theme-surface-lighter);
    }
    
    .function-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        background: var(--b3-theme-surface);
    }
    
    .function-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
    }
    
    .function-tabs {
        display: flex;
        border-bottom: 1px solid var(--b3-theme-surface-lighter);
        background: var(--b3-theme-surface);
    }
    
    .tab-btn {
        background: none;
        border: none;
        padding: 12px 20px;
        cursor: pointer;
        color: var(--b3-theme-on-surface-light);
        font-size: 14px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    
    .tab-btn:hover {
        background: var(--b3-theme-surface-lighter);
        color: var(--b3-theme-on-surface);
    }
    
    .tab-btn.active {
        color: var(--b3-theme-primary);
        border-bottom-color: var(--b3-theme-primary);
        background: var(--b3-theme-background);
    }
    
    .function-body {
        padding: 20px;
        max-height: 50vh;
        overflow-y: auto;
    }
    
    .function-section {
        margin-bottom: 24px;
    }
    
    .function-section:last-child {
        margin-bottom: 0;
    }
    
    .function-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
    }
    
    .section-desc {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
    }
    
    .input-group {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    
    .input-group input {
        flex: 1;
        min-width: 0;
    }
    
    .folder-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 12px;
    }
    
    .folder-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .folder-item:hover {
        background: var(--b3-theme-surface-lighter);
    }
    
    .folder-item input[type="checkbox"] {
        margin-right: 8px;
    }
    
    .folder-name {
        font-size: 13px;
        color: var(--b3-theme-on-surface);
    }
    
    .no-folders {
        text-align: center;
        color: var(--b3-theme-on-surface-light);
        font-size: 13px;
        padding: 20px;
        margin: 0;
    }
    
    .delete-actions {
        padding: 12px;
        background: var(--b3-theme-surface);
        border-radius: 4px;
        border: 1px solid var(--b3-theme-surface-lighter);
    }
    
    .selected-count {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
    }
    
    .function-error {
        background: var(--b3-theme-error-lighter);
        color: var(--b3-theme-error);
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        margin-top: 12px;
    }
    
    .function-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--b3-theme-surface-lighter);
        background: var(--b3-theme-surface);
        display: flex;
        justify-content: flex-end;
    }

    /* 删除文件功能样式 */
    .file-selection {
        margin-top: 12px;
    }

    .file-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 12px;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
        gap: 8px;
    }

    .file-item:hover {
        background: var(--b3-theme-surface-lighter);
    }

    .file-item input[type="checkbox"] {
        margin: 0;
    }

    .file-item .file-icon {
        font-size: 14px;
    }

    .file-item .file-name {
        flex: 1;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
        word-break: break-all;
    }

    .file-item .file-size {
        font-size: 11px;
        color: var(--b3-theme-on-surface-light);
        font-family: var(--b3-font-family-code);
    }

    .no-files {
        text-align: center;
        color: var(--b3-theme-on-surface-light);
        font-size: 13px;
        padding: 20px;
        margin: 0;
    }

    /* 上传功能在功能组中的样式 */
    .upload-management .upload-drop-zone {
        border: 2px dashed var(--b3-theme-surface-lighter);
        border-radius: 6px;
        padding: 16px;
        text-align: center;
        margin-bottom: 12px;
    }

    .upload-management .upload-drop-zone h5 {
        margin: 0 0 12px 0;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
    }

    .upload-management .upload-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 12px;
    }

    .upload-management .upload-btn {
        width: 40px;
        height: 40px;
        border: 1px solid var(--b3-theme-surface-lighter);
        border-radius: 6px;
        background: var(--b3-theme-surface);
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .upload-management .upload-btn:hover {
        border-color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-lighter);
    }

    .upload-management .selected-files {
        margin-top: 12px;
        padding: 12px;
        background: var(--b3-theme-surface);
        border-radius: 4px;
    }

    .upload-management .selected-files h5 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
    }

    .upload-actions {
        margin-top: 12px;
        text-align: center;
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


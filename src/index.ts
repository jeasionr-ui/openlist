import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData
} from "siyuan";
import "@/index.scss";

import AListBrowser from "@/hello.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { svelteDialog, simpleDialog } from "./libs/dialog";

const STORAGE_NAME = "alist-config";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private isMobile: boolean;
    private settingUtils: SettingUtils;
    private boundHandleLinkClick: (event: MouseEvent) => Promise<void>;

    async onload() {
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        console.log("loading plugin-sample", this.i18n);

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);

        // 移除顶栏按钮，AList 插件主要通过侧边栏使用

        // 移除状态栏图标，简化界面

        // 移除示例命令，只保留 AList 相关功能

        this.addDock({
            config: {
                position: "RightTop",
                size: { width: 300, height: 0 },
                icon: "iconFolder",
                title: "AList 文件浏览器",
                hotkey: "⌥⌘A",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                new AListBrowser({
                    target: dock.element,
                    props: {
                        plugin: this,
                    }
                });
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });

        this.settingUtils = new SettingUtils({
            plugin: this, name: STORAGE_NAME
        });
        this.settingUtils.addItem({
            key: "serverUrl",
            value: "http://localhost:5244",
            type: "textinput",
            title: "AList 服务器地址",
            description: "AList 服务器的完整地址，例如：http://localhost:5244",
            action: {
                callback: async () => {
                    let value = await this.settingUtils.takeAndSave("serverUrl");
                    // URL 验证
                    if (value && !this.validateServerUrl(value)) {
                        showMessage("⚠️ 服务器地址格式不正确，请输入有效的URL（如：http://localhost:5244）", 3000, "error");
                        return;
                    }
                    console.log("Server URL:", value);
                    if (value) {
                        showMessage("✅ 服务器地址已保存", 2000, "info");
                    }
                }
            }
        });
        this.settingUtils.addItem({
            key: "username",
            value: "",
            type: "textinput",
            title: "用户名",
            description: "AList 登录用户名",
            action: {
                callback: () => {
                    let value = this.settingUtils.takeAndSave("username");
                    console.log("Username:", value);
                }
            }
        });
        this.settingUtils.addItem({
            key: "password",
            value: "",
            type: "textinput",
            title: "密码",
            description: "AList 登录密码",
            action: {
                callback: () => {
                    let value = this.settingUtils.takeAndSave("password");
                    console.log("Password updated");
                }
            }
        });
        this.settingUtils.addItem({
            key: "rootPath",
            value: "/",
            type: "textinput",
            title: "根路径",
            description: "AList 文件浏览的根路径，默认为根目录",
            placeholder: "/",
            action: {
                callback: () => {
                    let value = this.settingUtils.take("rootPath");
                    console.log("Root path:", value);
                }
            }
        });
        this.settingUtils.addItem({
            key: "autoLogin",
            value: true,
            type: "checkbox",
            title: "自动登录",
            description: "启动时自动登录到 AList 服务器",
            action: {
                callback: () => {
                    let value = !this.settingUtils.get("autoLogin");
                    this.settingUtils.set("autoLogin", value);
                    console.log("Auto login:", value);
                }
            }
        });
        this.settingUtils.addItem({
            key: "testConnection",
            value: "",
            type: "button",
            title: "测试连接",
            description: "测试与 AList 服务器的连接",
            button: {
                label: "测试连接",
                callback: () => {
                    this.testAListConnection();
                }
            }
        });
        
        // 添加路径记忆设置项
        this.settingUtils.addItem({
            key: "lastPath",
            value: "/",
            type: "textinput",
            title: "上次访问路径",
            description: "记录上次访问的文件夹路径，用于下次打开时恢复位置",
            action: {
                callback: () => {
                    let value = this.settingUtils.takeAndSave("lastPath");
                    console.log("Last path:", value);
                }
            }
        });

        this.settingUtils.addItem({
            key: "hint",
            value: "",
            type: "hint",
            title: "使用说明",
            description: "配置完成后，AList 文件浏览器将显示在侧边栏中。请确保 AList 服务器正在运行并且网络连接正常。",
        });

        try {
            this.settingUtils.load();
        } catch (error) {
            console.error("Error loading settings storage, probably empty config json:", error);
        }


        this.protyleSlash = [{
            filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
            html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
            id: "insertEmoji",
            callback(protyle: Protyle) {
                protyle.insert("😊");
            }
        }];

        this.protyleOptions = {
            toolbar: ["block-ref",
                "a",
                "|",
                "text",
                "strong",
                "em",
                "u",
                "s",
                "mark",
                "sup",
                "sub",
                "clear",
                "|",
                "code",
                "kbd",
                "tag",
                "inline-math",
                "inline-memo",
                "|",
                {
                    name: "insert-smail-emoji",
                    icon: "iconEmoji",
                    hotkey: "⇧⌘I",
                    tipPosition: "n",
                    tip: this.i18n.insertEmoji,
                    click(protyle: Protyle) {
                        protyle.insert("😊");
                    }
                }],
        };

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        // 加载插件设置
        this.settingUtils.load();
        console.log(`AList 插件已加载 - frontend: ${getFrontend()}; backend: ${getBackend()}`);
        
        // 添加链接点击事件监听器
        this.addLinkClickListener();
    }

    /**
     * 添加链接点击事件监听器，拦截 [alist] 前缀的链接
     */
    private addLinkClickListener() {
        // 绑定事件处理函数
        this.boundHandleLinkClick = this.handleLinkClick.bind(this);
        // 监听文档点击事件
        document.addEventListener('click', this.boundHandleLinkClick, true);
        console.log('AList link click listener added successfully');
        
        // 添加测试函数到全局作用域，方便调试
        (window as any).testAListLink = () => {
            console.log('Testing AList protocol link detection...');
            const testLink = document.createElement('a');
            testLink.href = 'alist://' + encodeURIComponent('/test/file.txt');
            testLink.textContent = 'Test AList Protocol Link';
            testLink.style.cssText = 'color: blue; text-decoration: underline; cursor: pointer; margin: 10px; display: inline-block;';
            document.body.appendChild(testLink);
            console.log('Test protocol link created:', testLink);
        };
        
        // 添加测试自定义块的函数
        (window as any).testAListBlock = () => {
            console.log('Testing AList block creation...');
            const blockContent = `{{{row
📁 AList 文件: [测试文件.txt](alist://${encodeURIComponent('/test/测试文件.txt')})
文件路径: \`/test/测试文件.txt\`
点击链接预览文件
}}}`;
            navigator.clipboard.writeText(blockContent).then(() => {
                console.log('Test block content copied to clipboard:', blockContent);
                alert('测试块内容已复制到剪贴板，请粘贴到思源笔记中测试');
            });
        };
    }

    /**
     * 处理链接点击事件
     */
    private async handleLinkClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        console.log('Link click detected, target:', target.tagName, target);
        
        let href: string | null = null;
        let linkText: string = '';
        
        // 检查是否是标准的 <a> 标签
        if (target.tagName === 'A') {
            const linkElement = target as HTMLAnchorElement;
            href = linkElement.getAttribute('href');
            linkText = linkElement.textContent || '';
        } else {
            // 查找父级链接元素
            const linkElement = target.closest('a');
            if (linkElement) {
                href = linkElement.getAttribute('href');
                linkText = linkElement.textContent || '';
            } else {
                // 检查思源笔记的 data-href 属性（span 元素）
                const dataHref = target.getAttribute('data-href');
                if (dataHref) {
                    href = dataHref;
                    linkText = target.textContent || '';
                } else {
                    // 查找父级元素的 data-href 属性
                    const parentWithDataHref = target.closest('[data-href]');
                    if (parentWithDataHref) {
                        href = parentWithDataHref.getAttribute('data-href');
                        linkText = parentWithDataHref.textContent || '';
                    }
                }
            }
        }
        
        if (!href) {
            console.log('No link href found');
            return;
        }
        
        console.log('Link href:', href);
        
        // 检测 alist:// 协议
        if (!href || !href.startsWith('alist://')) {
            console.log('Not an AList protocol link, ignoring');
            return;
        }
        
        console.log('AList protocol link detected! Intercepting...');
        
        // 强制阻止默认链接行为和事件冒泡
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // 解析 AList 文件路径
        const encodedPath = href.substring(8); // 移除 alist:// 前缀
        const filePath = decodeURIComponent(encodedPath);
        console.log('Parsed AList file path:', filePath);
        
        // 验证文件路径格式
        if (!filePath || !filePath.startsWith('/')) {
            console.error('Invalid AList file path:', filePath);
            showMessage(`无效的文件路径: ${filePath}`, 3000, 'error');
            return;
        }
        
        showMessage('正在预览文件...', 2000, 'info');
        await this.previewAListFile(filePath, linkText || '文件');
    }

    /**
     * 预览 AList 文件
     */
    private async previewAListFile(filePath: string, fileName: string) {
        try {
            const serverUrl = this.settingUtils.get("serverUrl");
            let token = this.settingUtils.get("token");
            
            if (!serverUrl) {
                throw new Error('AList 服务器地址未配置，请检查设置');
            }
            
            // 检查 token 是否存在且未过期
            const { token: savedToken } = await this.getTokenData();
            if (!savedToken || await this.isTokenExpired()) {
                console.log('Token 无效或已过期，尝试重新登录...');
                token = await this.refreshToken();
                if (!token) {
                    throw new Error('无法获取有效的访问令牌，请检查登录信息');
                }
            } else {
                token = savedToken;
            }
            
            // 通过 AList API 获取文件信息
            const response = await fetch(`${serverUrl}/api/fs/get`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    path: filePath,
                    password: ""
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
            console.log('AList file info:', fileInfo);
            
            // 创建文件对象用于预览
            const file = {
                name: fileInfo.name,
                size: fileInfo.size,
                is_dir: fileInfo.is_dir,
                modified: fileInfo.modified,
                raw_url: fileInfo.raw_url
            };
            
            // 打开预览对话框
            this.showAListPreviewDialog(file, fileInfo.raw_url || `${serverUrl}/d${filePath}`);
        } catch (error) {
            console.error('预览 AList 文件失败:', error);
            showMessage(`预览失败: ${error.message}`, 3000, 'error');
        }
    }

    /**
     * 显示 AList 文件预览对话框
     */
    private showAListPreviewDialog(file: any, fileUrl: string) {
        // 创建预览容器
        const container = document.createElement('div');
        container.className = 'alist-preview-container';
        container.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column;';
        
        // 生成预览内容
        this.generatePreviewContent(file, fileUrl, container);
        
        // 使用 simpleDialog 代替 svelteDialog 避免 component.$destroy() 错误
        const { dialog, close } = simpleDialog({
            title: `预览: ${file.name}`,
            width: this.isMobile ? "92vw" : "80vw",
            height: this.isMobile ? "80vh" : "70vh",
            ele: container,
            callback: () => {
                // 清理预览内容
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        });
        
        return { dialog, close };
    }

    /**
     * 生成预览内容
     */
    private generatePreviewContent(file: any, fileUrl: string, container: HTMLElement) {
        const fileName = file.name;
        let previewHTML = '';
        
        // 根据文件扩展名生成预览内容
        if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            // 图片预览
            previewHTML = `
                <div class="obj-box hope-stack" style="text-align: center; padding: 20px; width: 100%; height: 100%;">
                    <img src="${fileUrl}" alt="${fileName}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                </div>
            `;
        } else if (fileName.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
            // 视频预览
            previewHTML = `
                <div class="obj-box hope-stack" style="text-align: center; padding: 20px; width: 100%; height: 100%;">
                    <video controls style="max-width: 100%; max-height: 100%;">
                        <source src="${fileUrl}" type="video/mp4">
                        您的浏览器不支持视频播放。
                    </video>
                </div>
            `;
        } else if (fileName.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
            // 音频预览
            previewHTML = `
                <div class="obj-box hope-stack" style="text-align: center; padding: 20px;">
                    <audio controls style="width: 100%; max-width: 500px;">
                        <source src="${fileUrl}" type="audio/mpeg">
                        您的浏览器不支持音频播放。
                    </audio>
                </div>
            `;
        } else if (fileName.match(/\.(pdf)$/i)) {
            // PDF 文件预览 - 使用PDF.js确保正确预览
            const encodedUrl = encodeURIComponent(fileUrl);
            previewHTML = `
                <div class="obj-box hope-stack" style="padding: 10px; width: 100%; height: 100%; flex-direction: column;">
                    <iframe 
                        src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}" 
                        style="width: 100%; flex: 1; border: none;"
                        title="PDF 预览">
                    </iframe>
                    <div style="margin-top: 10px; text-align: center; color: #666; flex-shrink: 0;">
                        <small>如果预览失败，请尝试 <a href="${fileUrl}" target="_blank" style="color: var(--b3-theme-primary);">直接下载文件</a> 查看</small>
                    </div>
                </div>
            `;
        } else if (fileName.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) {
            // Office 文档预览
            const encodedUrl = encodeURIComponent(fileUrl);
            previewHTML = `
                <div class="obj-box hope-stack" style="padding: 10px; width: 100%; height: 100%; flex-direction: column;">
                    <iframe 
                        src="https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}" 
                        style="width: 100%; flex: 1; border: none;"
                        title="Office 文档预览">
                    </iframe>
                    <div style="margin-top: 10px; text-align: center; color: #666; flex-shrink: 0;">
                        <small>如果预览失败，请尝试直接下载文件查看</small>
                    </div>
                </div>
            `;
        } else if (fileName.match(/\.(md|markdown|txt)$/i)) {
            // Markdown 和文本文件预览
            previewHTML = `
                <div class="obj-box hope-stack" style="padding: 20px; width: 100%; height: 100%; flex-direction: column;">
                    <div id="markdown-content" style="flex: 1; overflow: auto; width: 100%; background: var(--b3-theme-background); padding: 20px; border-radius: 6px; font-family: var(--b3-font-family);">
                        <div style="text-align: center; color: #666;">正在加载文件内容...</div>
                    </div>
                </div>
            `;
            
            // 异步加载文件内容
            setTimeout(async () => {
                try {
                    const response = await fetch(fileUrl);
                    if (response.ok) {
                        const content = await response.text();
                        const contentDiv = container.querySelector('#markdown-content');
                        if (contentDiv) {
                            if (fileName.match(/\.(md|markdown)$/i)) {
                                // 简单的Markdown渲染
                                const htmlContent = this.renderMarkdown(content);
                                contentDiv.innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
                            } else {
                                // 纯文本显示
                                contentDiv.innerHTML = `<pre class="text-content">${this.escapeHtml(content)}</pre>`;
                            }
                        }
                    } else {
                        throw new Error('文件加载失败');
                    }
                } catch (error) {
                    const contentDiv = container.querySelector('#markdown-content');
                    if (contentDiv) {
                        contentDiv.innerHTML = `
                            <div style="text-align: center; color: #f56565;">
                                <p>文件加载失败</p>
                                <a href="${fileUrl}" target="_blank" style="color: var(--b3-theme-primary);">点击下载文件</a>
                            </div>
                        `;
                    }
                }
            }, 100);
        } else {
            // 不支持的文件类型
            previewHTML = `
                <div class="obj-box hope-stack" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                    <h3>${fileName}</h3>
                    <p>此文件类型暂不支持预览</p>
                    <a href="${fileUrl}" target="_blank" style="color: var(--b3-theme-primary); text-decoration: none;">点击下载文件</a>
                </div>
            `;
        }
        
        container.innerHTML = previewHTML;
    }

    /**
     * 简单的Markdown渲染器
     */
    private renderMarkdown(content: string): string {
        let html = this.escapeHtml(content);
        
        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 代码块
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: var(--b3-theme-surface); padding: 10px; border-radius: 4px; overflow-x: auto;"><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code style="background: var(--b3-theme-surface); padding: 2px 4px; border-radius: 3px; font-family: var(--b3-font-family-code);">$1</code>');
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--b3-theme-primary);">$1</a>');
        
        // 列表
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // 换行
        html = html.replace(/\n/g, '<br>');
        
        return `<div style="line-height: 1.6; color: var(--b3-theme-on-background);">${html}</div>`;
    }

    /**
     * HTML转义
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        
        // 移除链接点击事件监听器
        if (this.boundHandleLinkClick) {
            document.removeEventListener('click', this.boundHandleLinkClick, true);
        }
        
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }

    /**
     * 验证 token 有效性
     */
    private async validateToken(serverUrl: string, token: string): Promise<boolean> {
        try {
            const response = await fetch(`${serverUrl}/api/me`, {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
            
            if (!response.ok) {
                return false;
            }
            
            const result = await response.json();
            return result.code === 200;
        } catch (error) {
            console.error('Token 验证失败:', error);
            return false;
        }
    }

    /**
     * 获取token数据
     */
    private async getTokenData(): Promise<{token: string | null, tokenExpiry: string | null}> {
        const tokenData = await this.loadData('token.json') || {};
        return {
            token: tokenData.token || null,
            tokenExpiry: tokenData.tokenExpiry || null
        };
    }

    /**
     * 保存token数据
     */
    private async saveTokenData(token: string, tokenExpiry: string): Promise<void> {
        await this.saveData('token.json', {
            token: token,
            tokenExpiry: tokenExpiry
        });
    }

    /**
     * 检查 token 是否过期
     */
    private async isTokenExpired(): Promise<boolean> {
        const { tokenExpiry } = await this.getTokenData();
        if (!tokenExpiry) {
            return true; // 如果没有过期时间记录，认为已过期
        }
        
        const now = Date.now();
        const expiryTime = parseInt(tokenExpiry);
        
        // 提前5分钟刷新token，避免在使用过程中过期
        const bufferTime = 5 * 60 * 1000; // 5分钟
        return now >= (expiryTime - bufferTime);
    }

    /**
     * 刷新 token（重新登录）
     */
    private async refreshToken(): Promise<string | null> {
        try {
            const serverUrl = this.settingUtils.get("serverUrl");
            const username = this.settingUtils.get("username");
            const password = this.settingUtils.get("password");
            
            if (!serverUrl || !username || !password) {
                throw new Error('登录信息不完整');
            }
            
            const loginResponse = await this.loginToAList(serverUrl, username, password);
            if (loginResponse && loginResponse.token) {
                // 设置token过期时间（AList token通常有效期为24小时）
                const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24小时后过期
                
                // 保存token数据到独立文件
                await this.saveTokenData(loginResponse.token, expiryTime.toString());
                
                console.log('Token 刷新成功');
                return loginResponse.token;
            }
            
            return null;
        } catch (error) {
            console.error('Token 刷新失败:', error);
            return null;
        }
    }

    /**
     * 验证服务器URL格式
     */
    private validateServerUrl(url: string): boolean {
        try {
            // 移除末尾的斜杠
            const cleanUrl = url.replace(/\/$/, '');
            
            // 使用URL构造函数验证URL格式
            const urlObj = new URL(cleanUrl);
            
            // 检查协议是否为http或https
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }
            
            // 检查是否有主机名
            if (!urlObj.hostname) {
                return false;
            }
            
            // 检查端口号是否有效（如果指定了的话）
            if (urlObj.port && (isNaN(Number(urlObj.port)) || Number(urlObj.port) < 1 || Number(urlObj.port) > 65535)) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('URL validation error:', error);
            return false;
        }
    }

    /**
     * 测试 AList 服务器连接
     */
    async testAListConnection() {
        const serverUrl = this.settingUtils.get("serverUrl");
        const username = this.settingUtils.get("username");
        const password = this.settingUtils.get("password");

        if (!serverUrl || !username || !password) {
            showMessage("请先配置服务器地址、用户名和密码", 3000, "error");
            return;
        }

        try {
            showMessage("正在测试连接...", 2000, "info");
            const response = await this.loginToAList(serverUrl, username, password);
            if (response && response.token) {
                // 设置token过期时间（AList token通常有效期为24小时）
                const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24小时后过期
                
                // 保存token数据到独立文件
                await this.saveTokenData(response.token, expiryTime.toString());
                
                showMessage("连接成功！", 3000, "info");
            } else {
                showMessage("连接失败：无效的响应", 3000, "error");
            }
        } catch (error) {
            console.error("AList connection test failed:", error);
            showMessage(`连接失败：${error.message || '未知错误'}`, 3000, "error");
        }
    }

    /**
     * 登录到 AList 服务器
     */
    async loginToAList(serverUrl: string, username: string, password: string) {
        const loginUrl = `${serverUrl}/api/auth/login`;
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.code !== 200) {
            throw new Error(data.message || '登录失败');
        }

        return data.data;
    }

    // 移除自定义设置对话框示例

    // 移除事件总线相关的示例方法

    // 移除块图标事件相关方法

    private showDialog() {
        svelteDialog({
            title: "AList 文件浏览器",
            width: this.isMobile ? "92vw" : "720px",
            constructor: (container: HTMLElement) => {
                return new AListBrowser({
                    target: container,
                    props: {
                        plugin: this,
                    }
                });
            }
        });
    }

    // 移除 addMenu 方法，不再需要顶栏菜单
}

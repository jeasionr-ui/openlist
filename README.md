
# AList File Browser Plugin

> 🚀 A powerful plugin that seamlessly integrates AList(OpenList) file manager into SiYuan Notes sidebar

[![GitHub release](https://img.shields.io/github/v/release/jeasionr-ui/openlist)](https://github.com/jeasionr-ui/openlist/releases)
[![License](https://img.shields.io/github/license/jeasionr-ui/openlist)](https://github.com/jeasionr-ui/openlist/blob/main/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/jeasionr-ui/openlist/total)](https://github.com/jeasionr-ui/openlist/releases)

## 📖 Project Overview

**AList File Browser Plugin** provides a complete file management solution for SiYuan Notes users. Through deep integration with AList(OpenList) file manager, you can:

- 🗂️ Browse and manage files directly in SiYuan Notes sidebar
- 📎 Seamlessly embed AList files into note content
- 🔄 Achieve integrated experience between notes and file management
- 🌐 Support both local and remote file server access

## 💝 Support Development

If this plugin helps you, welcome to support the developer:

- 🎯 **Voluntary Sponsorship**: Starting from 0.5 yuan/month (completely voluntary, no feature restrictions)
- 🚀 **Continuous Updates**: Your support will motivate me to continuously improve plugin features
- ⭐ **Free to Use**: Plugin is free, sponsorship is only for development motivation

<div align="center">
  <img src="./doc/AliPay.JPG" alt="Alipay Sponsorship" width="180" style="margin: 10px;">
  <img src="./doc/WeChat.JPG" alt="WeChat Sponsorship" width="180" style="margin: 10px;">
  <br>
  <small>Scan to support development ❤️</small>
</div>

## ✨ Features

### 🗂️ File Management
- ✅ **Complete File Operations**: Browse, upload, download, delete, rename, move
- 📁 **Folder Management**: Create, delete, rename, move folders
- 🔄 **Batch Operations**: Multi-select files for batch processing
- 🎯 **Drag & Drop Upload**: Intuitive drag-and-drop file upload experience
- 🔍 **Smart Search**: Quick file location and filtering

### 🎬 Multimedia Preview
- 🖼️ **Image Preview**: JPG, PNG, GIF, WebP, SVG, BMP
- 🎥 **Video Playback**: MP4, WebM, OGV, AVI, MOV
- 🎵 **Audio Playback**: MP3, WAV, OGG, FLAC, AAC
- 📄 **Document Viewing**: TXT, MD, JSON, XML, CSV
- 📋 **PDF Support**: Online PDF document preview

### 🔐 Security & Authentication
- 🔑 **Token Authentication**: Secure identity verification based on AList server
- 🚀 **Auto Login**: Automatically connect to server on startup
- 👥 **Permission Control**: Fully comply with AList server permission settings
- 🛡️ **Data Security**: All operations transmitted through encrypted connections

### 🌟 User Experience
- 🌍 **Multi-language Support**: Complete support for Chinese and English interfaces
- 📱 **Responsive Design**: Perfect adaptation for desktop and mobile
- ⚡ **Real-time Feedback**: Real-time display of file operation progress
- 🎨 **Modern Interface**: Clean and beautiful user interface design
- 🔧 **Smart Error Handling**: Friendly error prompts and automatic recovery

## 📦 Installation

### 🏪 Method 1: SiYuan Notes Marketplace (Recommended)

1. 📱 Open SiYuan Notes application
2. ⚙️ Go to `Settings` → `Marketplace` → `Plugins`
3. 🔍 Search for "**AList File Browser**" or "**openlist**"
4. ⬇️ Click `Download` and enable the plugin
5. 🎉 Installation complete, ready to use in sidebar

### 📦 Method 2: Manual Installation

1. 🌐 Visit [GitHub Releases](https://github.com/jeasionr-ui/openlist/releases) page
2. ⬇️ Download the latest `alist.zip` file
3. 📁 Extract to `data/plugins/` directory in SiYuan Notes workspace
4. 🔄 Restart SiYuan Notes application
5. ✅ Enable plugin in `Settings` → `Marketplace` → `Downloaded`

> 💡 **Tip**: Marketplace installation is recommended for automatic update notifications

## ⚙️ Configuration

### 🔧 Initial Setup

#### 1. Open Plugin Settings
- 📋 Go to `Settings` → `Plugins` → `AList File Browser`

#### 2. Configure Connection Parameters

| Configuration | Description | Example |
|---------------|-------------|----------|
| 🌐 **Server Address** | Complete address of AList server | `http://localhost:5244`<br>`https://files.example.com` |
| 👤 **Username** | AList server login username | `admin` or your username |
| 🔐 **Password** | Corresponding login password | Your AList password |
| 📁 **Root Path** | Starting directory for file browsing | `/` (default) or `/documents` |
| 🚀 **Auto Login** | Automatically connect to server on startup | ✅ Recommended to enable |

#### 3. Save Settings
- 💾 Click `Save` button to complete configuration
- 🔄 Plugin will automatically attempt to connect to server

### 📋 AList Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| 🔢 **AList Version** | v3.0+ | v3.8+ |
| 🌐 **Network Access** | HTTP/HTTPS reachable | HTTPS + domain |
| 👥 **User Permissions** | Read permissions | Full file operation permissions |
| 🔒 **Security Settings** | Basic authentication | Enable CORS + Token |

> ⚠️ **Note**: Ensure SiYuan Notes can normally access your AList server address

## 🚀 Usage Guide

### 🎯 Basic Operation Flow

#### 1. 🔗 Connect to Server
- 🖱️ Click the **folder icon** (AList File Browser) in SiYuan Notes sidebar
- ⚙️ First-time use requires configuring server address, username, and password in plugin settings
- 🚀 After enabling auto login, it will automatically connect to AList server each time opened
- ✅ Shows file list on successful connection, displays detailed error information on failure

#### 2. 📁 File Browsing
- 📂 **Directory Navigation**: Click folder name to enter subdirectory
- 🔙 **Go Back**: Click parent directory name in path for quick navigation
- 📍 **Path Display**: Top shows current complete path
- 🔄 **Refresh List**: Click refresh button to reload current directory

#### 3. ⚡ File Operations
- 👆 **File Preview**: Click filename to preview supported file types (images, videos, audio, PDF, Office documents, text, etc.)
- ⬇️ **File Download**: Download through preview dialog or direct file link access
- 📋 **Copy Link**: Get direct access link to file
- 🔗 **Protocol Link**: Support `alist://` protocol links, can create file references in SiYuan Notes

### 🚀 Advanced Features

#### 📦 File Management Operations
- ⬆️ **File Upload**: Support both online upload and offline download modes
- 📁 **New Folder**: Create new folder in current directory
- 🗑️ **Delete Operation**: Delete selected files or folders
- 📋 **Batch Selection**: Support multi-select files for batch operations
- 🔄 **Move Files**: Move files or folders to other directories

#### 🔍 File Preview Features
- 🖼️ **Image Preview**: Support JPG, PNG, GIF, WebP and other formats
- 🎬 **Video Playback**: Support MP4, WebM, AVI, MOV and other formats
- 🎵 **Audio Playback**: Support MP3, WAV, FLAC, AAC and other formats
- 📄 **Document Preview**: Support PDF, Office documents (Word, Excel, PowerPoint)
- 📝 **Text Viewing**: Support Markdown, TXT and other text file rendering display

#### ⚡ Upload & Download Management
- 📊 **Upload Progress**: Real-time display of file upload progress
- 🌐 **Offline Download**: Support offline download through URL
- 📋 **Task Management**: View and manage upload/download task status
- ⚙️ **Upload Options**: Configurable overwrite mode, streaming upload and other parameters

## 🔧 Troubleshooting

### Common Problem Solutions

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Login Failed | Incorrect server address, username or password | Check configuration information, confirm AList server status |
| Connection Timeout | Network issues or server unreachable | Check network connection, confirm server address is correct |
| Upload Failed | File permissions or insufficient storage space | Check AList server storage space and permission settings |
| Plugin Unresponsive | Plugin not loaded correctly | Restart SiYuan Notes, confirm plugin is enabled |
| File Preview Exception | Unsupported file format or corrupted file | Try downloading file or use other tools to open |

### ⚠️ Known Issues

| Issue Description | Impact Level | Temporary Solution | Fix Status |
|-------------------|--------------|-------------------|------------|
| Files not immediately displayed after upload | 🟡 Medium | Manually click refresh button | 🔄 In Development |
| Original location still shows after moving files | 🟡 Medium | Close and reopen function group | 🔄 In Development |

> 📝 **Note**: These issues are mainly caused by AList caching mechanism, we are developing auto-refresh functionality to resolve them

### Debug Mode

1. Enable `Debug Mode` in plugin settings
2. Open browser developer tools
3. Check detailed log information in Console tab
4. Report error information to developer

### Performance Optimization Suggestions

- **Large File Handling**: Recommend batch uploading large numbers of files
- **Network Optimization**: Use stable network connection
- **Cache Cleanup**: Regularly clear browser cache

## 🤝 Support & Feedback

### Getting Help

- 📧 **Email Contact**: [jeasionr@foxmail.com](mailto:jeasionr@foxmail.com)
- 🐛 **Issue Reporting**: [GitHub Issues](https://github.com/jeasionr-ui/openlist/issues)
- 💡 **Feature Suggestions**: Welcome to propose new feature suggestions on GitHub
- ⭐ **Project Support**: If the plugin helps you, please star the project

### Contributing

- 🔍 **Testing Feedback**: Report issues encountered during use
- 📝 **Documentation Improvement**: Help improve usage documentation
- 🌐 **Translation Contribution**: Assist with multi-language localization
- 💻 **Code Contribution**: Submit feature improvements or fixes

## 📋 更新日志

### 🎉 v1.0.0 (2025-01-05)
- ✨ **核心功能**：完整的文件浏览和管理功能
- 🔗 **服务器集成**：AList 服务器深度集成支持
- 👀 **文件预览**：多种文件类型预览支持
- 📦 **批量操作**：批量文件操作功能
- 🎨 **界面优化**：现代化用户界面设计
- 🌍 **多语言**：中英文界面支持

## 🛣️ 开发路线图

### 🔄 v1.1.0 (计划中)
- 🔧 修复缓存刷新问题
- ⚡ 自动刷新机制优化
- 🎯 文件操作体验改进

### 🚀 v1.2.0 (规划中)
- 🌐 更多语言支持
- 📱 移动端体验优化
- 🔍 高级搜索功能
- 🎨 主题定制支持

## 📚 常见问题 (FAQ)

<details>
<summary><strong>Q: 为什么上传文件后不立即显示？</strong></summary>

**A:** 这是由于 AList 服务器的缓存机制导致的。解决方案：
- 🔄 点击界面上的刷新按钮
- ⏱️ 等待 5-10 秒后自动刷新
- 🔧 我们正在开发自动刷新功能来解决此问题
</details>

<details>
<summary><strong>Q: 移动文件后为什么原位置还显示文件？</strong></summary>

**A:** 同样是缓存机制问题。解决方案：
- 🔄 关闭侧边栏功能组，重新打开
- 🖱️ 点击刷新按钮更新文件列表
- ⚡ 即将推出的版本将自动处理此问题
</details>

<details>
<summary><strong>Q: 插件支持哪些文件操作？</strong></summary>

**A:** 支持完整的文件管理操作：
- 文件：上传、下载、删除、重命名、移动、预览
- 文件夹：创建、删除、重命名、移动
- 批量操作：多选文件进行批量处理
</details>

<details>
<summary><strong>Q: 如何报告问题或建议功能？</strong></summary>

**A:** 您可以通过以下方式联系我们：
- 在 [GitHub Issues](https://github.com/jeasionr-ui/openlist/issues) 提交问题
- 发送邮件至 [jeasionr@foxmail.com](mailto:jeasionr@foxmail.com)
- 我们会及时回复并处理您的反馈
</details>

<details>
<summary><strong>Q: 插件是否支持多个 AList 服务器？</strong></summary>

**A:** 当前版本仅支持单个 AList 服务器连接。多服务器支持功能已列入开发计划，将在后续版本中提供。
</details>

<details>
<summary><strong>Q: 文件上传有大小限制吗？</strong></summary>

**A:** 上传限制主要取决于以下因素：
- 🖥️ **AList 服务器配置**：查看服务器的上传大小限制
- 🌐 **网络环境**：建议大文件使用稳定网络上传
- 💾 **存储空间**：确保目标目录有足够存储空间
- 📊 **建议**：单文件建议不超过 2GB，以获得最佳体验
</details>

<details>
<summary><strong>Q: 如何提高文件传输速度？</strong></summary>

**A:** 优化传输速度的方法：
- 🌐 **网络优化**：使用有线网络或稳定的 WiFi
- 📦 **分批上传**：大量文件建议分批次上传
- 🔧 **服务器优化**：确保 AList 服务器性能良好
- ⚡ **并发控制**：避免同时进行过多文件操作
</details>


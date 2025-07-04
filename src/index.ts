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
import { svelteDialog } from "./libs/dialog";

const STORAGE_NAME = "alist-config";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private isMobile: boolean;
    private settingUtils: SettingUtils;

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
                callback: () => {
                    let value = this.settingUtils.takeAndSave("serverUrl");
                    console.log("Server URL:", value);
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
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
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

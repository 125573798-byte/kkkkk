# 管家koofr PWA 版（v1.0.0.2）

## 一句话说明
把原 HTML 单文件应用封装成 **PWA（渐进式 Web 应用）**：可「添加到主屏幕 / 安装」，
离线可用，图标采用你提供的星云地球图标。**功能与界面零改动**，仅新增 PWA 相关文件。

## 文件结构
```
管家koofr_PWA/
├── index.html              ← 原程序（未改功能/界面），仅注入 PWA 元数据
├── manifest.webmanifest    ← 应用名称、图标、standalone 显示、快捷方式
├── sw.js                   ← Service Worker，离线缓存
├── offline.html            ← 离线时的友好提示页
├── icons/
│   ├── icon-72/96/128/144/152/192/384/512.png
│   ├── apple-touch-icon.png
│   └── splash-bg.png
└── README.md
```

## 如何「安装」
### 手机
- **Safari（iOS）**：打开 index.html → 分享 → 「添加到主屏幕」→ 出现星云地球图标，全屏运行。
- **Chrome / Edge（Android）**：打开 → 地址栏「安装」或菜单「添加到主屏幕」→ 桌面出现 App 图标。

### 电脑
- **Chrome / Edge / Brave**：打开 index.html → 地址栏右侧出现 「⊕ 安装」图标 → 点击，
  即以前独立窗口运行（无浏览器地址栏），并可在系统启动器/开始菜单找到。

## 如何发布（可选）
若想通过 https 网址直接安装（PWA 要求 https 或 localhost）：
- 放到任意静态托管：GitHub Pages、Vercel、Netlify、COS、nginx 均可，**无需后端**。
- 目录保持原样，`index.html` 为入口。
- 本地直接 `file://` 打开也可运行，但 Service Worker 缓存仅在 `localhost`/`https` 生效；
  此时 App 仍能正常使用，只是离线缓存不生效（不影响数据，数据本就存在 localStorage）。

## 数据说明
- 全部数据仍在 `localStorage`（与原程序一致），**不上传、不联网**。
- Koofr 同步走的是原程序内置的 Koofr WebDAV 逻辑，行为不变。
- 清除浏览器数据 = 清除账本，请务必使用程序内的「导出/备份」功能。

## 图标
采用你提供的星云地球图，按 iOS 连续圆角（≈22.7%）生成各尺寸，
`purpose: maskable` 保证在 Android 自适应图标上不被裁掉主体。

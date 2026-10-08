# 管家koofr · Cloudflare 无跨域部署说明

## 目录结构
```
管家koofr_PWA/
├── index.html                 ← 原程序（界面/功能零改动）
├── cloud-proxy.js             ← 【新增】智能代理切换（自动选通道，无感）
├── manifest.webmanifest
├── sw.js
├── offline.html
├── icons/
├── functions/dav/[...path].js ← 【新增】Pages Functions 同源代理（推荐）
└── koofr-worker.js            ← 【备用】独立 Cloudflare Worker 代理
```

## 已完成的修复
单机可用、托管 Cloudflare 后失败，根因是**浏览器跨域（CORS）**：
网页在 `https://jianguoyu.pages.dev`，却直连 `https://app.koofr.net` 的 WebDAV，
Koofr 对浏览器 CORS 预检支持不完善 → `Load failed` / `The string did not match the expected pattern`。

修复思路：**让请求走同源**，不再跨域。

## 两种代理（二选一，推荐第一种）

### ✅ 方案 1：Pages Functions（同源，最稳，无需额外域名）
`functions/dav/[...path].js` 已写好，部署后与前端同域：

```
前端：https://jianguoyu.pages.dev
代理：https://jianguoyu.pages.dev/dav/Koofr   ← 等于 https://app.koofr.net/dav/Koofr
```

**Cloudflare 后台操作**：
1. 进入 Pages 项目 → **Functions** → 开启
2. 把仓库根目录的 `functions/` 上传（或连 Git 自动部署）
3. 无需改任何设置

### 🔄 方案 2：独立 Worker（已有 `koofr-proxy.125573798.workers.dev`）
`koofr-worker.js` 是完整 Worker 代码，已带完整 CORS 头。
适用：想用自定义域名，或 Pages Functions 不便开启时。

## 智能代理（cloud-proxy.js）工作逻辑
**不改你的操作、不改界面**，只在"测试连接/上传/下载"时自动选择通道：

1. 同源 Pages Functions 代理 `/dav/Koofr`  ✅ 优先
2. 独立 Worker 代理 `https://koofr-proxy.125573798.workers.dev/dav/Koofr`
3. 直连 `https://app.koofr.net/dav/Koofr`（单机/离线场景）

- 点「测试连接」→ 自动探测最优通道 → 把结果**静默回填**到"服务器地址"输入框
- 点「保存云同步设置」→ 记住当前生效通道，下次直接用
- 上传/下载/检查更新 → 走已验证通道

## 你只需做 3 步
1. 把本目录部署到 Cloudflare Pages（连接 Git 或直传）
2. 确保 `functions/dav/[...path].js` 被识别（Pages → Functions 页可见）
3. 打开 App → 设置 → **点「测试连接」** → 通过后点「保存云同步设置」

> 服务器地址会被自动改为 `https://jianguoyu.pages.dev/dav/Koofr`，
> 账号 / 应用密码 / 远程文件夹 `/家庭管家备份/` **保持原样**。

## 验证是否生效
- 「测试连接」→ 提示成功
- 「加密上传到云端」→ 上传成功
- 「下载并恢复」→ 能拉取到备份
- 状态栏不再出现 `Load failed`

## 兜底
若 Cloudflare 代理异常，程序会自动回退到**直连 Koofr**（即单机模式），
本地备份、账本、密码箱等**全部功能不受影响**，仅云同步不可用。

---
隐私提醒：请勿在截图/日志中泄露 Koofr 邮箱、应用密码、远程目录。
应用密码建议定期重置。

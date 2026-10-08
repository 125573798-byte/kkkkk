# 管家 Koofr（PWA 干净版）

个人账本 / 固收 / 资金 / 贷款 / 合同 / 通讯录 / 供应商 / 密码箱 / 倒数日。
纯前端 + localStorage，AES-256 加密云同步，仅对接 **Koofr**（无坚果云、无多通道）。

## 目录
```
index.html                  # 主程序（唯一入口，功能与界面未改动）
manifest.webmanifest        # PWA 清单
sw.js                       # 离线缓存
offline.html                # 离线友好页
icons/                      # 72/96/128/144/152/192/384/512 + apple-touch-icon + splash
functions/dav/[[path]].js   # Cloudflare Pages Functions：同源代理 Koofr WebDAV（解决 CORS 405/404）
```

## 部署（Cloudflare Pages）
1. 仓库根目录即本目录，连 GitHub 或直传。
2. 无需 build 命令、无需 Wrangler 配置。
3. Pages 会自动识别 `functions/dav/[[path]].js` 并上传。
4. 部署成功后访问 `https://jianguoyu.pages.dev`。

## 云同步设置（前端填写）
| 项 | 值 |
|---|---|
| 服务器地址 | `https://jianguoyu.pages.dev/dav/Koofr` |
| 用户名 | 你的 Koofr 邮箱 |
| 密码 | Koofr **应用密码**（非登录密码） |
| 远程文件夹 | `/家庭管家备份/` |

程序会按优先级自动选通道：
1. Pages 同源代理（推荐，无跨域）
2. 独立 Worker 代理 `https://koofr-proxy.125573798.workers.dev/dav/Koofr`
3. 直连 `https://app.koofr.net/dav/Koofr`（单机兜底）

选通后静默回填“服务器地址”，点“保存云同步设置”即记住。

## 安装为 App
- iPhone：Safari → 分享 → 添加到主屏幕
- Android：Chrome → 菜单 → 安装
- 桌面：Chrome/Edge → 地址栏 ⊕ 安装

## 注意
- 数据在 localStorage；清除浏览器数据 = 清账，务必用“导出/备份”。
- PWA 离线缓存仅在 https:// 或 localhost 生效；file:// 双击也能用（走直连通道）。
- 备份文件建议 < 几 MB，避免触及 Worker CPU 限额。

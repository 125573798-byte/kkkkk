# 管家 Koofr（PWA 干净版）

个人账本 / 固收 / 资金 / 贷款 / 合同 / 通讯录 / 供应商 / 密码箱 / 倒数日。
纯前端 + localStorage，AES-256 加密云同步，**仅对接 Koofr**（无坚果云、无多通道、无只读提示条）。

## 云同步设置（已预填，通常无需改动）
| 项 | 值 |
|---|---|
| 服务器地址 | `https://jianguoyu.pages.dev/dav/Koofr`（只读，已锁定） |
| 用户名 | 你的 Koofr 邮箱 |
| 密码 | Koofr **应用密码**（非登录密码） |
| 远程文件夹 | `/家庭管家备份/` |

通道自动择优：Pages 同源代理 → Worker 代理 → 直连 Koofr（单机兜底）。

## 部署（Cloudflare Pages）
1. 仓库根目录即本目录，连 GitHub 或直传。
2. 无需 build 命令、无需 Wrangler 配置。
3. Pages 自动识别 `functions/dav/[[path]].js` 并上传。
4. 访问 `https://jianguoyu.pages.dev`。

## 安装为 App
- iPhone：Safari → 分享 → 添加到主屏幕
- Android：Chrome → 菜单 → 安装
- 桌面：Chrome/Edge → 地址栏 ⊕ 安装

## 注意
- 数据在 localStorage；清除浏览器数据 = 清账，务必用“导出/备份”。
- PWA 离线缓存仅在 https:// 或 localhost 生效；file:// 双击也能用（走直连通道）。
- 备份文件建议 < 几 MB，避免触及 Worker CPU 限额。

# 管家 · 家庭账本（双通道版：Koofr + 坚果云）

## 目录结构
```
/
├─ index.html                  # 主程序（PWA 入口，已注入双通道下拉）
├─ manifest.webmanifest        # PWA 清单
├─ sw.js                       # 离线缓存（v2）
├─ offline.html                # 离线提示页
├─ icons/                      # 多尺寸图标
└─ functions/
   ├─ dav/[[path]].js          # Koofr 代理
   └─ nut/[[path]].js          # 坚果云代理
```

## 部署（3 步）
1. 解压本 zip，**全部文件**上传/推送到 GitHub 仓库根目录。
2. Cloudflare Pages 连接该仓库：生产分支 `main`，构建命令留空，输出目录留空。
3. 等待部署完成（显示 "Functions: Uploaded"）。

## 云同步（已默认填好坚果云）
| 通道 | 服务器地址 | 账号 | 密码 | 远程文件夹 |
|---|---|---|---|---|
| 坚果云（默认·已选） | `https://jianguoyu.pages.dev/nut/dav` | `125573798@qq.com` | 应用密码已填 | `/家庭管家备份/` |
| Koofr | `https://jianguoyu.pages.dev/dav/Koofr` | Koofr 邮箱 | Koofr 应用密码 | `/家庭管家备份/` |

使用者操作：**只点「测试连接」→ 成功后点「保存云同步设置」**，无需懂 WebDAV。

## 凭据说明
- 坚果云密码为「第三方应用密码」（截图确认：应用 `ims_backup`，授权 2026-10-08），非登录密码。
- 建议每 3~6 个月在坚果云「第三方应用管理」撤销并重发。

## ⚠️ 隐私提醒（重要）
`index.html` 内含明文的坚果云应用密码。
- 若仓库为 **Public**：请立即到坚果云撤销该应用密码，并将仓库改为 **Private**；或改用 Cloudflare Pages 环境变量注入（需改前端读取逻辑）。
- 若仓库为 **Private**：风险较低，但仍建议不要把仓库邀请无关协作者。

## 切换通道
前端下拉选「Koofr」即自动回填 Koofr 的服务器地址；选「坚果云」即回填坚果云地址。
原有「加密上传 / 下载恢复 / 本地备份 / 导出」功能与界面**未做任何改动**。

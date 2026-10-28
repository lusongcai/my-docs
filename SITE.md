# 个人阅读笔记站

网站地址：https://lusongcai.github.io/

笔记与网站源码均保存在本仓库的 `develop` 分支。发布流程位于
`lusongcai/lusongcai.github.io` 仓库的 `.github/workflows/deploy.yml`。

## 本地开发

需要 Node.js 24。

```bash
npm ci
npm run dev
```

```bash
npm run build
npm run check:site
npm run preview
```

## 更新与发布

照常在 Obsidian 中更新 Markdown，提交并推送到 `develop`。
部署仓库每天北京时间 06:23 自动拉取最新笔记并重新构建。
GitHub 定时任务可能延迟；需要立即更新时执行：

```bash
gh workflow run deploy.yml --repo lusongcai/lusongcai.github.io
```

也可在个人主页仓库的 Actions 页面运行 “Publish reading notes”。
构建使用公开仓库检出和 GitHub Pages 的部署身份，不需要个人令牌。

## 内容与设计

- 自动读取 WeRead 导出的书籍元数据、划线与评论。
- 以 `bookId` 去重，不发布 `.obsidian`、`.trash` 或插件文件。
- 首页、可搜索的全部书目、独立阅读页、章节目录和原文链接。
- Hallmark Riso 方向：蓝色正文、粉色操作强调、中文衬线阅读排版。
- 字体随站点提供；封面使用笔记中已有的地址，失败时显示书名与作者。
- 原 Markdown 不作修改。阅读页只整理展示格式。

## 域名

旧站绑定 `blog.lusongcai.cn`，2026-10-28 检查时无 DNS 解析。
本次发布使用 `lusongcai.github.io`，解除 Pages 中的失效域名绑定。
GitHub 在解绑域名时自动删除了原主页仓库中的 `CNAME`，其内容仍保留在
Git 历史中。旧笔记保留在源分支；新的工作流只发布 `dist` 产物。
如需恢复自定义域名，请先配置 DNS，再在 Pages 设置中绑定，
并同步修改 `astro.config.mjs` 中的 `site`。

# 嵌入式交互学习站

这是一套纯静态网站。读者无需安装 PHP、Node.js 或数据库。每个已有教程的 HTML 都内嵌 CSS 和 JavaScript，可以单独下载、离线打开、分享。

## 以后添加课程：只放文件，再上传

1. 把一个**完整、可独立打开的 HTML** 放入分类目录，例如 `8051/interrupt.html`。
2. 图片、脚本和样式尽量都内嵌在 HTML 中。不要复制旧版只有 `data-page` 的空页面壳；新课正文和交互应在这个 HTML 里。
3. 提交到 `main`，等待 Actions 中的 `Build catalog and deploy Pages` 显示绿色。
4. 分类页自动出现课程卡片，卡片有“打开课程”和“下载 HTML”。

不需要再修改 `topics`、`pageInfo`、`renderers` 或 `assets/site.js`。新增的独立 HTML 保留自己的排版和脚本，不会被站点样式覆盖。

第一次使用我在 GitHub 上提交的改造前，在本地项目目录先运行 `git pull --ff-only origin main`，把改动取回来；如提示本地改动冲突，先停下来处理，不要强推覆盖。

以后在项目目录执行：

```bash
git add .
git commit -m "增加课程"
git push origin main
```

也可以在 GitHub 网页进入分类目录，使用 `Add file → Upload files` 上传，效果一样。不要上传个人密码或其他不准备公开的文件。

## 标题、描述和排序（可选，不填也能收录）

- 标题：优先 `lesson-title`，其次 HTML 的 `<title>`，最后用文件名。
- 描述：优先 `lesson-description`，其次普通的 `description`。
- 顺序：`lesson-order` 数字越小越靠前；未指定时按文件名排序。
- 支持子文件夹、中文文件名、空格以及 `.html` / `.htm`。
- 分类根目录的 `index.html` 是分类入口，不作为课程收录；子目录里的 `index.html` 可作为课程。

```html
<title>51 单片机中断</title>
<meta name="description" content="观察中断请求与中断返回">
<meta name="lesson-order" content="50">
```

可用 `<meta name="lesson-hidden" content="true">` 不在菜单中列出某课，但这**不是访问控制**，文件依然公开。草稿和私人资料不要上传；以前导下划线命名的文件/目录不参与构建。

## 新增分类

新建顶层目录（例如 `rt-thread/`），放入完整 HTML，构建会生成分类入口，并加入首页和左侧菜单。不需要手动创建 `index.html`。

可选放置 `rt-thread/category.json`，设置中文名称和排序：

```json
{"title":"RT-Thread","description":"实时操作系统学习","order":8,"icon":"RT"}
```

`assets`、`scripts`、`tests`、`docs`、`node_modules`、`dist`、`build`、隐藏目录和以下划线开头的目录不作为分类。

## 单文件分享

在网站分类页点击“下载 HTML”，或在已有教程页点击“下载本课 HTML”。保存后的单个 HTML 已包含所需 CSS/JS，不需要把 `assets/` 发给别人。

离线文件中的课程实验可以运行；“返回目录”等导航链接需要完整站点或联网访问网站。新上传的独立 HTML 原样发布，请确保其自身没有依赖外部 CSS、JS、图片或在线服务，否则这些资源仍需另行下载或联网。

## 先在电脑上预览

1. 解压 ZIP。
2. 打开 `embedded-learning` 文件夹。
3. 双击最外层的 `index.html`。
4. 浏览器会打开学习站，滑块、按钮和计算器均可直接操作。

## 一次性设置 GitHub Pages

1. 进入仓库 `Settings → Pages`。
2. 把 `Build and deployment → Source` 改为 **GitHub Actions**（不再用 `Deploy from a branch`）。
3. 进入 `Actions → Build catalog and deploy Pages → Run workflow`，选择 `main` 运行一次。
4. 之后向 `main` 上传或 push HTML 时，会自动生成目录、合并 CSS/JS 并发布。

如果 Settings 页面没有权限，需要仓库管理员设置。不要添加个人访问令牌，工作流只使用 GitHub 提供的短期权限。

网站地址通常是：

`https://haojucan.github.io/-omMCU/`

工作流遵循 [GitHub 官方自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 本地可选构建（维护者使用）

若已安装 Node.js 22，无需 npm install：

```bash
node --test scripts/build-catalog.test.js
node scripts/build-catalog.js
```

双击 `_site/index.html` 预览新目录。`_site/` 是自动生成的发布文件夹，重新构建会清理它，不要在里面写课程。课程应放在根目录下的 `8051/` 等分类中。

如果想把最新目录和内嵌脚本同步回源 HTML（供本地双击预览），运行 `node scripts/build-catalog.js --sync`。

GitHub Actions 只发布 `_site`，不自动提交生成文件回 `main`，避免机器人提交与本地推送冲突。因此网页菜单会自动更新，但仓库中 `assets/catalog.generated.js` 和源 HTML 中的目录快照不会在每次构建后产生新提交；它们可用 `--sync` 更新。实际课程文件始终在仓库中。

已有课程的共享源码仍集中在 `assets/site.js`、`assets/style.css` 便于维护，构建后内嵌进每个 HTML；读者无需下载这些维护文件。自动脚本仅生成目录和打包，不会凭空生成新课程正文或交互逻辑。

## 最容易出错的一点

GitHub 仓库首页必须能直接看到最外层的 `index.html`。不要只上传一个仍然包着全部文件的 `embedded-learning` 文件夹，否则网站入口会多一层。

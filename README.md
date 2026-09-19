# 嵌入式交互学习站

这是一套纯静态网站，不需要安装 PHP、Node.js 或数据库。

## 先在电脑上预览

1. 解压 ZIP。
2. 打开 `embedded-learning` 文件夹。
3. 双击最外层的 `index.html`。
4. 浏览器会打开学习站，滑块、按钮和计算器均可直接操作。

## 第一次发布到 GitHub Pages

1. 登录 GitHub，点击右上角 `+` → `New repository`。
2. 仓库名称填写 `embedded-learning`，选择 `Public`，点击 `Create repository`。
3. 在仓库页面点击 `uploading an existing file` 或 `Add file` → `Upload files`。
4. 把本文件夹里的**所有内容**拖进去，包括 `assets`、`electronics`、`8051` 等文件夹和最外层 `index.html`。
5. 点击页面底部的 `Commit changes`。
6. 进入仓库 `Settings` → 左侧 `Pages`。
7. 在 `Build and deployment` 中选择 `Deploy from a branch`。
8. Branch 选择 `main`，文件夹选择 `/(root)`，点击 `Save`。
9. 等待约 1～5 分钟，刷新 Pages 页面，会出现网站地址。

网站地址通常是：

`https://你的用户名.github.io/embedded-learning/`

## 最容易出错的一点

GitHub 仓库首页必须能直接看到最外层的 `index.html`。不要只上传一个仍然包着全部文件的 `embedded-learning` 文件夹，否则网站入口会多一层。

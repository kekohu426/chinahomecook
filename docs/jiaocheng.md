教程：手把手教你启用 Chrome AI 功能
我为了打开 Chrome AI 功能，折腾了一天都没成功。
试过改 Chrome Flags、换不同版本、VPN 切换地区... 全都失败了。

最后发现 GitHub 上有个神器，3 条命令就搞定了

太不容易了😭！

Image
把完整教程分享给大家，建议收藏保存 📌
启用后能做什么？

查看我这里有详细的介绍↓



Google 王炸更新 Gemini 和 Chrome 合体 绞杀一切竞争对手...

📱 准备工作（2 分钟）
该方法来源于这里：https://github.com/lcandy2/enable-chrome-ai/blob/main/README.zh.md

你需要准备：
✅ 一台电脑（Windows/Mac/Linux 都行） 

✅ 已安装 Chrome 浏览器（任意版本） 

✅ Python 3.13+（没有的话先装一下）

💡 检查 Python 版本： 打开终端，输入 python3 --version 如果版本低于 3.13，去官网下载最新版： https://www.python.org/downloads/ （新手需要，一般老手这些都有）

🚀 三步启用（5 分钟搞定）
第一步：安装 uv 工具
这是一个超快的 Python 包管理器，比 pip 快 100 倍。

Mac 用户：

打开终端，输入：

curl -LsSf https://astral.sh/uv/install.sh | sh
Windows 用户：

powershell

powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
复制命令，粘贴到终端，回车执行即可。

第二步：配置环境（Mac 必做）
Mac 用户继续执行：

# 添加 uv 到环境变量
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# 立即生效
source ~/.zshrc

# 验证安装
uv --version
看到版本号就说明成功了 ✅

Windows 用户： 直接重启终端就好，无需额外操作。

第三步：运行脚本
# 1. 下载项目
git clone https://github.com/lcandy2/enable-chrome-ai.git
cd enable-chrome-ai

# 2. 安装依赖
uv sync

# 3. 运行脚本（关键步骤！）
uv run main.py
运行后会发生什么？

1️⃣ Chrome 自动关闭（不要慌） 

2️⃣ 脚本修改配置文件（几秒钟） 

3️⃣ Chrome 自动重启 

4️⃣ 终端提示 "按 Enter 完成" 5️⃣ 按下 Enter

完成！ 🎉

✅ 验证是否成功
打开 Chrome，地址栏右侧应该出现一个 ⭐ Ask Gemini 图标



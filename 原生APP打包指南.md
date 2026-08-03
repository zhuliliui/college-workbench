# 小朱工作台 · 打包成「真实 Android App」（Capacitor + 原生读写权限）

> **推荐：零环境在线打包** —— 不想在本机装 Android Studio / JDK / Gradle？看文末「八、在线打包（GitHub Actions）」：把代码推到 GitHub，点一下就云端出 apk，手机直接装。

> 目标：把现在的网页版工作台，套一层原生壳打包成 `.apk`，装到华为平板 / vivo 上就是**真正的原生应用**：
> - 数据存在**原生存储**（SharedPreferences），清浏览器缓存、卸载重装也不丢；
> - 通过 **Capacitor Filesystem** 拥有**真实的文件读写权限**——点「导出本地JSON」会把备份写成手机「下载」目录里的真实 `.json` 文件，可用文件管理器查看/复制/再导入。

---

## 一、本机准备（只需装一次）

1. **Node.js 18+**
   下载 https://nodejs.org （LTS 版），安装时勾选「Add to PATH」。装完命令行验证：
   ```
   node -v
   npm -v
   ```
2. **Git**（你已经有了，之前推 Gitee 用过）
3. **Android Studio**（用来出 apk）
   下载 https://developer.android.com/studio ，安装时勾选：
   - Android SDK
   - Android SDK Platform（建议 API 34，即 Android 14）
   - Android SDK Build-Tools
   - （Android Studio 自带 JDK 17，Gradle 需要它，不用单独装）

   首次打开 Android Studio 会让你下载 SDK，按提示装完即可。

---

## 二、在本项目目录执行（D:\buddycode\college-workbench）

打开 **PowerShell** 或 **CMD**，进入项目目录：

```
cd D:\buddycode\college-workbench
```

### 第 1 步：安装依赖（仅首次）
```
npm install
```
会安装 `@capacitor/*`（core / android / preferences / filesystem）。

### 第 2 步：打包前端到 dist/
```
npm run build
```
把 `index.html`、`js/`、`css/`、`assets/`（含 42 张 Hello Kitty 图标）等打包进 `dist/`。

### 第 3 步：生成安卓工程（仅首次）
```
npx cap add android
```
自动生成 `android/` 原生工程（Gradle 项目）。之后改代码**不用**再跑这步。

### 第 4 步：把前端同步进原生工程
```
npx cap sync android
```
每次改完网页代码后都要跑这一句（它内部会先 `npm run build` 再同步）。

### 第 5 步：用 Android Studio 打开
```
npx cap open android
```
自动唤起 Android Studio。

---

## 三、生成 APK / 直接装到手机

### 方式 A：插手机直接运行（最快验证）
1. 手机打开「开发者选项 → USB 调试」（华为：设置→关于手机→连点版本号 7 次开启开发者模式；vivo 同理）。
2. 数据线连电脑，手机弹窗选「传输文件 / 允许 USB 调试」。
3. Android Studio 顶部设备选你的手机，点绿色 ▶ Run，会自动装好并打开。

### 方式 B：出独立 APK 文件（发给别人 / 侧载）
Android Studio 菜单：**Build → Build Bundle(s) / APK(s) → Build APK(s)**
完成后右下角弹窗「locate」，得到的文件在：
```
android\app\build\outputs\apk\debug\app-debug.apk
```
把这个 `app-debug.apk` 传到手机，点它安装即可（华为/vivo 需在设置里允许「未知来源应用」安装）。

> 鸿蒙（HarmonyOS）系统有安卓兼容层，绝大多数华为平板能正常安装运行这个 apk。

---

## 四、关于「读写权限」的说明

- **数据持久**：原生环境自动切到 Capacitor Preferences（等价于原生 `SharedPreferences`），不再依赖浏览器 localStorage，清缓存/换浏览器都不会丢。
- **文件读写**：点「备份 → 导出本地JSON」，原生 App 会把备份写成真实文件落到手机**下载**目录（如 `cw-backup-20260803.json`），可在文件管理器里看到、复制、再用「导入本地JSON」读回来。
- **权限弹窗**：在 **Android 10 及以上**，写下载目录走系统 MediaStore，**不需要**任何文件权限弹窗；老安卓（≤9）若想兼容，可在 `android/app/src/main/AndroidManifest.xml` 的 `<manifest>` 里加：
  ```xml
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  ```
  （Capacitor 默认已带 `INTERNET` 权限，无需手加。）

---

## 五、以后怎么更新 App

改完网页代码后，在本项目目录重跑：
```
npx cap sync android
```
然后 Android Studio 里点 ▶ Run 或重新 Build APK 即可。若想顺手更新云端 PWA，另跑 `node deploy-gitee.js`（仅备份到 Gitee 仓库，Gitee Pages 已下线不出网页）或用 CloudStudio 重新部署。

---

## 六、静默热更新（免重装 apk）

现在前端改完，**不用重新打包 apk**，App 打开时自动拉新版本热替换。

### 原理
- 新增 `js/app-update.js`：原生 App 启动时拉取 `manifest.json`，版本号比本地新就下载 zip 并热切换（`CapacitorUpdater`），全程在原生层完成、不受浏览器缓存/CORS 影响。
- 更新包托管在 Gitee 仓库的 **`updates` 分支**（国内访问稳）：`https://gitee.com/monichang/college-workbench/raw/updates/manifest.json`。
- 首装时以打包进 apk 的 `dist/version.json` 为基线，避免重复下载同版本。

### 发布一次热更新（在本项目目录）
```
set GITEE_TOKEN=你的私人令牌
set GITEE_USER=monichang
node deploy-update.js            ← 版本号自动 +0.0.1
```
> 想指定版本：`node deploy-update.js --version 1.2.3`
> 只想本地打包不推送（测试）：`node deploy-update.js --no-push`

脚本会：重打包 dist → 压成 `update/cw-<版本>.zip` → 生成 `update/manifest.json` → 推到 Gitee `updates` 分支。
推送成功后，**用户手机上的 App 下次启动即自动更新**（顶部会弹「发现新版本，正在后台更新…」）。

### 需要新增的依赖（仅首次）
`npm install` 已包含 `@capgo/capacitor-updater`（即 CapacitorUpdater 全局，提供 download/set/reload）与 `@capacitor-community/http`（`package.json` 已加，用于原生层拉取 manifest 避开 CORS）。首次 `npx cap sync android` 会把它们同步进安卓工程；之后发布热更新**不需要**再开 Android Studio。

### 在安卓工程启用插件（仅首次）
若 `npx cap add android` 时已装好上述依赖，直接 `npx cap sync android` 即可；若先装了安卓工程后补的依赖，重跑一次 `npx cap sync android`。

---

## 七、常见问题

- **`npm install` 卡住/超时**：检查网络，或把 npm 源切到国内：`npm config set registry https://registry.npmmirror.com`。
- **`cap` 命令找不到**：用 `npx cap ...` 形式调用（已写进 package.json 脚本：`npm run cap:sync`）。
- **Android Studio 报 SDK 缺失**：按提示在 SDK Manager 装对应 API 的 Platform 与 Build-Tools。
- **手机连不上**：换根数据线、确认 USB 调试已开、驱动已装（vivo/华为可装官方手机助手）。

---

## 八、在线打包（GitHub Actions，零本机环境）★推荐

不用装 Android Studio / JDK / Gradle，全程在 GitHub 云端完成；公开仓库 Actions 免费且无限分钟。

### 前提
- 代码已推到 GitHub 公开仓库（本项目：`zhuliliui/college-workbench`）。
- 仓库里已包含：全部网页源码、`android/` 原生工程（已生成）、`.github/workflows/build-apk.yml`（已配好）。

### 一键出 APK
1. 打开 GitHub 仓库 → **Actions** 标签页 → 左侧 `Build Debug APK` → 右侧 **Run workflow** → 选分支点运行。
2. 等 3~6 分钟，运行结束后在页面下方 **Artifacts** 里下载 `college-workbench-debug-apk`（里面是 `app-debug.apk`）。
3. 把 `app-debug.apk` 传到手机，点它安装（华为/vivo 需在设置里允许「未知来源应用」安装）。

> debug 版自带系统签名，可直接安装；后续改完前端**重新 Run workflow** 即出新版 apk，无需动 Android Studio。

### 以后怎么发新版
- 改完网页代码 → 推到 GitHub（main/master）→ Actions 自动触发打包；也可手动 Run workflow。
- 若想**免重装 apk 的热更新**：仍用 `node deploy-update.js` 把更新包推到 Gitee `updates` 分支，App 下次启动自动热替换（见第六节）。

### 说明
- `android/` 是 Capacitor 生成的原生壳，`cap sync` 会把网页资源同步进去；CI 里 `npx cap sync` + Gradle `assembleDebug` 完成构建。
- 想要**签名 release 版（可上架）**：在 GitHub 仓库 **Settings → Secrets** 里配 `KEYSTORE_BASE64` 等，再扩展 workflow 用 `r0adkll/sign-android-release` 签名；自用 debug 版无需此步。

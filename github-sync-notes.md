# GitHub Repo 同步技術筆記

## 情境說明

將本地專案（無 git 歷史）首次同步到 GitHub，過程中遇到幾個常見問題並逐一解決。

---

## 步驟一：建立 GitHub Personal Access Token (PAT)

1. 前往 **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. 點選 **Generate new token (classic)**
3. 勾選 **`repo`** 權限
4. 複製 token（格式為 `ghp_...`）
5. ⚠️ **用完後記得 revoke**，避免 token 外洩

---

## 步驟二：初始化本地 Git Repo

```powershell
cd "你的專案資料夾"

# 初始化並指定預設分支為 main
git init -b main

# 設定使用者資訊
git config user.email "你的email"
git config user.name "你的名字"
```

---

## 步驟三：建立 GitHub Repo（用 API）

```powershell
$TOKEN = "ghp_你的token"

$headers = @{
    "Authorization" = "token $TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
    "Content-Type"  = "application/json"
}

$body = @{
    name      = "repo名稱"
    private   = $false
    auto_init = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.github.com/user/repos" `
    -Method POST -Headers $headers -Body $body -UseBasicParsing
```

---

## 步驟四：Commit 並 Push

```powershell
# 加入所有檔案
git add -A

# 建立第一個 commit
git commit -m "Initial commit"

# 加入遠端（token 嵌入 URL 用於驗證）
git remote add origin "https://使用者名:TOKEN@github.com/使用者名/repo名稱.git"

# Push
git push -u origin main

# Push 完成後，換回不含 token 的乾淨 URL
git remote set-url origin "https://github.com/使用者名/repo名稱.git"
```

---

## 之後每次更新的指令

```powershell
git add -A
git commit -m "說明這次改了什麼"
git push
```

---

## 遇到的問題與解法

### 問題 1：`config.lock` 造成 git 無法運作

**錯誤訊息：**
```
error: could not lock config file .git/config: File exists
fatal: not in a git directory
```

**原因：** 殘留的 `.git/config.lock` 讓 git 認為有另一個程序正在寫入。

**解法：**
```powershell
# 刪除殘留的 lock 檔
Remove-Item ".git\config.lock" -Force

# 或直接重新初始化（刪掉整個 .git 資料夾）
Remove-Item ".git" -Recurse -Force
git init -b main
```

---

### 問題 2：Push 被拒絕 — `repository rule violations`

**錯誤訊息：**
```
remote rejected: push declined due to repository rule violations
```

**原因：** Commit 裡包含 GitHub PAT token（在 `.ps1` 腳本中），被 **GitHub Push Protection（Secret Scanning）** 偵測並封鎖。

**解法：** 把含有 token 的檔案從 commit 移除，再重新 push。

```powershell
# 從 git 追蹤中移除該檔案（但保留本地檔案）
git rm --cached setup-github.ps1

# 將該檔案加入 .gitignore
Add-Content .gitignore "`nsetup-github.ps1"

# 修改上一個 commit（不更改 commit message）
git add .gitignore
git commit --amend --no-edit

# 重新 push
git push -u origin main
```

---

## 安全注意事項

| 項目 | 建議 |
|------|------|
| PAT Token | 用完即 revoke，勿留在 repo |
| `.env.local` | 確認已加入 `.gitignore` |
| 含 token 的腳本 | 不要 commit 進 repo |
| GitHub Push Protection | 預設開啟，會自動偵測並阻擋含 secret 的 push |

---

## 常用 Git 指令速查

```powershell
git status                    # 查看目前狀態
git log --oneline             # 查看 commit 歷史
git show --stat HEAD          # 查看最新 commit 包含哪些檔案
git remote -v                 # 查看遠端設定
git rm --cached <檔案>        # 從 git 移除追蹤（保留本地檔案）
git commit --amend --no-edit  # 修改上一個 commit（不改 message）
git push -u origin main       # 第一次 push 並設定 upstream
git push                      # 之後每次 push
```

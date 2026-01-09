# 訂單流程追蹤系統

完整的訂單追蹤管理系統，使用 Flask Blueprint 架構，可獨立運行也可整合到主應用。

## 功能特性

- ✅ **訂單管理** - 完整的訂單CRUD、狀態追蹤
- ✅ **智能提醒** - 紅/黃/綠燈系統，自動標記逾期訂單
- ✅ **快速更新** - 一鍵更新訂單狀態（支持Shift+點擊填寫詳情）
- ✅ **修圖需求** - 管理無訂單號的修圖任務
- ✅ **用戶認證** - Session（網頁）+ JWT（API）雙重認證
- ✅ **權限管理** - 管理員vs查看者
- ✅ **RESTful API** - 完整的API接口，支持APP接入
- ✅ **響應式設計** - 暗黑主題，支持移動端

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 獨立運行

```bash
cd order_tracking
python app.py
```

訪問：http://localhost:5000/tracking

### 預設帳號

- **管理員**: admin / admin123
- **查看者**: viewer / viewer123

## 項目結構

```
order_tracking/
├── __init__.py          # Blueprint入口，包含所有路由
├── models.py            # 數據模型和數據庫操作
├── config.py            # 配置文件
├── app.py               # 獨立運行入口
├── requirements.txt     # Python依賴
├── static/
│   ├── tracking.css     # 統一樣式表
│   └── tracking.js      # 統一JavaScript
├── templates/
│   └── tracking/        # HTML模板
│       ├── base.html
│       ├── login.html
│       ├── index.html
│       ├── orders.html
│       ├── order_detail.html
│       ├── order_form.html
│       ├── revisions.html
│       ├── revision_detail.html
│       └── reports.html
└── data/
    └── tracking.db      # SQLite數據庫（自動創建）
```

## 整合到主應用

```python
from flask import Flask
from order_tracking import tracking_bp, init_app as init_tracking

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# 初始化
init_tracking(app)

# 或者手動註冊
# app.register_blueprint(tracking_bp)

if __name__ == '__main__':
    app.run()
```

訪問：http://localhost:5000/tracking

## API使用

### 登入獲取Token

```bash
POST /tracking/api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

### 使用Token調用API

```bash
GET /tracking/api/orders?light=red
Authorization: Bearer <your_token>
```

詳細API文檔請參考：`訂單流程追蹤系統-API和APP接入文檔.md`

## 技術棧

- **後端**: Flask + SQLite
- **前端**: HTML5 + CSS3 + JavaScript
- **認證**: Session + JWT
- **字體**: Noto Sans SC + JetBrains Mono

## 主要功能

### 訂單管理
- 新增/編輯/刪除訂單
- 訂單狀態追蹤（新訂單 → 圖稿確認 → 打樣 → 生產 → 完成）
- 狀態歷史記錄
- 快速更新狀態（一鍵操作）

### 智能提醒
- 🔴 紅燈：逾期訂單（需立即處理）
- 🟡 黃燈：需注意訂單（即將逾期）
- 🟢 綠燈：正常進行

### 修圖需求
- 自動生成編號（REV-日期-流水號）
- 可轉為正式訂單
- 狀態管理

## 開發計劃

- [x] 基礎架構
- [x] 訂單管理
- [x] 修圖需求管理
- [x] 用戶認證
- [x] RESTful API
- [ ] 圖片上傳（預留）
- [ ] Excel匯入/匯出
- [ ] 統計圖表

## 許可證

MIT License


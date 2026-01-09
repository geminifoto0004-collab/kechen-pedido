# 📦 訂單流程追蹤系統

## 🚀 快速開始

### 入口文件

**主要入口**：項目根目錄的 `app.py`

```bash
python app.py
```

### 訪問地址

```
http://localhost:5000/tracking
```

### 登入頁面

訪問 `http://localhost:5000/tracking` 時：
- 如果**未登入** → 自動跳轉到登入頁面：`/tracking/login`
- 如果**已登入** → 自動跳轉到主頁：`/tracking/index`

### 預設帳號

- **管理員**：`admin` / `admin123` （可以新增、編輯、刪除訂單）
- **查看者**：`viewer` / `viewer123` （只能查看訂單）

## 📁 項目結構

```
KECHEN PEDIDO/
├── app.py                      # 主入口文件（運行這個）
├── order_tracking/
│   ├── __init__.py            # Blueprint 路由定義
│   ├── models.py              # 數據庫模型
│   ├── config.py              # 配置文件
│   ├── static/
│   │   └── tracking.css       # 樣式文件
│   └── templates/tracking/
│       ├── base.html          # 基礎模板
│       ├── login.html         # 登入頁面
│       ├── index.html         # 主頁（訂單列表）
│       ├── order_detail.html  # 訂單詳情
│       ├── order_form.html    # 訂單表單（編輯用）
│       └── reports.html       # 報表頁面
└── order_tracking.db          # SQLite 數據庫（自動生成）
```

## 🎯 主要功能

1. **登入系統** - Session 認證
2. **訂單管理** - CRUD 操作
3. **狀態追蹤** - 紅/黃/綠燈提醒
4. **快速更新** - Shift+點擊快速更新
5. **詢價/修圖** - 無訂單號的詢價需求
6. **報表統計** - 客戶訂單報表

## 🔧 技術棧

- **後端**：Flask (Blueprint)
- **數據庫**：SQLite
- **前端**：HTML + CSS + JavaScript
- **認證**：Session (Web) + JWT (API)

## 📝 使用說明

1. 運行 `python app.py`
2. 瀏覽器訪問 `http://localhost:5000/tracking`
3. 使用預設帳號登入
4. 開始使用訂單追蹤系統

## 🎨 設計參考

UI 設計參考了 `V8.html` 和 `v9.html`，採用暗黑主題設計。

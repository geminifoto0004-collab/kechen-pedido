# 訂單追蹤系統 - 項目重構指南

## 📋 目標

將現有的單一 HTML 文件拆分成前後端分離的專業項目結構：

* **前端** ：HTML + CSS + JavaScript
* **後端** ：Python (Flask/FastAPI)
* **數據庫** ：PostgreSQL/MySQL

---

## 📁 目標項目結構

```
order-tracking-system/
├── backend/
│   ├── app.py                    # 主應用入口
│   ├── config.py                 # 配置文件
│   ├── requirements.txt          # Python 依賴
│   ├── models/
│   │   ├── __init__.py
│   │   ├── order.py              # 訂單模型
│   │   └── order_history.py      # 訂單狀態歷史模型
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── orders.py             # 訂單相關 API
│   │   └── history.py            # 歷史記錄 API
│   ├── services/
│   │   ├── __init__.py
│   │   ├── order_service.py      # 訂單業務邏輯
│   │   └── alert_service.py      # 紅黃綠燈邏輯
│   └── database/
│       ├── __init__.py
│       ├── db.py                 # 數據庫連接
│       └── migrations/           # 數據庫遷移腳本
│           └── init.sql
│
├── frontend/
│   ├── index.html                # 主頁面
│   ├── css/
│   │   ├── variables.css         # CSS 變量（顏色、字體）
│   │   ├── base.css              # 基礎樣式（重置、通用）
│   │   ├── layout.css            # 布局樣式（容器、網格）
│   │   ├── components.css        # 組件樣式（按鈕、卡片）
│   │   ├── table.css             # 表格樣式
│   │   ├── timeline.css          # 時間軸樣式
│   │   ├── modal.css             # Modal 樣式
│   │   └── responsive.css        # 響應式樣式
│   ├── js/
│   │   ├── config.js             # 前端配置（API URL、常量）
│   │   ├── api.js                # API 請求封裝
│   │   ├── utils.js              # 工具函數
│   │   ├── components/
│   │   │   ├── table.js          # 表格相關功能
│   │   │   ├── timeline.js       # 時間軸相關功能
│   │   │   ├── modal.js          # Modal 相關功能
│   │   │   └── filters.js        # 過濾器功能
│   │   └── main.js               # 主入口
│   └── assets/
│       └── images/
│
├── docs/
│   ├── API.md                    # API 文檔
│   ├── DATABASE.md               # 數據庫設計文檔
│   └── DEPLOYMENT.md             # 部署文檔
│
├── .env.example                  # 環境變量示例
├── .gitignore
└── README.md                     # 項目說明
```

---

## 🎨 CSS 分離規則

### **1. variables.css** - CSS 變量

```css
:root {
    /* 顏色系統 */
    --blue: #2563eb;
    --red: #ef4444;
    --yellow: #f59e0b;
    --green: #10b981;
    --gray: #6b7280;
  
    /* 背景顏色 */
    --bg: #f8fafc;
    --card: #ffffff;
    --border: #e2e8f0;
  
    /* 文字顏色 */
    --text: #0f172a;
    --text-2: #475569;
    --text-3: #94a3b8;
  
    /* 間距 */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
  
    /* 字體 */
    --font-primary: system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}
```

### **2. base.css** - 基礎樣式

```css
/* CSS Reset */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* 全局樣式 */
body {
    font-family: var(--font-primary);
    background: var(--bg);
    color: var(--text);
}

/* 通用類 */
.hidden { display: none; }
.text-center { text-align: center; }
```

### **3. layout.css** - 布局

```css
/* 容器 */
.container { max-width: 1400px; margin: 0 auto; padding: 2rem; }

/* 網格系統 */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
```

### **4. components.css** - 組件

```css
/* 按鈕 */
.btn { ... }
.btn.primary { ... }
.btn.secondary { ... }

/* 卡片 */
.card { ... }

/* 徽章 */
.badge { ... }
```

### **5. table.css** - 表格

```css
/* 表格容器和樣式 */
.table-wrapper { ... }
.table-container { ... }
table { ... }
thead { ... }
tbody { ... }
```

### **6. timeline.css** - 時間軸

```css
/* 橫向時間軸 */
.timeline-horizontal { ... }
.timeline-step { ... }

/* 詳細記錄表格 */
.timeline-detailed { ... }
```

### **7. modal.css** - Modal

```css
/* Modal 容器 */
.modal-overlay { ... }
.modal { ... }

/* Modal 內容 */
.modal-header { ... }
.modal-body { ... }
.modal-footer { ... }
```

### **8. responsive.css** - 響應式

```css
@media (max-width: 1400px) { ... }
@media (max-width: 768px) { ... }
```

---

## 🔧 JavaScript 分離規則

### **1. config.js** - 配置

```javascript
const CONFIG = {
    API_BASE_URL: '/api',
    PAGE_SIZE: 50,
    ALERT_THRESHOLDS: {
        '圖稿製作中': { green: 3, yellow: 5, red: 5 },
        '圖稿待確認': { green: 5, yellow: 7, red: 7 },
        '打樣製作中': { green: 5, yellow: 7, red: 7 },
        '樣品待確認': { green: 7, yellow: 10, red: 10 },
        '生產中': { green: 15, yellow: 20, red: 20 }
    }
};
```

### **2. api.js** - API 封裝

```javascript
class API {
    static async getOrders(page = 1, limit = 50) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/orders?page=${page}&limit=${limit}`);
        return await response.json();
    }
  
    static async getOrderHistory(orderId) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/orders/${orderId}/history`);
        return await response.json();
    }
  
    static async updateOrderStatus(orderId, newStatus, note) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, note })
        });
        return await response.json();
    }
  
    static async deleteLastStep(orderId, reason) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/orders/${orderId}/history/last`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        return await response.json();
    }
}
```

### **3. utils.js** - 工具函數

```javascript
class Utils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  
    static calculateDays(hours) {
        return Math.round(hours / 24);
    }
  
    static getAlertLevel(status, days) {
        const threshold = CONFIG.ALERT_THRESHOLDS[status];
        if (!threshold) return 'green';
        if (days > threshold.red) return 'red';
        if (days > threshold.yellow) return 'yellow';
        return 'green';
    }
  
    static getAlertIcon(level) {
        const icons = { red: '🔴', yellow: '🟡', green: '🟢' };
        return icons[level] || '⚫';
    }
}
```

### **4. components/table.js** - 表格功能

```javascript
class TableManager {
    constructor() {
        this.expandedRows = new Set();
    }
  
    toggleDetail(rowId, event) {
        if (event.target.closest('.actions')) return;
      
        const detailRow = document.getElementById(`detail-${rowId}`);
        const expandBtn = document.getElementById(`expand-${rowId}`);
      
        if (this.expandedRows.has(rowId)) {
            detailRow.style.display = 'none';
            expandBtn.textContent = '▶';
            this.expandedRows.delete(rowId);
        } else {
            detailRow.style.display = 'table-row';
            expandBtn.textContent = '▼';
            this.expandedRows.add(rowId);
        }
    }
  
    async loadOrders() {
        const data = await API.getOrders(1, 50);
        this.renderOrders(data.orders);
    }
  
    renderOrders(orders) {
        // 渲染邏輯
    }
}
```

### **5. components/timeline.js** - 時間軸功能

```javascript
class TimelineManager {
    constructor() {
        this.historyCache = {};
    }
  
    async toggleDetailedTimeline(orderId) {
        const container = document.getElementById(`timeline-detailed-${orderId}`);
        const button = document.getElementById(`toggle-btn-${orderId}`);
      
        if (container.classList.contains('show')) {
            container.classList.remove('show');
            button.textContent = '📋 查看詳細記錄';
        } else {
            await this.loadHistory(orderId);
            container.classList.add('show');
            button.textContent = '✕ 收起詳細記錄';
        }
    }
  
    async loadHistory(orderId) {
        if (this.historyCache[orderId]) {
            this.renderHistory(orderId, this.historyCache[orderId]);
            return;
        }
      
        const data = await API.getOrderHistory(orderId);
        this.historyCache[orderId] = data.history;
        this.renderHistory(orderId, data.history);
    }
  
    renderHistory(orderId, history) {
        // 渲染詳細歷史
    }
}
```

### **6. components/modal.js** - Modal 功能

```javascript
class ModalManager {
    showActionModal(action, from, to, orderId) {
        // 顯示操作確認 Modal
    }
  
    showDetailsMenu(orderId) {
        // 顯示詳情選單 Modal
    }
  
    showBackStepModal() {
        // 顯示退回步驟選擇 Modal
    }
  
    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.classList.remove('show');
        });
    }
  
    async confirmAction() {
        const note = document.getElementById('actionNote').value;
        const orderId = currentOrderId;
        const newStatus = currentNewStatus;
      
        await API.updateOrderStatus(orderId, newStatus, note);
        this.closeModal();
        await tableManager.loadOrders();
    }
}
```

### **7. components/filters.js** - 過濾功能

```javascript
class FilterManager {
    toggleCompletedOrders(checkbox) {
        const rows = document.querySelectorAll('tr.completed');
        rows.forEach(row => {
            row.style.display = checkbox.checked ? '' : 'none';
        });
    }
  
    toggleCancelledOrders(checkbox) {
        const rows = document.querySelectorAll('tr.cancelled');
        rows.forEach(row => {
            row.style.display = checkbox.checked ? '' : 'none';
        });
    }
  
    toggleSubstatus(filterId) {
        const dropdown = document.getElementById(`dropdown-${filterId}`);
        dropdown.classList.toggle('show');
    }
}
```

### **8. main.js** - 主入口

```javascript
// 全局實例
let tableManager;
let timelineManager;
let modalManager;
let filterManager;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    tableManager = new TableManager();
    timelineManager = new TimelineManager();
    modalManager = new ModalManager();
    filterManager = new FilterManager();
  
    await tableManager.loadOrders();
  
    // 綁定全局事件
    setupGlobalEventListeners();
});

function setupGlobalEventListeners() {
    // Modal 點擊外部關閉
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            modalManager.closeModal();
        }
    });
  
    // 步驟菜單點擊外部關閉
    document.addEventListener('click', () => {
        document.querySelectorAll('.step-action-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    });
}
```

---

## 🗄️ 數據庫設計

### **表結構**

#### **1. orders (訂單表)**

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(50),
    quantity VARCHAR(50),
    factory VARCHAR(100),
    product_type VARCHAR(100),
    current_status VARCHAR(50) NOT NULL,
    current_status_since TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_order_id ON orders(order_id);
CREATE INDEX idx_current_status ON orders(current_status);
CREATE INDEX idx_is_deleted ON orders(is_deleted);
```

#### **2. order_status_history (訂單狀態歷史表)**

```sql
CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    entered_at TIMESTAMP NOT NULL,
    exited_at TIMESTAMP,
    duration_hours INTEGER,
    note TEXT,
    action_type VARCHAR(20) NOT NULL, -- forward, backward, skip, cancel
    revision INTEGER DEFAULT 1,
    skipped_steps TEXT,
    back_from VARCHAR(50),
  
    -- 修改/刪除追蹤
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),
    delete_reason TEXT,
  
    note_edited BOOLEAN DEFAULT FALSE,
    note_edit_history JSONB,
  
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX idx_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_history_is_deleted ON order_status_history(is_deleted);
CREATE INDEX idx_history_status ON order_status_history(status);
```

---

## 🔌 後端 API 設計

### **基礎結構 - app.py**

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
from models.order import Order
from models.order_history import OrderHistory
from services.order_service import OrderService
from services.alert_service import AlertService

app = Flask(__name__)
CORS(app)

# 載入配置
app.config.from_object('config.Config')

# API Routes
from routes.orders import orders_bp
from routes.history import history_bp

app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(history_bp, url_prefix='/api/history')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### **API 端點**

#### **1. 獲取訂單列表**

```
GET /api/orders?page=1&limit=50&status=&factory=

Response:
{
    "orders": [
        {
            "orderId": "#1007273",
            "orderDate": "2025-12-05",
            "customer": "SERGIO CONDE",
            "productCode": "PRD-2025-001",
            "quantity": "500 碼",
            "factory": "廣州工廠",
            "currentStatus": "樣品待確認",
            "currentStatusSince": "2025-12-15 08:00:00",
            "daysInStatus": 15,
            "alertLevel": "red",
            "productType": "冰絲印花",
            "note": "等國外確認"
        }
    ],
    "total": 420,
    "page": 1,
    "limit": 50
}
```

#### **2. 獲取訂單詳細歷史**

```
GET /api/orders/{order_id}/history

Response:
{
    "orderId": "#1007273",
    "history": [
        {
            "id": 1,
            "status": "新訂單",
            "enteredAt": "2025-12-05 10:00:00",
            "exitedAt": "2025-12-05 14:00:00",
            "durationHours": 4,
            "note": null,
            "actionType": "forward",
            "createdBy": "張三"
        },
        {
            "id": 2,
            "status": "圖稿製作中",
            "enteredAt": "2025-12-05 14:00:00",
            "exitedAt": "2025-12-08 09:00:00",
            "durationHours": 67,
            "note": "中國做圖",
            "actionType": "forward",
            "createdBy": "張三"
        }
    ]
}
```

#### **3. 更新訂單狀態**

```
POST /api/orders/{order_id}/status

Request Body:
{
    "status": "準備生產",
    "note": "樣品已確認",
    "actionType": "forward"
}

Response:
{
    "success": true,
    "orderId": "#1007273",
    "newStatus": "準備生產"
}
```

#### **4. 撤銷最後一步**

```
DELETE /api/orders/{order_id}/history/last

Request Body:
{
    "reason": "點錯了，應該是需要修改"
}

Response:
{
    "success": true,
    "orderId": "#1007273",
    "deletedStepId": 6,
    "restoredStatus": "打樣製作中"
}
```

#### **5. 編輯步驟備註**

```
PATCH /api/orders/{order_id}/history/{step_id}/note

Request Body:
{
    "note": "已發圖給SERGIO先生（修正）",
    "reason": "寫錯了客戶名字"
}

Response:
{
    "success": true,
    "stepId": 3,
    "oldNote": "已發圖給客戶",
    "newNote": "已發圖給SERGIO先生（修正）"
}
```

#### **6. 退回到之前步驟**

```
POST /api/orders/{order_id}/back-to

Request Body:
{
    "targetStatus": "圖稿待確認",
    "reason": "圖稿需要重新確認",
    "note": "客戶要求改顏色"
}

Response:
{
    "success": true,
    "orderId": "#1007273",
    "fromStatus": "樣品待確認",
    "toStatus": "圖稿待確認"
}
```

#### **7. 跳過步驟**

```
POST /api/orders/{order_id}/skip

Request Body:
{
    "targetStatus": "準備生產",
    "skippedSteps": ["準備打樣", "打樣製作中", "樣品待確認"],
    "reason": "客戶要求直接生產",
    "note": "跳過打樣階段"
}

Response:
{
    "success": true,
    "orderId": "#1007273",
    "skippedSteps": ["準備打樣", "打樣製作中", "樣品待確認"],
    "newStatus": "準備生產"
}
```

---

## 🔐 環境變量 (.env)

```bash
# 數據庫配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=order_tracking
DB_USER=postgres
DB_PASSWORD=your_password

# 應用配置
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DEBUG=True

# API 配置
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 分頁配置
DEFAULT_PAGE_SIZE=50
MAX_PAGE_SIZE=200

# 緩存配置
CACHE_ENABLED=True
CACHE_TTL=300
```

---

## 📝 重構步驟

### **Phase 1: 拆分靜態資源**

1. ✅ 創建項目目錄結構
2. ✅ 將 CSS 拆分成 8 個文件
3. ✅ 將 JavaScript 拆分成模塊
4. ✅ 更新 HTML 引用路徑

### **Phase 2: 後端開發**

1. ✅ 設計數據庫表結構
2. ✅ 創建 Flask 應用骨架
3. ✅ 實現 ORM 模型
4. ✅ 開發 API 端點
5. ✅ 實現業務邏輯服務

### **Phase 3: 前後端整合**

1. ✅ 替換硬編碼數據為 API 調用
2. ✅ 實現加載狀態和錯誤處理
3. ✅ 測試所有功能

### **Phase 4: 優化與部署**

1. ✅ 添加緩存機制
2. ✅ 性能優化
3. ✅ 編寫部署文檔
4. ✅ 配置生產環境

---

## 🚀 關鍵技術點

### **1. 按需加載優化**

```javascript
// 只有展開時才加載詳細歷史
async toggleDetailedTimeline(orderId) {
    if (!this.historyCache[orderId]) {
        // 第一次展開才請求後端
        const data = await API.getOrderHistory(orderId);
        this.historyCache[orderId] = data.history;
    }
    // 渲染緩存的數據
    this.renderHistory(orderId, this.historyCache[orderId]);
}
```

### **2. 紅黃綠燈計算**

```python
# services/alert_service.py
class AlertService:
    THRESHOLDS = {
        '圖稿製作中': {'green': 3, 'yellow': 5, 'red': 5},
        '圖稿待確認': {'green': 5, 'yellow': 7, 'red': 7},
        '打樣製作中': {'green': 5, 'yellow': 7, 'red': 7},
        '樣品待確認': {'green': 7, 'yellow': 10, 'red': 10},
        '生產中': {'green': 15, 'yellow': 20, 'red': 20}
    }
  
    @staticmethod
    def get_alert_level(status, days):
        threshold = AlertService.THRESHOLDS.get(status)
        if not threshold:
            return 'green'
      
        if days > threshold['red']:
            return 'red'
        elif days > threshold['yellow']:
            return 'yellow'
        return 'green'
```

### **3. 軟刪除實現**

```python
# services/order_service.py
def undo_last_step(order_id, reason, user):
    # 找到最後一步
    last_step = OrderHistory.query.filter_by(
        order_id=order_id,
        is_deleted=False
    ).order_by(OrderHistory.id.desc()).first()
  
    # 軟刪除
    last_step.is_deleted = True
    last_step.deleted_at = datetime.now()
    last_step.deleted_by = user
    last_step.delete_reason = reason
  
    db.session.commit()
  
    # 更新訂單當前狀態為上一步
    previous_step = OrderHistory.query.filter_by(
        order_id=order_id,
        is_deleted=False
    ).order_by(OrderHistory.id.desc()).first()
  
    order = Order.query.filter_by(order_id=order_id).first()
    order.current_status = previous_step.status
    order.current_status_since = previous_step.entered_at
  
    db.session.commit()
```

---

## 📚 依賴清單

### **Python (requirements.txt)**

```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

### **前端**

* 無外部依賴
* 純 Vanilla JavaScript
* CSS 使用原生變量

---

## ✅ 驗收標準

### **功能完整性**

* [ ] 所有原有功能正常工作
* [ ] 新增功能（按需加載、撤銷、編輯）正常
* [ ] Modal 所有操作正常
* [ ] 過濾和搜索正常

### **性能指標**

* [ ] 初始加載時間 < 1 秒
* [ ] 展開詳細歷史 < 500ms
* [ ] API 響應時間 < 200ms
* [ ] 支持 10,000+ 訂單不卡頓

### **代碼質量**

* [ ] CSS 模塊化，無重複
* [ ] JavaScript 組件化，職責清晰
* [ ] API 設計 RESTful
* [ ] 數據庫設計規範

### **用戶體驗**

* [ ] 加載狀態提示
* [ ] 錯誤信息友好
* [ ] 操作反饋及時
* [ ] 響應式設計良好

---

## 🔧 開發工具建議

* **編輯器** ：VS Code
* **數據庫工具** ：DBeaver / pgAdmin
* **API 測試** ：Postman / Insomnia
* **版本控制** ：Git
* **代碼格式化** ：Prettier (JS/CSS), Black (Python)

---

## 📞 注意事項

1. **數據遷移** ：現有數據需要編寫遷移腳本導入新數據庫
2. **權限控制** ：後續需要添加用戶認證和權限管理
3. **日誌記錄** ：建議添加操作日誌記錄所有修改
4. **備份策略** ：定期備份數據庫
5. **監控告警** ：生產環境需要添加監控和告警

---

## 🎯 下一步計劃

1. **Phase 1** ：完成靜態資源拆分（預計 1 天）
2. **Phase 2** ：開發後端 API（預計 3 天）
3. **Phase 3** ：前後端整合（預計 2 天）
4. **Phase 4** ：測試和優化（預計 1 天）
5. **Phase 5** ：部署上線（預計 1 天）

**總計：約 8 個工作天**

---

*本文檔由 AI 生成，請根據實際情況調整*

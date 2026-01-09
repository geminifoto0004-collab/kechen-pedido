# 訂單流程追蹤系統 - API和APP接入補充文檔

**版本**: 3.0  
**日期**: 2026-01-08  
**主文檔**: 訂單流程追蹤系統需求文檔_v3.0.md  

本文檔是主需求文檔的補充，專門說明用戶認證、RESTful API設計和APP接入方案。

---

## 📋 目錄

1. [用戶認證系統](#用戶認證系統)
2. [RESTful API設計](#restful-api設計)
3. [APP接入指南](#app接入指南)

---

## 用戶認證系統

### 設計原則

- ✅ **簡單實用** - 固定用戶，不需要註冊功能
- ✅ **雙重認證** - 網頁用Session，APP用JWT
- ✅ **權限分離** - 管理員vs查看者
- ✅ **安全可靠** - 密碼加密，Token有效期

### 用戶類型

#### **管理員（admin）**
```
權限：
├─ ✅ 查看所有訂單
├─ ✅ 新增/編輯/刪除訂單
├─ ✅ 快速更新狀態
├─ ✅ 添加備註
├─ ✅ 匯出報表
└─ ✅ 系統設定
```

#### **查看者（viewer）**
```
權限：
├─ ✅ 查看所有訂單
├─ ✅ 搜尋和篩選
├─ ✅ 查看訂單詳情
├─ ✅ 查看歷史記錄
├─ ✅ 匯出報表
└─ ❌ 不能修改任何資料
```

### 初始用戶

系統預設創建兩個用戶：

```sql
INSERT INTO users (username, password_hash, display_name, role) VALUES
('admin', '$2b$12$...hashed...', '國內管理員', 'admin'),
('viewer', '$2b$12$...hashed...', '國外查看', 'viewer');
```

**預設密碼：**
- admin: `admin123`
- viewer: `viewer123`

### 網頁認證（Session）

#### **登入流程：**
```
1. 用戶訪問 /tracking/login
2. 輸入用戶名密碼
3. 後端驗證
4. 成功 → 存入session，重定向到主頁
5. 失敗 → 顯示錯誤信息
```

#### **Session內容：**
```python
session['user_id'] = 1
session['username'] = 'admin'
session['display_name'] = '國內管理員'
session['role'] = 'admin'
```

#### **登入保持：**
```
勾選「記住我」：
└─ Cookie有效期：7天
```

#### **權限檢查裝飾器：**
```python
@login_required          # 需要登入
def view_orders():
    pass

@admin_required          # 需要管理員權限
def update_order():
    pass
```

### APP認證（JWT Token）

#### **登入流程：**
```
1. APP發送POST請求到 /tracking/api/auth/login
   {
       "username": "admin",
       "password": "admin123"
   }

2. 後端驗證成功，生成JWT Token
   Token內容：
   {
       "user_id": 1,
       "username": "admin",
       "role": "admin",
       "exp": 1234567890  # 7天後過期
   }

3. 返回Token給APP
   {
       "success": true,
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
           "id": 1,
           "username": "admin",
           "display_name": "國內管理員",
           "role": "admin"
       }
   }

4. APP保存Token到本地存儲

5. 後續API請求都帶上Token
   Headers: {
       "Authorization": "Bearer eyJhbGci..."
   }
```

#### **Token驗證裝飾器：**
```python
@api_login_required      # API需要登入
def api_get_orders():
    pass

@api_admin_required      # API需要管理員權限
def api_update_order():
    pass
```

### 密碼加密

使用 **bcrypt** 加密密碼：

```python
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

# 加密
hashed = bcrypt.generate_password_hash('admin123').decode('utf-8')

# 驗證
is_valid = bcrypt.check_password_hash(hashed, 'admin123')  # True
```

### 界面差異

#### **管理員界面：**
```
頂部工具欄：
[🔍搜尋] [匯入] [匯出] [+ 新增訂單]  👤 國內管理員

訂單表格：
- 有「操作」欄
- 懸停顯示快速更新按鈕
```

#### **查看者界面：**
```
頂部工具欄：
[🔍搜尋] [匯出]  👤 國外查看

訂單表格：
- 無「操作」欄
- 無快速更新按鈕
- 無「新增訂單」按鈕
```

---

## RESTful API設計

### API設計原則

- ✅ **RESTful標準** - 使用HTTP方法語義
- ✅ **統一格式** - 所有響應格式一致
- ✅ **版本控制** - URL包含版本號（預留）
- ✅ **錯誤處理** - 清晰的錯誤信息
- ✅ **文檔完整** - 每個接口都有說明

### API基礎URL

```
開發環境：http://localhost:5000/tracking/api
生產環境：http://your-server.com/tracking/api
```

### 統一響應格式

#### **成功響應：**
```json
{
    "success": true,
    "data": { ... },
    "message": "操作成功"
}
```

#### **失敗響應：**
```json
{
    "success": false,
    "error": "錯誤描述",
    "code": "ERROR_CODE"
}
```

#### **列表響應：**
```json
{
    "success": true,
    "data": [ ... ],
    "total": 100,
    "page": 1,
    "per_page": 20
}
```

### API完整列表

#### **認證API**

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登入 | 無 |
| POST | `/api/auth/logout` | 登出 | 需登入 |
| GET | `/api/auth/me` | 獲取當前用戶信息 | 需登入 |

#### **訂單API**

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | `/api/orders` | 獲取訂單列表 | 需登入 |
| GET | `/api/orders/:number` | 獲取訂單詳情 | 需登入 |
| POST | `/api/orders` | 新增訂單 | Admin |
| PUT | `/api/orders/:number` | 更新訂單 | Admin |
| DELETE | `/api/orders/:number` | 刪除訂單 | Admin |
| POST | `/api/orders/quick-update` | 快速更新狀態 | Admin |
| GET | `/api/orders/:number/history` | 獲取訂單歷史 | 需登入 |

#### **修圖API**

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | `/api/revisions` | 獲取修圖列表 | 需登入 |
| GET | `/api/revisions/:number` | 獲取修圖詳情 | 需登入 |
| POST | `/api/revisions` | 新增修圖需求 | Admin |
| PUT | `/api/revisions/:number` | 更新修圖 | Admin |
| POST | `/api/revisions/:number/convert` | 轉為訂單 | Admin |

#### **統計API**

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | `/api/stats` | 獲取統計數據 | 需登入 |
| GET | `/api/stats/customer/:name` | 客戶統計 | 需登入 |

### API詳細示例

#### **1. 登入API**

**請求：**
```http
POST /tracking/api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**成功響應：**
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "admin",
        "display_name": "國內管理員",
        "role": "admin"
    },
    "expires_in": 604800
}
```

#### **2. 獲取訂單列表API**

**請求：**
```http
GET /tracking/api/orders?tab=all&stage=draft_confirm&light=red
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功響應：**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "order_number": "1007227",
            "customer_name": "OSCAR LLANO",
            "current_status": "圖稿確認中",
            "status_light": "red",
            "status_days": 8,
            "order_date": "2025-12-15"
        }
    ],
    "total": 8
}
```

#### **3. 快速更新訂單API**

**請求：**
```http
POST /tracking/api/orders/quick-update
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "order_number": "1007227",
    "action": "draft_confirm",
    "date": "2026-01-08",
    "notes": "客戶很滿意"
}
```

**成功響應：**
```json
{
    "success": true,
    "message": "訂單已更新為「待打樣」",
    "data": {
        "order_number": "1007227",
        "old_status": "圖稿確認中",
        "new_status": "待打樣",
        "action_date": "2026-01-08"
    }
}
```

### 錯誤碼列表

| 錯誤碼 | HTTP狀態 | 說明 |
|--------|---------|------|
| INVALID_CREDENTIALS | 401 | 用戶名或密碼錯誤 |
| UNAUTHORIZED | 401 | 未登入或Token無效 |
| FORBIDDEN | 403 | 無權限執行此操作 |
| NOT_FOUND | 404 | 資源不存在 |
| VALIDATION_ERROR | 400 | 參數驗證失敗 |
| DUPLICATE_ORDER | 400 | 訂單號已存在 |
| INTERNAL_ERROR | 500 | 服務器內部錯誤 |

---

## APP接入指南

### 快速開始

#### **步驟1：創建API客戶端**

```javascript
// api.js
class OrderTrackingAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        return await response.json();
    }

    async login(username, password) {
        const result = await this.request('/tracking/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (result.success) {
            this.setToken(result.token);
        }

        return result;
    }

    async getOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/tracking/api/orders?${params}`);
    }

    async quickUpdate(orderNumber, action, date, notes = '') {
        return await this.request('/tracking/api/orders/quick-update', {
            method: 'POST',
            body: JSON.stringify({
                order_number: orderNumber,
                action: action,
                date: date,
                notes: notes
            })
        });
    }
}

const api = new OrderTrackingAPI('http://your-server.com');
export default api;
```

#### **步驟2：實現登入**

```javascript
import api from './api';

async function handleLogin() {
    try {
        const result = await api.login('admin', 'admin123');
        
        if (result.success) {
            console.log('登入成功！', result.user);
            // 跳轉到主頁
        }
    } catch (error) {
        alert('登入失敗：' + error.message);
    }
}
```

#### **步驟3：獲取訂單列表**

```javascript
import api from './api';

async function loadOrders() {
    try {
        // 獲取所有紅燈訂單
        const result = await api.getOrders({ light: 'red' });
        
        if (result.success) {
            console.log('紅燈訂單：', result.data);
            // 渲染訂單列表
        }
    } catch (error) {
        console.error('獲取訂單失敗：', error);
    }
}
```

#### **步驟4：快速更新訂單**

```javascript
import api from './api';

async function handleQuickUpdate(orderNumber) {
    try {
        const result = await api.quickUpdate(
            orderNumber,
            'draft_confirm',
            '2026-01-08',
            '客戶很滿意'
        );
        
        if (result.success) {
            alert('更新成功！');
        }
    } catch (error) {
        alert('更新失敗：' + error.message);
    }
}
```

### React Native完整示例

```jsx
// OrderListScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import api from './api';

function OrderListScreen() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        const result = await api.getOrders({ light: 'red' });
        if (result.success) {
            setOrders(result.data);
        }
    }

    async function handleUpdate(orderNumber) {
        const result = await api.quickUpdate(
            orderNumber,
            'draft_confirm',
            new Date().toISOString().split('T')[0]
        );
        
        if (result.success) {
            loadOrders(); // 重新加載
        }
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={item => item.order_number}
            renderItem={({ item }) => (
                <View>
                    <Text>{item.order_number}</Text>
                    <Text>{item.customer_name}</Text>
                    <Button 
                        title="✅ 已確認" 
                        onPress={() => handleUpdate(item.order_number)}
                    />
                </View>
            )}
        />
    );
}

export default OrderListScreen;
```

### 測試工具

使用Postman測試API：

```
1. 登入：
   POST http://localhost:5000/tracking/api/auth/login
   Body: {"username":"admin","password":"admin123"}

2. 複製返回的token

3. 測試訂單列表：
   GET http://localhost:5000/tracking/api/orders
   Headers: Authorization: Bearer <your_token>

4. 測試快速更新：
   POST http://localhost:5000/tracking/api/orders/quick-update
   Headers: Authorization: Bearer <your_token>
   Body: {
       "order_number": "1007227",
       "action": "draft_confirm",
       "date": "2026-01-08"
   }
```

---

## 總結

### 關鍵要點

1. ✅ **用戶認證**：網頁用Session，APP用JWT
2. ✅ **權限控制**：管理員vs查看者
3. ✅ **統一API**：RESTful標準，響應格式一致
4. ✅ **簡單接入**：提供完整的API客戶端示例
5. ✅ **跨平台支持**：支持任何能發送HTTP請求的客戶端

### 下一步

1. 實現`__init__.py`中的所有路由
2. 實現JWT Token生成和驗證
3. 添加CORS支持
4. 實現API測試
5. 開發APP客戶端

---

**最後更新**: 2026-01-08  
**文檔狀態**: ✅ 已完成，可以開始開發

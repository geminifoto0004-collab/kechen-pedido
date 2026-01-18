"""
订单流程追踪系统 - 数据模型
"""
import sqlite3
import os
from datetime import datetime, date
try:
    from werkzeug.security import generate_password_hash
except ImportError:
    # 如果沒有werkzeug，使用簡單的hash（僅開發環境）
    def generate_password_hash(password):
        return f"hash_{password}"

from .config import DATABASE_PATH, LIGHT_RULES
from .status_config import STATUS  # 向后兼容：简体中文
from .status_definitions import STATUS_KEYS, get_status_label

# 数据库默认状态值（使用 key）
DEFAULT_STATUS = STATUS_KEYS['NEW_ORDER']

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """初始化数据库"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 使用 STATUS 配置中的默认状态（与 STATUS_SYSTEM.js 保持一致）
    default_status = STATUS['NEW_ORDER']
    
    # 1. 用戶表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'viewer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. 訂單主表（使用 STATUS 配置中的默认状态）
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            customer_id INTEGER,
            customer_name VARCHAR(100) NOT NULL,
            product_code VARCHAR(50),
            quantity VARCHAR(50),
            factory VARCHAR(100),
            order_date DATE NOT NULL,
            current_status VARCHAR(50) NOT NULL DEFAULT '{default_status}',
            status_light VARCHAR(10) NOT NULL DEFAULT 'green',
            status_days INTEGER DEFAULT 0,
            last_status_change_date DATE,
            production_type VARCHAR(100),
            product_name VARCHAR(100),
            pattern_code VARCHAR(50),
            expected_delivery_date DATE,
            notes TEXT,
            from_revision_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. 狀態歷史表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            order_number VARCHAR(50) NOT NULL,
            from_status VARCHAR(50),
            to_status VARCHAR(50) NOT NULL,
            action_date DATE NOT NULL,
            operator VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    ''')
    
    # 4. 備註表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type VARCHAR(20) NOT NULL,
            item_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 5. 修圖需求表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            revision_number VARCHAR(50) UNIQUE NOT NULL,
            customer_name VARCHAR(100) NOT NULL,
            request_date DATE NOT NULL,
            requirements TEXT,
            current_status VARCHAR(50) NOT NULL DEFAULT '已收到',
            completed_date DATE,
            converted_to_order_id INTEGER,
            converted_to_order_number VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 6. 系統設定表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(50) PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 7. 圖片表（預留）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type VARCHAR(20) NOT NULL,
            item_id INTEGER NOT NULL,
            stage VARCHAR(50),
            file_path VARCHAR(255) NOT NULL,
            file_size INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 8. 操作日誌表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type VARCHAR(50) NOT NULL,
            order_number VARCHAR(50),
            old_status VARCHAR(50),
            new_status VARCHAR(50),
            operator VARCHAR(50) NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 創建索引
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_order_number ON orders(order_number)",
        "CREATE INDEX IF NOT EXISTS idx_customer_name ON orders(customer_name)",
        "CREATE INDEX IF NOT EXISTS idx_current_status ON orders(current_status)",
        "CREATE INDEX IF NOT EXISTS idx_status_light ON orders(status_light)",
        "CREATE INDEX IF NOT EXISTS idx_history_order_id ON status_history(order_id)",
        "CREATE INDEX IF NOT EXISTS idx_history_order_number ON status_history(order_number)",
        "CREATE INDEX IF NOT EXISTS idx_history_to_status ON status_history(to_status)",
        "CREATE INDEX IF NOT EXISTS idx_history_action_date ON status_history(action_date)",
        "CREATE INDEX IF NOT EXISTS idx_notes_item ON notes(item_type, item_id)",
        "CREATE INDEX IF NOT EXISTS idx_revision_number ON revisions(revision_number)",
        "CREATE INDEX IF NOT EXISTS idx_revision_customer ON revisions(customer_name)",
        "CREATE INDEX IF NOT EXISTS idx_revision_status ON revisions(current_status)",
        "CREATE INDEX IF NOT EXISTS idx_images_item ON images(item_type, item_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_order ON audit_log(order_number)"
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    # 檢查並添加 product_name 字段（如果不存在）
    try:
        cursor.execute("SELECT product_name FROM orders LIMIT 1")
    except:
        # 字段不存在，添加它
        try:
            cursor.execute("ALTER TABLE orders ADD COLUMN product_name VARCHAR(100)")
        except:
            pass
    
    # 檢查並添加新字段（兼容舊數據庫）
    try:
        cursor.execute("SELECT product_code FROM orders LIMIT 1")
    except:
        try:
            cursor.execute("ALTER TABLE orders ADD COLUMN product_code VARCHAR(50)")
            print("✅ 成功添加字段：product_code")
        except Exception as e:
            print(f"⚠️ 添加字段 product_code 失敗或已存在: {e}")
    
    try:
        cursor.execute("SELECT quantity FROM orders LIMIT 1")
    except:
        try:
            cursor.execute("ALTER TABLE orders ADD COLUMN quantity VARCHAR(50)")
            print("✅ 成功添加字段：quantity")
        except Exception as e:
            print(f"⚠️ 添加字段 quantity 失敗或已存在: {e}")
    
    try:
        cursor.execute("SELECT factory FROM orders LIMIT 1")
    except:
        try:
            cursor.execute("ALTER TABLE orders ADD COLUMN factory VARCHAR(100)")
            print("✅ 成功添加字段：factory")
        except Exception as e:
            print(f"⚠️ 添加字段 factory 失敗或已存在: {e}")
    
    # 初始化用戶
    try:
        admin_hash = generate_password_hash('admin123')
        viewer_hash = generate_password_hash('viewer123')
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, password_hash, display_name, role)
            VALUES ('admin', ?, '国内管理员', 'admin')
        ''', (admin_hash,))
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, password_hash, display_name, role)
            VALUES ('viewer', ?, '国外查看', 'viewer')
        ''', (viewer_hash,))
    except:
        pass
    
    # 初始化设定
    settings_data = [
        ('draft_yellow_days', '3', '图稿确认超过X天变黄色'),
        ('draft_red_days', '5', '图稿确认超过X天变红色'),
        ('sampling_yellow_days', '2', '打样确认超过X天变黄色'),
        ('sampling_red_days', '3', '打样确认超过X天变红色'),
        ('new_order_yellow_days', '5', '新订单超过X天未发图变黄色'),
        ('new_order_red_days', '7', '新订单超过X天未发图变红色'),
        ('ready_sample_yellow_days', '5', '待打样超过X天变黄色'),
        ('ready_sample_red_days', '7', '待打样超过X天变红色'),
        ('sampling_process_yellow_days', '10', '打样中超过X天变黄色'),
        ('ready_production_yellow_days', '3', '待生产超过X天变黄色'),
        ('ready_production_red_days', '5', '待生产超过X天变红色'),
        ('delivery_warning_days', '3', '距离交货少于X天提醒'),
        ('revision_yellow_days', '3', '修图超过X天变黄色'),
        ('revision_red_days', '5', '修图超过X天变红色')
    ]
    
    for key, value, desc in settings_data:
        cursor.execute('''
            INSERT OR IGNORE INTO settings (key, value, description)
            VALUES (?, ?, ?)
        ''', (key, value, desc))
    
    conn.commit()
    conn.close()

def calculate_status_light(order):
    """
    计算订单的灯号
    支持新格式（key）和旧格式（中文）的状态值
    """
    today = date.today()
    current_status = order['current_status']
    last_change = order['last_status_change_date']
    
    if not last_change:
        return 'green'
    
    if isinstance(last_change, str):
        last_change = datetime.strptime(last_change, '%Y-%m-%d').date()
    
    days = (today - last_change).days
    
    # 檢查是否超過預計交貨日期
    if order['expected_delivery_date']:
        delivery = order['expected_delivery_date']
        if isinstance(delivery, str):
            delivery = datetime.strptime(delivery, '%Y-%m-%d').date()
        if today >= delivery:
            return 'red'
        if (delivery - today).days <= LIGHT_RULES['delivery_warning_days']:
            return 'yellow'
    
    # 正規化狀態：如果是中文，轉換成 key；如果已經是 key，直接使用
    status_key = current_status
    if current_status not in STATUS_KEYS.values():
        # 可能是舊的中文狀態，嘗試找到對應的 key
        for key, label_zh_cn in STATUS.items():
            if label_zh_cn == current_status:
                status_key = key
                break
        # 如果找不到，可能是未知狀態，返回綠燈
        if status_key not in STATUS_KEYS.values():
            return 'green'
    
    # 根據狀態 key 和等待天數判斷
    if status_key == STATUS_KEYS['NEW_ORDER']:
        rules = LIGHT_RULES['new_order']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['QUOTE_CONFIRMING']:
        rules = LIGHT_RULES['draft_confirm']  # 报价待确认使用图稿确认规则
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['DRAFT_MAKING']:
        # 图稿制作中：内部制作阶段，阈值沿用图稿阶段规则
        rules = LIGHT_RULES['draft_confirm']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['DRAFT_CONFIRMING']:
        rules = LIGHT_RULES['draft_confirm']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['DRAFT_REVISING']:
        rules = LIGHT_RULES['draft_confirm']  # 图稿修改中使用图稿确认规则
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['PENDING_SAMPLE']:
        rules = LIGHT_RULES['ready_sample']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['SAMPLING']:
        rules = LIGHT_RULES['sampling_process']
        if rules['red_days'] and days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['SAMPLE_CONFIRMING']:
        rules = LIGHT_RULES['sampling_confirm']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['SAMPLE_REVISING']:
        rules = LIGHT_RULES['sampling_confirm']  # 打样修改中使用打样确认规则
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['PENDING_PRODUCTION']:
        rules = LIGHT_RULES['ready_production']
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    elif status_key == STATUS_KEYS['PRODUCING']:
        rules = LIGHT_RULES['ready_production']  # 生产中待生产规则
        if days >= rules['red_days']:
            return 'red'
        elif days >= rules['yellow_days']:
            return 'yellow'
    
    return 'green'



def update_status_light(order_id, conn=None):
    """更新订单灯号（修复版 - 兼容 sqlite3.Row）"""
    should_close = False
    if conn is None:
        conn = get_db()
        should_close = True
    
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if order:
        light = calculate_status_light(order)
        
        # 计算天数（修复：确保不是负数）
        if order['last_status_change_date']:
            try:
                last_change = date.fromisoformat(order['last_status_change_date'])
                today = date.today()
                
                # 修复1: 如果 last_change 是未来日期，修正为今天
                if last_change > today:
                    # 修复：使用 order['order_number'] 而不是 order.get()
                    try:
                        order_num = order['order_number']
                    except (KeyError, IndexError):
                        order_num = f"ID:{order_id}"
                    
                    print(f"⚠️  警告: 订单 {order_num} 的最后变更日期是未来 ({last_change})，已修正为今天")
                    last_change = today
                    # 同时更新数据库中的日期
                    cursor.execute('''
                        UPDATE orders 
                        SET last_status_change_date = ?
                        WHERE id = ?
                    ''', (today.isoformat(), order_id))
                
                days = (today - last_change).days
                
                # 修复2: 双重保护 - 确保不是负数
                days = max(0, days)
                
            except (ValueError, TypeError) as e:
                try:
                    order_num = order['order_number']
                except (KeyError, IndexError):
                    order_num = f"ID:{order_id}"
                
                print(f"❌ 错误: 订单 {order_num} 日期格式错误: {e}")
                days = 0
        else:
            days = 0
        
        cursor.execute('''
            UPDATE orders 
            SET status_light = ?, 
                status_days = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (light, days, order_id))
        conn.commit()
    
    if should_close:
        conn.close()






def generate_revision_number():
    """生成修图编号"""
    today = datetime.now().strftime('%Y%m%d')
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COUNT(*) as count 
        FROM revisions 
        WHERE revision_number LIKE ?
    ''', (f'REV-{today}-%',))
    
    count = cursor.fetchone()['count'] + 1
    revision_number = f'REV-{today}-{count:03d}'
    
    conn.close()
    return revision_number


# ==================== 新增：數據庫遷移工具 ====================
# 添加在 models.py 文件末尾

def migrate_database():
    """
    執行數據庫遷移
    添加新表和新欄位，不影響現有數據
    """
    conn = get_db()
    cursor = conn.cursor()
    
    print("=" * 50)
    print("開始數據庫遷移...")
    print("=" * 50)
    
    # ===== 檢查並添加 users 表的新欄位 =====
    try:
        cursor.execute("SELECT real_name FROM users LIMIT 1")
        print("[OK] users.real_name 欄位已存在")
    except:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN real_name VARCHAR(100)")
            print("[OK] 成功添加 users.real_name 欄位")
            
            # 為現有用戶設置默認值
            cursor.execute("UPDATE users SET real_name = display_name WHERE real_name IS NULL")
            conn.commit()
        except Exception as e:
            print(f"[WARN] 添加 users.real_name 失敗: {e}")
    
    # ===== 添加員工ID欄位（用於顯示，不是主鍵）=====
    try:
        cursor.execute("SELECT employee_id FROM users LIMIT 1")
        print("[OK] users.employee_id 欄位已存在")
    except:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN employee_id VARCHAR(20)")
            print("[OK] 成功添加 users.employee_id 欄位")
            
            # 為現有用戶生成員工ID（格式：EMP001, EMP002...）
            cursor.execute("SELECT id FROM users WHERE employee_id IS NULL OR employee_id = '' ORDER BY id")
            users = cursor.fetchall()
            for idx, user in enumerate(users, 1):
                employee_id = f"EMP{idx:03d}"
                cursor.execute("UPDATE users SET employee_id = ? WHERE id = ?", (employee_id, user['id']))
            conn.commit()
            print("[OK] 已為現有用戶生成員工ID")
        except Exception as e:
            print(f"[WARN] 添加 users.employee_id 失敗: {e}")
    
    # ===== 添加用戶狀態欄位 =====
    try:
        cursor.execute("SELECT status FROM users LIMIT 1")
        print("[OK] users.status 欄位已存在")
    except:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
            print("[OK] 成功添加 users.status 欄位")
            
            # 為現有用戶設置默認值為 active
            cursor.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
            conn.commit()
        except Exception as e:
            print(f"[WARN] 添加 users.status 失敗: {e}")
    
    # ===== 添加密碼重置標記欄位 =====
    try:
        cursor.execute("SELECT needs_password_reset FROM users LIMIT 1")
        print("[OK] users.needs_password_reset 欄位已存在")
    except:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN needs_password_reset BOOLEAN DEFAULT 0")
            print("[OK] 成功添加 users.needs_password_reset 欄位")
            conn.commit()
        except Exception as e:
            print(f"[WARN] 添加 users.needs_password_reset 失敗: {e}")
    
    # ===== 創建 products 表（M2 會用到）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id VARCHAR(20) UNIQUE NOT NULL,
            order_number VARCHAR(50) NOT NULL,
            
            product_name VARCHAR(200),
            product_code VARCHAR(50),
            quantity VARCHAR(50),
            factory VARCHAR(100),
            production_type VARCHAR(100),
            expected_delivery_date DATE,
            
            current_status VARCHAR(50) DEFAULT 'new_order',
            status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status_days INTEGER DEFAULT 0,
            
            created_by_id INTEGER,
            handler_id INTEGER,
            
            folder_path VARCHAR(500),
            notes TEXT,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (created_by_id) REFERENCES users(id),
            FOREIGN KEY (handler_id) REFERENCES users(id)
        )
    ''')
    print("[OK] products 表已創建（如果不存在）")
    
    # ===== 創建 product_status_history 表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id VARCHAR(20) NOT NULL,
            order_number VARCHAR(50),
            
            from_status VARCHAR(50),
            to_status VARCHAR(50) NOT NULL,
            action_date DATE NOT NULL,
            
            operator_id INTEGER,
            notes TEXT,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (operator_id) REFERENCES users(id)
        )
    ''')
    print("[OK] product_status_history 表已創建")
    
    # ===== 創建 files 表（M3 會用到）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id VARCHAR(20) UNIQUE NOT NULL,
            order_number VARCHAR(50),
            product_id VARCHAR(20),
            
            filename VARCHAR(500) NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            file_size INTEGER,
            file_type VARCHAR(100),
            
            uploaded_by_id INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            is_deleted BOOLEAN DEFAULT 0,
            deleted_by_id INTEGER,
            deleted_at TIMESTAMP,
            
            FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
            FOREIGN KEY (deleted_by_id) REFERENCES users(id)
        )
    ''')
    print("[OK] files 表已創建")
    
    # ===== 創建 product_handover_log 表（M4 會用到）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_handover_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id VARCHAR(20) NOT NULL,
            order_number VARCHAR(50),
            
            from_handler_id INTEGER,
            to_handler_id INTEGER,
            handover_by_id INTEGER,
            
            handover_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reason TEXT,
            
            FOREIGN KEY (from_handler_id) REFERENCES users(id),
            FOREIGN KEY (to_handler_id) REFERENCES users(id),
            FOREIGN KEY (handover_by_id) REFERENCES users(id)
        )
    ''')
    print("[OK] product_handover_log 表已創建")
    
    # ===== 創建 operation_logs 表（M5 會用到）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            
            operation_type VARCHAR(50) NOT NULL,
            operation_desc VARCHAR(500),
            
            order_number VARCHAR(50),
            product_id VARCHAR(20),
            target_user_id INTEGER,
            
            details TEXT,
            ip_address VARCHAR(50),
            user_agent VARCHAR(500),
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    print("[OK] operation_logs 表已創建")
    
    # ===== 創建 notifications 表（M6 會用到）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT,
            
            order_number VARCHAR(50),
            product_id VARCHAR(20),
            
            is_read BOOLEAN DEFAULT 0,
            read_at TIMESTAMP,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    print("[OK] notifications 表已創建")
    
    # ===== 創建索引 =====
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_products_order ON products(order_number)",
        "CREATE INDEX IF NOT EXISTS idx_products_handler ON products(handler_id)",
        "CREATE INDEX IF NOT EXISTS idx_products_status ON products(current_status)",
        "CREATE INDEX IF NOT EXISTS idx_files_product ON files(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted)",
        "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)",
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    print("[OK] 索引已創建")
    
    conn.commit()
    conn.close()
    
    print("=" * 50)
    print("[OK] 數據庫遷移完成！")
    print("=" * 50)


def check_migration_status():
    """檢查遷移狀態"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 檢查新表是否存在
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('products', 'files', 'product_handover_log', 'operation_logs', 'notifications')
    """)
    
    existing_tables = [row['name'] for row in cursor.fetchall()]
    
    print("\n檢查遷移狀態:")
    print("-" * 30)
    
    required_tables = ['products', 'files', 'product_handover_log', 'operation_logs', 'notifications']
    for table in required_tables:
        if table in existing_tables:
            print(f"[OK] {table} 表存在")
        else:
            print(f"[FAIL] {table} 表不存在")
    
    conn.close()
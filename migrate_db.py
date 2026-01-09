import sqlite3
import os

def migrate():
    """添加新字段到現有數據庫"""
    db_path = 'order_tracking.db'
    
    if not os.path.exists(db_path):
        print(f"❌ 數據庫文件不存在: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("開始遷移數據庫...")
    
    # 添加新字段
    fields_to_add = [
        ('product_code', 'VARCHAR(50)'),
        ('quantity', 'VARCHAR(50)'),
        ('factory', 'VARCHAR(100)')
    ]
    
    for field_name, field_type in fields_to_add:
        try:
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {field_name} {field_type}")
            print(f"✅ 成功添加字段: {field_name}")
        except Exception as e:
            if 'duplicate column name' in str(e).lower():
                print(f"⚠️ 字段 {field_name} 已存在，跳過")
            else:
                print(f"❌ 添加字段 {field_name} 失敗: {e}")
    
    conn.commit()
    conn.close()
    print("\n✅ 數據庫遷移完成！")

if __name__ == '__main__':
    migrate()

"""
用戶帳號管理工具
可以查看資料庫中的所有帳號，並重置密碼
"""
import sqlite3
import os
import sys
from pathlib import Path

# 添加 order_tracking 到路徑
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from werkzeug.security import generate_password_hash, check_password_hash
except ImportError:
    print("⚠️  警告: werkzeug 未安裝，將使用簡單的 hash 方法（僅開發環境）")
    def generate_password_hash(password):
        return f"hash_{password}"
    def check_password_hash(hashed, password):
        return hashed == f"hash_{password}"

# 資料庫路徑
BASE_DIR = Path(__file__).parent / 'order_tracking'
DATABASE_PATH = BASE_DIR / 'data' / 'tracking.db'

def get_db():
    """獲取資料庫連接"""
    if not DATABASE_PATH.exists():
        print(f"❌ 錯誤: 找不到資料庫檔案: {DATABASE_PATH}")
        return None
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def list_users():
    """列出所有用戶"""
    conn = get_db()
    if conn is None:
        return
    
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, display_name, role, created_at FROM users ORDER BY id')
    users = cursor.fetchall()
    conn.close()
    
    if not users:
        print("\n📋 資料庫中沒有任何用戶帳號")
        return
    
    print("\n" + "=" * 70)
    print("📋 資料庫中的所有帳號")
    print("=" * 70)
    print(f"{'ID':<5} {'帳號名稱':<20} {'顯示名稱':<20} {'角色':<15} {'建立時間':<20}")
    print("-" * 70)
    
    for user in users:
        created_at = user['created_at'] if user['created_at'] else 'N/A'
        print(f"{user['id']:<5} {user['username']:<20} {user['display_name']:<20} {user['role']:<15} {created_at:<20}")
    
    print("=" * 70)
    print(f"\n總共 {len(users)} 個帳號\n")

def reset_password(username, new_password):
    """重置指定用戶的密碼"""
    conn = get_db()
    if conn is None:
        return False
    
    cursor = conn.cursor()
    
    # 檢查用戶是否存在
    cursor.execute('SELECT id, username FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if not user:
        print(f"\n❌ 錯誤: 找不到帳號 '{username}'")
        conn.close()
        return False
    
    # 生成新的密碼 hash
    new_hash = generate_password_hash(new_password)
    
    # 更新密碼
    cursor.execute('UPDATE users SET password_hash = ? WHERE username = ?', (new_hash, username))
    conn.commit()
    conn.close()
    
    print(f"\n✅ 成功重置帳號 '{username}' 的密碼")
    print(f"   新密碼: {new_password}")
    return True

def create_user(username, password, display_name, role='viewer'):
    """創建新用戶"""
    conn = get_db()
    if conn is None:
        return False
    
    cursor = conn.cursor()
    
    # 檢查用戶是否已存在
    cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
    if cursor.fetchone():
        print(f"\n❌ 錯誤: 帳號 '{username}' 已存在")
        conn.close()
        return False
    
    # 生成密碼 hash
    password_hash = generate_password_hash(password)
    
    # 插入新用戶
    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, display_name, role)
            VALUES (?, ?, ?, ?)
        ''', (username, password_hash, display_name, role))
        conn.commit()
        conn.close()
        
        print(f"\n✅ 成功創建新帳號 '{username}'")
        print(f"   顯示名稱: {display_name}")
        print(f"   角色: {role}")
        print(f"   密碼: {password}")
        return True
    except Exception as e:
        print(f"\n❌ 錯誤: 創建帳號失敗: {e}")
        conn.close()
        return False

def main():
    """主函數 - 互動式選單"""
    print("\n" + "=" * 70)
    print("👤 用戶帳號管理工具")
    print("=" * 70)
    
    while True:
        print("\n請選擇操作:")
        print("  1. 查看所有帳號")
        print("  2. 重置密碼")
        print("  3. 創建新帳號")
        print("  4. 退出")
        
        choice = input("\n請輸入選項 (1-4): ").strip()
        
        if choice == '1':
            list_users()
        
        elif choice == '2':
            list_users()
            username = input("\n請輸入要重置密碼的帳號名稱: ").strip()
            if not username:
                print("❌ 帳號名稱不能為空")
                continue
            
            new_password = input("請輸入新密碼: ").strip()
            if not new_password:
                print("❌ 密碼不能為空")
                continue
            
            confirm = input(f"確定要重置 '{username}' 的密碼嗎? (y/n): ").strip().lower()
            if confirm == 'y':
                reset_password(username, new_password)
            else:
                print("已取消操作")
        
        elif choice == '3':
            username = input("\n請輸入新帳號名稱: ").strip()
            if not username:
                print("❌ 帳號名稱不能為空")
                continue
            
            password = input("請輸入密碼: ").strip()
            if not password:
                print("❌ 密碼不能為空")
                continue
            
            display_name = input("請輸入顯示名稱: ").strip()
            if not display_name:
                display_name = username
            
            role = input("請輸入角色 (admin/viewer，預設為 viewer): ").strip().lower()
            if role not in ['admin', 'viewer']:
                role = 'viewer'
            
            create_user(username, password, display_name, role)
        
        elif choice == '4':
            print("\n👋 再見！")
            break
        
        else:
            print("❌ 無效的選項，請重新選擇")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程式已中斷")
    except Exception as e:
        print(f"\n❌ 發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        input("\n按 Enter 鍵退出...")


"""
删除所有订单数据脚本
⚠️ 警告：此脚本会删除所有订单及其相关数据！
"""
import sys
import os
from pathlib import Path

# 设置控制台编码（Windows）
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# 添加项目路径
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from order_tracking.models import get_db

def delete_all_orders():
    """删除所有订单及其相关数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    print("=" * 60)
    print("⚠️  警告：即将删除所有订单数据！")
    print("=" * 60)
    
    # 确认操作
    confirm = input("确认要删除所有订单吗？输入 'YES' 继续: ")
    if confirm != 'YES':
        print("操作已取消")
        conn.close()
        return
    
    try:
        # 1. 统计要删除的数据
        cursor.execute("SELECT COUNT(*) as count FROM orders")
        order_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM status_history")
        history_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM notes WHERE item_type = 'order'")
        notes_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM audit_log")
        audit_count = cursor.fetchone()['count']
        
        print(f"\n将要删除：")
        print(f"  - 订单: {order_count} 条")
        print(f"  - 状态历史: {history_count} 条")
        print(f"  - 备注: {notes_count} 条")
        print(f"  - 操作日志: {audit_count} 条")
        
        # 2. 删除所有相关数据
        print("\n开始删除...")
        
        # 删除状态历史
        cursor.execute("DELETE FROM status_history")
        history_deleted = cursor.rowcount
        print(f"✅ 已删除状态历史: {history_deleted} 条")
        
        # 删除订单备注
        cursor.execute("DELETE FROM notes WHERE item_type = 'order'")
        notes_deleted = cursor.rowcount
        print(f"✅ 已删除订单备注: {notes_deleted} 条")
        
        # 删除操作日志
        cursor.execute("DELETE FROM audit_log")
        audit_deleted = cursor.rowcount
        print(f"✅ 已删除操作日志: {audit_deleted} 条")
        
        # 删除订单
        cursor.execute("DELETE FROM orders")
        orders_deleted = cursor.rowcount
        print(f"✅ 已删除订单: {orders_deleted} 条")
        
        conn.commit()
        conn.close()
        
        print("=" * 60)
        print("✅ 删除完成！所有订单数据已清空")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"❌ 删除失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    delete_all_orders()


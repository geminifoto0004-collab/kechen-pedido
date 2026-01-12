"""
删除测试订单数据脚本
删除通过 import_orders.py 导入的测试订单
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

# 测试订单号列表（从 import_orders.py 导入的订单）
TEST_ORDER_NUMBERS = [
    "1005682",
    "1006204-1",
    "1006693-4",
    "1006693-5",
    "1006693-6",
    "1006693-7",
    "1006693-8",
    "1006693-9",
    "1006693-10",
    "1006693-11",
    "1006693-12",
    "1006693-13",
    "1006693-14",
    "1006693-15",
    "1006693-16",
    "1006693-17"
]

def delete_test_orders():
    """删除测试订单"""
    conn = get_db()
    cursor = conn.cursor()
    
    deleted_count = 0
    not_found_count = 0
    error_count = 0
    
    print("=" * 60)
    print("开始删除测试订单数据...")
    print("=" * 60)
    
    for idx, order_number in enumerate(TEST_ORDER_NUMBERS, 1):
        try:
            # 检查订单是否存在
            cursor.execute("SELECT id FROM orders WHERE order_number = ?", (order_number,))
            order = cursor.fetchone()
            
            if not order:
                print(f"⏭️  [{idx}] 订单 {order_number}: 不存在，跳过")
                not_found_count += 1
                continue
            
            order_id = order['id']
            
            # 删除状态历史
            cursor.execute("DELETE FROM status_history WHERE order_number = ?", (order_number,))
            history_deleted = cursor.rowcount
            
            # 删除备注
            cursor.execute("DELETE FROM notes WHERE item_type = 'order' AND item_id = ?", (order_id,))
            notes_deleted = cursor.rowcount
            
            # 删除订单
            cursor.execute("DELETE FROM orders WHERE order_number = ?", (order_number,))
            
            deleted_count += 1
            print(f"✅ [{idx}] 订单 {order_number}: 已删除 (历史记录: {history_deleted}, 备注: {notes_deleted})")
            
        except Exception as e:
            error_count += 1
            print(f"❌ [{idx}] 订单 {order_number}: 删除失败 - {str(e)}")
            conn.rollback()
            continue
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print(f"删除完成！")
    print(f"  ✅ 已删除: {deleted_count}")
    print(f"  ⏭️  不存在: {not_found_count}")
    print(f"  ❌ 失败: {error_count}")
    print("=" * 60)

def delete_all_test_orders_by_pattern():
    """根据订单号模式删除所有测试订单（更安全的方式）"""
    conn = get_db()
    cursor = conn.cursor()
    
    print("=" * 60)
    print("根据订单号模式删除测试订单...")
    print("=" * 60)
    
    # 查找所有匹配的订单
    patterns = ['1005682', '1006204-%', '1006693-%']
    
    total_deleted = 0
    
    for pattern in patterns:
        try:
            if '%' in pattern:
                cursor.execute("SELECT id, order_number FROM orders WHERE order_number LIKE ?", (pattern,))
            else:
                cursor.execute("SELECT id, order_number FROM orders WHERE order_number = ?", (pattern,))
            
            orders = cursor.fetchall()
            
            for order in orders:
                order_id = order['id']
                order_number = order['order_number']
                
                # 删除状态历史
                cursor.execute("DELETE FROM status_history WHERE order_number = ?", (order_number,))
                
                # 删除备注
                cursor.execute("DELETE FROM notes WHERE item_type = 'order' AND item_id = ?", (order_id,))
                
                # 删除订单
                cursor.execute("DELETE FROM orders WHERE order_number = ?", (order_number,))
                
                total_deleted += 1
                print(f"✅ 订单 {order_number}: 已删除")
        
        except Exception as e:
            print(f"❌ 删除模式 {pattern} 时出错: {str(e)}")
            conn.rollback()
            continue
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print(f"删除完成！共删除 {total_deleted} 个订单")
    print("=" * 60)

def delete_yu_orders():
    """删除所有 YU 开头的订单（自动生成的询价/修图订单）"""
    conn = get_db()
    cursor = conn.cursor()
    
    deleted_count = 0
    error_count = 0
    
    print("=" * 60)
    print("开始删除所有 YU 开头的订单...")
    print("=" * 60)
    
    try:
        # 查找所有 YU 开头的订单
        cursor.execute("SELECT id, order_number FROM orders WHERE order_number LIKE 'YU%'")
        orders = cursor.fetchall()
        
        if not orders:
            print("没有找到 YU 开头的订单")
            conn.close()
            return
        
        print(f"找到 {len(orders)} 个 YU 开头的订单")
        
        for order in orders:
            try:
                order_id = order['id']
                order_number = order['order_number']
                
                # 删除状态历史
                cursor.execute("DELETE FROM status_history WHERE order_number = ?", (order_number,))
                history_deleted = cursor.rowcount
                
                # 删除备注
                cursor.execute("DELETE FROM notes WHERE item_type = 'order' AND item_id = ?", (order_id,))
                notes_deleted = cursor.rowcount
                
                # 删除操作日志
                cursor.execute("DELETE FROM audit_log WHERE order_number = ?", (order_number,))
                
                # 删除订单
                cursor.execute("DELETE FROM orders WHERE order_number = ?", (order_number,))
                
                deleted_count += 1
                print(f"✅ 订单 {order_number}: 已删除 (历史记录: {history_deleted}, 备注: {notes_deleted})")
                
            except Exception as e:
                error_count += 1
                print(f"❌ 订单 {order['order_number']}: 删除失败 - {str(e)}")
                conn.rollback()
                continue
        
        conn.commit()
        conn.close()
        
        print("=" * 60)
        print(f"删除完成！")
        print(f"  ✅ 已删除: {deleted_count}")
        print(f"  ❌ 失败: {error_count}")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"❌ 删除过程中出错: {str(e)}")

def delete_all_orders():
    """删除所有订单及其相关数据（危险操作）"""
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
    import argparse
    
    parser = argparse.ArgumentParser(description='删除测试订单')
    parser.add_argument('--pattern', action='store_true', help='使用订单号模式删除（更安全）')
    parser.add_argument('--yu', action='store_true', help='删除所有 YU 开头的订单（自动生成的询价/修图订单）')
    parser.add_argument('--all', action='store_true', help='⚠️ 删除所有订单数据（危险操作）')
    args = parser.parse_args()
    
    if args.all:
        delete_all_orders()
    elif args.yu:
        delete_yu_orders()
    elif args.pattern:
        delete_all_test_orders_by_pattern()
    else:
        delete_test_orders()


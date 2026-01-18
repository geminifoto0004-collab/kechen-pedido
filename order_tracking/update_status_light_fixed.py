"""
批量更新所有訂單的紅綠黃燈狀態
用於檢查和修復資料庫中的燈號是否正確
"""
import sys
import os

# 添加項目路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from order_tracking.models import get_db, calculate_status_light
from order_tracking.status_config import STATUS
from datetime import date

def update_status_light(order_id, conn=None):
    """更新订单灯号"""
    should_close = False
    if conn is None:
        conn = get_db()
        should_close = True
    
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if order:
        light = calculate_status_light(order)
        
        # 计算天数（确保不是负数）
        if order['last_status_change_date']:
            try:
                last_change = date.fromisoformat(order['last_status_change_date'])
                days = (date.today() - last_change).days
                # 确保不是负数（防止未来日期）
                days = max(0, days)
            except (ValueError, TypeError):
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
        
        return {
            'order_number': order['order_number'],
            'old_light': order['status_light'],
            'new_light': light,
            'days': days,
            'status': order['current_status']
        }
    
    if should_close:
        conn.close()
    
    return None

def main():
    """主程序：批量更新所有訂單的燈號"""
    print("=" * 60)
    print("批量更新訂單紅綠黃燈狀態")
    print("=" * 60)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 獲取所有訂單
    cursor.execute('SELECT id, order_number, current_status, status_light, last_status_change_date FROM orders')
    orders = cursor.fetchall()
    
    print(f"\n找到 {len(orders)} 個訂單，開始更新...\n")
    
    updated_count = 0
    changed_count = 0
    stats = {'red': 0, 'yellow': 0, 'green': 0}
    
    for order in orders:
        order_id = order['id']
        order_number = order['order_number']
        old_light = order['status_light']
        
        result = update_status_light(order_id, conn)
        
        if result:
            updated_count += 1
            new_light = result['new_light']
            stats[new_light] = stats.get(new_light, 0) + 1
            
            if old_light != new_light:
                changed_count += 1
                print(f"✓ 訂單 {order_number}: {old_light} → {new_light} (狀態: {result['status']}, 等待: {result['days']} 天)")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("更新完成！")
    print("=" * 60)
    print(f"總訂單數: {len(orders)}")
    print(f"已更新: {updated_count}")
    print(f"燈號變更: {changed_count}")
    print(f"\n燈號統計:")
    print(f"  🔴 紅燈: {stats.get('red', 0)}")
    print(f"  🟡 黃燈: {stats.get('yellow', 0)}")
    print(f"  🟢 綠燈: {stats.get('green', 0)}")
    print("=" * 60)

if __name__ == '__main__':
    main()

"""
測試紅綠黃燈功能是否正常
創建測試訂單並驗證燈號計算是否正確
"""
import sys
import os
from datetime import date, timedelta

# 添加項目路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from order_tracking.models import get_db, calculate_status_light, update_status_light
from order_tracking.status_config import STATUS
from order_tracking.config import LIGHT_RULES

def create_test_order(cursor, order_number, current_status, last_change_date, expected_delivery_date=None):
    """創建測試訂單"""
    cursor.execute('''
        INSERT INTO orders (
            order_number, customer_name, order_date, current_status,
            last_status_change_date, expected_delivery_date, status_light, status_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        order_number,
        '測試客戶',
        date.today().isoformat(),
        current_status,
        last_change_date.isoformat() if last_change_date else None,
        expected_delivery_date.isoformat() if expected_delivery_date else None,
        'green',  # 初始值，會被重新計算
        0
    ))
    return cursor.lastrowid

def test_status_light():
    """測試紅綠黃燈功能"""
    print("=" * 70)
    print("測試紅綠黃燈功能")
    print("=" * 70)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 清理之前的測試訂單
    print("\n清理舊的測試訂單...")
    cursor.execute("DELETE FROM orders WHERE order_number LIKE 'TEST-%'")
    cursor.execute("DELETE FROM status_history WHERE order_number LIKE 'TEST-%'")
    conn.commit()
    
    today = date.today()
    test_cases = []
    
    # ========== 測試案例 1: 新訂單 - 綠燈（剛創建）==========
    test_cases.append({
        'order_number': 'TEST-GREEN-01',
        'status': STATUS['NEW_ORDER'],
        'last_change': today,
        'expected_light': 'green',
        'description': '新訂單 - 今天創建（應該綠燈）'
    })
    
    # ========== 測試案例 2: 新訂單 - 黃燈（超過黃燈天數）==========
    yellow_days = LIGHT_RULES['new_order']['yellow_days']
    test_cases.append({
        'order_number': 'TEST-YELLOW-01',
        'status': STATUS['NEW_ORDER'],
        'last_change': today - timedelta(days=yellow_days),
        'expected_light': 'yellow',
        'description': f'新訂單 - {yellow_days} 天前創建（應該黃燈）'
    })
    
    # ========== 測試案例 3: 新訂單 - 紅燈（超過紅燈天數）==========
    red_days = LIGHT_RULES['new_order']['red_days']
    test_cases.append({
        'order_number': 'TEST-RED-01',
        'status': STATUS['NEW_ORDER'],
        'last_change': today - timedelta(days=red_days),
        'expected_light': 'red',
        'description': f'新訂單 - {red_days} 天前創建（應該紅燈）'
    })
    
    # ========== 測試案例 4: 圖稿待確認 - 綠燈 ==========
    test_cases.append({
        'order_number': 'TEST-DRAFT-GREEN',
        'status': STATUS['DRAFT_CONFIRMING'],
        'last_change': today,
        'expected_light': 'green',
        'description': '圖稿待確認 - 今天（應該綠燈）'
    })
    
    # ========== 測試案例 5: 圖稿待確認 - 黃燈 ==========
    draft_yellow = LIGHT_RULES['draft_confirm']['yellow_days']
    test_cases.append({
        'order_number': 'TEST-DRAFT-YELLOW',
        'status': STATUS['DRAFT_CONFIRMING'],
        'last_change': today - timedelta(days=draft_yellow),
        'expected_light': 'yellow',
        'description': f'圖稿待確認 - {draft_yellow} 天前（應該黃燈）'
    })
    
    # ========== 測試案例 6: 圖稿待確認 - 紅燈 ==========
    draft_red = LIGHT_RULES['draft_confirm']['red_days']
    test_cases.append({
        'order_number': 'TEST-DRAFT-RED',
        'status': STATUS['DRAFT_CONFIRMING'],
        'last_change': today - timedelta(days=draft_red),
        'expected_light': 'red',
        'description': f'圖稿待確認 - {draft_red} 天前（應該紅燈）'
    })
    
    # ========== 測試案例 7: 預計交貨日期 - 紅燈（已過期）==========
    test_cases.append({
        'order_number': 'TEST-DELIVERY-RED',
        'status': STATUS['PRODUCING'],
        'last_change': today - timedelta(days=5),
        'expected_delivery': today - timedelta(days=1),  # 昨天就該交貨
        'expected_light': 'red',
        'description': '生產中 - 預計交貨日期已過（應該紅燈）'
    })
    
    # ========== 測試案例 8: 預計交貨日期 - 黃燈（即將到期）==========
    warning_days = LIGHT_RULES.get('delivery_warning_days', 3)
    test_cases.append({
        'order_number': 'TEST-DELIVERY-YELLOW',
        'status': STATUS['PRODUCING'],
        'last_change': today - timedelta(days=5),
        'expected_delivery': today + timedelta(days=warning_days),
        'expected_light': 'yellow',
        'description': f'生產中 - 預計交貨日期還有 {warning_days} 天（應該黃燈）'
    })
    
    # ========== 測試案例 9: 已完成 - 應該不影響燈號（但通常不會顯示）==========
    test_cases.append({
        'order_number': 'TEST-COMPLETED',
        'status': STATUS['COMPLETED'],
        'last_change': today - timedelta(days=30),
        'expected_light': 'green',  # 已完成通常顯示綠燈或特殊處理
        'description': '已完成 - 30 天前（已完成狀態）'
    })
    
    print(f"\n創建 {len(test_cases)} 個測試訂單...\n")
    
    results = []
    for i, test in enumerate(test_cases, 1):
        order_id = create_test_order(
            cursor,
            test['order_number'],
            test['status'],
            test['last_change'],
            test.get('expected_delivery')
        )
        
        # 重新獲取訂單以計算燈號
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        # 計算燈號
        calculated_light = calculate_status_light(order)
        
        # 更新到資料庫
        update_status_light(order_id, conn)
        
        # 再次查詢確認
        cursor.execute('SELECT status_light, status_days FROM orders WHERE id = ?', (order_id,))
        updated_order = cursor.fetchone()
        
        actual_light = updated_order['status_light']
        status_days = updated_order['status_days']
        
        # 判斷測試是否通過
        passed = (actual_light == test['expected_light'])
        status_icon = '✓' if passed else '✗'
        
        results.append({
            'test': test,
            'passed': passed,
            'calculated': calculated_light,
            'actual': actual_light,
            'days': status_days
        })
        
        print(f"{status_icon} 測試 {i}: {test['order_number']}")
        print(f"   描述: {test['description']}")
        print(f"   狀態: {test['status']}")
        print(f"   日期: {test['last_change']} ({status_days} 天前)")
        if test.get('expected_delivery'):
            print(f"   預計交貨: {test['expected_delivery']}")
        print(f"   預期燈號: {test['expected_light']}")
        print(f"   實際燈號: {actual_light}")
        print(f"   結果: {'通過' if passed else '失敗'}")
        print()
    
    conn.commit()
    conn.close()
    
    # 統計結果
    passed_count = sum(1 for r in results if r['passed'])
    total_count = len(results)
    
    print("=" * 70)
    print("測試結果統計")
    print("=" * 70)
    print(f"總測試數: {total_count}")
    print(f"通過: {passed_count}")
    print(f"失敗: {total_count - passed_count}")
    print(f"通過率: {passed_count/total_count*100:.1f}%")
    print("=" * 70)
    
    # 顯示失敗的測試
    failed_tests = [r for r in results if not r['passed']]
    if failed_tests:
        print("\n失敗的測試:")
        for r in failed_tests:
            print(f"  ✗ {r['test']['order_number']}: 預期 {r['test']['expected_light']}, 實際 {r['actual']}")
    
    print("\n所有測試訂單已寫入資料庫（訂單號以 TEST- 開頭）")
    print("您可以在系統中查看這些測試訂單來驗證燈號是否正確")

if __name__ == '__main__':
    test_status_light()

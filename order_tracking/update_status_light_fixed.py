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
    
    if should_close:
        conn.close()

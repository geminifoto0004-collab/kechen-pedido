"""
訂單流程追蹤系統 - Blueprint入口
包含所有路由定義和業務邏輯
"""
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, g
try:
    from werkzeug.security import check_password_hash
except ImportError:
    # 如果沒有werkzeug，使用簡單的檢查（僅開發環境）
    def check_password_hash(hashed, password):
        return hashed == f"hash_{password}"

from datetime import datetime, date
import functools
try:
    import jwt
    HAS_JWT = True
except ImportError:
    jwt = None
    HAS_JWT = False

from .models import get_db, init_db, calculate_status_light, update_status_light, generate_revision_number
from .config import SECRET_KEY, JWT_SECRET_KEY, JWT_EXPIRATION_DELTA, BLUEPRINT_NAME, URL_PREFIX

# 創建Blueprint
tracking_bp = Blueprint(
    BLUEPRINT_NAME,
    __name__,
    url_prefix=URL_PREFIX,
    template_folder='templates/tracking',
    static_folder='static',
    static_url_path='/static/tracking'
)

# ==================== 工具函數 ====================

def login_required(f):
    """登入驗證裝飾器（Session）"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/tracking/api'):
                return jsonify({'success': False, 'error': '未登入', 'code': 'UNAUTHORIZED'}), 401
            return redirect(url_for('tracking_bp.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """管理員權限裝飾器"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/tracking/api'):
                return jsonify({'success': False, 'error': '未登入', 'code': 'UNAUTHORIZED'}), 401
            return redirect(url_for('tracking_bp.login'))
        if session.get('role') != 'admin':
            if request.path.startswith('/tracking/api'):
                return jsonify({'success': False, 'error': '無權限', 'code': 'FORBIDDEN'}), 403
            return redirect(url_for('tracking_bp.index'))
        return f(*args, **kwargs)
    return decorated_function

def api_login_required(f):
    """API登入驗證裝飾器（JWT）"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        # 1) 先支援已有的 Session 登入（從網頁呼叫 API）
        if 'user_id' in session:
            g.current_user = {
                'id': session['user_id'],
                'username': session.get('username'),
                'role': session.get('role', 'viewer')
            }
            return f(*args, **kwargs)

        # 2) 若無 Session，改用 JWT Token 驗證（純 API 用途）
        if not HAS_JWT:
            return jsonify({'success': False, 'error': 'JWT未安裝', 'code': 'JWT_NOT_AVAILABLE'}), 500
        
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'error': 'Token格式錯誤', 'code': 'INVALID_TOKEN'}), 401
        
        if not token:
            return jsonify({'success': False, 'error': '未提供Token或未登入', 'code': 'UNAUTHORIZED'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            g.current_user = {
                'id': data['user_id'],
                'username': data['username'],
                'role': data['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token已過期', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Token無效', 'code': 'INVALID_TOKEN'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def api_admin_required(f):
    """API管理員權限裝飾器"""
    @functools.wraps(f)
    @api_login_required
    def decorated_function(*args, **kwargs):
        if g.current_user['role'] != 'admin':
            return jsonify({'success': False, 'error': '無權限', 'code': 'FORBIDDEN'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ==================== 認證路由 ====================

@tracking_bp.route('/login', methods=['GET', 'POST'])
def login():
    """登入頁面"""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            if request.is_json:
                # API登入，返回JWT Token
                if not HAS_JWT:
                    return jsonify({'success': False, 'error': 'JWT未安裝', 'code': 'JWT_NOT_AVAILABLE'}), 500
                
                token = jwt.encode({
                    'user_id': user['id'],
                    'username': user['username'],
                    'role': user['role'],
                    'exp': datetime.utcnow().timestamp() + JWT_EXPIRATION_DELTA
                }, JWT_SECRET_KEY, algorithm='HS256')
                
                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'display_name': user['display_name'],
                        'role': user['role']
                    },
                    'expires_in': JWT_EXPIRATION_DELTA
                })
            else:
                # 網頁登入，設置Session
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['display_name'] = user['display_name']
                session['role'] = user['role']
                return redirect(url_for('tracking_bp.index'))
        
        error_msg = '用戶名或密碼錯誤'
        if request.is_json:
            return jsonify({'success': False, 'error': error_msg, 'code': 'INVALID_CREDENTIALS'}), 401
        return render_template('login.html', error=error_msg)
    
    # GET請求 - 如果已登入，重定向到主頁
    if 'user_id' in session:
        return redirect(url_for('tracking_bp.index'))
    return render_template('login.html')

@tracking_bp.route('/logout', methods=['GET', 'POST'])
def logout():
    """登出"""
    if request.is_json:
        session.clear()
        return jsonify({'success': True, 'message': '已登出'})
    session.clear()
    return redirect(url_for('tracking_bp.login'))

# ==================== 網頁路由 ====================

@tracking_bp.route('/')
@tracking_bp.route('/index')
def index():
    """主頁 - 自動判斷是否登入，未登入則顯示登入頁"""
    # 如果未登入，直接顯示登入頁面
    if 'user_id' not in session:
        return render_template('login.html')
    
    # 已登入，返回所有訂單數據（前端進行篩選）
    conn = get_db()
    cursor = conn.cursor()
    
    # 獲取所有訂單（不做篩選，前端處理）
    cursor.execute("SELECT * FROM orders ORDER BY status_light DESC, status_days DESC, order_date DESC")
    orders_list = [dict(row) for row in cursor.fetchall()]
    
    # 為每個訂單查詢發圖日期
    for order in orders_list:
        order_dict = dict(order)
        cursor.execute('''
            SELECT action_date FROM status_history 
            WHERE order_number = ? AND to_status = '圖稿確認中' 
            ORDER BY action_date ASC LIMIT 1
        ''', (order_dict['order_number'],))
        draft_row = cursor.fetchone()
        order_dict['draft_date'] = draft_row['action_date'] if draft_row else None
        orders_list[orders_list.index(order)] = order_dict
    
    # 總訂單數
    cursor.execute('SELECT COUNT(*) as total FROM orders')
    total_orders = cursor.fetchone()['total']
    
    # 燈號統計（用於統計卡片）
    cursor.execute('''
        SELECT status_light, COUNT(*) as count 
        FROM orders 
        WHERE current_status NOT IN ('已完成', '已取消')
        GROUP BY status_light
    ''')
    light_stats = {row['status_light']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    return render_template('index.html',
                         all_orders=orders_list,
                         total_orders=total_orders,
                         light_stats=light_stats)

@tracking_bp.route('/orders')
@login_required
def orders():
    """訂單列表頁 - 與主頁相同，返回所有數據"""
    # 重定向到主頁（使用同一個HTML和數據）
    return redirect(url_for('tracking_bp.index'))

@tracking_bp.route('/orders/<order_number>')
@login_required
def order_detail(order_number):
    """訂單詳情頁"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return '訂單不存在', 404
    
    order = dict(order)
    
    # 獲取狀態歷史
    cursor.execute('''
        SELECT * FROM status_history 
        WHERE order_number = ?
        ORDER BY action_date ASC, created_at ASC
    ''', (order_number,))
    history = [dict(row) for row in cursor.fetchall()]
    
    # 獲取備註
    cursor.execute('''
        SELECT * FROM notes 
        WHERE item_type = 'order' AND item_id = ?
        ORDER BY created_at DESC
    ''', (order['id'],))
    notes = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return render_template('order_detail.html', order=order, history=history, notes=notes)

@tracking_bp.route('/orders/new', methods=['GET', 'POST'])
@admin_required
def order_new():
    """新增訂單（支持無訂單號的詢價/修圖）"""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        
        conn = get_db()
        cursor = conn.cursor()
        
        order_number = data.get('order_number', '').strip()
        
        # 如果沒有提供訂單號，生成詢價/修圖編號（YU00001開始）
        if not order_number:
            cursor.execute('''
                SELECT order_number 
                FROM orders 
                WHERE order_number LIKE 'YU%'
                ORDER BY order_number DESC
                LIMIT 1
            ''')
            last_order = cursor.fetchone()
            if last_order and last_order['order_number'].startswith('YU'):
                try:
                    last_num = int(last_order['order_number'].replace('YU', ''))
                    next_num = last_num + 1
                except:
                    next_num = 1
            else:
                next_num = 1
            order_number = f'YU{next_num:05d}'
            initial_status = '詢價中'
        else:
            # 如果提供了訂單號，檢查是否已存在
            cursor.execute('SELECT id FROM orders WHERE order_number = ?', (order_number,))
            if cursor.fetchone():
                conn.close()
                error = '訂單號已存在'
                if request.is_json:
                    return jsonify({'success': False, 'error': error, 'code': 'DUPLICATE_ORDER'}), 400
                return render_template('order_form.html', error=error)
            initial_status = '新訂單'
        
        # 插入訂單
        order_date = data.get('order_date', date.today().isoformat())
        
        cursor.execute('''
            INSERT INTO orders (order_number, customer_name, order_date, current_status, 
                              production_type, product_name, product_code, pattern_code, expected_delivery_date, notes, last_status_change_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_number,
            data.get('customer_name'),
            order_date,
            initial_status,
            data.get('production_type'),
            data.get('product_name'),
            data.get('product_code'),
            data.get('pattern_code'),
            data.get('expected_delivery_date'),
            data.get('notes'),
            order_date
        ))
        
        order_id = cursor.lastrowid
        
        # 記錄初始狀態
        cursor.execute('''
            INSERT INTO status_history (order_id, order_number, from_status, to_status, action_date, operator)
            VALUES (?, ?, NULL, ?, ?, ?)
        ''', (order_id, order_number, initial_status, order_date, session.get('display_name', 'system')))
        
        # 更新燈號
        update_status_light(order_id)
        
        conn.commit()
        conn.close()
        
        if request.is_json:
            return jsonify({'success': True, 'message': '訂單創建成功'})
        return redirect(url_for('tracking_bp.order_detail', order_number=order_number))
    
    # GET請求
    order_data = {}
    
    return render_template('order_form.html', order=order_data)

@tracking_bp.route('/orders/<order_number>/edit', methods=['GET', 'POST'])
@admin_required
def order_edit(order_number):
    """編輯訂單"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return '訂單不存在', 404
    
    order = dict(order)
    
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        
        cursor.execute('''
            UPDATE orders 
            SET customer_name = ?, order_date = ?, production_type = ?, 
                product_name = ?, product_code = ?, pattern_code = ?, expected_delivery_date = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE order_number = ?
        ''', (
            data.get('customer_name'),
            data.get('order_date'),
            data.get('production_type'),
            data.get('product_name'),
            data.get('product_code'),
            data.get('pattern_code'),
            data.get('expected_delivery_date'),
            data.get('notes'),
            order_number
        ))
        
        update_status_light(order['id'])
        conn.commit()
        conn.close()
        
        if request.is_json:
            return jsonify({'success': True, 'message': '訂單更新成功'})
        return redirect(url_for('tracking_bp.order_detail', order_number=order_number))
    
    conn.close()
    return render_template('order_form.html', order=order)

@tracking_bp.route('/reports')
@login_required
def reports():
    """統計報表"""
    customer = request.args.get('customer', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 獲取所有客戶
    cursor.execute('SELECT DISTINCT customer_name FROM orders ORDER BY customer_name')
    customers = [row['customer_name'] for row in cursor.fetchall()]
    
    # 如果有選擇客戶，顯示該客戶的訂單
    customer_orders = []
    if customer:
        cursor.execute('''
            SELECT * FROM orders 
            WHERE customer_name = ?
            ORDER BY order_date DESC
        ''', (customer,))
        customer_orders = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return render_template('reports.html', customers=customers, customer=customer, orders=customer_orders)

# ==================== API路由 ====================

@tracking_bp.route('/api/auth/me', methods=['GET'])
@api_login_required
def api_auth_me():
    """獲取當前用戶信息"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (g.current_user['id'],))
    user = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'id': user['id'],
            'username': user['username'],
            'display_name': user['display_name'],
            'role': user['role']
        }
    })

@tracking_bp.route('/api/orders', methods=['GET'])
@api_login_required
def api_orders():
    """獲取訂單列表API"""
    tab = request.args.get('tab', 'all')
    stage = request.args.get('stage', 'all')
    light = request.args.get('light', 'all')
    search = request.args.get('search', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM orders WHERE 1=1"
    params = []
    
    if tab == 'all':
        query += " AND current_status NOT IN ('已完成', '已取消')"
    elif tab == 'quote':
        query += " AND (order_number LIKE 'REV-%' OR current_status = '詢價中')"
    elif tab == 'draft':
        query += " AND current_status IN ('新訂單', '圖稿確認中', '圖稿修改中')"
    elif tab == 'sampling':
        query += " AND current_status IN ('待打樣', '打樣中', '打樣確認中', '打樣修改中')"
    elif tab == 'production':
        query += " AND current_status IN ('待生產', '生產中')"
    
    if stage != 'all':
        query += " AND current_status = ?"
        params.append(stage)
    
    if light != 'all':
        query += " AND status_light = ?"
        params.append(light)
    
    if search:
        query += " AND (order_number LIKE ? OR customer_name LIKE ?)"
        search_term = f'%{search}%'
        params.extend([search_term, search_term])
    
    query += " ORDER BY status_light DESC, status_days DESC, order_date DESC"
    
    cursor.execute(query, params)
    orders_list = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': orders_list,
        'total': len(orders_list)
    })

@tracking_bp.route('/api/orders/<order_number>', methods=['GET'])
@api_login_required
def api_order_detail(order_number):
    """獲取訂單詳情API"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'success': False, 'error': '訂單不存在', 'code': 'NOT_FOUND'}), 404
    
    order = dict(order)
    
    # 獲取狀態歷史
    cursor.execute('''
        SELECT * FROM status_history 
        WHERE order_number = ?
        ORDER BY action_date ASC, created_at ASC
    ''', (order_number,))
    history = [dict(row) for row in cursor.fetchall()]
    
    order['history'] = history
    
    conn.close()
    
    return jsonify({'success': True, 'data': order})

@tracking_bp.route('/api/orders/quick-update', methods=['POST'])
@api_admin_required
def api_quick_update():
    """快速更新訂單狀態API"""
    data = request.get_json()
    order_number = data.get('order_number')
    action = data.get('action')
    action_date = data.get('date', date.today().isoformat())
    notes = data.get('notes', '')
    
    # 狀態映射
    status_map = {
        'quote_to_order': '新訂單',  # 詢價轉為訂單（需要額外處理）
        'quote_complete': '已完成',  # 詢價完成
        'draft_sent': '圖稿確認中',
        'draft_confirm': '待打樣',
        'draft_revise': '圖稿修改中',
        'draft_modified': '圖稿確認中',
        'sample_start': '打樣中',
        'sample_done': '打樣確認中',
        'sample_confirm': '待生產',
        'sample_revise': '打樣修改中',
        'sample_modified': '打樣確認中',
        'production_start': '生產中',
        'complete': '已完成',
        'cancel': '已取消'
    }
    
    new_status = status_map.get(action)
    if not new_status:
        return jsonify({'success': False, 'error': '無效的操作', 'code': 'INVALID_ACTION'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'success': False, 'error': '訂單不存在', 'code': 'NOT_FOUND'}), 404
    
    order = dict(order)
    old_status = order['current_status']
    
    # 特殊處理：詢價轉為訂單（這個在前端處理，調用update-order-number接口）
    if action == 'quote_to_order':
        conn.close()
        return jsonify({
            'success': False, 
            'error': '請使用轉為訂單功能', 
            'code': 'USE_CONVERT_API'
        }), 400
    
    # 記錄狀態變更
    cursor.execute('''
        INSERT INTO status_history (order_id, order_number, from_status, to_status, action_date, operator, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        order['id'],
        order_number,
        old_status,
        new_status,
        action_date,
        g.current_user.get('username', 'system'),
        notes
    ))
    
    # 更新訂單
    cursor.execute('''
        UPDATE orders 
        SET current_status = ?,
            last_status_change_date = ?,
            status_days = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_number = ?
    ''', (new_status, action_date, order_number))
    
    # 更新燈號
    update_status_light(order['id'])
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'訂單已更新為「{new_status}」',
        'data': {
            'order_number': order_number,
            'old_status': old_status,
            'new_status': new_status,
            'action_date': action_date
        }
    })

@tracking_bp.route('/api/revisions', methods=['GET'])
@api_login_required
def api_revisions():
    """獲取修圖列表API"""
    status = request.args.get('status', 'all')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM revisions WHERE 1=1"
    params = []
    
    if status != 'all':
        query += " AND current_status = ?"
        params.append(status)
    
    query += " ORDER BY request_date DESC"
    
    cursor.execute(query, params)
    revisions_list = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': revisions_list,
        'total': len(revisions_list)
    })

@tracking_bp.route('/api/customers/search', methods=['GET'])
@login_required
def api_search_customers():
    """搜索客戶名稱（用於自動完成）"""
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 1:
        return jsonify({'success': True, 'data': []})
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DISTINCT customer_name 
        FROM orders 
        WHERE customer_name LIKE ?
        ORDER BY customer_name
        LIMIT 10
    ''', (f'%{query}%',))
    
    customers = [row['customer_name'] for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'data': customers})

@tracking_bp.route('/api/orders/check-number', methods=['GET'])
@login_required
def api_check_order_number():
    """檢查訂單號是否已存在"""
    order_number = request.args.get('order_number', '').strip()
    
    if not order_number:
        return jsonify({'success': False, 'error': '訂單號不能為空'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM orders WHERE order_number = ?', (order_number,))
    exists = cursor.fetchone() is not None
    
    conn.close()
    
    return jsonify({
        'success': True,
        'exists': exists,
        'message': '訂單號已存在' if exists else '訂單號可用'
    })

@tracking_bp.route('/api/orders/next-quote-number', methods=['GET'])
@login_required
def api_next_quote_number():
    """獲取下一個詢價編號"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT order_number 
        FROM orders 
        WHERE order_number LIKE 'YU%'
        ORDER BY order_number DESC
        LIMIT 1
    ''')
    
    last_order = cursor.fetchone()
    if last_order and last_order['order_number'].startswith('YU'):
        try:
            last_num = int(last_order['order_number'].replace('YU', ''))
            next_num = last_num + 1
        except:
            next_num = 1
    else:
        next_num = 1
    
    next_number = f'YU{next_num:05d}'
    conn.close()
    
    return jsonify({
        'success': True,
        'next_number': next_number
    })

@tracking_bp.route('/api/stats', methods=['GET'])
@api_login_required
def api_stats():
    """獲取統計數據API"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total FROM orders')
    total = cursor.fetchone()['total']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE current_status NOT IN ("已完成", "已取消")')
    active = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "red" AND current_status NOT IN ("已完成", "已取消")')
    red = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "yellow" AND current_status NOT IN ("已完成", "已取消")')
    yellow = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "green" AND current_status NOT IN ("已完成", "已取消")')
    green = cursor.fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'total': total,
            'active': active,
            'lights': {
                'red': red,
                'yellow': yellow,
                'green': green
            }
        }
    })

# ==================== 初始化函數 ====================

def init_app(app):
    """初始化應用（整合到主應用時調用）"""
    app.register_blueprint(tracking_bp)
    # 初始化數據庫
    init_db()

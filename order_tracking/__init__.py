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

from datetime import datetime, date, timezone
import functools
try:
    import jwt
    HAS_JWT = True
except ImportError:
    jwt = None
    HAS_JWT = False

from .models import get_db, init_db, calculate_status_light, update_status_light, generate_revision_number
from .config import SECRET_KEY, JWT_SECRET_KEY, JWT_EXPIRATION_DELTA, BLUEPRINT_NAME, URL_PREFIX
from .status_config import STATUS, STAGE_GROUPS, STATUS_MAP, get_stage_group, get_statuses_by_stage_group

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
    
    # 为每个订单查询发图日期
    for order in orders_list:
        order_dict = dict(order)
        cursor.execute('''
            SELECT action_date FROM status_history 
            WHERE order_number = ? AND to_status = ? 
            ORDER BY action_date ASC LIMIT 1
        ''', (order_dict['order_number'], STATUS['DRAFT_CONFIRMING']))
        draft_row = cursor.fetchone()
        order_dict['draft_date'] = draft_row['action_date'] if draft_row else None
        orders_list[orders_list.index(order)] = order_dict
    
    # 总订单数
    cursor.execute('SELECT COUNT(*) as total FROM orders')
    total_orders = cursor.fetchone()['total']
    
    # 燈號統計（用於統計卡片）
    cursor.execute('''
        SELECT status_light, COUNT(*) as count 
        FROM orders 
        WHERE current_status NOT IN (?, ?)
        GROUP BY status_light
    ''', (STATUS['COMPLETED'], STATUS['CANCELLED']))
    light_stats = {row['status_light']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    # 定义各阶段的状态列表（简体）
    # 统一使用 status_config.py 中定义的状态（与 STATUS_SYSTEM.js 保持一致）
    new_and_quote_statuses = get_statuses_by_stage_group('new_and_quote')
    draft_statuses = get_statuses_by_stage_group('draft')
    sampling_statuses = get_statuses_by_stage_group('sampling')
    production_statuses = get_statuses_by_stage_group('production')
    quote_statuses = get_statuses_by_stage_group('quote')  # 等国外确认
    
    # 计算等国外确认的订单数量
    quote_orders = [o for o in orders_list if o['current_status'] in quote_statuses]
    
    # 传递状态常量给模板
    return render_template('index.html',
                         all_orders=orders_list,
                         total_orders=total_orders,
                         light_stats=light_stats,
                         new_and_quote_statuses=new_and_quote_statuses,
                         draft_statuses=draft_statuses,
                         sampling_statuses=sampling_statuses,
                         production_statuses=production_statuses,
                         quote_orders=quote_orders,
                         STATUS=STATUS)  # 传递 STATUS 常量给模板

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
    # GET請求 - 重定向到主頁（使用 modal 新增）
    if request.method == 'GET':
        return redirect(url_for('tracking_bp.index'))
    
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
            initial_status = STATUS['NEW_ORDER']  # 使用统一配置（与 STATUS_SYSTEM.js 一致）
        else:
            # 如果提供了訂單號，檢查是否已存在
            cursor.execute('SELECT id FROM orders WHERE order_number = ?', (order_number,))
            if cursor.fetchone():
                conn.close()
                error = '订单号已存在'
                if request.is_json:
                    return jsonify({'success': False, 'error': error, 'code': 'DUPLICATE_ORDER'}), 400
                return render_template('order_form.html', error=error)
            initial_status = STATUS['NEW_ORDER']  # 使用统一配置（与 STATUS_SYSTEM.js 一致）
        
        # 插入订单
        order_date = data.get('order_date', date.today().isoformat())
        today_str = date.today().isoformat() 
        
        cursor.execute('''
            INSERT INTO orders (order_number, customer_name, order_date, current_status, 
                            production_type, product_name, product_code, pattern_code, expected_delivery_date, notes, last_status_change_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_number,
            data.get('customer_name'),
            order_date,              # ← 订单日期（可以是过去、今天、未来）
            initial_status,
            data.get('production_type'),
            data.get('product_name'),
            data.get('product_code'),
            data.get('pattern_code'),
            data.get('expected_delivery_date'),
            data.get('notes'),
            today_str                # ← 关键修改！改用 today_str（永远是今天）
        ))
        
        order_id = cursor.lastrowid
        
        # 記錄初始狀態
        cursor.execute('''
            INSERT INTO status_history (order_id, order_number, from_status, to_status, action_date, operator)
            VALUES (?, ?, NULL, ?, ?, ?)
        ''', (order_id, order_number, initial_status, today_str, session.get('display_name', 'system')))
        # 更新燈號
        update_status_light(order_id, conn)
        
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
    # GET請求 - 重定向到訂單詳情頁（使用 modal 編輯）
    if request.method == 'GET':
        return redirect(url_for('tracking_bp.order_detail', order_number=order_number))
    
    # POST請求 - 處理表單提交（保留用於兼容性，但主要通過 API 處理）
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return '訂單不存在', 404
    
    order = dict(order)
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
    
    update_status_light(order['id'], conn)
    conn.commit()
    conn.close()
    
    if request.is_json:
        return jsonify({'success': True, 'message': '訂單更新成功'})
    return redirect(url_for('tracking_bp.order_detail', order_number=order_number))

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
        query += " AND current_status NOT IN (?, ?)"
        params.extend([STATUS['COMPLETED'], STATUS['CANCELLED']])
    elif tab == 'quote':
        # 等国外确认 - 筛选所有需要国外确认的状态
        quote_statuses = get_statuses_by_stage_group('quote')
        placeholders = ','.join(['?'] * len(quote_statuses))
        query += f" AND current_status IN ({placeholders})"
        params.extend(quote_statuses)
    elif tab == 'draft':
        draft_statuses = get_statuses_by_stage_group('draft')
        placeholders = ','.join(['?'] * len(draft_statuses))
        query += f" AND current_status IN ({placeholders})"
        params.extend(draft_statuses)
    elif tab == 'sampling':
        sampling_statuses = get_statuses_by_stage_group('sampling')
        placeholders = ','.join(['?'] * len(sampling_statuses))
        query += f" AND current_status IN ({placeholders})"
        params.extend(sampling_statuses)
    elif tab == 'production':
        production_statuses = get_statuses_by_stage_group('production')
        placeholders = ','.join(['?'] * len(production_statuses))
        query += f" AND current_status IN ({placeholders})"
        params.extend(production_statuses)
    
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

@tracking_bp.route('/api/orders', methods=['POST'])
@api_admin_required
def api_create_order():
    """新建訂單API"""
    data = request.get_json()
    
    # 驗證必填字段（订单号可以为空，会自动生成）
    required_fields = ['customer_name', 'order_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False, 
                'error': f'{field} 為必填項',
                'code': 'MISSING_REQUIRED_FIELD'
            }), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 处理订单号
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
        initial_status = STATUS['NEW_ORDER']  # 使用统一配置（与 STATUS_SYSTEM.js 一致）
    else:
        # 如果提供了訂單號，檢查是否已存在
        cursor.execute('SELECT id FROM orders WHERE order_number = ?', (order_number,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'error': '訂單號已存在',
                'code': 'DUPLICATE_ORDER_NUMBER'
            }), 400
        initial_status = STATUS['NEW_ORDER']  # 使用统一配置（与 STATUS_SYSTEM.js 一致）
    
    # 插入訂單
    try:
        cursor.execute('''
            INSERT INTO orders (
                order_number, customer_name, order_date,
                product_code, quantity, factory,
                production_type, expected_delivery_date,
                current_status, last_status_change_date,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_number,
            data['customer_name'],
            data['order_date'],
            data.get('product_code'),
            data.get('quantity'),
            data.get('factory'),
            data.get('production_type'),
            data.get('expected_delivery_date'),
            initial_status,
            data['order_date'],
            data.get('notes')
        ))
        
        order_id = cursor.lastrowid
        
        # 记录初始状态历史
        cursor.execute('''
            INSERT INTO status_history (
                order_id, order_number, from_status, to_status,
                action_date, operator, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_id,
            order_number,
            None,
            initial_status,
            data['order_date'],
            g.current_user.get('username', 'system'),
            '订单创建'
        ))
        
        # 更新灯号
        update_status_light(order_id, conn)
        
        conn.commit()
        
        # 獲取完整訂單信息返回
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = dict(cursor.fetchone())
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '訂單創建成功',
            'data': order
        }), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({
            'success': False,
            'error': str(e),
            'code': 'DATABASE_ERROR'
        }), 500

@tracking_bp.route('/api/orders/quick-update', methods=['POST'])
@api_admin_required
def api_quick_update():
    """快速更新訂單狀態API"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '無效的請求數據'}), 400
            
        order_number = data.get('order_number')
        action = data.get('action')
        action_date = data.get('date', date.today().isoformat())
        notes = data.get('notes', '')
        
        if not order_number or not action:
            return jsonify({'success': False, 'error': '缺少必要參數'}), 400
        
        # 状态映射（统一使用 status_config.py 中的 STATUS_MAP）
        # 与 STATUS_SYSTEM.js 中的 QUICK_ACTIONS 保持一致
        status_map = STATUS_MAP.copy()
        
        # 兼容旧版本（保留，但建议逐步迁移）
        status_map.update({
            'quote_to_order': STATUS['NEW_ORDER'],
            'quote_complete': STATUS['COMPLETED'],
            'draft_sent': STATUS['DRAFT_CONFIRMING'],
            'draft_revise': STATUS['DRAFT_REVISING'],
            'draft_modified': STATUS['DRAFT_CONFIRMING'],
            'sample_start': STATUS['SAMPLING'],
            'sample_done': STATUS['SAMPLE_CONFIRMING'],
            'sample_confirm': STATUS['PENDING_PRODUCTION'],
            'sample_revise': STATUS['SAMPLE_REVISING'],
            'sample_modified': STATUS['SAMPLE_CONFIRMING'],
            'complete': STATUS['COMPLETED']
        })
        
        new_status = status_map.get(action)
        if not new_status:
            return jsonify({'success': False, 'error': f'无效的操作：{action}'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'success': False, 'error': '訂單不存在'}), 404
        
        order = dict(order)
        old_status = order['current_status']
        
        # 特殊處理：詢價轉為訂單
        if action == 'quote_to_order':
            conn.close()
            return jsonify({'success': False, 'error': '請使用轉為訂單功能'}), 400
        
        # 獲取操作者
        operator = 'system'
        if hasattr(g, 'current_user') and g.current_user:
            operator = g.current_user.get('username', 'system')
        
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
            operator,
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
        update_status_light(order['id'], conn)
        
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
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"API Error: {error_detail}")  # 打印到控制台
        
        if 'conn' in locals():
            conn.close()
            
        return jsonify({
            'success': False,
            'error': f'更新失敗：{str(e)}'
        }), 500


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

@tracking_bp.route('/api/orders/<order_number>/status', methods=['POST'])
@api_admin_required
def api_update_order_status(order_number):
    """更新訂單狀態API（用於跳過階段、取消訂單等）"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '無效的請求數據'}), 400
        
        new_status = data.get('new_status')
        action_date = data.get('action_date', date.today().isoformat())
        notes = data.get('notes', '')
        
        if not new_status:
            return jsonify({'success': False, 'error': '缺少新狀態參數'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 查詢訂單
        cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'success': False, 'error': '訂單不存在'}), 404
        
        order = dict(order)
        old_status = order['current_status']
        
        # 獲取操作者
        operator = 'system'
        if hasattr(g, 'current_user') and g.current_user:
            operator = g.current_user.get('username', 'system')
        
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
            operator,
            notes
        ))
        
        # 更新訂單
        cursor.execute('''
            UPDATE orders 
            SET current_status = ?,
                last_status_change_date = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE order_number = ?
        ''', (new_status, action_date, order_number))
        
        # 更新燈號
        update_status_light(order['id'], conn)
        
        # 記錄操作日誌
        cursor.execute('''
            INSERT INTO audit_log (action_type, order_number, old_status, new_status, operator, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('status_update', order_number, old_status, new_status, operator, notes))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'狀態已更新：{old_status} → {new_status}',
            'data': {
                'order_number': order_number,
                'old_status': old_status,
                'new_status': new_status,
                'action_date': action_date
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE current_status NOT IN (?, ?)', 
                   (STATUS['COMPLETED'], STATUS['CANCELLED']))
    active = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "red" AND current_status NOT IN (?, ?)', 
                   (STATUS['COMPLETED'], STATUS['CANCELLED']))
    red = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "yellow" AND current_status NOT IN (?, ?)', 
                   (STATUS['COMPLETED'], STATUS['CANCELLED']))
    yellow = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE status_light = "green" AND current_status NOT IN (?, ?)', 
                   (STATUS['COMPLETED'], STATUS['CANCELLED']))
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

@tracking_bp.route('/api/orders/<order_number>/undo-last-step', methods=['POST'])
@api_admin_required
def api_undo_last_step(order_number):
    """撤銷最後一步（硬刪除）"""
    data = request.get_json() or {}
    reason = data.get('reason', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. 獲取訂單
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        return jsonify({'success': False, 'error': '訂單不存在'}), 404
    
    order = dict(order)
    
    # 2. 獲取最後兩步
    cursor.execute('''
        SELECT * FROM status_history 
        WHERE order_number = ? 
        ORDER BY action_date DESC, id DESC 
        LIMIT 2
    ''', (order_number,))
    history = cursor.fetchall()
    
    if len(history) < 2:
        conn.close()
        return jsonify({'success': False, 'error': '沒有可撤銷的步驟'}), 400
    
    last_step = dict(history[0])
    previous_step = dict(history[1])
    

    # 4. 記錄到操作日誌
    cursor.execute('''
        INSERT INTO audit_log (
            action_type, order_number, old_status, new_status,
            operator, reason
        ) VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        'UNDO_STEP',
        order_number,
        last_step['to_status'],
        previous_step['to_status'],
        g.current_user.get('username', 'system'),
        reason or '撤銷操作'
    ))
    
    # 5. 硬刪除最後一步
    cursor.execute('DELETE FROM status_history WHERE id = ?', (last_step['id'],))
    
    # 6. 恢復訂單到上一個狀態
    cursor.execute('''
        UPDATE orders 
        SET current_status = ?,
            last_status_change_date = ?,
            status_days = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_number = ?
    ''', (previous_step['to_status'], previous_step['action_date'], order_number))
    
    # 7. 更新燈號
    update_status_light(order['id'], conn)
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'已撤銷，訂單恢復到「{previous_step["to_status"]}」',
        'data': {
            'order_number': order_number,
            'restored_status': previous_step['to_status']
        }
    })

@tracking_bp.route('/api/orders/<order_number>/history/<int:history_id>', methods=['PUT'])
@api_admin_required
def api_update_history(order_number, history_id):
    """編輯歷史記錄的日期和備註"""
    data = request.get_json() or {}
    action_date = data.get('action_date')
    notes = data.get('notes', '')
    
    if not action_date:
        return jsonify({'success': False, 'error': '日期不能為空'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 檢查歷史記錄是否存在
    cursor.execute('''
        SELECT * FROM status_history 
        WHERE id = ? AND order_number = ?
    ''', (history_id, order_number))
    history_record = cursor.fetchone()
    
    if not history_record:
        conn.close()
        return jsonify({'success': False, 'error': '歷史記錄不存在'}), 404
    
    # 更新歷史記錄
    cursor.execute('''
        UPDATE status_history 
        SET action_date = ?, notes = ?
        WHERE id = ?
    ''', (action_date, notes, history_id))
    
    # 記錄到操作日誌
    cursor.execute('''
        INSERT INTO audit_log (
            action_type, order_number, operator, reason
        ) VALUES (?, ?, ?, ?)
    ''', (
        'EDIT_HISTORY',
        order_number,
        g.current_user.get('username', 'system'),
        f'編輯歷史記錄 #{history_id}'
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': '歷史記錄已更新'
    })

@tracking_bp.route('/api/orders/<order_number>', methods=['PUT'])
@api_admin_required
def api_update_order(order_number):
    """更新訂單信息API"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '無效的請求數據'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 檢查訂單是否存在
        cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'success': False, 'error': '訂單不存在'}), 404
        
        # 更新訂單（支持所有欄位）
        cursor.execute('''
            UPDATE orders 
            SET customer_name = ?, 
                order_date = ?, 
                product_name = ?,
                product_code = ?, 
                quantity = ?,
                factory = ?,
                production_type = ?, 
                pattern_code = ?, 
                expected_delivery_date = ?, 
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE order_number = ?
        ''', (
            data.get('customer_name'),
            data.get('order_date'),
            data.get('product_name', data.get('product_code', '')),  # product_name 優先，否則用 product_code
            data.get('product_code', ''),
            data.get('quantity', ''),
            data.get('factory', ''),
            data.get('production_type', ''),
            data.get('pattern_code', ''),
            data.get('expected_delivery_date'),
            data.get('notes', ''),
            order_number
        ))
        
        # 更新燈號
        update_status_light(order['id'], conn)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '訂單更新成功',
            'data': {'order_number': order_number}
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tracking_bp.route('/api/orders/<order_number>/change-number', methods=['POST'])
@api_admin_required
def api_change_order_number(order_number):
    """修改訂單號API（同步更新所有相關表）"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '無效的請求數據'}), 400
        
        new_order_number = data.get('new_order_number', '').strip()
        if not new_order_number:
            return jsonify({'success': False, 'error': '新訂單號不能為空'}), 400
        
        if new_order_number == order_number:
            return jsonify({'success': False, 'error': '新訂單號與原訂單號相同'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 檢查原訂單是否存在
        cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'success': False, 'error': '訂單不存在'}), 404
        
        order = dict(order)
        
        # 檢查新訂單號是否已存在
        cursor.execute('SELECT id FROM orders WHERE order_number = ?', (new_order_number,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'error': '新訂單號已存在',
                'code': 'DUPLICATE_ORDER_NUMBER'
            }), 400
        
        # 開始事務：更新所有相關表的訂單號
        try:
            # 1. 更新 orders 表
            cursor.execute('''
                UPDATE orders 
                SET order_number = ?,
                    customer_name = ?,
                    order_date = ?,
                    product_name = ?,
                    product_code = ?,
                    quantity = ?,
                    factory = ?,
                    production_type = ?,
                    pattern_code = ?,
                    expected_delivery_date = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE order_number = ?
            ''', (
                new_order_number,
                data.get('customer_name'),
                data.get('order_date'),
                data.get('product_name', data.get('product_code', '')),
                data.get('product_code', ''),
                data.get('quantity', ''),
                data.get('factory', ''),
                data.get('production_type', ''),
                data.get('pattern_code', ''),
                data.get('expected_delivery_date'),
                data.get('notes', ''),
                order_number
            ))
            
            # 2. 更新 status_history 表
            cursor.execute('''
                UPDATE status_history 
                SET order_number = ?
                WHERE order_number = ?
            ''', (new_order_number, order_number))
            
            # 3. 更新 audit_log 表
            cursor.execute('''
                UPDATE audit_log 
                SET order_number = ?
                WHERE order_number = ?
            ''', (new_order_number, order_number))
            
            # 4. 記錄操作日誌
            cursor.execute('''
                INSERT INTO audit_log (
                    action_type, order_number, old_status, new_status,
                    operator, reason
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                'CHANGE_ORDER_NUMBER',
                new_order_number,
                order_number,
                new_order_number,
                g.current_user.get('username', 'system'),
                f'訂單號從 {order_number} 修改為 {new_order_number}'
            ))
            
            # 更新燈號
            update_status_light(order['id'], conn)
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'訂單號已從 {order_number} 修改為 {new_order_number}',
                'data': {
                    'old_order_number': order_number,
                    'new_order_number': new_order_number
                }
            })
            
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({
                'success': False,
                'error': f'修改訂單號失敗：{str(e)}',
                'code': 'DATABASE_ERROR'
            }), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tracking_bp.route('/api/orders/<order_number>', methods=['DELETE'])

@api_admin_required
def api_delete_order(order_number):
    """刪除訂單（僅管理員）"""
    data = request.get_json() or {}
    confirm_order_number = data.get('confirm_order_number', '')
    reason = data.get('reason', '')
    
    # 驗證訂單號確認
    if confirm_order_number != order_number:
        return jsonify({
            'success': False,
            'error': '訂單號不匹配，請重新輸入'
        }), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 檢查訂單是否存在
    cursor.execute('SELECT * FROM orders WHERE order_number = ?', (order_number,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({
            'success': False,
            'error': '訂單不存在'
        }), 404
    
    order = dict(order)
    
    try:
        # 記錄到操作日誌（刪除前）
        cursor.execute('''
            INSERT INTO audit_log (
                action_type, order_number, old_status, new_status,
                operator, reason
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            'DELETE_ORDER',
            order_number,
            order['current_status'],
            'DELETED',
            g.current_user.get('username', 'system'),
            reason or '刪除訂單'
        ))
        
        # 刪除備註
        cursor.execute('DELETE FROM notes WHERE item_type = ? AND item_id = ?', 
                      ('order', order['id']))
        
        # 刪除圖片記錄
        cursor.execute('DELETE FROM images WHERE item_type = ? AND item_id = ?', 
                      ('order', order['id']))
        
        # 刪除狀態歷史
        cursor.execute('DELETE FROM status_history WHERE order_number = ?', (order_number,))
        
        # 刪除訂單
        cursor.execute('DELETE FROM orders WHERE order_number = ?', (order_number,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'訂單 {order_number} 已刪除',
            'data': {
                'order_number': order_number,
                'deleted_status': order['current_status']
            }
        })
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({
            'success': False,
            'error': f'刪除失敗：{str(e)}'
        }), 500


@tracking_bp.route('/api/search', methods=['GET'])
@login_required
def api_global_search():
    """全局搜索API - 搜索所有状态的订单"""
    keyword = request.args.get('q', '').strip()
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        if keyword:
            # 有关键字：搜索匹配的订单
            cursor.execute('''
                SELECT * FROM orders 
                WHERE order_number LIKE ? OR customer_name LIKE ?
                ORDER BY order_date DESC 
                LIMIT 100
            ''', (f'%{keyword}%', f'%{keyword}%'))
            
            orders = cursor.fetchall()
            
            # 转换为字典列表
            orders_list = []
            for order in orders:
                order_dict = dict(order)
                # 更新灯号
                order_dict['status_light'] = calculate_status_light(order)
                orders_list.append(order_dict)
            
            conn.close()
            
            return jsonify({
                'success': True,
                'type': 'search',
                'keyword': keyword,
                'orders': orders_list,
                'total': len(orders_list),
                'message': f'找到 {len(orders_list)} 条匹配的订单'
            })
        else:
            # 无关键字：返回最近250条（所有状态）
            cursor.execute('''
                SELECT * FROM orders 
                ORDER BY order_date DESC 
                LIMIT 250
            ''')
            
            orders = cursor.fetchall()
            
            # 转换为字典列表
            orders_list = []
            for order in orders:
                order_dict = dict(order)
                # 更新灯号
                order_dict['status_light'] = calculate_status_light(order)
                orders_list.append(order_dict)
            
            conn.close()
            
            return jsonify({
                'success': True,
                'type': 'recent',
                'orders': orders_list,
                'total': len(orders_list),
                'message': '最近250条订单（所有状态）'
            })
            
    except Exception as e:
        conn.close()
        return jsonify({
            'success': False,
            'error': f'搜索失败：{str(e)}'
        }), 500


# ==================== 初始化函數 ====================

def init_app(app):
    """初始化應用（整合到主應用時調用）"""
    app.register_blueprint(tracking_bp)
    # 初始化數據庫
    init_db()

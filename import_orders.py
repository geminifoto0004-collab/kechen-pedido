"""
导入订单数据脚本
从图片描述中提取的订单数据导入到数据库
"""
import sys
import os
from pathlib import Path
from datetime import datetime, date
import re

# 设置控制台编码（Windows）
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# 添加项目路径
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from order_tracking.models import get_db, calculate_status_light, update_status_light
from order_tracking.status_config import STATUS

# 从图片描述中提取的订单数据
ORDERS_DATA = [
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1005682",
        "customer_name": "NELIA GURARCHI",
        "product_name": "雪纺珠水印花",
        "product_info": "2024年5月30号已发配色图稿",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006204-1",
        "customer_name": "HERNAN CHINO",
        "product_name": "冰丝弹数码印花",
        "product_info": "看客人拿货情况在安排生产",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-4",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "先暂停安排",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-5",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "花型取消",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-6",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "等通知安排生产",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-7",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "先暂时不安排",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-8",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年2月14号已发修改配色图稿",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-9",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年2月28号已发排版图给客人确认",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-10",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年5月15号已发修改花型的配色图稿",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-11",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "先沟通底布在安排SO样",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-12",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年8月1号已发SO样",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-13",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年9月1号发修改设计图",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2024/5/15",
        "confirmation_date": "",
        "order_number": "1006693-14",
        "customer_name": "GONSALO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "2025年8月1号重发设计图给客人确认",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2025/7/28",
        "confirmation_date": "",
        "order_number": "1006693-15",
        "customer_name": "WALDO MAGI",
        "product_name": "雪纺珠水印花",
        "product_info": "",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2025/7/28",
        "confirmation_date": "",
        "order_number": "1006693-16",
        "customer_name": "FRANCISCO GONZALES",
        "product_name": "雪纺珠水印花",
        "product_info": "",
        "product_code": "",
        "product_category": ""
    },
    {
        "order_date": "2025/7/28",
        "confirmation_date": "",
        "order_number": "1006693-17",
        "customer_name": "WILLIAM TACO",
        "product_name": "雪纺珠水印花",
        "product_info": "",
        "product_code": "",
        "product_category": ""
    }
]

def parse_date(date_str):
    """解析日期字符串，支持 YYYY/MM/DD 格式"""
    if not date_str or date_str.strip() == "":
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y/%m/%d").date()
    except:
        try:
            return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
        except:
            return None

def extract_date_from_text(text):
    """从文本中提取日期，格式：2024年5月30号"""
    if not text:
        return None
    pattern = r'(\d{4})年(\d{1,2})月(\d{1,2})号'
    match = re.search(pattern, text)
    if match:
        year, month, day = match.groups()
        try:
            return date(int(year), int(month), int(day))
        except:
            return None
    return None

def determine_status_from_info(product_info):
    """根据产品信息判断订单状态（使用统一的状态配置）"""
    if not product_info:
        return STATUS['NEW_ORDER'], None
    
    info_lower = product_info.lower()
    
    # 已取消
    if "取消" in product_info or "花型取消" in product_info:
        return STATUS['CANCELLED'], None
    
    # 暂停/不安排
    if "暂停" in product_info or "不安排" in product_info or "等通知" in product_info:
        return STATUS['PENDING_PRODUCTION'], None
    
    # 打样相关
    if "so样" in info_lower or "打样" in info_lower:
        if "已发" in product_info:
            return STATUS['SAMPLE_CONFIRMING'], extract_date_from_text(product_info)
        elif "安排" in product_info:
            return STATUS['PENDING_SAMPLE'], None
        else:
            return STATUS['SAMPLING'], None
    
    # 图稿相关
    if "图稿" in product_info or "设计图" in product_info or "排版图" in product_info:
        if "修改" in product_info:
            return STATUS['DRAFT_REVISING'], extract_date_from_text(product_info)
        elif "确认" in product_info or "已发" in product_info:
            return STATUS['DRAFT_CONFIRMING'], extract_date_from_text(product_info)
        else:
            return STATUS['DRAFT_CONFIRMING'], None
    
    # 生产相关
    if "生产" in product_info or "安排生产" in product_info:
        if "看" in product_info or "等" in product_info:
            return STATUS['PENDING_PRODUCTION'], None
        elif "中" in product_info:
            return STATUS['PRODUCING'], None
        else:
            return STATUS['PENDING_PRODUCTION'], None
    
    # 默认状态
    return STATUS['NEW_ORDER'], None

def import_orders():
    """导入订单数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    print("=" * 60)
    print("开始导入订单数据...")
    print("=" * 60)
    
    for idx, order_data in enumerate(ORDERS_DATA, 1):
        try:
            order_number = order_data["order_number"]
            customer_name = order_data["customer_name"]
            order_date = parse_date(order_data["order_date"])
            
            if not order_date:
                print(f"❌ [{idx}] 订单 {order_number}: 订单日期格式错误")
                error_count += 1
                continue
            
            # 检查订单是否已存在
            cursor.execute("SELECT id FROM orders WHERE order_number = ?", (order_number,))
            if cursor.fetchone():
                print(f"⏭️  [{idx}] 订单 {order_number}: 已存在，跳过")
                skipped_count += 1
                continue
            
            # 确定状态
            product_info = order_data.get("product_info", "")
            current_status, status_date = determine_status_from_info(product_info)
            
            # 如果没有从产品信息中提取到日期，使用订单日期
            if not status_date:
                status_date = order_date
            
            # 准备备注（包含产品名称和产品信息）
            notes_parts = []
            if order_data.get("product_name"):
                notes_parts.append(f"产品: {order_data['product_name']}")
            if product_info:
                notes_parts.append(f"备注: {product_info}")
            notes = "\n".join(notes_parts) if notes_parts else None
            
            # 插入订单（注意字段顺序和数量要与数据库表结构匹配）
            cursor.execute('''
                INSERT INTO orders (
                    order_number, customer_name, order_date,
                    product_name, current_status, last_status_change_date,
                    status_light, status_days, notes, factory,
                    production_type, product_code, quantity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_number,
                customer_name,
                order_date.isoformat(),
                order_data.get("product_name"),
                current_status,
                status_date.isoformat() if status_date else order_date.isoformat(),
                'green',  # 初始灯号，后面会更新
                0,  # 初始天数
                notes,
                None,  # 工厂信息暂时为空
                None,  # production_type
                order_data.get("product_code"),  # product_code
                None  # quantity
            ))
            
            order_id = cursor.lastrowid
            
            # 插入状态历史
            cursor.execute('''
                INSERT INTO status_history (
                    order_id, order_number, from_status, to_status,
                    action_date, operator, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_id,
                order_number,
                None,
                current_status,
                status_date.isoformat() if status_date else order_date.isoformat(),
                'system',
                '订单导入'
            ))
            
            # 更新灯号
            cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
            order = dict(cursor.fetchone())
            light = calculate_status_light(order)
            status_days = (date.today() - status_date).days if status_date else 0
            
            cursor.execute('''
                UPDATE orders 
                SET status_light = ?, status_days = ?
                WHERE id = ?
            ''', (light, status_days, order_id))
            
            success_count += 1
            print(f"✅ [{idx}] 订单 {order_number} ({customer_name}): {current_status}")
            
        except Exception as e:
            error_count += 1
            print(f"❌ [{idx}] 订单 {order_data.get('order_number', 'N/A')}: 导入失败 - {str(e)}")
            conn.rollback()
            continue
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print(f"导入完成！")
    print(f"  ✅ 成功: {success_count}")
    print(f"  ⏭️  跳过: {skipped_count}")
    print(f"  ❌ 失败: {error_count}")
    print("=" * 60)

if __name__ == '__main__':
    import_orders()


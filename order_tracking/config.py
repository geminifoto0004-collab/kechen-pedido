"""
訂單流程追蹤系統 - 配置文件
"""
import os

# 基礎配置
SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-in-production-2026'
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production-2026'
JWT_EXPIRATION_DELTA = 7 * 24 * 60 * 60  # 7天

# 數據庫配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'data', 'tracking.db')

# 藍圖配置
BLUEPRINT_NAME = 'tracking_bp'
URL_PREFIX = '/tracking'

# ==================== 燈號規則配置（天數）====================
# 核心原则：监控每个阶段的停留时间
# 🟢 绿灯 = 正常进行中
# 🟡 黄灯 = 停留时间有点久了，该注意了
# 🔴 红灯 = 停留太久了，必须处理！

LIGHT_RULES = {
    # ===== 等客户回复的状态（比较紧迫）=====
    
    'new_order': {
        # 新订单/询价刚进来
        'yellow_days': 5,      # 5天变黄：该跟进了
        'red_days': 7,         # 7天变红：客户可能不感兴趣了
        'description': '新订单 - 刚收到询价'
    },
    
    'quote_confirming': {
        # 报价已发出，等客户确认
        'yellow_days': 4,      # 4天变黄：该追问客户了
        'red_days': 7,         # 7天变红：很紧迫，必须追！
        'description': '报价待确认 - 等国外客户回复报价'
    },
    
    'draft_confirm': {
        # 图稿已发出，等客户确认
        'yellow_days': 3,      # 3天变黄：该催客户看图了
        'red_days': 5,         # 5天变红：必须催！
        'description': '图稿待确认 - 等国外客户确认图稿'
    },
    
    'draft_revising': {
        # 客户要求修改图稿，我们在改
        'yellow_days': 2,      # 2天变黄：改得有点慢
        'red_days': 4,         # 4天变红：太慢了
        'description': '图稿修改中 - 国内修改图稿'
    },
    
    'sampling_confirm': {
        # 样品已寄出，等客户确认
        'yellow_days': 2,      # 2天变黄：该问问收到没
        'red_days': 4,         # 4天变红：要追问！
        'description': '打样待确认 - 等国外客户确认样品'
    },
    
    'sample_revising': {
        # 客户要求修改样品，我们在改
        'yellow_days': 3,      # 3天变黄
        'red_days': 5,         # 5天变红
        'description': '打样修改中 - 国内修改样品'
    },
    
    # ===== 我们这边处理的状态（相对宽松）=====
    
    'ready_sample': {
        # 图稿确认了，等待开始打样
        'yellow_days': 5,      # 5天变黄：该安排了
        'red_days': 7,         # 7天变红：太慢了
        'description': '待打样 - 国内准备打样'
    },
    
    'sampling_process': {
        # 正在打样中
        'yellow_days': 10,     # 10天变黄：有点久
        'red_days': 15,        # 15天变红：太久了，检查问题
        'description': '打样中 - 国内正在制作样品'
    },
    
    'ready_production': {
        # 样品确认了，等待开始生产
        'yellow_days': 3,      # 3天变黄：该催工厂了
        'red_days': 5,         # 5天变红：必须催！
        'description': '待生产 - 等工厂排产'
    },
    
    'producing': {
        # 正在生产中
        'yellow_days': 14,     # 14天变黄：稍长，关注进度
        'red_days': 21,        # 21天变红：异常，检查问题
        'description': '生产中 - 工厂正在生产'
    },
    
    # ===== 其他 =====
    
    'revision': {
        # 修图需求
        'yellow_days': 3,
        'red_days': 5,
        'description': '修图中'
    },
    
    # 暂时保留（虽然不推荐使用，但 models.py 还在引用）
    'delivery_warning_days': 3  # 距离交货日期3天内警告
}

# 注意：delivery_warning_days 已不推荐使用
# 原因：交货日期往往不准确（询价、图稿阶段客户拖延会导致超期）
# 建议只监控每个阶段的停留时间，这样更准确
# 等 models.py 更新后可以移除

# 上傳配置（預留）
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# 確保目錄存在
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

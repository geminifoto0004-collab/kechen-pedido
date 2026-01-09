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

# 燈號規則配置（天數）
LIGHT_RULES = {
    'new_order': {
        'yellow_days': 5,
        'red_days': 7
    },
    'draft_confirm': {
        'yellow_days': 3,
        'red_days': 5
    },
    'ready_sample': {
        'yellow_days': 5,
        'red_days': 7
    },
    'sampling_process': {
        'yellow_days': 10,
        'red_days': None  # 打樣中只有黃燈
    },
    'sampling_confirm': {
        'yellow_days': 2,
        'red_days': 3
    },
    'ready_production': {
        'yellow_days': 3,
        'red_days': 5
    },
    'revision': {
        'yellow_days': 3,
        'red_days': 5
    },
    'delivery_warning_days': 3
}

# 上傳配置（預留）
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# 確保目錄存在
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


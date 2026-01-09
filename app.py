"""
訂單流程追蹤系統 - 獨立運行入口
開發測試用（項目根目錄版本）
"""
from flask import Flask
from order_tracking import tracking_bp, init_db

app = Flask(__name__)
app.secret_key = 'development-secret-key-change-in-production'

# 初始化數據庫
init_db()

# 註冊Blueprint
app.register_blueprint(tracking_bp)

if __name__ == '__main__':
    print("=" * 50)
    print("📦 訂單流程追蹤系統")
    print("=" * 50)
    print("🌐 訪問地址: http://localhost:5000/tracking")
    print("👤 預設帳號:")
    print("   - 管理員: admin / admin123")
    print("   - 查看者: viewer / viewer123")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)


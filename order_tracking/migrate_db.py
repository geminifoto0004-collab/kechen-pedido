#!/usr/bin/env python
"""
數據庫遷移腳本
用法：python migrate_db.py
"""
import sys
from pathlib import Path

# 添加項目根目錄到路徑
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir.parent))

from order_tracking.models import migrate_database, check_migration_status

if __name__ == '__main__':
    print("開始遷移...")
    migrate_database()
    print("\n檢查遷移結果...")
    check_migration_status()
    print("\n遷移完成！")


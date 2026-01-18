import sqlite3
from pathlib import Path

# ====== 資料庫路徑 ======
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "tracking.db"

if not DB_PATH.exists():
    raise FileNotFoundError(f"找不到資料庫檔案：{DB_PATH}")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=" * 60)
print(f"資料庫位置：{DB_PATH.resolve()}")
print("=" * 60)

# ====== 1. 列出所有資料表 ======
cur.execute("""
    SELECT name 
    FROM sqlite_master 
    WHERE type='table'
    ORDER BY name
""")
tables = [row["name"] for row in cur.fetchall()]

print("\n【資料表列表】")
for t in tables:
    print(f" - {t}")

# ====== 2. 每個表的欄位結構 + 資料 ======
for table in tables:
    print("\n" + "=" * 60)
    print(f"資料表：{table}")
    print("=" * 60)

    # 欄位結構
    cur.execute(f"PRAGMA table_info({table})")
    columns = cur.fetchall()

    print("\n【欄位結構】")
    for col in columns:
        print(
            f"- {col['name']:<20} | "
            f"type={col['type']:<10} | "
            f"notnull={col['notnull']} | "
            f"default={col['dflt_value']} | "
            f"pk={col['pk']}"
        )

    # 前 5 筆資料
    cur.execute(f"SELECT * FROM {table} LIMIT 5")
    rows = cur.fetchall()

    print("\n【前 5 筆資料】")
    if not rows:
        print("（無資料）")
    else:
        for i, row in enumerate(rows, 1):
            print(f"\n-- 第 {i} 筆 --")
            for key in row.keys():
                print(f"{key}: {row[key]}")

conn.close()

print("\n【全文搜尋：YU】")

for table in tables:
    try:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        for row in rows:
            for v in row:
                if v and isinstance(v, str) and "YU" in v:
                    print(f"表={table} | 值={v}")
    except Exception as e:
        pass

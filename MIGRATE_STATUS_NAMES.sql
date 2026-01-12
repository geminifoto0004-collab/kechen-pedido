-- ============================================
-- 状态名称迁移脚本
-- 将所有"确认中"改为"待确认"
-- ============================================
-- 
-- 注意：执行前请备份数据库！
-- 
-- 使用方法：
-- sqlite3 your_database.db < MIGRATE_STATUS_NAMES.sql
--

-- 备份原数据（可选）
-- CREATE TABLE orders_backup AS SELECT * FROM orders;
-- CREATE TABLE status_history_backup AS SELECT * FROM status_history;

-- 更新 orders 表
UPDATE orders SET current_status = '报价待确认' WHERE current_status = '报价确认中';
UPDATE orders SET current_status = '图稿待确认' WHERE current_status = '图稿确认中';
UPDATE orders SET current_status = '打样待确认' WHERE current_status = '打样确认中';

-- 更新 status_history 表
UPDATE status_history SET from_status = '报价待确认' WHERE from_status = '报价确认中';
UPDATE status_history SET from_status = '图稿待确认' WHERE from_status = '图稿确认中';
UPDATE status_history SET from_status = '打样待确认' WHERE from_status = '打样确认中';

UPDATE status_history SET to_status = '报价待确认' WHERE to_status = '报价确认中';
UPDATE status_history SET to_status = '图稿待确认' WHERE to_status = '图稿确认中';
UPDATE status_history SET to_status = '打样待确认' WHERE to_status = '打样确认中';

-- 验证更新
SELECT DISTINCT current_status FROM orders ORDER BY current_status;
SELECT DISTINCT from_status FROM status_history WHERE from_status IS NOT NULL ORDER BY from_status;
SELECT DISTINCT to_status FROM status_history ORDER BY to_status;


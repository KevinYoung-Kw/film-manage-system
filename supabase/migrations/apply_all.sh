#!/bin/bash
# 执行所有必要的SQL迁移脚本
# 使用方法: ./apply_all.sh <supabase项目ID>

if [ -z "$1" ]; then
  echo "错误: 必须提供Supabase项目ID"
  echo "用法: ./apply_all.sh <supabase项目ID>"
  exit 1
fi

PROJECT_ID=$1
DB_URL="db.${PROJECT_ID}.supabase.co"
DB_PORT=5432
DB_NAME="postgres"
DB_USER="postgres"

echo "请输入数据库密码:"
read -s DB_PASS

echo "开始应用迁移..."

# 重置数据库
echo "步骤 1/2: 执行 DATABASE_RESET.sql"
PGPASSWORD=$DB_PASS psql -h $DB_URL -p $DB_PORT -d $DB_NAME -U $DB_USER -f DATABASE_RESET.sql

# 应用认证和安全设置
echo "步骤 2/2: 执行 auth_and_security.sql"
PGPASSWORD=$DB_PASS psql -h $DB_URL -p $DB_PORT -d $DB_NAME -U $DB_USER -f auth_and_security.sql

# 以下文件已整合到主要文件中:
# - setup_auth.sql 和 update_rls_policies.sql 已整合到 auth_and_security.sql
# - update_create_order.sql 已整合到 DATABASE_RESET.sql
# - drop_duplicate_function.sql 已整合到 DATABASE_RESET.sql

echo "迁移完成!"
echo "当前数据库架构版本: 1.3.0" 
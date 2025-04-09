# 电影票务系统数据库设计与实现

这个文件夹包含电影票务系统的完整数据库设计，旨在从现有的模拟数据迁移到Supabase(PostgreSQL)数据库。

## 文件结构

- **SQL_DESIGN_SCHEMA.sql**: 数据库表结构定义
- **SQL_VIEWS.sql**: 数据库视图定义
- **SQL_PROCEDURES.sql**: 存储过程定义
- **SQL_TRIGGERS.sql**: 触发器定义
- **SQL_SECURITY.sql**: 安全策略和权限定义
- **SQL_DATA_MIGRATION.sql**: 数据迁移脚本

## 使用说明

### 数据库部署步骤

1. 在Supabase中创建新项目
2. 连接到SQL编辑器
3. 按照以下顺序执行SQL文件:
   1. SQL_DESIGN_SCHEMA.sql
   2. SQL_PROCEDURES.sql
   3. SQL_TRIGGERS.sql
   4. SQL_VIEWS.sql
   5. SQL_SECURITY.sql
   6. SQL_DATA_MIGRATION.sql

### 连接到数据库

可以使用Supabase客户端库连接到数据库:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// 示例查询
const { data, error } = await supabase
  .from('movies')
  .select('*')
  .eq('status', 'showing')
```

## 数据库设计说明

### 主要表结构

- **users**: 用户信息
- **movies**: 电影信息
- **theaters**: 影厅信息
- **theater_seat_layouts**: 影厅座位布局
- **showtimes**: 电影场次
- **seats**: 场次座位
- **orders**: 订单信息
- **order_seats**: 订单座位关联
- **staff_operations**: 工作人员操作记录
- **staff_schedules**: 工作人员排班
- **payments**: 支付记录
- **payment_methods**: 支付方式
- **banners**: 轮播图
- **announcements**: 公告
- **faqs**: 常见问题

### 主要功能

1. **电影管理**：添加、更新、删除电影信息
2. **影厅管理**：管理影厅及座位布局
3. **场次管理**：设置电影场次和价格
4. **订单处理**：创建、支付、取消、退款订单
5. **售票操作**：售票、检票、退票
6. **用户管理**：用户注册、登录、权限控制
7. **数据统计**：票房统计、观影人数统计

### 权限设计

系统设计了三种用户角色:

- **管理员(admin)**: 拥有全部权限
- **工作人员(staff)**: 可以售票、检票、退票，查看排班
- **观众(customer)**: 可以浏览电影、场次，购票、退票

## 视图说明

系统提供了多个视图以便于数据查询:

- **vw_now_showing_movies**: 正在上映的电影
- **vw_coming_soon_movies**: 即将上映的电影
- **vw_today_showtimes**: 今日场次
- **vw_movie_details**: 电影详情(包含场次信息)
- **vw_user_orders**: 用户订单
- **vw_available_seats**: 场次可用座位
- **vw_staff_operations**: 员工操作记录
- **vw_daily_revenue**: 每日票房
- **vw_movie_revenue_ranking**: 电影票房排行
- **vw_theater_occupancy**: 影厅使用率
- **vw_ticket_type_distribution**: 票种分布
- **vw_staff_schedules**: 工作人员排班

## 存储过程说明

系统实现了多个存储过程处理核心业务逻辑:

- **generate_order_id()**: 生成订单号
- **create_order()**: 创建订单
- **cancel_order()**: 取消订单
- **check_ticket()**: 检票
- **refund_ticket()**: 退票
- **sell_ticket()**: 售票
- **generate_seats_for_showtime()**: 为场次生成座位

## 触发器说明

系统使用触发器确保数据一致性:

- **自动更新时间戳**: 在记录更新时自动更新时间戳
- **自动生成座位**: 添加场次时自动生成座位
- **检查场次冲突**: 防止同一影厅场次时间冲突
- **订单状态变更验证**: 确保订单状态变更符合业务逻辑
- **支付成功后更新订单**: 支付成功后自动更新订单状态

## 注意事项

1. 执行数据迁移脚本前，请确保已经创建了所有必要的表结构和存储过程
2. 数据迁移脚本会清空所有表数据，请谨慎在生产环境执行
3. 执行存储过程前，确保提供正确的参数类型
4. 测试数据仅用于演示，包含电影上映时间设定在2025年 
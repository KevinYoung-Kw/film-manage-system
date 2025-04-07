export enum UserRole {
  ADMIN = 'admin',      // 影院管理员
  STAFF = 'staff',      // 售票员
  CUSTOMER = 'customer' // 观众
}

// 电影状态
export enum MovieStatus {
  SHOWING = 'showing',          // 正在上映
  COMING_SOON = 'coming_soon',  // 即将上映
  OFF_SHOWING = 'off_showing'   // 已下映
}

// 用户基本信息
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// 电影类型
export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;  // 原始标题（外语电影）
  poster: string;
  duration: number; // 分钟
  director: string;
  actors: string[];
  cast?: string[];  // 演员阵容（详细）
  description: string;
  releaseDate: Date;
  genre: string[];
  rating: number; // 1-10的评分
  status?: MovieStatus;  // 电影状态
}

// 影厅类型
export interface Theater {
  id: string;
  name: string;
  totalSeats: number;
  rows: number;
  columns: number;
  equipment: string[]; // 设备列表，如 "3D", "IMAX", "4D"等
}

// 座位类型
export interface Seat {
  id: string;
  row: number;
  column: number;
  type: 'normal' | 'vip' | 'couple' | 'disabled';
  available: boolean;
}

// 票价类型
export enum TicketType {
  NORMAL = 'normal',
  STUDENT = 'student',
  SENIOR = 'senior',
  CHILD = 'child',
  VIP = 'vip'
}

// 电影场次
export interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  startTime: Date;
  endTime: Date;
  price: Record<TicketType, number>; // 不同票价类型对应的价格
  availableSeats: Seat[];
}

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',     // 待支付
  PAID = 'paid',           // 已支付
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded'    // 已退款
}

// 订单类型
export interface Order {
  id: string;
  userId: string;
  showtimeId: string;
  seats: string[]; // 座位ID列表
  ticketType: TicketType;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
}

// 工作人员操作类型
export enum StaffOperationType {
  SELL = 'sell',           // 售票
  CHECK = 'check',         // 检票
  REFUND = 'refund',       // 退票
  MODIFY = 'modify'        // 改签
}

// 工作人员操作记录
export interface StaffOperation {
  id: string;
  staffId: string;         // 操作人员ID
  orderId?: string;        // 相关订单ID
  showtimeId?: string;     // 相关场次ID
  type: StaffOperationType; // 操作类型
  details: string;         // 操作详情（可以是JSON字符串）
  createdAt: Date;         // 操作时间
}

// 排班时段类型
export enum ShiftType {
  MORNING = 'morning',     // 早班 (8:00-14:00)
  AFTERNOON = 'afternoon', // 午班 (14:00-20:00)
  EVENING = 'evening'      // 晚班 (20:00-次日2:00)
}

// 工作人员排班信息
export interface StaffSchedule {
  id: string;
  staffId: string;         // 员工ID
  date: Date;              // 排班日期
  shift: ShiftType;        // 班次类型
  position: string;        // 工作岗位 (如"售票"、"检票"等)
  notes?: string;          // 备注信息
  createdAt: Date;         // 创建时间
  updatedAt?: Date;        // 更新时间
} 
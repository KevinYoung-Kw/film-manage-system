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
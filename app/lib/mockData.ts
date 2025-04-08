import { User, UserRole, Movie, Theater, Showtime, Order, OrderStatus, TicketType, MovieStatus, StaffOperation, StaffOperationType, StaffSchedule, ShiftType } from './types';

// 默认图片资源
export const defaultImages = {
  banner: '/images/default-banner.jpg',
  moviePoster: '/images/default-poster.jpg',
  avatar: '/images/default-avatar.jpg',
  theater: '/images/default-theater.jpg',
  logo: '/images/logo.png'
};

// 网站信息
export const siteInfo = {
  name: '电影票务系统',
  address: '中国某省某市某区某街道123号',
  phone: '400-123-4567',
  email: 'support@example.com',
  copyright: '© 2025 电影票务系统',
  workingHours: '09:00 - 22:00'
};

// 模拟电影数据
export const mockMovies: Movie[] = [
  {
    id: "movie1",
    title: "流浪地球2",
    originalTitle: "The Wandering Earth II",
    description: "太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。",
    director: "郭帆",
    actors: ["吴京", "刘德华", "李雪健", "沙溢"],
    cast: ["吴京", "刘德华", "李雪健", "沙溢", "宁理", "王智", "朱颜曼滋", "安地"],
    genre: ["科幻", "冒险", "灾难"],
    duration: 173,
    rating: 8.2,
    releaseDate: new Date("2023-01-22"),
    poster: defaultImages.moviePoster,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie2",
    title: "独行月球",
    poster: "https://img1.doubanio.com/view/photo/l/public/p2876409008.webp",
    duration: 122,
    director: "张小北",
    actors: ["沈腾", "马丽", "常远", "李诞"],
    description: "人类为抵御小行星的撞击，拯救地球，在月球部署了月盾计划。但由于意外，一名中国宇航员执行月盾计划时被困在了月球。",
    releaseDate: new Date("2023-07-29"),
    genre: ["喜剧", "科幻"],
    rating: 7.8,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie3",
    title: "长安三万里",
    poster: "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2892364610.webp",
    duration: 138,
    director: "刘海波",
    actors: ["王凯", "李雪健", "吴磊", "沈腾"],
    description: "盛唐时期，诗人高适与李白的传奇友谊，以及他们在大唐盛世的奇异冒险。",
    releaseDate: new Date("2023-07-08"),
    genre: ["动画", "历史", "奇幻"],
    rating: 8.3,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie4",
    title: "奥本海默",
    poster: "https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2895145309.webp",
    duration: 180,
    director: "克里斯托弗·诺兰",
    actors: ["基里安·墨菲", "艾米丽·布朗特", "马特·达蒙", "小罗伯特·唐尼"],
    description: "本片聚焦于美国物理学家J·罗伯特·奥本海默的故事，他被称为'原子弹之父'。",
    releaseDate: new Date("2023-08-30"),
    genre: ["传记", "历史", "剧情"],
    rating: 9.0,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie5",
    title: "坚如磐石",
    poster: "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2895107941.webp",
    duration: 128,
    director: "张艺谋",
    actors: ["雷佳音", "张国立", "于和伟", "周冬雨"],
    description: "这是一部犯罪题材电影，讲述了一桩看似简单的自杀案引出的一系列黑幕，以及主人公与幕后黑手斗智斗勇的故事。",
    releaseDate: new Date("2023-09-28"),
    genre: ["犯罪", "悬疑", "剧情"],
    rating: 7.5,
    status: MovieStatus.COMING_SOON
  },
  {
    id: "movie6",
    title: "孤注一掷",
    poster: "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2895465725.webp", 
    duration: 137,
    director: "申奥",
    actors: ["张艺兴", "王戈", "刘浩存", "范伟"],
    description: "一场意外中，建筑工人潘生意外坠楼，为了给女儿治病，他铤而走险踏上了一条危险的路。",
    releaseDate: new Date("2023-08-18"),
    genre: ["犯罪", "剧情"],
    rating: 7.3,
    status: MovieStatus.COMING_SOON
  },
  {
    id: "movie7",
    title: "封神第一部",
    poster: "https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2889966987.webp",
    duration: 148,
    director: "乌尔善",
    actors: ["费翔", "李雪健", "黄渤", "于适"],
    description: "商王殷寿与狐妖妲己勾结，暴虐无道，引发天谴。姬昌率领的西周和阐教弟子妄图讨伐商王，却遭到以申公豹为首的截教弟子的阻挠。",
    releaseDate: new Date("2023-07-20"),
    genre: ["奇幻", "动作", "古装"],
    rating: 7.0,
    status: MovieStatus.OFF_SHOWING
  }
];

// 模拟影厅数据
export const mockTheaters: Theater[] = [
  {
    id: "theater1",
    name: "1号厅 - IMAX",
    totalSeats: 120,
    rows: 10,
    columns: 12,
    equipment: ["IMAX", "杜比全景声"]
  },
  {
    id: "theater2",
    name: "2号厅 - 3D",
    totalSeats: 80,
    rows: 8,
    columns: 10,
    equipment: ["3D", "杜比音效"]
  },
  {
    id: "theater3",
    name: "3号厅 - 标准",
    totalSeats: 60,
    rows: 6,
    columns: 10,
    equipment: ["标准银幕"]
  }
];

// 生成座位数据的辅助函数
const generateSeats = (theater: Theater) => {
  const seats = [];
  
  for (let row = 1; row <= theater.rows; row++) {
    for (let col = 1; col <= theater.columns; col++) {
      // 简单的逻辑：边角座位设为情侣座，中间两排为VIP座位
      let type: 'normal' | 'vip' | 'couple' | 'disabled' = 'normal';
      
      if ((row === 1 && col === 1) || (row === theater.rows && col === theater.columns)) {
        type = 'couple';
      } else if (row === Math.floor(theater.rows / 2) || row === Math.floor(theater.rows / 2) + 1) {
        type = 'vip';
      } else if (row === theater.rows && col === 1) {
        type = 'disabled';
      }
      
      seats.push({
        id: `seat-${theater.id}-${row}-${col}`,
        row,
        column: col,
        type,
        available: Math.random() > 0.2 // 随机生成一些已售出座位
      });
    }
  }
  
  return seats;
};

// 模拟电影场次数据
export const mockShowtimes: Showtime[] = [
  {
    id: "showtime1",
    movieId: "movie1",
    theaterId: "theater1",
    startTime: new Date("2024-05-01T10:00:00"),
    endTime: new Date("2024-05-01T12:25:00"),
    price: {
      [TicketType.NORMAL]: 80,
      [TicketType.STUDENT]: 40,
      [TicketType.SENIOR]: 40,
      [TicketType.CHILD]: 40,
      [TicketType.VIP]: 100
    },
    availableSeats: generateSeats(mockTheaters[0])
  },
  {
    id: "showtime2",
    movieId: "movie1",
    theaterId: "theater1",
    startTime: new Date("2024-05-01T14:00:00"),
    endTime: new Date("2024-05-01T16:25:00"),
    price: {
      [TicketType.NORMAL]: 80,
      [TicketType.STUDENT]: 40,
      [TicketType.SENIOR]: 40,
      [TicketType.CHILD]: 40,
      [TicketType.VIP]: 100
    },
    availableSeats: generateSeats(mockTheaters[0])
  },
  {
    id: "showtime3",
    movieId: "movie2",
    theaterId: "theater2",
    startTime: new Date("2024-05-01T11:30:00"),
    endTime: new Date("2024-05-01T13:32:00"),
    price: {
      [TicketType.NORMAL]: 60,
      [TicketType.STUDENT]: 30,
      [TicketType.SENIOR]: 30,
      [TicketType.CHILD]: 30,
      [TicketType.VIP]: 80
    },
    availableSeats: generateSeats(mockTheaters[1])
  },
  {
    id: "showtime4",
    movieId: "movie3",
    theaterId: "theater3",
    startTime: new Date("2024-05-01T13:00:00"),
    endTime: new Date("2024-05-01T15:18:00"),
    price: {
      [TicketType.NORMAL]: 50,
      [TicketType.STUDENT]: 25,
      [TicketType.SENIOR]: 25,
      [TicketType.CHILD]: 25,
      [TicketType.VIP]: 70
    },
    availableSeats: generateSeats(mockTheaters[2])
  },
  {
    id: "showtime5",
    movieId: "movie4",
    theaterId: "theater1",
    startTime: new Date("2024-05-01T19:00:00"),
    endTime: new Date("2024-05-01T22:00:00"),
    price: {
      [TicketType.NORMAL]: 90,
      [TicketType.STUDENT]: 45,
      [TicketType.SENIOR]: 45,
      [TicketType.CHILD]: 45,
      [TicketType.VIP]: 120
    },
    availableSeats: generateSeats(mockTheaters[0])
  }
];

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: "admin1",
    name: "管理员",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    createdAt: new Date("2023-01-01")
  },
  {
    id: "staff1",
    name: "售票员小王",
    email: "staff1@example.com",
    role: UserRole.STAFF,
    createdAt: new Date("2023-01-15")
  },
  {
    id: "customer1",
    name: "张三",
    email: "customer1@example.com",
    role: UserRole.CUSTOMER,
    createdAt: new Date("2023-02-10")
  },
  {
    id: "customer2",
    name: "李四",
    email: "customer2@example.com",
    role: UserRole.CUSTOMER,
    createdAt: new Date("2023-03-15")
  }
];

// 模拟订单数据
export const mockOrders: Order[] = [
  {
    id: "order1",
    userId: "customer1",
    showtimeId: "showtime1",
    seats: ["seat-theater1-5-6", "seat-theater1-5-7"],
    ticketType: TicketType.NORMAL,
    totalPrice: 160,
    status: OrderStatus.PAID,
    createdAt: new Date("2024-04-25T14:30:00"),
    paidAt: new Date("2024-04-25T14:35:00")
  },
  {
    id: "order2",
    userId: "customer2",
    showtimeId: "showtime3",
    seats: ["seat-theater2-3-5"],
    ticketType: TicketType.STUDENT,
    totalPrice: 30,
    status: OrderStatus.PAID,
    createdAt: new Date("2024-04-26T09:15:00"),
    paidAt: new Date("2024-04-26T09:20:00")
  },
  {
    id: "order3",
    userId: "customer1",
    showtimeId: "showtime5",
    seats: ["seat-theater1-4-6", "seat-theater1-4-7", "seat-theater1-4-8"],
    ticketType: TicketType.NORMAL,
    totalPrice: 270,
    status: OrderStatus.PENDING,
    createdAt: new Date("2024-04-28T18:45:00")
  }
];

// 模拟工作人员操作记录
export const mockStaffOperations: StaffOperation[] = [
  {
    id: "operation1",
    staffId: "staff1",
    orderId: "order1",
    showtimeId: "showtime1",
    type: StaffOperationType.SELL,
    details: JSON.stringify({
      ticketType: TicketType.NORMAL,
      seats: ["seat-theater1-5-6", "seat-theater1-5-7"],
      totalPrice: 160,
      paymentMethod: "cash"
    }),
    createdAt: new Date("2024-04-25T14:35:00")
  },
  {
    id: "operation2",
    staffId: "staff1",
    orderId: "order2",
    showtimeId: "showtime3",
    type: StaffOperationType.SELL,
    details: JSON.stringify({
      ticketType: TicketType.STUDENT,
      seats: ["seat-theater2-3-5"],
      totalPrice: 30,
      paymentMethod: "wechat"
    }),
    createdAt: new Date("2024-04-26T09:20:00")
  },
  {
    id: "operation3",
    staffId: "staff1",
    orderId: "order1",
    showtimeId: "showtime1",
    type: StaffOperationType.CHECK,
    details: JSON.stringify({
      checkTime: "2024-04-25T16:45:00",
      status: "success"
    }),
    createdAt: new Date("2024-04-25T16:45:00")
  },
  {
    id: "operation4",
    staffId: "staff1",
    orderId: "order4",
    showtimeId: "showtime2",
    type: StaffOperationType.REFUND,
    details: JSON.stringify({
      refundAmount: 80,
      reason: "顾客个人原因",
      refundMethod: "original"
    }),
    createdAt: new Date("2024-04-27T11:30:00")
  }
];

// 模拟工作人员排班信息
export const mockStaffSchedules: StaffSchedule[] = [
  {
    id: "schedule1",
    staffId: "staff1",
    date: new Date("2024-05-01"),
    shift: ShiftType.MORNING,
    position: "售票",
    notes: "工作日早班",
    createdAt: new Date("2024-04-20T10:00:00")
  },
  {
    id: "schedule2",
    staffId: "staff1",
    date: new Date("2024-05-01"),
    shift: ShiftType.AFTERNOON,
    position: "检票",
    notes: "工作日下午班",
    createdAt: new Date("2024-04-20T10:00:00")
  },
  {
    id: "schedule3",
    staffId: "staff1",
    date: new Date("2024-05-02"),
    shift: ShiftType.EVENING,
    position: "售票",
    notes: "加班",
    createdAt: new Date("2024-04-20T10:00:00"),
    updatedAt: new Date("2024-04-25T14:30:00")
  },
  {
    id: "schedule4",
    staffId: "staff1",
    date: new Date("2024-05-03"),
    shift: ShiftType.MORNING,
    position: "售票",
    createdAt: new Date("2024-04-20T10:00:00")
  },
  {
    id: "schedule5",
    staffId: "staff1",
    date: new Date("2024-05-04"),
    shift: ShiftType.AFTERNOON,
    position: "检票",
    notes: "周末班",
    createdAt: new Date("2024-04-20T10:00:00")
  }
];

// 轮播图数据
export const mockBanners = [
  {
    id: "banner1",
    imageUrl: "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2895465725.webp",
    title: "孤注一掷",
    description: "一场意外中，建筑工人潘生意外坠楼，为了给女儿治病，他铤而走险踏上了一条危险的路。",
    link: "/movies/movie6"
  },
  {
    id: "banner2",
    imageUrl: "https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2895145309.webp",
    title: "奥本海默",
    description: "本片聚焦于美国物理学家J·罗伯特·奥本海默的故事，他被称为'原子弹之父'。",
    link: "/movies/movie4"
  },
  {
    id: "banner3",
    imageUrl: defaultImages.banner,
    title: "会员日特惠",
    description: "每周二会员日，全场电影票8折优惠",
    link: "/promotions/members-day"
  }
];

// 公告消息
export const mockAnnouncements = [
  {
    id: "announcement1",
    title: "五一特别活动",
    content: "五一期间，购买任意电影票即可参与抽奖，有机会获得电影周边礼品。",
    date: new Date("2024-04-25")
  },
  {
    id: "announcement2",
    title: "系统维护通知",
    content: "系统将于2024年5月3日凌晨2:00-4:00进行维护升级，期间可能无法正常访问，请提前安排您的购票时间。",
    date: new Date("2024-04-28")
  },
  {
    id: "announcement3",
    title: "新增取票方式",
    content: "现在可以通过微信小程序直接出示电子票入场，无需再到自助机取票。",
    date: new Date("2024-04-20")
  }
];

// 常见问题
export const mockFAQs = [
  {
    id: "faq1",
    question: "如何退改签电影票？",
    answer: "已支付的电影票，开场前2小时可申请退票，收取票价的10%作为手续费；开场前30分钟至2小时之间可申请退票，收取票价的30%作为手续费；开场前30分钟内不支持退票。"
  },
  {
    id: "faq2",
    question: "如何使用优惠券？",
    answer: "在选座确认订单页面，可以选择使用符合条件的优惠券。每个订单仅限使用一张优惠券，且不与其他优惠活动同时使用。"
  },
  {
    id: "faq3",
    question: "电影院内可以带食物吗？",
    answer: "您可以携带影院出售的食品进入影厅。外带食品需在指定区域食用，不能带入影厅。"
  },
  {
    id: "faq4",
    question: "儿童/老人票如何购买？",
    answer: "儿童票适用于身高1.3米以下的儿童，老人票适用于65岁以上老人，购票时选择对应票种，入场时可能需要提供相关证件。"
  }
];

// 支付方式
export const mockPaymentMethods = [
  {
    id: "payment1",
    name: "微信支付",
    icon: "/images/payment/wechat.png",
    code: "wechat"
  },
  {
    id: "payment2",
    name: "支付宝",
    icon: "/images/payment/alipay.png",
    code: "alipay"
  },
  {
    id: "payment3",
    name: "银联卡",
    icon: "/images/payment/unionpay.png",
    code: "unionpay"
  },
  {
    id: "payment4",
    name: "会员卡支付",
    icon: "/images/payment/membercard.png",
    code: "membercard"
  }
];

// 模拟管理员统计数据
export const mockAdminStats = {
  totalSales: 15280,
  ticketsSold: 187,
  averageOccupancy: 68.5,
  popularMovie: "流浪地球2",
  popularShowtime: "周末晚间",
  dailyRevenue: [
    { date: "04-25", revenue: 2480 },
    { date: "04-26", revenue: 1850 },
    { date: "04-27", revenue: 3200 },
    { date: "04-28", revenue: 2940 },
    { date: "04-29", revenue: 2430 },
    { date: "04-30", revenue: 2380 }
  ],
  ticketTypeDistribution: [
    { type: "普通票", percentage: 65 },
    { type: "学生票", percentage: 20 },
    { type: "老人票", percentage: 10 },
    { type: "儿童票", percentage: 5 }
  ],
  theaterOccupancy: [
    { name: "1号厅", occupancy: 78 },
    { name: "2号厅", occupancy: 62 },
    { name: "3号厅", occupancy: 45 }
  ]
}; 
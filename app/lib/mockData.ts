import { User, UserRole, Movie, Theater, Showtime, Order, OrderStatus, TicketType, MovieStatus, StaffOperation, StaffOperationType, StaffSchedule, ShiftType, Seat } from './types';

// 默认图片资源
export const defaultImages = {
  banner: '/images/default-banner.jpg',
  webpBanner: '/images/default-banner.webp',
  moviePoster: '/images/default-poster.jpg',
  webpMoviePoster: '/images/default-poster.webp',
  avatar: '/images/default-avatar.jpg',
  webpAvatar: '/images/default-avatar.webp',
  theater: '/images/default-theater.jpg',
  webpTheater: '/images/default-theater.webp',
  logo: '/images/logo.png',
  webpLogo: '/images/logo.webp'
};

/**
 * 生成初始座位数据
 */
const generateInitialSeats = (theater: Theater): Seat[] => {
  const seats: Seat[] = [];
  
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
    title: "星际迷航：超越边界",
    originalTitle: "Star Trek: Beyond Boundaries",
    description: "2127年，星际联盟探索舰队发现一个神秘的星际通道，可能连接到未知宇宙。舰队指挥官林宇辰带领精英团队穿越通道，意外发现一个与地球平行发展的文明。他们必须在两个世界的冲突中寻找和平，同时解开通道背后的宇宙奥秘。",
    director: "林超能",
    actors: ["王大锤", "李小方", "张绝绝子", "麦克风"],
    cast: ["王大锤", "李小方", "张绝绝子", "麦克风", "赵火箭", "钱满袋", "孙传奇", "周真香"],
    genre: ["科幻", "冒险", "动作"],
    duration: 145,
    rating: 8.7,
    releaseDate: new Date("2025-04-06"),
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie1.webp',
    status: MovieStatus.SHOWING
  },
  {
    id: "movie2",
    title: "幻象追踪",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie2.webp',
    duration: 118,
    director: "陈不看",
    actors: ["高启强", "高启盛", "安静", "海绵宝"],
    description: "著名物理学家陈磊研发出一种可以探测人类梦境的技术，却意外发现某些梦境竟然是现实中从未发生过的记忆碎片。当他深入调查，发现自己可能处于一个比梦境更为复杂的现实中。在追寻真相的过程中，他必须面对自己内心深处的恐惧。",
    releaseDate: new Date("2025-04-08"),
    genre: ["悬疑", "科幻", "心理"],
    rating: 8.5,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie3",
    title: "春日告白",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie3.webp',
    duration: 112,
    director: "赵糖糖",
    actors: ["何止一点", "陈伟笑", "刘会唱", "李芒果"],
    description: "大学教授林夏与心理医生顾一舟是青梅竹马，却因一场误会分开多年。当命运再次将他们带到同一所大学工作时，他们不得不面对过去的心结，以及那些未曾说出口的感情。一场春日樱花雨中的邂逅，让他们有机会重新审视彼此的心意。",
    releaseDate: new Date("2025-04-10"),
    genre: ["爱情", "剧情"],
    rating: 7.9,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie4",
    title: "暗影追踪者",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie4.webp',
    duration: 135,
    director: "吴梗王",
    actors: ["黄飞鸿", "倪好笑", "张艺猛", "周一围"],
    description: "特别行动组组长萧风在一次卧底任务中失忆，醒来后发现自己深陷一个庞大的犯罪集团内部。他必须在不知道自己真实身份的情况下，依靠本能和零碎的记忆完成任务，同时寻找自己的过去。背叛与忠诚的界限在他的世界中逐渐模糊。",
    releaseDate: new Date("2025-04-07"),
    genre: ["动作", "犯罪", "悬疑"],
    rating: 8.8,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie5",
    title: "城市之光",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie5.webp',
    duration: 152,
    director: "冯导演",
    actors: ["胡一刀", "孙悟饭", "邓不群", "宋江湖"],
    description: "这部史诗般的城市群像剧讲述了在2025年的中国大都市中，五个不同阶层、不同职业的人物，如何在经济转型的大潮中找寻自我价值与人生意义。从打工族到企业家，从教师到艺术家，他们的故事交织成一幅现代都市生活的全景图。",
    releaseDate: new Date("2025-04-12"),
    genre: ["剧情", "社会", "家庭"],
    rating: 9.1,
    status: MovieStatus.COMING_SOON
  },
  {
    id: "movie6",
    title: "微光之下",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie6.webp',
    duration: 128,
    director: "王不二",
    actors: ["梁非凡", "汤圆圆", "井底蛙", "猪猪侠"],
    description: "在一个永远不见天日的地下城市，人们已经习惯了人造光源的生活。年轻的工程师李明偶然发现了通往地面的秘密通道，却在踏上寻找真实阳光的旅程中，发现关于地下城市起源的惊人真相。这是一个关于勇气、真相与希望的故事。",
    releaseDate: new Date("2025-04-15"),
    genre: ["科幻", "冒险", "剧情"],
    rating: 8.4,
    status: MovieStatus.COMING_SOON
  },
  {
    id: "movie7",
    title: "古城疑云",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie7.webp',
    duration: 142,
    director: "陈可口",
    actors: ["张麻花", "章小蕙", "黄小厨", "周星星"],
    description: "民国时期，考古学家肖然带队前往西北古城遗址考察，却接连发生离奇事件。当地传说古城因一场灾难一夜消失，但随着考古深入，他们发现古城背后隐藏着一个跨越千年的秘密，以及一个关乎华夏文明起源的惊天发现。",
    releaseDate: new Date("2025-04-09"),
    genre: ["历史", "冒险", "悬疑"],
    rating: 8.2,
    status: MovieStatus.SHOWING
  },
  {
    id: "movie8",
    title: "芷园传奇",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie8.webp',
    duration: 120,
    director: "陈饭王",
    actors: ["李大厨", "王师傅", "张创新", "周味道"],
    description: "讲述华南农业大学芷园饭堂如何凭借独特的烹饪技艺和创新菜品，在全校厨艺大比拼中次次夺得第一的故事。从普通食堂到美食传奇的蜕变过程中，芷园团队克服重重困难，用美食温暖人心，最终成为校园文化的重要标志。",
    releaseDate: new Date("2025-04-20"),
    genre: ["美食", "励志", "纪实"],
    rating: 9.3,
    status: MovieStatus.COMING_SOON
  },
  {
    id: "movie9",
    title: "华农爱情故事",
    poster: defaultImages.moviePoster,
    webpPoster: '/images/movies/movie9.webp',
    duration: 115,
    director: "张情感",
    actors: ["王法学", "李计算", "赵校园", "钱青春"],
    description: "来自法学院的大四学生小王，在毕业前夕爱上了计算机专业的才女小李。为了追求心仪的姑娘，他每天横跨紫荆桥，从启林区奔向泰山区，用一系列浪漫而又略显笨拙的方式表达爱意。这是一个关于跨越专业鸿沟、勇敢追爱的青春故事。",
    releaseDate: new Date("2025-05-01"),
    genre: ["爱情", "青春", "校园"],
    rating: 8.9,
    status: MovieStatus.COMING_SOON
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

// 模拟电影场次数据
export const mockShowtimes: Showtime[] = [
  {
    id: "showtime1",
    movieId: "movie1",
    theaterId: "theater1",
    startTime: new Date("2025-04-06T10:00:00"),
    endTime: new Date("2025-04-06T12:25:00"),
    price: {
      [TicketType.NORMAL]: 80,
      [TicketType.STUDENT]: 40,
      [TicketType.SENIOR]: 40,
      [TicketType.CHILD]: 40
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
  },
  {
    id: "showtime2",
    movieId: "movie1",
    theaterId: "theater1",
    startTime: new Date("2025-04-06T14:00:00"),
    endTime: new Date("2025-04-06T16:25:00"),
    price: {
      [TicketType.NORMAL]: 80,
      [TicketType.STUDENT]: 40,
      [TicketType.SENIOR]: 40,
      [TicketType.CHILD]: 40
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
  },
  {
    id: "showtime3",
    movieId: "movie2",
    theaterId: "theater2",
    startTime: new Date("2025-04-08T11:30:00"),
    endTime: new Date("2025-04-08T13:28:00"),
    price: {
      [TicketType.NORMAL]: 60,
      [TicketType.STUDENT]: 30,
      [TicketType.SENIOR]: 30,
      [TicketType.CHILD]: 30
    },
    availableSeats: generateInitialSeats(mockTheaters[1])
  },
  {
    id: "showtime4",
    movieId: "movie3",
    theaterId: "theater3",
    startTime: new Date("2025-04-10T13:00:00"),
    endTime: new Date("2025-04-10T14:52:00"),
    price: {
      [TicketType.NORMAL]: 50,
      [TicketType.STUDENT]: 25,
      [TicketType.SENIOR]: 25,
      [TicketType.CHILD]: 25
    },
    availableSeats: generateInitialSeats(mockTheaters[2])
  },
  {
    id: "showtime5",
    movieId: "movie4",
    theaterId: "theater1",
    startTime: new Date("2025-04-07T19:00:00"),
    endTime: new Date("2025-04-07T21:15:00"),
    price: {
      [TicketType.NORMAL]: 90,
      [TicketType.STUDENT]: 45,
      [TicketType.SENIOR]: 45,
      [TicketType.CHILD]: 45
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
  },
  {
    id: "showtime6",
    movieId: "movie7",
    theaterId: "theater2",
    startTime: new Date("2025-04-09T15:30:00"),
    endTime: new Date("2025-04-09T17:52:00"),
    price: {
      [TicketType.NORMAL]: 70,
      [TicketType.STUDENT]: 35,
      [TicketType.SENIOR]: 35,
      [TicketType.CHILD]: 35
    },
    availableSeats: generateInitialSeats(mockTheaters[1])
  },
  {
    id: "showtime7",
    movieId: "movie5",
    theaterId: "theater1",
    startTime: new Date("2025-04-12T20:00:00"),
    endTime: new Date("2025-04-12T22:32:00"),
    price: {
      [TicketType.NORMAL]: 85,
      [TicketType.STUDENT]: 42,
      [TicketType.SENIOR]: 42,
      [TicketType.CHILD]: 42
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
  },
  {
    id: "showtime8",
    movieId: "movie8",
    theaterId: "theater2",
    startTime: new Date("2025-04-20T14:30:00"),
    endTime: new Date("2025-04-20T16:30:00"),
    price: {
      [TicketType.NORMAL]: 75,
      [TicketType.STUDENT]: 38,
      [TicketType.SENIOR]: 38,
      [TicketType.CHILD]: 38
    },
    availableSeats: generateInitialSeats(mockTheaters[1])
  },
  {
    id: "showtime9",
    movieId: "movie8",
    theaterId: "theater1",
    startTime: new Date("2025-04-20T19:00:00"),
    endTime: new Date("2025-04-20T21:00:00"),
    price: {
      [TicketType.NORMAL]: 85,
      [TicketType.STUDENT]: 42,
      [TicketType.SENIOR]: 42,
      [TicketType.CHILD]: 42
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
  },
  {
    id: "showtime10",
    movieId: "movie9",
    theaterId: "theater3",
    startTime: new Date("2025-05-01T15:00:00"),
    endTime: new Date("2025-05-01T16:55:00"),
    price: {
      [TicketType.NORMAL]: 70,
      [TicketType.STUDENT]: 35,
      [TicketType.SENIOR]: 35,
      [TicketType.CHILD]: 35
    },
    availableSeats: generateInitialSeats(mockTheaters[2])
  },
  {
    id: "showtime11",
    movieId: "movie9",
    theaterId: "theater1",
    startTime: new Date("2025-05-01T20:00:00"),
    endTime: new Date("2025-05-01T21:55:00"),
    price: {
      [TicketType.NORMAL]: 80,
      [TicketType.STUDENT]: 40,
      [TicketType.SENIOR]: 40,
      [TicketType.CHILD]: 40
    },
    availableSeats: generateInitialSeats(mockTheaters[0])
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
    createdAt: new Date("2025-04-05T14:30:00"),
    paidAt: new Date("2025-04-05T14:35:00")
  },
  {
    id: "order2",
    userId: "customer2",
    showtimeId: "showtime3",
    seats: ["seat-theater2-3-5"],
    ticketType: TicketType.STUDENT,
    totalPrice: 30,
    status: OrderStatus.PAID,
    createdAt: new Date("2025-04-06T09:15:00"),
    paidAt: new Date("2025-04-06T09:20:00")
  },
  {
    id: "order3",
    userId: "customer1",
    showtimeId: "showtime5",
    seats: ["seat-theater1-4-6", "seat-theater1-4-7", "seat-theater1-4-8"],
    ticketType: TicketType.NORMAL,
    totalPrice: 270,
    status: OrderStatus.PENDING,
    createdAt: new Date("2025-04-06T18:45:00")
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
    createdAt: new Date("2025-04-05T14:35:00")
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
    createdAt: new Date("2025-04-06T09:20:00")
  },
  {
    id: "operation3",
    staffId: "staff1",
    orderId: "order1",
    showtimeId: "showtime1",
    type: StaffOperationType.CHECK,
    details: JSON.stringify({
      checkTime: "2025-04-06T10:45:00",
      status: "success"
    }),
    createdAt: new Date("2025-04-06T10:45:00")
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
    createdAt: new Date("2025-04-06T11:30:00")
  }
];

// 模拟工作人员排班信息
export const mockStaffSchedules: StaffSchedule[] = [
  {
    id: "schedule1",
    staffId: "staff1",
    date: new Date("2025-04-06"),
    shift: ShiftType.MORNING,
    position: "售票",
    notes: "工作日早班",
    createdAt: new Date("2025-04-01T10:00:00")
  },
  {
    id: "schedule2",
    staffId: "staff1",
    date: new Date("2025-04-06"),
    shift: ShiftType.AFTERNOON,
    position: "检票",
    notes: "工作日下午班",
    createdAt: new Date("2025-04-01T10:00:00")
  },
  {
    id: "schedule3",
    staffId: "staff1",
    date: new Date("2025-04-07"),
    shift: ShiftType.EVENING,
    position: "售票",
    notes: "加班",
    createdAt: new Date("2025-04-01T10:00:00"),
    updatedAt: new Date("2025-04-05T14:30:00")
  },
  {
    id: "schedule4",
    staffId: "staff1",
    date: new Date("2025-04-08"),
    shift: ShiftType.MORNING,
    position: "售票",
    createdAt: new Date("2025-04-01T10:00:00")
  },
  {
    id: "schedule5",
    staffId: "staff1",
    date: new Date("2025-04-09"),
    shift: ShiftType.AFTERNOON,
    position: "检票",
    notes: "周末班",
    createdAt: new Date("2025-04-01T10:00:00")
  }
];

// 轮播图数据
export const mockBanners = [
  {
    id: "banner1",
    imageUrl: defaultImages.banner,
    webpImageUrl: '/images/banners/banner1.webp',
    title: "微光之下",
    description: "在一个永远不见天日的地下城市，由梁非凡和汤圆圆主演的科幻冒险之旅，一场关于勇气、真相与希望的故事。",
    link: "/movies/movie6"
  },
  {
    id: "banner2",
    imageUrl: defaultImages.banner,
    webpImageUrl: '/images/banners/banner2.webp',
    title: "暗影追踪者",
    description: "特别行动组组长萧风（黄飞鸿饰）在一次卧底任务中失忆，醒来后发现自己深陷一个庞大的犯罪集团内部。",
    link: "/movies/movie4"
  },
  {
    id: "banner3",
    imageUrl: defaultImages.banner,
    webpImageUrl: '/images/banners/banner3.webp',
    title: "会员日特惠",
    description: "每周二会员日，全场电影票8折优惠",
    link: "/promotions/members-day"
  },
  {
    id: "banner4",
    imageUrl: defaultImages.banner,
    webpImageUrl: '/images/banners/banner4.webp',
    title: "芷园传奇",
    description: "华农校园美食传奇，芷园饭堂的厨艺大师们如何在厨艺大比拼中脱颖而出，带你领略校园美食文化的魅力。",
    link: "/movies/movie8"
  }
];

// 公告消息
export const mockAnnouncements = [
  {
    id: "announcement1",
    title: "五一特别活动",
    content: "五一期间，购买任意电影票即可参与抽奖，有机会获得电影周边礼品。",
    date: new Date("2025-04-05")
  },
  {
    id: "announcement2",
    title: "系统维护通知",
    content: "系统将于2025年4月13日凌晨2:00-4:00进行维护升级，期间可能无法正常访问，请提前安排您的购票时间。",
    date: new Date("2025-04-08")
  },
  {
    id: "announcement3",
    title: "新增取票方式",
    content: "现在可以通过微信小程序直接出示电子票入场，无需再到自助机取票。",
    date: new Date("2025-04-01")
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
  },
  {
    id: "faq5",
    question: "华农校园主题电影有哪些特殊活动？",
    answer: "华农校园主题电影《芷园传奇》和《华农爱情故事》将在首映当天邀请华农在校师生参与互动环节，凭学生证或教师证可享受额外8折优惠，还有机会与电影主创见面。"
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
  popularMovie: "星际迷航：超越边界",
  popularShowtime: "周末晚间",
  dailyRevenue: [
    { date: "04-05", revenue: 2480 },
    { date: "04-06", revenue: 1850 },
    { date: "04-07", revenue: 3200 },
    { date: "04-08", revenue: 2940 },
    { date: "04-09", revenue: 2430 },
    { date: "04-10", revenue: 2380 }
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
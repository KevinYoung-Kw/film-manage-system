import { Movie, Theater, UserRole, Showtime, TicketType, User, OrderStatus, Order } from "./types";

// 模拟电影数据
export const mockMovies: Movie[] = [
  {
    id: "movie1",
    title: "流浪地球3",
    poster: "https://img3.doubanio.com/view/photo/l/public/p2545472803.webp",
    duration: 145,
    director: "郭帆",
    actors: ["吴京", "刘德华", "李雪健", "沙溢"],
    description: "地球生态系统面临崩溃，人类启动'流浪地球'计划，推动地球离开太阳系，寻找新家园。",
    releaseDate: new Date("2024-02-10"),
    genre: ["科幻", "冒险", "灾难"],
    rating: 8.5
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
    rating: 7.8
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
    rating: 8.3
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
    rating: 9.0
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
    rating: 7.5
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

// 默认图片URL
export const defaultImages = {
  moviePoster: "https://img3.doubanio.com/f/movie/caa8f80c1fcb133a0eb083caaa89e9c8ff1c3ed7/pics/movie/movie_default_large.png",
  banner: "https://img2.doubanio.com/view/photo/l/public/p2879572901.webp",
  logo: "https://img1.doubanio.com/f/movie/0a74d4ece5f642af5c5f3fa05b5f659b6e229a81/pics/movie/logo_db.png"
}; 
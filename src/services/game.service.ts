import { PrismaClient, Game, GameStatus, GameCategory, Post } from '@prisma/client';

const prisma = new PrismaClient();

export interface GameWithStats extends Game {
  _count: {
    posts: number;
  };
}

export interface GameFilters {
  category?: GameCategory;
  status?: GameStatus;
  search?: string;
  isPopular?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'sortOrder' | 'posts';
  sortOrder?: 'asc' | 'desc';
}

export class GameService {
  /**
   * Get all games with optional filtering and pagination
   */
  async getGames(
    filters: GameFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    games: GameWithStats[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      category,
      status = GameStatus.ACTIVE,
      search,
      isPopular
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status
    };

    if (category) {
      where.category = category;
    }

    if (isPopular !== undefined) {
      where.isPopular = isPopular;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'posts') {
      orderBy = { posts: { _count: sortOrder } };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.game.count({ where })
    ]);

    return {
      games,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get featured games
   */
  async getFeaturedGames(limit: number = 10): Promise<GameWithStats[]> {
    return prisma.game.findMany({
      where: {
        OR: [
          { status: GameStatus.FEATURED },
          { isPopular: true }
        ]
      },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: [
        { status: 'desc' }, // FEATURED games first
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: string): Promise<GameWithStats | null> {
    return prisma.game.findUnique({
      where: { id: gameId },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
  }

  /**
   * Get game by slug
   */
  async getGameBySlug(slug: string): Promise<GameWithStats | null> {
    return prisma.game.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
  }

  /**
   * Get posts for a specific game
   */
  async getPostsByGame(
    gameId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'likes' | 'comments';
      sortOrder?: 'asc' | 'desc';
      userId?: string;
    } = {}
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId
    } = options;

    const skip = (page - 1) * limit;

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'likes' || sortBy === 'comments') {
      orderBy = { [sortBy]: { _count: sortOrder } };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { gameId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isKYCVerified: true
            }
          },
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          },
          ...(userId && {
            likes: {
              where: { userId },
              select: { id: true }
            }
          })
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.post.count({ where: { gameId } })
    ]);

    // Transform posts to include isLiked flag
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: userId ? (post.likes as any)?.length > 0 : false,
      likes: undefined // Remove the likes array from response
    }));

    return {
      posts: transformedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get game categories with post counts
   */
  async getGameCategories(): Promise<Array<{
    category: GameCategory;
    label: string;
    count: number;
  }>> {
    const categoryLabels = {
      BATTLE_ROYALE: 'Battle Royale',
      FPS: 'First Person Shooter',
      SPORTS: 'Sports',
      MOBA: 'MOBA',
      RPG: 'Role Playing Game',
      STRATEGY: 'Strategy',
      RACING: 'Racing',
      SIMULATION: 'Simulation',
      OTHER: 'Other'
    };

    const categoryCounts = await prisma.game.groupBy({
      by: ['category'],
      where: { status: GameStatus.ACTIVE },
      _count: {
        category: true
      }
    });

    return Object.entries(categoryLabels).map(([category, label]) => ({
      category: category as GameCategory,
      label,
      count: categoryCounts.find(c => c.category === category)?._count.category || 0
    }));
  }

  /**
   * Search games by name or description
   */
  async searchGames(
    query: string,
    limit: number = 10
  ): Promise<GameWithStats[]> {
    return prisma.game.findMany({
      where: {
        status: GameStatus.ACTIVE,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: [
        { isPopular: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      take: limit
    });
  }

  /**
   * Get popular games (games with most posts)
   */
  async getPopularGames(limit: number = 10): Promise<GameWithStats[]> {
    return prisma.game.findMany({
      where: { status: GameStatus.ACTIVE },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: { _count: 'desc' }
      },
      take: limit
    });
  }
}

export const gameService = new GameService();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'listing';
  title: string;
  subtitle?: string;
  image?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

export const searchService = {
  async search(query: string, type: string, userId?: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      // Search Users
      if (type === 'all' || type === 'users') {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isKYCVerified: true,
          },
          take: type === 'users' ? 20 : 5,
        });

        results.push(...users.map((user: any) => ({
          id: user.id,
          type: 'user' as const,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `@${user.username}`,
          avatar: user.avatar || undefined,
          username: user.username,
          verified: user.isKYCVerified,
        })));
      }

      // Search Posts
      if (type === 'all' || type === 'posts') {
        const posts = await prisma.post.findMany({
          where: {
            description: { contains: query, mode: 'insensitive' },
            status: 'ACTIVE',
            type: 'SOCIAL_POST',
          },
          select: {
            id: true,
            description: true,
            title: true,
            images: true,
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: type === 'posts' ? 20 : 5,
          orderBy: { createdAt: 'desc' },
        });

        results.push(...posts.map((post: any) => ({
          id: post.id,
          type: 'post' as const,
          title: post.title || post.description?.substring(0, 60) || 'Untitled Post',
          subtitle: `by @${post.user.username}`,
          image: post.images?.[0] || undefined,
        })));
      }

      // Search Listings (Marketplace)
      if (type === 'all' || type === 'listings') {
        const listings = await prisma.post.findMany({
          where: {
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                  { gameTitle: { contains: query, mode: 'insensitive' } },
                  { category: { contains: query, mode: 'insensitive' } },
                  { tags: { hasSome: [query.toLowerCase()] } },
                ],
              },
              { type: 'MARKETPLACE_LISTING' },
              { status: 'ACTIVE' },
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            images: true,
            gameTitle: true,
            category: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          take: type === 'listings' ? 20 : 5,
          orderBy: { createdAt: 'desc' },
        });

        results.push(...listings.map((listing: any) => ({
          id: listing.id,
          type: 'listing' as const,
          title: listing.title || listing.gameTitle || 'Untitled Listing',
          subtitle: listing.price ? `${listing.currency} ${listing.price.toString()}` : undefined,
          image: listing.images?.[0] || undefined,
        })));
      }

      return results;
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  },
};

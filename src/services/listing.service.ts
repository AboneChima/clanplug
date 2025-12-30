import { prisma } from '../config/database';
import { ListingCategory, ListingType, ListingStatus, Currency, PostType } from '@prisma/client';

export interface CreateListingRequest {
  sellerId: string;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  price: number;
  currency: Currency;
  platform?: string;
  level?: number;
  followers?: number;
  verified?: boolean;
  username?: string;
  images: string[];
  videos: string[];
  tags?: string[];
  features?: any;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  platform?: string;
  level?: number;
  followers?: number;
  verified?: boolean;
  username?: string;
  images?: string[];
  videos?: string[];
  tags?: string[];
  features?: any;
  status?: ListingStatus;
}

export interface ListingFilters {
  category?: ListingCategory;
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  platform?: string;
  search?: string;
  sellerId?: string;
  status?: ListingStatus;
}

class ListingService {
  // Create new listing
  async createListing(data: CreateListingRequest) {
    try {
      const listing = await prisma.listing.create({
        data: {
          sellerId: data.sellerId,
          title: data.title,
          description: data.description,
          category: data.category,
          type: data.type,
          price: data.price,
          currency: data.currency,
          platform: data.platform,
          level: data.level,
          followers: data.followers,
          verified: data.verified,
          username: data.username,
          images: data.images,
          videos: data.videos,
          tags: data.tags || [],
          features: data.features,
          status: ListingStatus.ACTIVE,
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isKYCVerified: true,
            },
          },
        },
      });

      // Automatically create a social post for this listing
      try {
        const postDescription = `🎮 New ${data.category} Listing!\n\n${data.title}\n\n${data.description.substring(0, 150)}${data.description.length > 150 ? '...' : ''}\n\n💰 Price: ${data.currency} ${data.price.toLocaleString()}`;
        
        await prisma.post.create({
          data: {
            userId: data.sellerId,
            title: `${data.title} - Marketplace Listing`,
            description: postDescription,
            type: PostType.MARKETPLACE_LISTING,
            images: data.images.slice(0, 1), // Use first image only
            videos: [],
            listingId: listing.id,
            price: data.price,
            category: data.category,
          },
        });
        console.log('✅ Auto-created social post for listing:', listing.id);
      } catch (postError) {
        console.error('⚠️ Failed to create social post for listing:', postError);
        // Don't fail the listing creation if post creation fails
      }

      return listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw new Error('Failed to create listing');
    }
  }

  // Get listings with filters and pagination
  async getListings(filters: ListingFilters, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};

      // Only exclude DELETED listings, show ACTIVE and SOLD
      if (filters.status) {
        where.status = filters.status;
      } else {
        where.status = { notIn: [ListingStatus.DELETED] };
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.platform) {
        where.platform = { contains: filters.platform, mode: 'insensitive' };
      }

      if (filters.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters.minPrice || filters.maxPrice) {
        where.price = {};
        if (filters.minPrice) where.price.gte = filters.minPrice;
        if (filters.maxPrice) where.price.lte = filters.maxPrice;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search } },
        ];
      }

      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isKYCVerified: true,
              },
            },
          },
        }),
        prisma.listing.count({ where }),
      ]);

      return {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw new Error('Failed to fetch listings');
    }
  }

  // Get listing by ID
  async getListingById(id: string) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
              isKYCVerified: true,
              createdAt: true,
            },
          },
        },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Increment view count
      await prisma.listing.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      return listing;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  }

  // Update listing
  async updateListing(id: string, sellerId: string, data: UpdateListingRequest) {
    try {
      // Verify ownership
      const listing = await prisma.listing.findUnique({
        where: { id },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      if (listing.sellerId !== sellerId) {
        throw new Error('Unauthorized to update this listing');
      }

      if (listing.status === ListingStatus.SOLD) {
        throw new Error('Cannot update sold listing');
      }

      const updated = await prisma.listing.update({
        where: { id },
        data,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  // Delete listing
  async deleteListing(id: string, sellerId: string) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      if (listing.sellerId !== sellerId) {
        throw new Error('Unauthorized to delete this listing');
      }

      if (listing.status === ListingStatus.SOLD) {
        throw new Error('Cannot delete sold listing');
      }

      await prisma.listing.update({
        where: { id },
        data: { status: ListingStatus.DELETED },
      });

      return { success: true, message: 'Listing deleted successfully' };
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }

  // Mark listing as sold
  async markAsSold(id: string, purchaseId: string) {
    try {
      await prisma.listing.update({
        where: { id },
        data: { status: ListingStatus.SOLD },
      });

      return { success: true, message: 'Listing marked as sold' };
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      throw error;
    }
  }

  // Get seller's listings
  async getSellerListings(sellerId: string, page: number = 1, limit: number = 20) {
    return this.getListings({ sellerId }, page, limit);
  }

  // Get listing counts per category
  async getListingCounts() {
    try {
      const listings = await prisma.listing.findMany({
        where: {
          status: { notIn: [ListingStatus.DELETED] }
        },
        select: {
          category: true
        }
      });

      // Count listings per category
      const counts: { [key: string]: number } = {};
      listings.forEach(listing => {
        const category = listing.category.toLowerCase().replace(/_/g, '-');
        counts[category] = (counts[category] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting listing counts:', error);
      throw new Error('Failed to get listing counts');
    }
  }
}

export const listingService = new ListingService();

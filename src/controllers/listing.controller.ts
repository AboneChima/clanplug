import { Request, Response } from 'express';
import { listingService } from '../services/listing.service';
import { ListingCategory, ListingType, ListingStatus, Currency } from '@prisma/client';

export class ListingController {
  // Create new listing
  async createListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const {
        title,
        description,
        category,
        type,
        price,
        currency,
        platform,
        level,
        followers,
        verified,
        username,
        images,
        videos,
        tags,
        features,
      } = req.body;

      // Validation
      if (!title || !description || !category || !type || !price) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, description, category, type, price',
        });
      }

      const listing = await listingService.createListing({
        sellerId: userId,
        title,
        description,
        category: category as ListingCategory,
        type: type as ListingType,
        price: parseFloat(price),
        currency: currency as Currency || Currency.NGN,
        platform,
        level: level ? parseInt(level) : undefined,
        followers: followers ? parseInt(followers) : undefined,
        verified,
        username,
        images: images || [],
        videos: videos || [],
        tags,
        features,
      });

      return res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        listing,
      });
    } catch (error: any) {
      console.error('Create listing error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create listing',
      });
    }
  }

  // Get all listings with filters
  async getListings(req: Request, res: Response) {
    try {
      const {
        category,
        type,
        minPrice,
        maxPrice,
        platform,
        search,
        status,
        page = '1',
        limit = '20',
      } = req.query;

      const filters: any = {};
      if (category) filters.category = category as ListingCategory;
      if (type) filters.type = type as ListingType;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (platform) filters.platform = platform as string;
      if (search) filters.search = search as string;
      if (status) filters.status = status as ListingStatus;

      const result = await listingService.getListings(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Get listings error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch listings',
      });
    }
  }

  // Get listing by ID
  async getListingById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const listing = await listingService.getListingById(id);

      return res.status(200).json({
        success: true,
        listing,
      });
    } catch (error: any) {
      console.error('Get listing error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Listing not found',
      });
    }
  }

  // Get my listings
  async getMyListings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { page = '1', limit = '20' } = req.query;

      const result = await listingService.getSellerListings(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Get my listings error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch listings',
      });
    }
  }

  // Update listing
  async updateListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;
      const updateData = req.body;

      const listing = await listingService.updateListing(id, userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Listing updated successfully',
        listing,
      });
    } catch (error: any) {
      console.error('Update listing error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update listing',
      });
    }
  }

  // Delete listing
  async deleteListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;

      const result = await listingService.deleteListing(id, userId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Delete listing error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete listing',
      });
    }
  }

  // Get listing counts per category
  async getListingCounts(req: Request, res: Response) {
    try {
      const counts = await listingService.getListingCounts();
      return res.status(200).json({ success: true, counts });
    } catch (error: any) {
      console.error('Get listing counts error:', error);
      // Return empty counts instead of error
      return res.status(200).json({ success: true, counts: {} });
    }
  }
}

export const listingController = new ListingController();

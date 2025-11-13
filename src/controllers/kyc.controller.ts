import { Request, Response } from 'express';
import prisma from '../config/database';
import { uploadToCloudinary } from '../utils/cloudinary';

export async function submitKYC(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      address,
      city,
      state,
      country,
      idType,
      idNumber,
      bvn,
      idFrontUrl,
      idBackUrl,
      selfieUrl
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !address || !idType || !idNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if user already has pending or approved KYC
    const existingKYC = await prisma.kYCVerification.findFirst({
      where: { 
        userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingKYC) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved KYC submission'
      });
    }

    // Create KYC submission
    const kyc = await prisma.kYCVerification.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        address,
        city,
        state,
        country,
        idType,
        idNumber,
        bvn: bvn || null,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
        status: 'PENDING',
        submittedAt: new Date()
      }
    });

    return res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. We will review it within 24-48 hours.',
      data: kyc
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit KYC'
    });
  }
}

export async function getKYCStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const kyc = await prisma.kYCVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!kyc) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'NOT_SUBMITTED',
          message: 'No KYC submission found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: kyc.status,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get KYC status'
    });
  }
}

// Admin endpoints
export async function listKYCSubmissions(req: Request, res: Response) {
  try {
    const { status } = req.query;

    const where = status ? { status: status as string } : {};

    const submissions = await prisma.kYCVerification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('List KYC submissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list KYC submissions'
    });
  }
}

export async function reviewKYC(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED'
      });
    }

    const kyc = await prisma.kYCVerification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        reviewedAt: new Date(),
        reviewedBy: req.user?.id
      }
    });

    // Update user KYC status
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: kyc.userId },
        data: { isKYCVerified: true }
      });
    }

    return res.status(200).json({
      success: true,
      message: `KYC ${status.toLowerCase()} successfully`,
      data: kyc
    });
  } catch (error) {
    console.error('Review KYC error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review KYC'
    });
  }
}

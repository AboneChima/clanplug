import { Request, Response } from 'express';
import prisma from '../config/database';

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
      selfieUrl,
      verificationType,
      livenessFrontUrl,
      livenessSmileUrl,
      livenessLeftUrl,
      livenessRightUrl,
    } = req.body;

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

    // Handle liveness verification
    if (verificationType === 'liveness') {
      if (!livenessFrontUrl || !livenessSmileUrl || !livenessLeftUrl || !livenessRightUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'All liveness photos are required' 
        });
      }

      const kyc = await prisma.kYCVerification.create({
        data: {
          userId,
          documentType: 'LIVENESS',
          documentNumber: `LIVENESS-${userId}-${Date.now()}`,
          documentImages: [livenessFrontUrl, livenessSmileUrl, livenessLeftUrl, livenessRightUrl],
          firstName: firstName || '',
          lastName: lastName || '',
          dateOfBirth: new Date(),
          address: 'Liveness Verification',
          phoneNumber: '',
          status: 'PENDING'
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Face verification submitted successfully! We will review it within 24 hours.',
        data: kyc
      });
    }

    // Handle document verification (existing logic)
    if (!firstName || !lastName || !dateOfBirth || !address || !idType || !idNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if document number is already used by another account
    const duplicateDocument = await prisma.kYCVerification.findFirst({
      where: {
        documentNumber: idNumber,
        status: 'APPROVED',
        userId: { not: userId }
      }
    });

    if (duplicateDocument) {
      return res.status(400).json({
        success: false,
        message: 'This document number is already registered to another account'
      });
    }

    // Create KYC submission
    const kyc = await prisma.kYCVerification.create({
      data: {
        userId,
        documentType: idType,
        documentNumber: idNumber,
        documentImages: [idFrontUrl, idBackUrl, selfieUrl].filter(Boolean),
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        address,
        phoneNumber: req.body.phoneNumber || '',
        status: 'PENDING'
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
        createdAt: kyc.createdAt,
        updatedAt: kyc.updatedAt,
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

    const where = status ? { status: status as any } : {};

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
        verifiedAt: status === 'APPROVED' ? new Date() : null
      }
    });

    // Update user KYC status and send notification
    if (status === 'APPROVED') {
      // Update user: set KYC verified and activate account
      await prisma.user.update({
        where: { id: kyc.userId },
        data: { 
          isKYCVerified: true,
          status: 'ACTIVE' // Activate account when KYC is approved
        }
      });

      // Send approval notification
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC',
          title: '✅ KYC Approved!',
          message: 'Congratulations! Your KYC verification has been approved. You can now post on the marketplace and access all verified features.',
          data: {
            kycId: kyc.id,
            status: 'APPROVED',
            approvedAt: new Date().toISOString()
          }
        }
      });
    } else if (status === 'REJECTED') {
      // Set user KYC to false if rejected
      await prisma.user.update({
        where: { id: kyc.userId },
        data: { isKYCVerified: false }
      });

      // Send rejection notification
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC',
          title: '❌ KYC Rejected',
          message: `Your KYC verification was rejected. Reason: ${rejectionReason || 'Please check your documents and resubmit.'}`,
          data: {
            kycId: kyc.id,
            status: 'REJECTED',
            reason: rejectionReason,
            rejectedAt: new Date().toISOString()
          }
        }
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

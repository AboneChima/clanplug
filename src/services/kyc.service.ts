import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { prisma } from '../config/database';
import { KYCStatus } from '@prisma/client';

// KYC Verification Interfaces
export interface KYCVerificationRequest {
  userId: string;
  documentType: 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENSE';
  documentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address?: string;
  documentImages?: string[];
}

export interface KYCVerificationResponse {
  success: boolean;
  message: string;
  verificationId?: string;
  status: KYCStatus;
  data?: any;
  error?: string;
}

export interface DojahNINResponse {
  entity: {
    firstname: string;
    lastname: string;
    middlename?: string;
    phone: string;
    birthdate: string;
    gender: string;
    photo?: string;
  };
}

export interface DojahBVNResponse {
  entity: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone_number1: string;
    date_of_birth: string;
    gender: string;
    image?: string;
  };
}

export interface IdentityPassResponse {
  status: boolean;
  detail: string;
  response_code: string;
  data?: any;
}

class KYCService {
  private dojahApi: AxiosInstance;
  private identityPassApi: AxiosInstance;

  constructor() {
    // Initialize Dojah API client
    this.dojahApi = axios.create({
      baseURL: config.DOJAH_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.DOJAH_API_KEY}`,
        'AppId': config.DOJAH_APP_ID,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Initialize IdentityPass API client
    this.identityPassApi = axios.create({
      baseURL: config.IDENTITYPASS_BASE_URL,
      headers: {
        'x-api-key': config.IDENTITYPASS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Verify NIN using Dojah API
  async verifyNIN(nin: string, firstName: string, lastName: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await this.dojahApi.post('/api/v1/kyc/nin', {
        nin: nin,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.data && response.data.entity) {
        const entity = response.data.entity as DojahNINResponse['entity'];
        
        // Check if names match (case-insensitive)
        const firstNameMatch = entity.firstname.toLowerCase().includes(firstName.toLowerCase()) || 
                              firstName.toLowerCase().includes(entity.firstname.toLowerCase());
        const lastNameMatch = entity.lastname.toLowerCase().includes(lastName.toLowerCase()) || 
                             lastName.toLowerCase().includes(entity.lastname.toLowerCase());

        if (firstNameMatch && lastNameMatch) {
          return {
            success: true,
            data: entity,
            message: 'NIN verification successful',
          };
        } else {
          return {
            success: false,
            message: 'Name mismatch with NIN records',
          };
        }
      } else {
        return {
          success: false,
          message: 'Invalid NIN or verification failed',
        };
      }
    } catch (error: any) {
      console.error('Dojah NIN verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'NIN verification service unavailable',
      };
    }
  }

  // Verify BVN using Dojah API
  async verifyBVN(bvn: string, firstName: string, lastName: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await this.dojahApi.post('/api/v1/kyc/bvn', {
        bvn: bvn,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.data && response.data.entity) {
        const entity = response.data.entity as DojahBVNResponse['entity'];
        
        // Check if names match (case-insensitive)
        const firstNameMatch = entity.first_name.toLowerCase().includes(firstName.toLowerCase()) || 
                              firstName.toLowerCase().includes(entity.first_name.toLowerCase());
        const lastNameMatch = entity.last_name.toLowerCase().includes(lastName.toLowerCase()) || 
                             lastName.toLowerCase().includes(entity.last_name.toLowerCase());

        if (firstNameMatch && lastNameMatch) {
          return {
            success: true,
            data: entity,
            message: 'BVN verification successful',
          };
        } else {
          return {
            success: false,
            message: 'Name mismatch with BVN records',
          };
        }
      } else {
        return {
          success: false,
          message: 'Invalid BVN or verification failed',
        };
      }
    } catch (error: any) {
      console.error('Dojah BVN verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'BVN verification service unavailable',
      };
    }
  }

  // Verify Passport using IdentityPass API
  async verifyPassport(passportNumber: string, firstName: string, lastName: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await this.identityPassApi.post('/api/v2/biometrics/merchant/data/verification/passport', {
        number: passportNumber,
        first_name: firstName,
        last_name: lastName,
      });

      const result = response.data as IdentityPassResponse;
      
      if (result.status && result.response_code === '00') {
        return {
          success: true,
          data: result.data,
          message: 'Passport verification successful',
        };
      } else {
        return {
          success: false,
          message: result.detail || 'Passport verification failed',
        };
      }
    } catch (error: any) {
      console.error('IdentityPass Passport verification error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Passport verification service unavailable',
      };
    }
  }

  // Verify Driver's License using IdentityPass API
  async verifyDriversLicense(licenseNumber: string, firstName: string, lastName: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await this.identityPassApi.post('/api/v2/biometrics/merchant/data/verification/drivers_license', {
        number: licenseNumber,
        first_name: firstName,
        last_name: lastName,
      });

      const result = response.data as IdentityPassResponse;
      
      if (result.status && result.response_code === '00') {
        return {
          success: true,
          data: result.data,
          message: 'Driver\'s license verification successful',
        };
      } else {
        return {
          success: false,
          message: result.detail || 'Driver\'s license verification failed',
        };
      }
    } catch (error: any) {
      console.error('IdentityPass Driver\'s License verification error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Driver\'s license verification service unavailable',
      };
    }
  }

  // Main KYC verification method
  async verifyKYC(request: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          status: KYCStatus.REJECTED,
          error: 'USER_NOT_FOUND',
        };
      }

      // Check if user already has a verified KYC
      const existingKYC = await prisma.kYCVerification.findFirst({
        where: {
          userId: request.userId,
          status: KYCStatus.APPROVED,
        },
      });

      if (existingKYC) {
        return {
          success: false,
          message: 'User already has verified KYC',
          status: KYCStatus.APPROVED,
          error: 'ALREADY_VERIFIED',
        };
      }

      // Create KYC verification record
      const kycVerification = await prisma.kYCVerification.create({
        data: {
          userId: request.userId,
          status: KYCStatus.PENDING,
          documentType: request.documentType,
          documentNumber: request.documentNumber,
          documentImages: request.documentImages || [],
          firstName: request.firstName,
          lastName: request.lastName,
          dateOfBirth: new Date(request.dateOfBirth),
          address: request.address || '',
          phoneNumber: request.phoneNumber,
          verificationData: {},
        },
      });

      // Perform verification based on document type
      let verificationResult: { success: boolean; data?: any; message: string };

      switch (request.documentType) {
        case 'NIN':
          verificationResult = await this.verifyNIN(
            request.documentNumber,
            request.firstName,
            request.lastName
          );
          break;

        case 'BVN':
          verificationResult = await this.verifyBVN(
            request.documentNumber,
            request.firstName,
            request.lastName
          );
          break;

        case 'PASSPORT':
          verificationResult = await this.verifyPassport(
            request.documentNumber,
            request.firstName,
            request.lastName
          );
          break;

        case 'DRIVERS_LICENSE':
          verificationResult = await this.verifyDriversLicense(
            request.documentNumber,
            request.firstName,
            request.lastName
          );
          break;

        default:
          verificationResult = {
            success: false,
            message: 'Unsupported document type',
          };
      }

      // Update KYC verification record with results
      const finalStatus = verificationResult.success ? KYCStatus.APPROVED : KYCStatus.REJECTED;
      
      const updatedKYC = await prisma.kYCVerification.update({
        where: { id: kycVerification.id },
        data: {
          status: finalStatus,
          verificationData: verificationResult.data || {},
          verifiedAt: verificationResult.success ? new Date() : undefined,
          rejectionReason: verificationResult.success ? undefined : verificationResult.message,
        },
      });

      // Update user's KYC status if approved
      if (verificationResult.success) {
        await prisma.user.update({
          where: { id: request.userId },
          data: {
            isKYCVerified: true,
            firstName: request.firstName,
            lastName: request.lastName,
            dateOfBirth: new Date(request.dateOfBirth),
          },
        });
      }

      return {
        success: verificationResult.success,
        message: verificationResult.message,
        verificationId: updatedKYC.id,
        status: finalStatus,
        data: verificationResult.data,
      };

    } catch (error: any) {
      console.error('KYC verification error:', error);
      return {
        success: false,
        message: 'KYC verification failed due to system error',
        status: KYCStatus.REJECTED,
        error: error.message || 'SYSTEM_ERROR',
      };
    }
  }

  // Get KYC status for a user
  async getKYCStatus(userId: string): Promise<{ success: boolean; status?: KYCStatus; data?: any; message: string }> {
    try {
      const latestKYC = await prisma.kYCVerification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestKYC) {
        return {
          success: true,
          status: undefined,
          data: null,
          message: 'No KYC submission found',
        };
      }

      return {
        success: true,
        status: latestKYC.status,
        data: {
          id: latestKYC.id,
          documentType: latestKYC.documentType,
          status: latestKYC.status,
          createdAt: latestKYC.createdAt,
          verifiedAt: latestKYC.verifiedAt,
          rejectionReason: latestKYC.rejectionReason,
        },
        message: 'KYC status retrieved successfully',
      };
    } catch (error: any) {
      console.error('Get KYC status error:', error);
      return {
        success: false,
        message: 'Failed to retrieve KYC status',
      };
    }
  }

  // Retry KYC verification for failed attempts
  async retryKYCVerification(kycId: string): Promise<KYCVerificationResponse> {
    try {
      const kycRecord = await prisma.kYCVerification.findUnique({
        where: { id: kycId },
      });

      if (!kycRecord) {
        return {
          success: false,
          message: 'KYC record not found',
          status: KYCStatus.REJECTED,
          error: 'KYC_NOT_FOUND',
        };
      }

      if (kycRecord.status !== KYCStatus.REJECTED) {
        return {
          success: false,
          message: 'Can only retry rejected KYC verifications',
          status: kycRecord.status,
          error: 'INVALID_STATUS',
        };
      }

      // Retry verification with existing data
      const retryRequest: KYCVerificationRequest = {
        userId: kycRecord.userId,
        documentType: kycRecord.documentType as any,
        documentNumber: kycRecord.documentNumber,
        firstName: kycRecord.firstName,
        lastName: kycRecord.lastName,
        dateOfBirth: kycRecord.dateOfBirth.toISOString(),
        phoneNumber: kycRecord.phoneNumber,
        address: kycRecord.address,
        documentImages: kycRecord.documentImages,
      };

      // Update status to pending before retry
      await prisma.kYCVerification.update({
        where: { id: kycId },
        data: { status: KYCStatus.PENDING },
      });

      return await this.verifyKYC(retryRequest);
    } catch (error: any) {
      console.error('Retry KYC verification error:', error);
      return {
        success: false,
        message: 'Failed to retry KYC verification',
        status: KYCStatus.REJECTED,
        error: error.message || 'RETRY_ERROR',
      };
    }
  }
}

export const kycService = new KYCService();
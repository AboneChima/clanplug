"use client";

import { useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoDocumentText, IoEye, IoRefresh } from 'react-icons/io5';

interface KYCSubmission {
  id: string;
  userId: string;
  user: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  documentType: string;
  documentNumber: string;
  documentImages: string[];
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  createdAt: string;
  rejectionReason?: string;
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kyc?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId: string) => {
    if (!confirm('Approve this KYC submission?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kyc/${kycId}/verify`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        alert('KYC Approved!');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        alert('Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Error approving KYC');
    }
  };

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kyc/${kycId}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        alert('KYC Rejected');
        fetchSubmissions();
        setSelectedSubmission(null);
        setRejecting(false);
        setRejectionReason('');
      } else {
        alert('Failed to reject KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert('Error rejecting KYC');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">KYC Verifications</h1>
          <p className="text-gray-400">Review and approve user identity documents</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
          <button
            onClick={fetchSubmissions}
            className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <IoRefresh className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No {filter.toLowerCase()} submissions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">
                      {submission.user.firstName} {submission.user.lastName}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">@{submission.user.username} • {submission.user.email}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>📄 {submission.documentType}</span>
                      <span>🔢 {submission.documentNumber}</span>
                      <span>📅 {new Date(submission.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <IoEye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">KYC Review</h2>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Full Name</p>
                      <p className="text-white font-medium">{selectedSubmission.user.firstName} {selectedSubmission.user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Username</p>
                      <p className="text-white font-medium">@{selectedSubmission.user.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-white font-medium">{selectedSubmission.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Phone</p>
                      <p className="text-white font-medium">{selectedSubmission.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Date of Birth</p>
                      <p className="text-white font-medium">{new Date(selectedSubmission.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Address</p>
                      <p className="text-white font-medium">{selectedSubmission.address}</p>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Document Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Document Type</p>
                      <p className="text-white font-medium">{selectedSubmission.documentType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Document Number</p>
                      <p className="text-white font-medium">{selectedSubmission.documentNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {selectedSubmission.documentImages.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Uploaded Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubmission.documentImages.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Document ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedSubmission.rejectionReason && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                    <h3 className="text-red-400 font-semibold mb-2">Rejection Reason</h3>
                    <p className="text-red-300 text-sm">{selectedSubmission.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedSubmission.status === 'PENDING' && (
                  <div className="flex gap-3">
                    {!rejecting ? (
                      <>
                        <button
                          onClick={() => handleApprove(selectedSubmission.id)}
                          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <IoCheckmarkCircle className="w-5 h-5" />
                          Approve KYC
                        </button>
                        <button
                          onClick={() => setRejecting(true)}
                          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <IoCloseCircle className="w-5 h-5" />
                          Reject KYC
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 space-y-3">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(selectedSubmission.id)}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejecting(false);
                              setRejectionReason('');
                            }}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="p-6 border-t border-slate-700">
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setRejecting(false);
                    setRejectionReason('');
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

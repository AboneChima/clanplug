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
  const [filteredSubmissions, setFilteredSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubmissions();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  // Filter submissions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(submission => 
      submission.user.username.toLowerCase().includes(query) ||
      submission.user.email.toLowerCase().includes(query) ||
      submission.user.firstName.toLowerCase().includes(query) ||
      submission.user.lastName.toLowerCase().includes(query) ||
      submission.documentNumber.toLowerCase().includes(query)
    );
    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        alert('Please login as admin first');
        return;
      }

      console.log('Fetching KYC submissions:', `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/list?status=${filter}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/list?status=${filter}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('KYC Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch KYC submissions:', response.status, errorText);
        alert(`Failed to fetch KYC submissions: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('KYC submissions response:', data);
      
      if (!data.success) {
        console.error('API returned error:', data.message);
        alert(`Error: ${data.message}`);
        return;
      }

      const submissionsData = data.data || [];
      console.log('KYC submissions data:', submissionsData);
      
      if (!Array.isArray(submissionsData)) {
        console.error('Submissions data is not an array:', submissionsData);
        return;
      }

      setSubmissions(submissionsData);
      setFilteredSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId: string) => {
    if (!confirm('✅ Approve this KYC submission?\n\nThis will:\n- Mark the KYC as APPROVED\n- Set user.isKYCVerified = true\n- Allow user to post on marketplace')) return;

    try {
      const token = localStorage.getItem('accessToken');
      console.log('Approving KYC:', kycId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/review/${kycId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      const data = await response.json();
      console.log('Approve response:', data);

      if (response.ok && data.success) {
        alert('✅ KYC Approved Successfully!\n\nUser can now:\n- Post on marketplace\n- Access all verified features');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        alert(`❌ Failed to approve KYC: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert(`❌ Error approving KYC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm('⚠️ BULK APPROVE ALL PENDING KYC?\n\nThis will approve ALL pending KYC submissions.\n\nAre you sure?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/bulk-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Success! Approved ${data.data?.count || 0} KYC submissions`);
        fetchSubmissions();
      } else {
        alert('Failed to bulk approve KYC submissions');
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Error bulk approving KYC submissions');
    }
  };

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/review/${kycId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ KYC Rejected');
        fetchSubmissions();
        setSelectedSubmission(null);
        setRejecting(false);
        setRejectionReason('');
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRevoke = async (kycId: string) => {
    const reason = prompt('Enter reason for revoking KYC approval:');
    
    if (!reason || !reason.trim()) {
      alert('Revoke reason is required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/review/${kycId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: `REVOKED: ${reason}` }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ KYC Approval Revoked');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error revoking KYC:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (kycId: string) => {
    if (!confirm('🗑️ Delete this rejected KYC submission?\n\nThis will permanently remove the submission and allow the user to resubmit.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/delete/${kycId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ KYC submission deleted successfully');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting KYC:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">KYC Verifications</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Review and approve user identity documents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900/50 text-gray-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
        {filter === 'PENDING' && submissions.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] sm:text-xs font-medium"
          >
            <IoCheckmarkCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Approve All</span>
            <span className="xs:hidden">All</span>
          </button>
        )}
        <button
          onClick={fetchSubmissions}
          className="ml-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-slate-900/50 hover:bg-slate-800 text-gray-300 border border-slate-800 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm"
        >
          <IoRefresh className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, username, email, or document number..."
          className="w-full px-4 py-3 pl-10 bg-slate-900/50 border border-slate-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <IoCloseCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-slate-900/50 rounded-lg p-8 sm:p-12 text-center border border-slate-800">
          <IoDocumentText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {searchQuery ? `No results found for "${searchQuery}"` : `No ${filter.toLowerCase()} submissions`}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">
                      {submission.user.firstName} {submission.user.lastName}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 truncate">@{submission.user.username} • {submission.user.email}</p>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center gap-1">📄 {submission.documentType}</span>
                      <span className="flex items-center gap-1">🔢 {submission.documentNumber}</span>
                      <span className="flex items-center gap-1">📅 {new Date(submission.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-white">KYC Review</h2>
                  <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                    selectedSubmission.status === 'PENDING' ? 'bg-orange-500/20 text-orange-300' :
                    selectedSubmission.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedSubmission.status}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
                {/* User Info */}
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2 text-xs sm:text-sm">User Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Full Name</p>
                      <p className="text-white font-medium">{selectedSubmission.user.firstName} {selectedSubmission.user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Username</p>
                      <p className="text-white font-medium">@{selectedSubmission.user.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Email</p>
                      <p className="text-white font-medium break-all">{selectedSubmission.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Phone</p>
                      <p className="text-white font-medium">{selectedSubmission.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Date of Birth</p>
                      <p className="text-white font-medium">{new Date(selectedSubmission.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Address</p>
                      <p className="text-white font-medium text-[9px] sm:text-[10px]">{selectedSubmission.address}</p>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2 text-xs sm:text-sm">Document Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Document Type</p>
                      <p className="text-white font-medium">{selectedSubmission.documentType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Document Number</p>
                      <p className="text-white font-medium">{selectedSubmission.documentNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {selectedSubmission.documentImages.length > 0 && (
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <h3 className="text-white font-semibold mb-2 text-xs sm:text-sm">Uploaded Documents</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSubmission.documentImages.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <img
                            src={url}
                            alt={`Document ${index + 1}`}
                            className="w-full h-32 sm:h-40 object-cover rounded-lg border border-slate-600 group-hover:border-blue-500 transition-colors"
                          />
                          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 text-center">Tap to enlarge</p>
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!rejecting ? (
                      <>
                        <button
                          onClick={() => handleApprove(selectedSubmission.id)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <IoCheckmarkCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejecting(true)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <IoCloseCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="w-full px-3 py-2 bg-slate-700 text-white text-xs sm:text-sm rounded-lg border border-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(selectedSubmission.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-semibold transition-colors"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejecting(false);
                              setRejectionReason('');
                            }}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Revoke Option for Approved KYC */}
                {selectedSubmission.status === 'APPROVED' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-xs mb-2">This KYC is approved. You can revoke it if approved by mistake.</p>
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Revoke this KYC approval?\n\nThis will:\n- Set user.isKYCVerified = false\n- User cannot post on marketplace anymore\n- User will receive notification')) {
                          handleRevoke(selectedSubmission.id);
                        }
                      }}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-colors"
                    >
                      Revoke KYC Approval
                    </button>
                  </div>
                )}

                {/* Delete Option for Rejected KYC */}
                {selectedSubmission.status === 'REJECTED' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 text-xs mb-2">Delete this rejected submission to allow the user to resubmit.</p>
                    <button
                      onClick={() => handleDelete(selectedSubmission.id)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <IoCloseCircle className="w-4 h-4" />
                      Delete KYC Submission
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800">
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setRejecting(false);
                    setRejectionReason('');
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

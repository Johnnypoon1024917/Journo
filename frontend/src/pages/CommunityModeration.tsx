/**
 * CommunityModeration - Admin dashboard for reviewing reported posts
 * 
 * Features:
 * - Display pending reports
 * - Review and dismiss reports
 * - Remove posts
 * - Filter by status
 * - Admin-only access
 * 
 * Validates Requirements 12.2, 12.3, 12.4
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import CommunityService from '@/services/communityService';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'removed';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  post?: {
    id: string;
    content: string;
    userName: string;
    userId: string;
    createdAt: string;
    reportCount?: number;
  };
}

type ReportStatus = 'all' | 'pending' | 'reviewed' | 'dismissed' | 'removed';

export const CommunityModeration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'dismiss' | 'remove' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user has admin role
    if (user.role !== 'admin' && user.role !== 'moderator') {
      navigate('/community');
      return;
    }
    
    loadReports();
  }, [user, navigate]);

  // Filter reports when status changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => r.status === statusFilter));
    }
  }, [reports, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CommunityService.getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewReport = (report: Report, action: 'dismiss' | 'remove') => {
    setSelectedReport(report);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedReport || !reviewAction) return;

    setIsSubmitting(true);
    
    try {
      await CommunityService.reviewReport(selectedReport.id, reviewAction);
      
      // Update local state
      setReports(reports.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: reviewAction === 'dismiss' ? 'dismissed' : 'removed', reviewedAt: new Date().toISOString() }
          : r
      ));
      
      setShowReviewModal(false);
      setSelectedReport(null);
      setReviewAction(null);
    } catch (err) {
      console.error('Failed to review report:', err);
      alert('Failed to review report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam or misleading',
      harassment: 'Harassment or bullying',
      hate_speech: 'Hate speech',
      violence: 'Violence or threats',
      inappropriate: 'Inappropriate content',
      misinformation: 'Misinformation',
      copyright: 'Copyright violation',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Moderation
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review and manage reported posts
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/community')}
            >
              Back to Community
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{reports.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {reports.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Dismissed</div>
            <div className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-400">
              {reports.filter(r => r.status === 'dismissed').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Removed</div>
            <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {reports.filter(r => r.status === 'removed').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {(['all', 'pending', 'reviewed', 'dismissed', 'removed'] as ReportStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reports list */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No {statusFilter !== 'all' ? statusFilter : ''} reports found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(report.status)}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Reported {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      {report.post?.reportCount && report.post.reportCount > 1 && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                          {report.post.reportCount} reports
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Reason:</strong> {getReasonLabel(report.reason)}
                    </div>
                    {report.description && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Details:</strong> {report.description}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Reported by: {report.reporterName}
                    </div>
                  </div>
                </div>

                {/* Post content */}
                {report.post && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.post.userName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(report.post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {report.post.content}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReviewReport(report, 'dismiss')}
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReviewReport(report, 'remove')}
                    >
                      Remove Post
                    </Button>
                  </div>
                )}

                {report.reviewedAt && (
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                    Reviewed on {new Date(report.reviewedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review confirmation modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === 'dismiss' ? 'Dismiss Report' : 'Remove Post'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {reviewAction === 'dismiss' ? (
              <>Are you sure you want to dismiss this report? The post will remain visible.</>
            ) : (
              <>Are you sure you want to remove this post? This action cannot be undone and the post will be hidden from all users.</>
            )}
          </p>

          {selectedReport?.post && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedReport.post.content}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'dismiss' ? 'primary' : 'danger'}
              onClick={confirmReview}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : reviewAction === 'dismiss' ? 'Dismiss' : 'Remove Post'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommunityModeration;

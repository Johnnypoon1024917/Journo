import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../hooks/useToast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
  tripTitle: string;
}

export function QRCodeModal({ isOpen, onClose, shareToken, tripTitle }: QRCodeModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/t/${shareToken}`;

  const handleDownloadQRCode = () => {
    try {
      if (!qrCodeRef.current) {
        throw new Error('QR code element not found');
      }

      // Get the SVG element
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size (larger for better quality)
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      // Create an image from the SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Draw the QR code
        ctx.drawImage(img, 0, 0, size, size);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            showError('Failed to generate QR code image');
            return;
          }

          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${tripTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);

          showSuccess('QR code downloaded successfully!');
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        showError('Failed to load QR code image');
      };

      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showError('Failed to download QR code');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code">
      <div className="space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center">
          <div
            ref={qrCodeRef}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <QRCodeSVG
              value={shareUrl}
              size={256}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            Scan this QR code to view the trip
          </p>
        </div>

        {/* Trip Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {tripTitle}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
            {shareUrl}
          </p>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How to use</p>
              <p>
                Open your phone's camera app and point it at the QR code. Tap the notification
                to open the trip in your browser.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
          <Button onClick={handleDownloadQRCode} variant="primary">
            <svg
              className="w-5 h-5 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download QR Code
          </Button>
        </div>
      </div>
    </Modal>
  );
}

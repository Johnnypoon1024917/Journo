/**
 * StickerUpload Component
 * 
 * Allows users to upload custom stickers
 */

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import stickerService from '../../services/stickerService';

interface StickerUploadProps {
  onUploadSuccess?: () => void;
  className?: string;
}

export const StickerUpload: React.FC<StickerUploadProps> = ({
  onUploadSuccess,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size is ${fileSizeMB}MB. Maximum allowed size is 5MB. Please compress or resize your image.`);
      return;
    }

    // Store the file
    setSelectedFile(file);

    // Read file and create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !name) {
      setError('Please select a file and enter a name');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await stickerService.uploadSticker(selectedFile, name, 'custom', false);
      
      // Reset form
      setPreview(null);
      setSelectedFile(null);
      setName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent
      onUploadSuccess?.();
    } catch (err: any) {
      console.error('Upload error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to upload sticker';
      
      if (err.message?.includes('too large') || err.message?.includes('entity too large')) {
        errorMessage = 'File is too large. Please compress or resize your image to under 5MB.';
      } else if (err.message?.includes('Invalid file format')) {
        errorMessage = 'Invalid file format. Please use PNG, JPG, or GIF.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`rounded-2xl p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Custom Sticker</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            Max 5MB
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            PNG, JPG, GIF
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium text-xs">
            Recommended: Under 2MB
          </span>
        </div>
      </div>

      {!preview ? (
        // Upload button
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-kawaii-500 hover:bg-white/50 transition-colors flex flex-col items-center justify-center gap-3 bg-white/30"
          >
            <PhotoIcon className="w-16 h-16 text-gray-400" />
            <div className="text-center">
              <span className="block text-sm font-medium text-gray-700">Click to select image</span>
              <span className="block text-xs text-gray-500 mt-1">Maximum file size: 5MB</span>
              <span className="block text-xs text-gray-500">Supported formats: PNG, JPG, GIF</span>
              <span className="block text-xs text-gray-400 mt-1 italic">Tip: Compress large images for faster uploads</span>
            </div>
          </button>
          
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      ) : (
        // Preview and upload form
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center bg-white/50 rounded-xl p-4">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-contain rounded-xl"
            />
          </div>

          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sticker Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sticker name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 font-medium text-gray-700"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleUpload}
              disabled={isUploading || !name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-kawaii-500 text-white rounded-full hover:bg-kawaii-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Upload
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerUpload;

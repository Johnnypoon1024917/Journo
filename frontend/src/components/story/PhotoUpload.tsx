import { useState, useRef } from 'react';
import { uploadService } from '../../services/uploadService';

interface PhotoUploadProps {
  onPhotoUploaded: (url: string, caption: string) => void;
  onCancel: () => void;
}

export const PhotoUpload = ({ onPhotoUploaded, onCancel }: PhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadService.uploadPhoto(selectedFile);
      onPhotoUploaded(result.url, caption);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2 text-xl">📷</span>
          Upload Photo
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {!previewUrl ? (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <span className="text-5xl mb-2">📤</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Click to select a photo
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max size: 10MB
            </span>
          </label>
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-lg object-cover max-h-64"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="caption"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Caption (optional)
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption to your photo..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {caption.length}/500
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import stickerService from '../../services/stickerService';

/**
 * Example component showing how to upload and use custom stickers
 * This can be integrated into your sticker picker UI
 */
export const StickerUploadExample: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedSticker, setUploadedSticker] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPEG, GIF, SVG, or WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload the sticker
      const sticker = await stickerService.uploadSticker(
        file,
        file.name.replace(/\.[^/.]+$/, ''), // Remove extension from name
        'custom',
        false // Make it private by default
      );

      setUploadedSticker(sticker);
      console.log('Sticker uploaded successfully:', sticker);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload sticker');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="sticker-upload-example p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Upload Custom Sticker</h3>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleUploadClick}
        disabled={uploading}
        className="px-4 py-2 bg-bubblequest-pink text-white rounded-lg hover:bg-bubblequest-pink-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Choose Sticker Image'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {uploadedSticker && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <p className="text-green-700 font-semibold mb-2">Sticker uploaded successfully!</p>
          <div className="flex items-center gap-4">
            <img 
              src={uploadedSticker.image_url} 
              alt={uploadedSticker.name}
              className="w-16 h-16 object-contain"
            />
            <div>
              <p className="font-medium">{uploadedSticker.name}</p>
              <p className="text-sm text-gray-600">Category: {uploadedSticker.category}</p>
              <p className="text-sm text-gray-600">
                Size: {(uploadedSticker.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Max file size: 2MB</li>
          <li>Supported formats: PNG, JPEG, GIF, SVG, WebP</li>
          <li>Recommended size: 128x128 to 512x512 pixels</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Example of attaching a sticker to a place
 */
export const attachStickerToPlace = async (
  stickerId: string,
  placeId: string
) => {
  try {
    const attachment = await stickerService.attachSticker(
      stickerId,
      'place',
      placeId,
      {
        x: 50, // Center horizontally (percentage)
        y: 50, // Center vertically (percentage)
        rotation: 0,
        scale: 1.0,
        zIndex: 1
      }
    );
    console.log('Sticker attached:', attachment);
    return attachment;
  } catch (error) {
    console.error('Failed to attach sticker:', error);
    throw error;
  }
};

/**
 * Example of getting all stickers for display in a picker
 */
export const loadStickersForPicker = async () => {
  try {
    const { custom, public: publicStickers, predefined } = await stickerService.getStickers();
    
    return {
      myStickers: custom,
      communityStickers: publicStickers,
      defaultStickers: predefined
    };
  } catch (error) {
    console.error('Failed to load stickers:', error);
    throw error;
  }
};

/**
 * Example of displaying stickers on a day card
 */
export const StickerDisplay: React.FC<{ dayId: string }> = ({ dayId }) => {
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadStickers();
  }, [dayId]);

  const loadStickers = async () => {
    try {
      setLoading(true);
      const attachments = await stickerService.getEntityStickers('trip_day', dayId);
      setStickers(attachments);
    } catch (error) {
      console.error('Failed to load stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading stickers...</div>;
  }

  return (
    <div className="sticker-display relative">
      {stickers.map((attachment) => (
        <img
          key={attachment.id}
          src={attachment.sticker_image_url}
          alt={attachment.sticker_name}
          className="absolute"
          style={{
            left: `${attachment.position_x}%`,
            top: `${attachment.position_y}%`,
            transform: `translate(-50%, -50%) rotate(${attachment.rotation}deg) scale(${attachment.scale})`,
            zIndex: attachment.z_index,
            width: '48px',
            height: '48px',
            objectFit: 'contain'
          }}
        />
      ))}
    </div>
  );
};

export default StickerUploadExample;

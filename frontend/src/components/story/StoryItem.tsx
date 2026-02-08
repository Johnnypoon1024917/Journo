import { StoryItem as StoryItemType } from '../../types/story';

interface StoryItemProps {
  item: StoryItemType;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export const StoryItem = ({ item, onDelete, canDelete = false }: StoryItemProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    switch (item.type) {
      case 'photo':
        return (
          <div className="relative">
            <img
              src={item.content_url || ''}
              alt={item.caption || 'Story photo'}
              className="w-full rounded-lg object-cover max-h-96"
              loading="lazy"
            />
            {item.caption && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.caption}</p>
            )}
          </div>
        );

      case 'youtube':
        const videoId = item.content_url?.split('/').pop() || '';
        return (
          <div className="relative">
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={item.caption || 'YouTube video'}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {item.caption && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.caption}</p>
            )}
          </div>
        );

      case 'note':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {item.caption || item.content_url}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="mr-1">📅</span>
          <span>{formatDate(item.created_at)}</span>
        </div>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors text-lg"
            title="Delete story item"
          >
            🗑️
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

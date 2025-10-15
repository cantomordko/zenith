'use client';

import { Tag } from '@/types';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export default function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
          title="Usuń tag"
        >
          ×
        </button>
      )}
    </span>
  );
}

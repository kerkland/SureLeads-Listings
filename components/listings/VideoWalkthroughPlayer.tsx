'use client';

interface Props {
  youtubeId:       string;   // YouTube video ID (11-char alphanumeric)
  durationSeconds?: number;
}

export default function VideoWalkthroughPlayer({ youtubeId, durationSeconds }: Props) {
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;

  return (
    <div className="rounded-xl overflow-hidden bg-black border border-gray-200">
      {/* Header bar */}
      <div className="p-3 bg-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-white text-sm font-medium">Video Walkthrough</span>
        {durationSeconds && (
          <span className="text-gray-400 text-xs ml-auto">
            {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')}
          </span>
        )}
        {/* YouTube badge */}
        <span className="ml-auto text-2xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/>
          </svg>
          YouTube
        </span>
      </div>
      {/* 16:9 responsive iframe */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title="Property Video Walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}

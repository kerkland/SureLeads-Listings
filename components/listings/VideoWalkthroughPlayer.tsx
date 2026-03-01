'use client';

interface Props {
  cloudinaryUrl: string;
  durationSeconds?: number;
}

export default function VideoWalkthroughPlayer({ cloudinaryUrl, durationSeconds }: Props) {
  return (
    <div className="rounded-xl overflow-hidden bg-black border border-gray-200">
      <div className="p-3 bg-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-white text-sm font-medium">Video Walkthrough</span>
        {durationSeconds && (
          <span className="text-gray-400 text-xs ml-auto">
            {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <video
        controls
        className="w-full max-h-[400px]"
        preload="metadata"
        src={cloudinaryUrl}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

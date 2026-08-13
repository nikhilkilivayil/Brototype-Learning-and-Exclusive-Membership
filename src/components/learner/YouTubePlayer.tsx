"use client";

/**
 * Responsive 16:9 YouTube embed. The `.yt-embed` wrapper class (defined in
 * globals.css) handles the aspect ratio, rounded corners and letterboxing.
 */
export default function YouTubePlayer({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  return (
    <div className="yt-embed">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

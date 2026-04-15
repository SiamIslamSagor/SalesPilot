import { useEffect, useCallback } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt,
  onClose,
}: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (src) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [src, handleKeyDown]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X size={20} className="text-white" />
      </button>

      <img
        src={src}
        alt={alt || "Image preview"}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

/**
 * Small overlay icon to indicate an image is clickable/zoomable.
 * Wrap the image container in a relative div and place this inside.
 */
export function ZoomOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors cursor-pointer">
      <ZoomIn
        size={20}
        className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
      />
    </div>
  );
}

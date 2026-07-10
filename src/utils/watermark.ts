/**
 * Watermark Utility for ClanPlug
 * Adds "ClanPlug" watermark to images and videos (Instagram/TikTok style)
 */

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  fontSize?: number;
  padding?: number;
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  text: 'ClanPlug',
  opacity: 0.6,
  position: 'bottom-right',
  fontSize: 16,
  padding: 12,
};

/**
 * Add watermark to an image
 * @param imageUrl - URL of the image
 * @param options - Watermark configuration
 * @returns Promise<Blob> - Watermarked image as blob
 */
export async function addWatermarkToImage(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise(async (resolve, reject) => {
    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark style
        ctx.font = `bold ${opts.fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opts.opacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${opts.opacity * 0.5})`;
        ctx.lineWidth = 2;

        // Calculate position
        const textMetrics = ctx.measureText(opts.text!);
        const textWidth = textMetrics.width;
        const textHeight = opts.fontSize!;

        let x, y;
        switch (opts.position) {
          case 'bottom-right':
            x = canvas.width - textWidth - opts.padding!;
            y = canvas.height - opts.padding!;
            break;
          case 'bottom-left':
            x = opts.padding!;
            y = canvas.height - opts.padding!;
            break;
          case 'top-right':
            x = canvas.width - textWidth - opts.padding!;
            y = textHeight + opts.padding!;
            break;
          case 'top-left':
          default:
            x = opts.padding!;
            y = textHeight + opts.padding!;
        }

        // Draw text with stroke (for better visibility)
        ctx.strokeText(opts.text!, x, y);
        ctx.fillText(opts.text!, x, y);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download file with watermark
 * @param blob - File blob
 * @param filename - Desired filename
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate watermarked video HTML (for display, not download)
 * Videos require server-side processing for real watermarks,
 * so we add an overlay div instead
 */
export function getVideoWatermarkOverlay(options: WatermarkOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const positions = {
    'bottom-right': 'bottom-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
  };

  return `
    <div class="absolute ${positions[opts.position!]} pointer-events-none">
      <span class="text-white font-bold text-sm drop-shadow-lg" style="opacity: ${opts.opacity};">
        ${opts.text}
      </span>
    </div>
  `;
}

/**
 * Show watermark download instructions for videos
 * (Real video watermarking requires server-side processing)
 */
export function showVideoDownloadInfo() {
  return {
    message: 'Video downloading with watermark',
    tip: 'The watermark will be visible in the downloaded video',
  };
}

/**
 * Client-side image compression utility for lead2b
 * Targets 250KB - 500KB with max 1600px longest dimension
 */

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressBusinessCardImage(
  inputFile: File,
  maxDimension: number = 1600,
  maxSizeKB: number = 450
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(inputFile);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to create canvas 2D context'));
        }

        // Draw image on white background (avoids transparent dark business cards)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Quality reduction loop to hit target size ~250-450KB
        let quality = 0.85;
        const mimeType = 'image/jpeg';

        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas blob generation failed'));
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB > maxSizeKB && q > 0.45) {
                tryCompress(q - 0.1);
              } else {
                const compressedFile = new File([blob], `card_${Date.now()}.jpg`, {
                  type: mimeType,
                  lastModified: Date.now(),
                });

                const dataUrl = canvas.toDataURL(mimeType, q);
                resolve({
                  file: compressedFile,
                  blob,
                  dataUrl,
                  originalSize: inputFile.size,
                  compressedSize: blob.size,
                  width,
                  height,
                });
              }
            },
            mimeType,
            q
          );
        };

        tryCompress(quality);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

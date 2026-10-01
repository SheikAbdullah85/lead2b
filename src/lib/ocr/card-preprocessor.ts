/**
 * Client-Side Business Card Image Preprocessor for OCR
 * Enhances contrast, converts to high-fidelity grayscale,
 * and sharpens text boundaries so Tesseract can reliably read small font
 * mobile numbers (+971 50..., M:, Mob:) even in dim exhibition booth lighting.
 */

export interface PreprocessOptions {
  maxDimension?: number;
  contrastBoost?: number; // 1.0 = normal, 1.25 = punchy
  sharpen?: boolean;
}

export async function preprocessCardForOcr(
  imageSource: string | File | Blob,
  options: PreprocessOptions = {}
): Promise<string> {
  const { maxDimension = 2000, contrastBoost = 1.3, sharpen = true } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    // Cross origin if applicable
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Maintain high resolution (up to 2000px) so small phone numbers are crisp
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

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource as Blob));
        }

        // 1. Draw original on pure white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Extract pixel data for contrast stretching & sharpening
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const totalPixels = width * height;

        // Build luminance histogram (256 bins)
        const hist = new Uint32Array(256);
        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R BT.601 luma
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          hist[lum]++;
        }

        // Find 2nd and 98th percentile for auto-contrast stretching (avoids outlier shadows/hotspots)
        const lowerLimit = Math.floor(totalPixels * 0.02);
        const upperLimit = Math.floor(totalPixels * 0.98);

        let count = 0;
        let minLum = 0;
        let maxLum = 255;

        for (let i = 0; i < 256; i++) {
          count += hist[i];
          if (count >= lowerLimit) {
            minLum = i;
            break;
          }
        }

        count = 0;
        for (let i = 255; i >= 0; i--) {
          count += hist[i];
          if (count >= totalPixels - upperLimit) {
            maxLum = i;
            break;
          }
        }

        if (maxLum <= minLum) {
          maxLum = 255;
          minLum = 0;
        }

        const lumRange = maxLum - minLum;

        // Apply contrast stretch + grayscale
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Stretch
          let stretched = ((lum - minLum) / lumRange) * 255;

          // Apply contrast boost around midpoint
          stretched = (stretched - 128) * contrastBoost + 128;

          // Clamp 0-255
          const finalVal = Math.min(255, Math.max(0, Math.round(stretched)));

          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
          // data[i+3] remains alpha
        }

        ctx.putImageData(imageData, 0, 0);

        // 3. Optional unsharp mask (3x3 sharpening kernel)
        if (sharpen && width > 400 && height > 400) {
          const sharpCanvas = document.createElement('canvas');
          sharpCanvas.width = width;
          sharpCanvas.height = height;
          const sharpCtx = sharpCanvas.getContext('2d');

          if (sharpCtx) {
            const srcData = ctx.getImageData(0, 0, width, height);
            const dstData = sharpCtx.createImageData(width, height);
            const src = srcData.data;
            const dst = dstData.data;

            // Simple 3x3 sharpen kernel:
            //  0  -0.5   0
            // -0.5  3.0 -0.5
            //  0  -0.5   0
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const top = ((y - 1) * width + x) * 4;
                const bottom = ((y + 1) * width + x) * 4;
                const left = (y * width + (x - 1)) * 4;
                const right = (y * width + (x + 1)) * 4;

                const centerVal = src[idx];
                const sharpVal = 3.0 * centerVal - 0.5 * (src[top] + src[bottom] + src[left] + src[right]);
                const clamped = Math.min(255, Math.max(0, Math.round(sharpVal)));

                dst[idx] = clamped;
                dst[idx + 1] = clamped;
                dst[idx + 2] = clamped;
                dst[idx + 3] = 255;
              }
            }

            sharpCtx.putImageData(dstData, 0, 0);
            resolve(sharpCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load card image for OCR preprocessing'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageSource);
    }
  });
}

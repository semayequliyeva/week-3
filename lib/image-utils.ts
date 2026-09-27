// Fayl olcusunu oxunaqli formata salir (KB, MB va s.)
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Faylin heqiqi formatini bilmek ucun ilk 4 baytini (magic number) yoxlayiriq
export async function verifyMagicNumber(file: File): Promise<{ hex: string; isValid: boolean }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const blob = file.slice(0, 4);

    reader.onloadend = () => {
      if (!reader.result || !(reader.result instanceof ArrayBuffer)) {
        resolve({ hex: 'UNKNOWN', isValid: false });
        return;
      }

      const uint = new Uint8Array(reader.result);
      const bytes: string[] = [];
      uint.forEach((byte) => bytes.push(byte.toString(16).padStart(2, '0')));
      const hex = bytes.join('').toLowerCase();

      // Faylin uzantisina gore magic number uygunlugunu yoxlayiriq
      let isValid = false;
      if (file.type === 'image/png' && hex.startsWith('89504e47')) isValid = true;
      else if (file.type === 'image/jpeg' && hex.startsWith('ffd8ff')) isValid = true;
      else if (file.type === 'image/webp' && hex.startsWith('52494646')) isValid = true;
      else if (file.type === 'image/gif' && hex.startsWith('47494638')) isValid = true;

      resolve({ hex: hex.toUpperCase(), isValid });
    };

    reader.onerror = () => resolve({ hex: 'ERROR', isValid: false });
    reader.readAsArrayBuffer(blob);
  });
}

// Sheklin olcusunu balacalashdirib canvas ile kichiq thumbnail duzeldirik
export function createThumbnail(file: File): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const originalUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const maxDimension = 300;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      let targetWidth = width;
      let targetHeight = height;

      // Proporsiyani bozmadan max 300px olcuye getiririk
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          targetWidth = maxDimension;
          targetHeight = Math.round((height * maxDimension) / width);
        } else {
          targetHeight = maxDimension;
          targetWidth = Math.round((width * maxDimension) / height);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(originalUrl);
        reject(new Error('Canvas yaradila bilmedi'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        // Yaddasda yer tutmasin deye boyuk seklin URL-ini legv edirik
        URL.revokeObjectURL(originalUrl);

        if (blob) {
          const thumbnailUrl = URL.createObjectURL(blob);
          resolve({ thumbnailUrl, width, height });
        } else {
          reject(new Error('Thumbnail hazirlanmadi'));
        }
      }, 'image/jpeg', 0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(originalUrl);
      reject(new Error('Sekil fayli zedelenib'));
    };

    img.src = originalUrl;
  });
}
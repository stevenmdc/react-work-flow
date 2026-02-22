import type { StageImageAsset } from '@/types';

export const MAX_NODE_IMAGE_BYTES = 1024 * 1024;
const MAX_NODE_IMAGE_WIDTH = 800;
const MAX_NODE_IMAGE_HEIGHT = 450;

const BASE64_PREFIX = ';base64,';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode the image.'));
    image.src = dataUrl;
  });
}

function estimateDataUrlSize(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(BASE64_PREFIX);
  if (base64Index < 0) return 0;
  const base64 = dataUrl.slice(base64Index + BASE64_PREFIX.length);
  return Math.floor((base64.length * 3) / 4);
}

function toCanvasSize(width: number, height: number) {
  const ratio = Math.min(
    1,
    MAX_NODE_IMAGE_WIDTH / Math.max(1, width),
    MAX_NODE_IMAGE_HEIGHT / Math.max(1, height)
  );

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function createNodeImageAsset(file: File): Promise<StageImageAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file.');
  }

  const inputDataUrl = await readFileAsDataUrl(file);
  const decoded = await loadImage(inputDataUrl);
  const targetSize = toCanvasSize(decoded.naturalWidth, decoded.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not process image on this browser.');
  }

  context.drawImage(decoded, 0, 0, targetSize.width, targetSize.height);

  const outputTypes = ['image/webp', 'image/jpeg'];
  const qualitySteps = [0.9, 0.82, 0.74, 0.66, 0.58];

  for (const type of outputTypes) {
    for (const quality of qualitySteps) {
      const dataUrl = canvas.toDataURL(type, quality);
      const bytes = estimateDataUrlSize(dataUrl);
      if (bytes > 0 && bytes <= MAX_NODE_IMAGE_BYTES) {
        return {
          src: dataUrl,
          name: file.name,
          mimeType: type,
          bytes,
          width: targetSize.width,
          height: targetSize.height,
        };
      }
    }
  }

  throw new Error(
    `Image is still too large after compression. Use a smaller file (max ${formatBytes(
      MAX_NODE_IMAGE_BYTES
    )}).`
  );
}

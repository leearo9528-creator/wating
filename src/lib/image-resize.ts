// 브라우저에서 이미지 자동 리사이즈/압축
// 긴 변을 maxDim 이하로 줄이고, 결과 크기가 maxBytes 이하가 될 때까지
// JPEG quality 를 단계적으로 낮춰가며 재인코딩한다.
// 원본이 이미 작으면 그대로 반환.

export async function resizeImageFile(
  file: File,
  opts: { maxDim?: number; maxBytes?: number } = {}
): Promise<File> {
  const maxDim = opts.maxDim ?? 1600;
  const maxBytes = opts.maxBytes ?? 900 * 1024; // 서버 액션 1MB 한도 안쪽

  if (!file.type.startsWith('image/')) return file;
  if (file.size <= maxBytes) {
    // 크기 OK 라도 아주 큰 해상도면 줄이는 게 좋지만, 비용 대비 효과 낮으므로 통과
    const bmp = await safeBitmap(file);
    if (!bmp || (bmp.width <= maxDim && bmp.height <= maxDim)) return file;
  }

  const bitmap = await safeBitmap(file);
  if (!bitmap) return file; // 디코딩 실패하면 원본 그대로 (서버에서 검증)

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
  for (const q of qualities) {
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', q)
    );
    if (!blob) continue;
    if (blob.size <= maxBytes || q === qualities[qualities.length - 1]) {
      const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
    }
  }
  return file;
}

async function safeBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

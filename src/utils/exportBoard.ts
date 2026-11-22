import {InsectChampion} from '../data/champions';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function exportRosterToCanvasPng(
  champions: InsectChampion[],
): Promise<void> {
  const width = 2560;
  const height = 1360;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#090A0D';
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = '#D9A441';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CHITIN & RUNES  ·  PLANNING DES CONCEPTS INSECTOÏDES', 72, 68);

  ctx.fillStyle = '#F3F1EC';
  ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('10 Champions Insectoïdes — Planche de Concept', 72, 120);

  // Grid of 5 columns x 2 rows
  const cols = 5;
  const startX = 72;
  const startY = 164;
  const gapX = 28;
  const gapY = 36;
  const cardW = (width - startX * 2 - gapX * (cols - 1)) / cols; // ~460
  const imgH = Math.round(cardW * (9 / 16)); // ~259
  const cardH = imgH + 104;

  const loaded = await Promise.allSettled(
    champions.slice(0, 10).map((c) => loadImage(c.imagePath)),
  );

  champions.slice(0, 10).forEach((champ, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Card frame
    ctx.fillStyle = '#12141B';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, cardH);

    // Image
    const result = loaded[idx];
    if (result && result.status === 'fulfilled') {
      ctx.drawImage(result.value, x, y, cardW, imgH);
    } else {
      ctx.fillStyle = '#1A1D26';
      ctx.fillRect(x, y, cardW, imgH);
    }

    // Text metadata
    ctx.fillStyle = '#D9A441';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${champ.index} · ${champ.role.toUpperCase()}`, x + 16, y + imgH + 28);

    ctx.fillStyle = '#F3F1EC';
    ctx.font = '600 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${champ.name}`, x + 16, y + imgH + 58);

    ctx.fillStyle = '#9DA3B0';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${champ.insectType} · ${champ.region}`, x + 16, y + imgH + 84);
  });

  // Footer note
  ctx.fillStyle = '#737988';
  ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Chitin & Runes — 10 concepts originaux inspirés de League of Legends', 72, height - 38);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'chitin-and-runes-10-champions.png';
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import React, { useRef, useState } from 'react';

const RANK_BADGE_COLORS = {
  E: { bg: 'bg-slate-800', border: 'border-slate-500', text: 'text-slate-300', glow: 'rgba(148, 163, 184, 0.4)' },
  D: { bg: 'bg-stone-800', border: 'border-stone-500', text: 'text-stone-300', glow: 'rgba(168, 162, 158, 0.4)' },
  C: { bg: 'bg-emerald-950', border: 'border-emerald-500', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.5)' },
  B: { bg: 'bg-blue-950', border: 'border-blue-500', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.5)' },
  A: { bg: 'bg-violet-950', border: 'border-violet-500', text: 'text-violet-400', glow: 'rgba(139, 92, 246, 0.6)' },
  S: { bg: 'bg-amber-950', border: 'border-amber-400', text: 'text-amber-300', glow: 'rgba(251, 191, 36, 0.7)' },
};

export default function HunterCardModal({ hunter, onClose }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!hunter) return null;

  const rank = hunter.rank || 'E';
  const rankStyle = RANK_BADGE_COLORS[rank] || RANK_BADGE_COLORS['E'];

  // Draw card onto HTML5 canvas for clean export
  const renderCardToCanvas = () => {
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 860;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#09080d');
    bgGrad.addColorStop(0.5, '#120b12');
    bgGrad.addColorStop(1, '#050406');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Holographic border
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.strokeStyle = 'rgba(225, 29, 72, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let y = 30; y < height - 30; y += 4) {
      ctx.fillRect(24, y, width - 48, 1);
    }

    // 3. Header
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#e11d48';
    ctx.fillText('HUNTER ASSOCIATION // OFFICIAL LICENSE', 40, 65);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#74d8bd';
    ctx.fillText(`SYS-ID: #ASC-${String(hunter.id || 999).padStart(6, '0')}`, width - 220, 65);

    // Divider
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)';
    ctx.beginPath();
    ctx.moveTo(40, 80);
    ctx.lineTo(width - 40, 80);
    ctx.stroke();

    // 4. Hunter Name & Rank Badge
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#fbdbdb';
    ctx.fillText((hunter.username || 'HUNTER').toUpperCase(), 40, 140);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#ac8889';
    ctx.fillText(`AWAKENED HUNTER  •  LEVEL ${hunter.level || 1}`, 40, 175);

    // Rank Badge Box
    ctx.fillStyle = '#1c0f14';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 150, 105, 100, 75);
    ctx.fillRect(width - 150, 105, 100, 75);

    ctx.font = 'bold 38px sans-serif';
    ctx.fillStyle = rank === 'S' ? '#f59e0b' : '#ffb3b6';
    ctx.textAlign = 'center';
    ctx.fillText(`${rank}`, width - 100, 155);
    ctx.font = 'bold 10px monospace';
    ctx.fillText('RANK', width - 100, 172);
    ctx.textAlign = 'left';

    // 5. Stats Section Header
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#e11d48';
    ctx.fillText('COMBAT ATTRIBUTES', 40, 240);

    ctx.strokeStyle = 'rgba(225, 29, 72, 0.3)';
    ctx.beginPath();
    ctx.moveTo(40, 255);
    ctx.lineTo(width - 40, 255);
    ctx.stroke();

    // Stats Grid
    const stats = [
      { name: 'STR (Strength)', val: hunter.stat_str || 0, desc: 'Lifting volume' },
      { name: 'VIT (Vitality)', val: hunter.stat_vit || 0, desc: 'Consistency & recovery' },
      { name: 'AGI (Agility)', val: hunter.stat_agi || 0, desc: 'Cardio & speed' },
      { name: 'END (Endurance)', val: hunter.stat_end || 0, desc: 'Session duration' },
      { name: 'FLX (Flexibility)', val: hunter.stat_flx || 0, desc: 'Mobility & stretching' },
      { name: 'PER (Perception)', val: hunter.stat_per || 0, desc: 'Streak & discipline' },
    ];

    stats.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 40 + col * 280;
      const y = 290 + row * 90;

      // Box
      ctx.fillStyle = 'rgba(25, 10, 15, 0.7)';
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.2)';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, 260, 70);
      ctx.strokeRect(x, y, 260, 70);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ac8889';
      ctx.fillText(st.name, x + 15, y + 28);

      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#fbdbdb';
      ctx.fillText(String(st.val), x + 15, y + 58);
    });

    // 6. Summary metrics (Streak & XP)
    const metricsY = 600;
    ctx.fillStyle = 'rgba(225, 29, 72, 0.1)';
    ctx.fillRect(40, metricsY, width - 80, 110);
    ctx.strokeStyle = '#e11d48';
    ctx.strokeRect(40, metricsY, width - 80, 110);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#ffb3b6';
    ctx.fillText('CURRENT STREAK', 60, metricsY + 35);
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#fbdbdb';
    ctx.fillText(`${hunter.current_streak || 0} DAYS`, 60, metricsY + 80);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#ffb3b6';
    ctx.fillText('TOTAL EXPERIENCE', 340, metricsY + 35);
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#fbdbdb';
    ctx.fillText(`${(hunter.xp || 0).toLocaleString()} XP`, 340, metricsY + 80);

    // 7. Footer watermark
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(251, 219, 219, 0.4)';
    ctx.fillText('ASCEND SYSTEM // AUTHORIZED GUILD REGISTRY', 40, height - 45);
    ctx.fillText('THE MONARCH AWAITS YOUR PROGRESSION', width - 280, height - 45);

    return canvas;
  };

  const handleDownload = () => {
    setExporting(true);
    try {
      const canvas = renderCardToCanvas();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `hunter-license-${hunter.username || 'hunter'}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export canvas:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      const canvas = renderCardToCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          handleDownload();
        }
      });
    } catch (err) {
      console.error('Failed to copy card image:', err);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-primary-container/40 p-5 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-primary-container/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Card Preview */}
        <div ref={cardRef} className="p-4 rounded-xl border-2 border-primary-container/60 bg-surface-container-lowest/90 relative overflow-hidden shadow-inner">
          <div className="scanlines absolute inset-0 pointer-events-none opacity-40"></div>

          <div className="flex justify-between items-center text-[10px] font-mono text-primary border-b border-primary-container/20 pb-2 mb-3">
            <span>HUNTER LICENSE</span>
            <span className="text-tertiary">SYS-ID #{String(hunter.id || 1).padStart(5, '0')}</span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-monarch-display text-2xl text-primary font-bold tracking-wide">
                {hunter.username}
              </h3>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                LEVEL {hunter.level || 1} • {rank}-RANK HUNTER
              </p>
            </div>
            <div className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center ${rankStyle.bg} ${rankStyle.border} shadow-lg`}
                 style={{ boxShadow: `0 0 15px ${rankStyle.glow}` }}>
              <span className={`text-2xl font-black ${rankStyle.text}`}>{rank}</span>
              <span className="text-[8px] font-mono text-on-surface-variant tracking-wider">RANK</span>
            </div>
          </div>

          {/* Stats matrix */}
          <div className="grid grid-cols-3 gap-2 my-3 font-mono text-center">
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">STR</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_str || 0}</div>
            </div>
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">VIT</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_vit || 0}</div>
            </div>
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">AGI</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_agi || 0}</div>
            </div>
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">END</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_end || 0}</div>
            </div>
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">FLX</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_flx || 0}</div>
            </div>
            <div className="bg-surface-container/60 p-2 rounded border border-primary-container/20">
              <div className="text-[10px] text-on-surface-variant">PER</div>
              <div className="text-sm font-bold text-primary">{hunter.stat_per || 0}</div>
            </div>
          </div>

          {/* Streak & XP footer */}
          <div className="flex justify-between items-center bg-primary-container/10 border border-primary-container/30 rounded-lg p-2.5 text-xs font-mono mt-2">
            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span>{hunter.current_streak || 0}d Streak</span>
            </div>
            <div className="text-primary font-bold">
              {(hunter.xp || 0).toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 monarch-btn py-2.5 px-3 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            {exporting ? 'GENERATING...' : 'SAVE IMAGE (PNG)'}
          </button>

          <button
            onClick={handleCopyImage}
            className="monarch-btn py-2.5 px-4 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 text-tertiary border-tertiary/40 hover:bg-tertiary/10"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'COPIED!' : 'COPY'}
          </button>
        </div>
      </div>
    </div>
  );
}

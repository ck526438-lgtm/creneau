import { ImageResponse } from 'next/og';

export const alt = 'Creneau — la prise de rendez-vous en ligne sans friction';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #f2f6f1 0%, #a8bfa3 55%, #26372b 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#b87333',
              color: '#fff',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#26372b' }}>Creneau</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: '#26372b', lineHeight: 1.05 }}>
            Vos rendez-vous se prennent
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: '#b87333', lineHeight: 1.05 }}>
            tout seuls, 24 h sur 24.
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#39503a', maxWidth: 900 }}>
            Un lien, un agenda, des confirmations et des rappels automatiques.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#26372b' }}>
            Pour indépendants, praticiens, coachs, agences
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 700,
              color: '#f2f6f1',
              background: '#26372b',
              borderRadius: 14,
              padding: '14px 26px',
            }}
          >
            Gratuit
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

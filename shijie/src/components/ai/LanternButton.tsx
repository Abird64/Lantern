import { useState } from 'react';
import { LanternSvg } from '@/components/ui';
import { LanternModal } from './LanternModal';
import { usePageTheme } from '@/hooks/usePageTheme';

export function LanternButton() {
  const [show, setShow] = useState(false);
  const t = usePageTheme('lantern');

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-6 left-6 z-30 w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-lg"
        style={{ backgroundColor: t.nav }}
        title="提灯助手"
      >
        <div className="w-11 h-11">
          <LanternSvg accentColor={t.accent} />
        </div>
      </button>
      <LanternModal show={show} onClose={() => setShow(false)} />
    </>
  );
}

import { useEffect, useRef } from 'react';

interface LanternSvgProps {
  className?: string;
  accentColor?: string;
  isDark?: boolean;
}

export function LanternSvg({ className, accentColor = '#58A968', isDark = true }: LanternSvgProps) {
  const eyeColor = isDark ? '#FFF5E0' : '#5D3A1A';
  const frameColor = isDark ? '#e8e8e8' : '#4A4A4A';
  const frameDim = isDark ? '#c0c0c0' : '#6A6A6A';
  const leftEyeRef = useRef<SVGLineElement>(null);
  const rightEyeRef = useRef<SVGLineElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;
    const svg = svgRef.current;
    if (!leftEye || !rightEye || !svg) return;

    const leftEyeCenter = { x: 165, y: 280 };
    const rightEyeCenter = { x: 235, y: 280 };
    const eyesMidpoint = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: leftEyeCenter.y,
    };

    function updateEyeLine(
      eyeElement: SVGLineElement,
      center: { x: number; y: number },
      mx: number,
      my: number
    ) {
      const dx = mx - eyesMidpoint.x;
      const dy = my - eyesMidpoint.y;
      const distanceToMid = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const maxDist = 400;
      const clampedDist = Math.min(distanceToMid, maxDist);
      const distanceRatio = clampedDist / maxDist;

      const minLength = 4;
      const maxLength = 25;
      const eyeLength = minLength + distanceRatio * (maxLength - minLength);

      const maxOffsetX = 8;
      const maxOffsetY = 12;
      const offsetX = Math.cos(angle) * maxOffsetX * distanceRatio;
      const offsetY = Math.sin(angle) * maxOffsetY * distanceRatio;

      const eyeX = center.x + offsetX;
      const eyeY = center.y + offsetY;
      const halfLength = eyeLength / 2;

      eyeElement.setAttribute('x1', String(eyeX));
      eyeElement.setAttribute('y1', String(eyeY - halfLength));
      eyeElement.setAttribute('x2', String(eyeX));
      eyeElement.setAttribute('y2', String(eyeY + halfLength));
    }

    function updateEyes(clientX: number, clientY: number) {
      const rect = svg!.getBoundingClientRect();
      const scaleX = 400 / rect.width;
      const scaleY = 500 / rect.height;
      const svgMouseX = (clientX - rect.left) * scaleX;
      const svgMouseY = (clientY - rect.top) * scaleY;
      updateEyeLine(leftEye!, leftEyeCenter, svgMouseX, svgMouseY);
      updateEyeLine(rightEye!, rightEyeCenter, svgMouseX, svgMouseY);
    }

    const onMouseMove = (e: MouseEvent) => updateEyes(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateEyes(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);

    // 眨眼
    let blinkTimer: ReturnType<typeof setTimeout>;
    function blink() {
      leftEye!.classList.add('blinking');
      rightEye!.classList.add('blinking');
      blinkTimer = setTimeout(() => {
        leftEye!.classList.remove('blinking');
        rightEye!.classList.remove('blinking');
      }, 250);
      setTimeout(blink, 3000 + Math.random() * 4000);
    }
    const startTimer = setTimeout(blink, 3000);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      clearTimeout(blinkTimer);
      clearTimeout(startTimer);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes flameFlicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          25% { transform: scaleY(1.05) scaleX(0.97); opacity: 1; }
          50% { transform: scaleY(0.97) scaleX(1.03); opacity: 0.85; }
          75% { transform: scaleY(1.03) scaleX(0.98); opacity: 0.95; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @keyframes eyeBlink {
          0%, 45%, 55%, 100% { opacity: 0.9; }
          50% { opacity: 0.3; stroke-width: 5; }
        }
        .lantern-flame {
          animation: flameFlicker 1.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .lantern-glow {
          animation: glowPulse 2s ease-in-out infinite;
        }
        .eye-line.blinking {
          animation: eyeBlink 0.25s ease-in-out;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox="0 0 400 500"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <clipPath id="ringClip">
            <rect x="0" y="0" width="400" height="155" />
          </clipPath>
          <radialGradient id="lanternGlow" cx="50%" cy="65%" r="35%">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
            <stop offset="50%" stopColor={accentColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="flameGradient" cx="50%" cy="90%" r="60%">
            <stop offset="0%" stopColor="#FFF5E0" stopOpacity={0.95} />
            <stop offset="20%" stopColor="#FFE082" stopOpacity={0.85} />
            <stop offset="50%" stopColor="#FFB74D" stopOpacity={0.5} />
            <stop offset="75%" stopColor="#FF9800" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#FFB74D" stopOpacity={0.05} />
          </radialGradient>
          <linearGradient id="flameTip" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFB74D" stopOpacity={0.7} />
            <stop offset="40%" stopColor="#FFD54F" stopOpacity={0.45} />
            <stop offset="70%" stopColor="#FFE082" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#FFF5E0" stopOpacity={0.15} />
          </linearGradient>
          <filter id="softBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation={3} />
          </filter>
          <clipPath id="glassClip">
            <path d="M145,180 L90,280 L145,430 L255,430 L310,280 L255,180 Z" />
          </clipPath>
        </defs>

        {/* 背景光晕 */}
        <ellipse cx="200" cy="290" rx="100" ry="120" fill="url(#lanternGlow)" className="lantern-glow" />

        {/* 灯体内容 */}
        <g clipPath="url(#glassClip)">
          <g transform="translate(-15, 0)">
            <g className="lantern-flame">
              {/* 主火焰体 */}
              <path
                d="M155,430 Q135,420 128,400 Q122,380 128,360 Q138,340 152,320 Q168,300 185,280 Q198,260 208,240 Q215,220 218,210 Q222,220 228,240 Q238,260 255,280 Q272,300 288,320 Q302,340 308,360 Q315,380 308,400 Q300,420 285,430 Z"
                fill="url(#flameGradient)"
                filter="url(#softBlur)"
              />
              {/* 左侧火舌 */}
              <path
                d="M152,420 Q135,380 142,340 Q148,300 162,260 Q175,220 185,180 Q195,210 188,240 Q182,280 168,320 Q155,360 162,400 Q168,420 175,430 Z"
                fill="url(#flameTip)"
                opacity={0.7}
                filter="url(#softBlur)"
              />
              {/* 左中火舌 */}
              <path
                d="M182,415 Q172,370 178,330 Q188,290 198,250 Q208,210 215,190 Q222,210 215,250 Q205,290 195,330 Q185,370 195,415 Z"
                fill="url(#flameTip)"
                opacity={0.65}
                filter="url(#softBlur)"
              />
              {/* 中央主火舌 */}
              <path
                d="M202,420 Q195,360 198,300 Q205,250 208,200 Q215,170 222,150 Q228,170 235,200 Q242,250 245,300 Q248,360 245,420 Z"
                fill="#FFF5E0"
                opacity={0.5}
                filter="url(#softBlur)"
              />
              {/* 右中火舌 */}
              <path
                d="M235,415 Q245,370 238,330 Q228,290 218,250 Q208,210 202,190 Q188,210 195,250 Q212,290 222,330 Q242,370 232,415 Z"
                fill="url(#flameTip)"
                opacity={0.65}
                filter="url(#softBlur)"
              />
              {/* 右侧火舌 */}
              <path
                d="M272,430 Q295,420 302,400 Q308,360 302,320 Q288,280 275,240 Q262,210 255,180 Q238,210 245,240 Q258,280 268,320 Q288,360 282,400 Z"
                fill="url(#flameTip)"
                opacity={0.7}
                filter="url(#softBlur)"
              />
            </g>
          </g>

          {/* 眼睛 */}
          <g>
            <line
              ref={leftEyeRef}
              className="eye-line"
              x1="165" y1="275" x2="165" y2="285"
              stroke={eyeColor} strokeWidth={12} strokeLinecap="round" opacity={0.9}
            />
            <line
              ref={rightEyeRef}
              className="eye-line"
              x1="235" y1="275" x2="235" y2="285"
              stroke={eyeColor} strokeWidth={12} strokeLinecap="round" opacity={0.9}
            />
          </g>
        </g>

        {/* 顶部提手圆环 */}
        <g clipPath="url(#ringClip)">
          <ellipse cx="200" cy="110" rx="75" ry="75" fill="none" stroke={frameColor} strokeWidth={3} />
          <ellipse cx="200" cy="110" rx="58" ry="58" fill="none" stroke={frameColor} strokeWidth={2} />
        </g>

        {/* 顶部连接方块 */}
        <rect x="175" y="140" width="50" height="15" fill="none" stroke={frameColor} strokeWidth={3} />
        <rect x="130" y="155" width="140" height="25" fill="none" stroke={frameColor} strokeWidth={3} />

        {/* 灯体外框 */}
        <path d="M130,180 L70,280 L130,430" fill="none" stroke={frameColor} strokeWidth={3} />
        <path d="M270,180 L330,280 L270,430" fill="none" stroke={frameColor} strokeWidth={3} />
        <path d="M145,180 L90,280 L145,430" fill="none" stroke={frameDim} strokeWidth={2} />
        <path d="M255,180 L310,280 L255,430" fill="none" stroke={frameDim} strokeWidth={2} />

        {/* 玻璃罩边框 */}
        <line x1="130" y1="180" x2="145" y2="180" stroke={frameColor} strokeWidth={3} />
        <line x1="255" y1="180" x2="270" y2="180" stroke={frameColor} strokeWidth={3} />

        {/* 底部横条 */}
        <rect x="120" y="430" width="160" height="18" fill="none" stroke={frameColor} strokeWidth={3} />
        <rect x="100" y="448" width="200" height="22" fill="none" stroke={frameColor} strokeWidth={3} />
      </svg>
    </>
  );
}

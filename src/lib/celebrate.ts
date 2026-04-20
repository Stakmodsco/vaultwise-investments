import confetti from 'canvas-confetti';

export const celebrate = () => {
  // Brand colors: forest, leaf, gold, off-white
  const colors = ['#25671E', '#48A111', '#F2B50B', '#F7F0F0'];
  const end = Date.now() + 1200;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Center burst
  confetti({
    particleCount: 90,
    spread: 90,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1.1,
  });
};

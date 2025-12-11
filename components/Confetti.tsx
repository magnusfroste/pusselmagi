import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

const colors = ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF4500'];

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 2
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm animate-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `fall 3s linear ${p.delay}s infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { top: -10%; transform: rotate(0deg) translateX(0px); }
          100% { top: 110%; transform: rotate(720deg) translateX(${Math.random() * 100 - 50}px); }
        }
      `}</style>
    </div>
  );
};
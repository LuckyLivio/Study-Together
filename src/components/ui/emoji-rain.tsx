'use client';

import { useEffect, useState } from 'react';

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
}

interface EmojiRainProps {
  isActive: boolean;
  surpriseType: string;
  duration?: number;
  onComplete?: () => void;
}

const SURPRISE_EMOJIS = {
  heart_rain: ['💕', '❤️', '💖', '💗', '💝', '💘', '💞', '💓'],
  confetti: ['🎉', '🎊', '✨', '🌟', '⭐', '💫', '🎈', '🎁'],
  fireworks: ['🎆', '🎇', '✨', '💥', '🌟', '⭐', '💫', '🔥'],
  sparkles: ['✨', '⭐', '🌟', '💫', '🔮', '💎', '🌠', '☄️']
};

export default function EmojiRain({ isActive, surpriseType, duration = 3000, onComplete }: EmojiRainProps) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [particleIdCounter, setParticleIdCounter] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
      }
      return;
    }

    // 获取对应惊喜类型的emoji
    const emojis = SURPRISE_EMOJIS[surpriseType as keyof typeof SURPRISE_EMOJIS] || SURPRISE_EMOJIS.sparkles;
    
    // 创建初始粒子
    const initialParticles: EmojiParticle[] = [];
    const particleCount = 50;
    let currentId = 0;
    
    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: currentId++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * window.innerWidth,
        y: -50 - Math.random() * 200, // 从屏幕上方开始
        vx: (Math.random() - 0.5) * 4, // 水平速度
        vy: Math.random() * 3 + 2, // 垂直速度
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        scale: Math.random() * 0.5 + 0.5, // 0.5 到 1.0 的缩放
        opacity: 1
      });
    }
    
    setParticles(initialParticles);
    setParticleIdCounter(currentId);
    
    // 动画循环
    let startTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      if (elapsed >= duration) {
        setParticles([]);
        setAnimationId(null);
        onComplete?.();
        return;
      }
      
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          rotation: particle.rotation + particle.rotationSpeed,
          opacity: Math.max(0, 1 - (elapsed / duration)) // 逐渐淡出
        })).filter(particle => 
          particle.y < window.innerHeight + 100 && particle.opacity > 0.1
        )
      );
      
      // 持续添加新粒子（前2秒）
      if (elapsed < duration * 0.7) {
        setParticles(prevParticles => {
          const newParticles = [];
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              id: Date.now() + i,
              emoji: emojis[Math.floor(Math.random() * emojis.length)],
              x: Math.random() * window.innerWidth,
              y: -50,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * 3 + 2,
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 10,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 1
            });
          }
          return [...prevParticles, ...newParticles];
        });
      }
      
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
    };
    
    const id = requestAnimationFrame(animate);
    setAnimationId(id);
    
    return () => {
      if (id) {
        cancelAnimationFrame(id);
      }
    };
  }, [isActive, surpriseType, duration, onComplete]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute text-2xl select-none"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: particle.opacity,
            fontSize: '2rem',
            lineHeight: 1,
            willChange: 'transform, opacity'
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
}

// 导出一个简化的hook用于触发效果
export function useEmojiRain() {
  const [activeEffect, setActiveEffect] = useState<{ type: string; id: string } | null>(null);
  
  const triggerEffect = (surpriseType: string, messageId?: string) => {
    setActiveEffect({ type: surpriseType, id: messageId || Date.now().toString() });
  };
  
  const stopEffect = () => {
    setActiveEffect(null);
  };
  
  return {
    activeEffect,
    triggerEffect,
    stopEffect
  };
}
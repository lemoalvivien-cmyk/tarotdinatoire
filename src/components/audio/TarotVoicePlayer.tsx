import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PremiumGate } from '@/components/subscription/PremiumGate';

interface TarotVoicePlayerProps {
  text: string;
  context?: 'daily' | 'reading';
  autoPlay?: boolean;
  className?: string;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export function TarotVoicePlayer({
  text,
  context = 'reading',
  autoPlay = false,
  className = '',
}: TarotVoicePlayerProps) {
  const { hasAccess, loading: accessLoading } = useFeatureAccess('audio_readings');
  const [state, setState] = useState<PlayerState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayed = useRef(false);

  const generateAudio = useCallback(async () => {
    if (audioUrl) return audioUrl;

    setState('loading');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text, context }),
        }
      );

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } catch (err) {
      console.error('TTS error:', err);
      setState('error');
      toast.error('Narration indisponible.', { duration: 3000 });
      return null;
    }
  }, [text, context, audioUrl]);

  const play = useCallback(async () => {
    const url = await generateAudio();
    if (!url) return;

    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('timeupdate', () => {
        setProgress(audio.currentTime / audio.duration);
      });
      audio.addEventListener('ended', () => {
        setState('paused');
        setProgress(0);
        audio.currentTime = 0;
      });
      audio.addEventListener('canplay', () => {
        if (state === 'loading') setState('playing');
      });
    } else {
      audioRef.current.src = url;
    }

    audioRef.current.muted = isMuted;
    await audioRef.current.play();
    setState('playing');
  }, [generateAudio, isMuted, state]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState('paused');
  }, []);

  const togglePlay = useCallback(() => {
    if (state === 'playing') {
      pause();
    } else {
      play();
    }
  }, [state, play, pause]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) audioRef.current.muted = !isMuted;
    setIsMuted(prev => !prev);
  }, [isMuted]);

  // Autoplay trigger
  useEffect(() => {
    if (autoPlay && !hasAutoPlayed.current && text) {
      hasAutoPlayed.current = true;
      // Slight delay so the reveal animation plays first
      const timer = setTimeout(() => play(), 1800);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, text, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (state === 'error') return null;

  const isActive = state === 'playing' || state === 'paused';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
      style={{
        background: 'hsl(var(--primary) / 0.08)',
        border: '1px solid hsl(var(--primary) / 0.25)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Icon label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Sparkles
          className="h-3.5 w-3.5"
          style={{ color: 'hsl(var(--primary))' }}
        />
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
          Oracle
        </span>
      </div>

      {/* Waveform visualizer */}
      <div className="flex items-center gap-[3px] h-6 flex-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full w-[2px] shrink-0"
            style={{ background: 'hsl(var(--primary) / 0.6)' }}
            animate={
              state === 'playing'
                ? {
                    height: [
                      `${6 + Math.random() * 14}px`,
                      `${6 + Math.random() * 14}px`,
                      `${6 + Math.random() * 14}px`,
                    ],
                  }
                : { height: '4px' }
            }
            transition={
              state === 'playing'
                ? {
                    duration: 0.4 + (i % 5) * 0.08,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.04,
                  }
                : { duration: 0.3 }
            }
          />
        ))}
      </div>

      {/* Progress bar — only visible when audio loaded */}
      {isActive && duration > 0 && (
        <div className="absolute bottom-0 left-0 h-[2px] rounded-full overflow-hidden w-full">
          <motion.div
            className="h-full"
            style={{
              background: 'hsl(var(--primary))',
              width: `${progress * 100}%`,
            }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className="rounded-lg p-1.5 transition-colors hover:bg-primary/10"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={state === 'loading'}
          className="rounded-xl p-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
          title={state === 'playing' ? 'Pause' : 'Écouter la narration'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === 'loading' ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </motion.div>
            ) : state === 'playing' ? (
              <motion.div key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Pause className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Play className="h-3.5 w-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );

  // Gate the entire player behind the audio_readings feature flag
  return (
    <PremiumGate feature="audio_readings" hasAccess={hasAccess} loading={accessLoading} variant="inline" className={className}>
      {playerUI}
    </PremiumGate>
  );
}

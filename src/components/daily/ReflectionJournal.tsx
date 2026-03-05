import { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { MysticButton } from '@/components/mystic';
import { BookOpen, Loader2 } from 'lucide-react';

const MOODS = [
  { value: 'serein', emoji: '😌', label: 'Serein' },
  { value: 'curieux', emoji: '🤔', label: 'Curieux' },
  { value: 'energise', emoji: '⚡', label: 'Énergisé' },
  { value: 'melancolique', emoji: '🌧️', label: 'Mélancolique' },
  { value: 'inspire', emoji: '✨', label: 'Inspiré' },
  { value: 'incertain', emoji: '🌫️', label: 'Incertain' },
];

interface ReflectionJournalProps {
  drawId: string;
  reflectionQuestion: string;
  existingEntry?: string | null;
  existingMood?: string | null;
  existingEnergyScore?: number;
  onSave: (data: { drawId: string; journal_entry: string; mood: string; energy_score: number }) => void;
  isSaving?: boolean;
}

export function ReflectionJournal({
  drawId,
  reflectionQuestion,
  existingEntry,
  existingMood,
  existingEnergyScore = 5,
  onSave,
  isSaving = false,
}: ReflectionJournalProps) {
  const [entry, setEntry] = useState(existingEntry ?? '');
  const [mood, setMood] = useState(existingMood ?? '');
  const [energyScore, setEnergyScore] = useState(existingEnergyScore);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    if (!entry.trim() && !mood) return;
    onSave({ drawId, journal_entry: entry.trim(), mood, energy_score: energyScore });
    setIsDirty(false);
  };

  return (
    <div className="space-y-5">
      {/* Reflection question */}
      <div
        className="px-4 py-3 rounded-xl italic text-sm text-center"
        style={{
          background: 'hsl(var(--primary) / 0.08)',
          borderLeft: '3px solid hsl(var(--primary) / 0.6)',
          color: 'hsl(var(--foreground) / 0.85)',
        }}
      >
        {reflectionQuestion}
      </div>

      {/* Mood picker */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Comment vous sentez-vous ?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => { setMood(m.value); setIsDirty(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200"
              style={{
                background: mood === m.value
                  ? 'hsl(var(--primary) / 0.2)'
                  : 'hsl(var(--muted) / 0.6)',
                border: `1px solid ${mood === m.value ? 'hsl(var(--primary))' : 'transparent'}`,
                color: mood === m.value ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.7)',
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Niveau d'énergie</p>
          <span className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
            {energyScore}/10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={energyScore}
          onChange={e => { setEnergyScore(Number(e.target.value)); setIsDirty(true); }}
          className="w-full accent-primary h-1.5 rounded-full bg-muted cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Épuisé</span>
          <span>Extatique</span>
        </div>
      </div>

      {/* Journal textarea */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Votre réflexion du jour
        </p>
        <Textarea
          placeholder="Laissez vos pensées s'écouler librement… Ce journal n'appartient qu'à vous."
          value={entry}
          onChange={e => { setEntry(e.target.value); setIsDirty(true); }}
          rows={4}
          maxLength={1000}
          className="resize-none text-sm"
          style={{
            background: 'hsl(var(--card) / 0.5)',
            borderColor: 'hsl(var(--border))',
          }}
        />
        <p className="text-[10px] text-muted-foreground text-right mt-1">
          {entry.length}/1000
        </p>
      </div>

      {/* Save button */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MysticButton
            onClick={handleSave}
            disabled={isSaving || (!entry.trim() && !mood)}
            className="w-full"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</>
            ) : (
              <><BookOpen className="h-4 w-4 mr-2" />Enregistrer ma réflexion</>
            )}
          </MysticButton>
        </motion.div>
      )}
    </div>
  );
}

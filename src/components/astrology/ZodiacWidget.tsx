import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAstrology } from '@/hooks/useAstrology';
import { getZodiacSignFromDate, ELEMENT_COLORS, ELEMENT_EMOJI, type ZodiacSign } from '@/utils/astrologyData';
import { cn } from '@/lib/utils';

interface ZodiacWidgetProps {
  compact?: boolean;
  className?: string;
}

export function ZodiacWidget({ compact = false, className }: ZodiacWidgetProps) {
  const { zodiacSign, allSigns, profile, updateAstrology, isSaving, isLoading } = useAstrology();
  const [editing, setEditing] = useState(false);
  const [selectedSign, setSelectedSign] = useState<string>('');
  const [birthDateInput, setBirthDateInput] = useState('');

  const handleSave = () => {
    const finalSign = selectedSign || undefined;
    const birthDate = birthDateInput || undefined;

    // If birth date given, auto-compute sign
    let resolvedSign = finalSign;
    if (birthDate && !finalSign) {
      const computed = getZodiacSignFromDate(new Date(birthDate));
      resolvedSign = computed?.id;
    }

    updateAstrology({
      birth_date: birthDate ?? null,
      zodiac_sign: resolvedSign ?? null,
    });
    setEditing(false);
    setSelectedSign('');
    setBirthDateInput('');
  };

  if (isLoading) {
    return (
      <div className={cn('h-20 rounded-2xl bg-muted/30 animate-pulse', className)} />
    );
  }

  // Compact pill mode (for header/nav)
  if (compact && zodiacSign) {
    const colors = ELEMENT_COLORS[zodiacSign.element];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
          `bg-gradient-to-r ${colors.from} ${colors.to}`,
          'border border-white/10 backdrop-blur-sm',
          colors.text,
          className
        )}
      >
        <span className="text-base">{zodiacSign.emoji}</span>
        <span>{zodiacSign.name_fr}</span>
        <span>{zodiacSign.symbol}</span>
      </motion.div>
    );
  }

  // Full card mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-border/50 overflow-hidden',
        'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
        className
      )}
    >
      {zodiacSign ? (
        <ZodiacSignCard
          sign={zodiacSign}
          birthDate={profile?.birth_date}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <ZodiacEmpty onEdit={() => setEditing(true)} />
      )}

      {/* Edit panel */}
      {editing && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-5 border-t border-border/50 space-y-4 bg-muted/20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date de naissance</Label>
              <input
                type="date"
                value={birthDateInput}
                onChange={e => {
                  setBirthDateInput(e.target.value);
                  // Auto-set sign from date
                  if (e.target.value) {
                    const computed = getZodiacSignFromDate(new Date(e.target.value));
                    if (computed) setSelectedSign(computed.id);
                  }
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ou choisir votre signe</Label>
              <Select value={selectedSign} onValueChange={setSelectedSign}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Signe astrologique..." />
                </SelectTrigger>
                <SelectContent>
                  {allSigns.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.emoji} {s.name_fr} {s.symbol} — {s.date_range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || (!selectedSign && !birthDateInput)}
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ZodiacSignCard({
  sign,
  birthDate,
  onEdit,
}: {
  sign: ZodiacSign;
  birthDate?: string | null;
  onEdit: () => void;
}) {
  const colors = ELEMENT_COLORS[sign.element];

  return (
    <div className={cn('p-5 bg-gradient-to-br', colors.from, colors.to)}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{sign.emoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn('font-serif text-xl font-semibold', colors.text)}>
                {sign.name_fr}
              </h3>
              <span className={cn('text-xl', colors.text)}>{sign.symbol}</span>
            </div>
            <p className="text-xs text-muted-foreground">{sign.date_range}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronDown className="h-3 w-3" />
          Modifier
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-background/20 p-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Élément</p>
          <p className="text-sm font-medium">
            {ELEMENT_EMOJI[sign.element]} {sign.element}
          </p>
        </div>
        <div className="rounded-lg bg-background/20 p-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Planète</p>
          <p className="text-sm font-medium">✦ {sign.ruling_planet_fr}</p>
        </div>
        <div className="rounded-lg bg-background/20 p-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Tarot</p>
          <p className="text-xs font-medium leading-tight">{sign.tarot_card_fr}</p>
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {sign.keywords_fr.map(k => (
          <span
            key={k}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border border-current/20',
              'bg-background/20',
              colors.text
            )}
          >
            {k}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {sign.description_fr}
      </p>

      {/* Birth date display */}
      {birthDate && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Né(e) le {new Date(birthDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      )}
    </div>
  );
}

function ZodiacEmpty({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center text-center gap-4">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Star className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold mb-1">Profil Astral</h3>
        <p className="text-sm text-muted-foreground">
          Entrez votre date de naissance pour que vos tirages soient enrichis de votre énergie zodiacale.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
        <Sparkles className="h-3.5 w-3.5" />
        Configurer mon profil astral
      </Button>
    </div>
  );
}

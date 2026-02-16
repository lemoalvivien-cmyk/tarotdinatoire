import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/hooks/useSubscription';
import { Ticket, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { z } from 'zod';

// Strict alphanumeric + hyphens only, 3-30 chars
const promoCodeSchema = z.string()
  .min(3, 'Code trop court')
  .max(30, 'Code trop long')
  .regex(/^[A-Z0-9\-]+$/, 'Code invalide (lettres, chiffres et tirets uniquement)');

interface PromoCodeInputProps {
  className?: string;
}

export function PromoCodeInput({ className }: PromoCodeInputProps) {
  const { redeemPromo } = useSubscription();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    
    // Validate input strictly before sending to backend
    const validation = promoCodeSchema.safeParse(trimmed);
    if (!validation.success) {
      setResult({ success: false, error: validation.error.errors[0].message });
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const res = await redeemPromo(trimmed);
      setResult(res);
      if (res.success) {
        setCode('');
        setTimeout(() => navigate('/app', { replace: true }), 1500);
      }
    } catch {
      setResult({ success: false, error: 'Les énergies sont troubles, réessayez...' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Ticket className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Code Invitation</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
          placeholder="Ex: VIP-TAROT-2025"
          className="font-mono text-sm uppercase"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
        />
        <Button onClick={handleRedeem} disabled={loading || !code.trim()} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activer'}
        </Button>
      </div>
      {result && (
        <div className={`flex items-center gap-2 mt-2 text-sm ${result.success ? 'text-green-500' : 'text-destructive'}`}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{result.success ? 'Accès VIP activé ! Redirection...' : result.error}</span>
        </div>
      )}
    </div>
  );
}

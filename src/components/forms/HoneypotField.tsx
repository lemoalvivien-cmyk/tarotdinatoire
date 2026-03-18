import React from 'react';

interface HoneypotFieldProps {
  /** Field name - should look legitimate to bots */
  name?: string;
  /** Callback when honeypot is triggered (bot detected) */
  onBotDetected?: () => void;
}

/**
 * Invisible honeypot field to catch spam bots.
 * Bots typically fill all form fields, including hidden ones.
 * Real users won't see or fill this field.
 */
export function HoneypotField({ name = 'website_url', onBotDetected }: HoneypotFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      console.warn('[Honeypot] Bot detected - field was filled');
      onBotDetected?.();
    }
  };

  return (
    <div 
      aria-hidden="true" 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Use attractive field names for bots */}
      <label htmlFor={name}>
        Leave this field empty
      </label>
      <input
        type="text"
        id={name}
        name={name}
        autoComplete="off"
        tabIndex={-1}
        onChange={handleChange}
      />
    </div>
  );
}

/**
 * Hook to manage honeypot state in forms
 */
export function useHoneypot() {
  const [isBotDetected, setIsBotDetected] = React.useState(false);
  const honeypotRef = React.useRef<string>('');

  const checkHoneypot = (formData: FormData | Record<string, string | File | null>): boolean => {
    const honeypotFields = ['website_url', 'url', 'website', 'homepage'];
    
    for (const field of honeypotFields) {
      const value = formData instanceof FormData 
        ? formData.get(field) 
        : formData[field];
      
      if (value && String(value).trim()) {
        console.warn('[Honeypot] Bot detected via form check');
        setIsBotDetected(true);
        return true;
      }
    }
    
    return false;
  };

  const onBotDetected = () => {
    setIsBotDetected(true);
  };

  return {
    isBotDetected,
    checkHoneypot,
    onBotDetected,
    HoneypotField: () => <HoneypotField onBotDetected={onBotDetected} />,
  };
}

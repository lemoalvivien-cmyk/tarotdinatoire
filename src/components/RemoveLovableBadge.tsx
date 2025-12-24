import { useEffect } from "react";

/**
 * Composant qui supprime le badge "Edit with Lovable" en production.
 * Le badge est injecté par l'environnement Lovable et n'existe pas dans le code source.
 */
export default function RemoveLovableBadge() {
  useEffect(() => {
    // Ne s'exécute qu'en production
    if (!import.meta.env.PROD) return;

    const remove = () => {
      // 1. Suppression par ID direct
      const badge = document.getElementById("lovable-badge");
      if (badge) badge.remove();

      // 2. Suppression par ID partiel
      document.querySelectorAll('[id*="lovable"]').forEach((el) => {
        const style = window.getComputedStyle(el as HTMLElement);
        if (style.position === "fixed") {
          el.remove();
        }
      });

      // 3. Suppression par texte
      const all = Array.from(document.querySelectorAll("a,button,div,span"));
      for (const el of all) {
        const text = (el.textContent || "").toLowerCase();
        if (!text.includes("edit with lovable") && !text.includes("edit in lovable")) continue;
        
        const node = el instanceof HTMLElement ? el : null;
        if (!node) continue;

        const style = window.getComputedStyle(node);
        const parent = node.parentElement ? window.getComputedStyle(node.parentElement) : null;
        const isFixed =
          style.position === "fixed" ||
          (parent && parent.position === "fixed");
        const rect = node.getBoundingClientRect();
        const looksLikeBadge = rect.width < 260 && rect.height < 120;

        if (isFixed && looksLikeBadge) {
          const container = node.closest("div") || node;
          container.remove();
        }
      }

      // 4. Suppression par lien lovable.dev en position fixe
      document.querySelectorAll('a[href*="lovable.dev"]').forEach((el) => {
        const parent = el.closest('div[style*="fixed"]') || el.closest('[style*="position: fixed"]');
        if (parent) parent.remove();
      });
    };

    // Exécution initiale
    remove();

    // Filet de sécurité : exécution toutes les 500ms pendant 5 secondes
    let count = 0;
    const interval = setInterval(() => {
      remove();
      count++;
      if (count >= 10) clearInterval(interval);
    }, 500);

    // Observer pour les injections lazy
    const obs = new MutationObserver(() => remove());
    obs.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      obs.disconnect();
    };
  }, []);

  return null;
}

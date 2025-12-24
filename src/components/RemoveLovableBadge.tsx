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
      const all = Array.from(document.querySelectorAll("a,button,div,span"));
      for (const el of all) {
        const text = (el.textContent || "").toLowerCase();
        if (!text.includes("edit with lovable") && !text.includes("edit in lovable")) continue;
        
        const node = el instanceof HTMLElement ? el : null;
        if (!node) continue;

        // On cible un petit élément flottant (badge)
        const style = window.getComputedStyle(node);
        const parent = node.parentElement ? window.getComputedStyle(node.parentElement) : null;
        const isFixed =
          style.position === "fixed" ||
          (parent && parent.position === "fixed");
        const rect = node.getBoundingClientRect();
        const looksLikeBadge = rect.width < 260 && rect.height < 120;

        if (isFixed && looksLikeBadge) {
          // Supprime le conteneur si possible
          const container = node.closest("div") || node;
          container.remove();
        }
      }
    };

    // Exécution initiale
    remove();

    // Observer pour les injections lazy
    const obs = new MutationObserver(() => remove());
    obs.observe(document.documentElement, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);

  return null;
}

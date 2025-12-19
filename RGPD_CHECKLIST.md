# Checklist RGPD - Tarot Divinatoire

## ✅ Pages légales

| Élément | Statut | Route |
|---------|--------|-------|
| Mentions légales | ✅ OK | `/legal/imprint` |
| Politique de confidentialité | ✅ OK | `/legal/privacy` |
| Politique cookies | ✅ OK | `/legal/cookies` |
| CGU | ✅ OK | `/legal/terms` |
| Exercer mes droits | ✅ OK | `/legal/rights` |

## ✅ CMP Cookies

| Élément | Statut |
|---------|--------|
| Bannière cookies affichée | ✅ OK |
| Catégories (essentiel, analytics, marketing) | ✅ OK |
| Opt-in requis pour analytics/marketing | ✅ OK |
| Bouton "Modifier préférences" | ✅ OK |
| Table `consent_logs` | ✅ OK |
| Logging des consentements | ✅ OK |

## ✅ Droits utilisateurs

| Droit | Implémentation | Statut |
|-------|----------------|--------|
| Accès | Export JSON dans profil | ✅ OK |
| Rectification | Modification profil | ✅ OK |
| Effacement | Suppression compte | ✅ OK |
| Portabilité | Export JSON | ✅ OK |
| Opposition | Désabonnement email | ✅ OK |
| Retrait consentement | Bouton cookies | ✅ OK |

## ✅ Sécurité RLS

| Table | RLS | Politique |
|-------|-----|-----------|
| `profiles` | ✅ | `auth.uid() = id` |
| `tarot_readings` | ✅ | `auth.uid() = user_id` |
| `reading_sessions` | ✅ | `auth.uid() = user_id` |
| `consent_logs` | ✅ | Insert public, select own |
| `feature_flags` | ✅ | Admin only |

## ⚠️ À compléter

| Élément | Action requise |
|---------|----------------|
| Email contact RGPD | Remplacer `contact@ton-domaine.fr` |
| Hébergeur | Compléter nom + adresse |
| Fournisseur email | Documenter si utilisé |
| Leaked Password Protection | Activer dans paramètres Auth |

## 📋 Durées de conservation

- Compte : Actif → suppression sur demande
- Historique tirages : 12 mois
- Consent logs : 13 mois
- Logs techniques : 12 mois
- Marketing : 3 ans après dernier contact

## 🔒 Mesures techniques

- [x] HTTPS/TLS en transit
- [x] Chiffrement au repos
- [x] Hash mots de passe (Supabase Auth)
- [x] Row Level Security
- [x] Pas de secrets côté frontend
- [ ] Leaked Password Protection (à activer)

---
*Généré le : 2024*

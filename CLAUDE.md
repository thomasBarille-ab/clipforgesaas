# CreaClip - Claude Code Rules

## 🎯 Contexte Projet
- Nom : CreaClip
- Type : SaaS B2C de création de clips vidéo
- Stack : Next.js 14 App Router + TypeScript + Supabase
- Phase : MVP (6 semaines)

## 🛠️ Stack Technique

### Frontend
- Next.js 14 (App Router UNIQUEMENT, pas Pages Router)
- TypeScript strict mode
- Tailwind CSS (pas de CSS modules ni styled-components)
- React Server Components par défaut
- "use client" explicite si hooks/interactivité nécessaires

### Backend & Database
- Supabase (Auth + PostgreSQL + Storage)
- Row Level Security (RLS) activé sur toutes les tables
- API Routes Next.js (/app/api/)

### External APIs
- Replicate (Whisper transcription + FFmpeg)
- Anthropic Claude (suggestions clips)
- Stripe (paiements)

## 📋 Conventions de Code

### Naming Conventions

**Composants React :**
- PascalCase : `VideoUploader.tsx`, `ClipCard.tsx`
- Client components : préfixer "use client" en haut
- Props avec interfaces TypeScript

**Fichiers utilitaires :**
- camelCase : `formatDate.ts`, `validateVideo.ts`

**Constantes :**
- UPPER_SNAKE_CASE : `MAX_FILE_SIZE`, `ALLOWED_FORMATS`

**API Routes :**
- kebab-case : `/api/process-video/route.ts`
- Toujours `route.ts` (pas `index.ts`)

### Structure Composants React

**Functional Components uniquement :**
```typescript
'use client' // si nécessaire

import { useState } from 'react'

interface Props {
  userId: string
  onSuccess?: () => void
}

export function ComponentName({ userId, onSuccess }: Props) {
  const [state, setState] = useState(false)

  // Logique...

  return (
    <div>...</div>
  )
}
```

**Pas de default exports pour composants réutilisables** (sauf pages)

### TypeScript Rules

- ✅ **Strict mode activé**
- ❌ **Jamais `any`** (utiliser `unknown` si vraiment nécessaire)
- ✅ **Interfaces pour Props**, types pour unions/intersections
- ✅ **Générer types depuis Supabase** avec CLI
- ✅ **Typer toutes les fonctions** (params + return)

### Tailwind Best Practices

**Mobile-first :**
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* Base → sm → md → lg → xl */}
</div>
```

**Éviter @apply sauf répétition >5 fois**

**Variables CSS pour couleurs custom :**
```css
/* globals.css */
:root {
  --primary: #6D28D9;
  --secondary: #EC4899;
}
```

**Créer composants pour classes répétées >5 fois**

### Supabase Patterns

**Client vs Server :**
```typescript
// Client Component
'use client'
import { createClient } from '@/lib/supabase/client'

// Server Component
import { createClient } from '@/lib/supabase/server'
```

**Toujours gérer les erreurs :**
```typescript
const { data, error } = await supabase
  .from('videos')
  .select('*')

if (error) {
  console.error('Supabase error:', error)
  return { error: 'Message user-friendly en français' }
}
```

**RLS policies strictes :**
- User ne voit que ses données
- Vérifier auth.uid() dans toutes les policies

### Error Handling

**API Routes :**
```typescript
export async function POST(request: Request) {
  try {
    // Logique...
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Message en français pour l\'utilisateur' },
      { status: 500 }
    )
  }
}
```

**Client Components :**
```typescript
const [error, setError] = useState<string | null>(null)

try {
  // Action...
} catch (err: any) {
  setError(err.message || 'Une erreur est survenue')
}
```

**Messages d'erreur toujours en français et user-friendly**

### Performance

- ✅ Server Components par défaut
- ✅ "use client" uniquement si nécessaire
- ✅ Lazy load composants lourds : `next/dynamic`
- ✅ Images avec `next/image`
- ✅ Suspense boundaries pour loading states

## 🎨 Design System

### Couleurs

| Token       | Valeur                          | Usage                    |
|-------------|---------------------------------|--------------------------|
| primary     | `#6D28D9` (violet)              | CTA, liens, accents      |
| secondary   | `#EC4899` (rose)                | Highlights, badges        |
| accent      | `#10B981` (emerald)             | Succès, validations       |
| dark        | `#0F172A` (slate très foncé)    | Textes, surfaces sombres  |
| background  | gradient `slate-950 → purple-950` | Fond principal de l'app |

### Composants Standards

**Cards :**
```tsx
<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
```

**Buttons :**
```tsx
<button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform">
```

**Inputs :**
```tsx
<input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors" />
```

### Spacing Cohérent
- Padding containers : `p-6 md:p-8`
- Gap grids : `gap-4 md:gap-6`
- Margin sections : `mb-8 md:mb-12`

## ❌ À Éviter Absolument

- ❌ CSS modules ou styled-components
- ❌ Class components React
- ❌ Mutations directes de state
- ❌ `useEffect` sans cleanup pour appels API
- ❌ Secrets/tokens dans code client
- ❌ SQL direct (toujours passer par Supabase client)
- ❌ `fetch` natif (utiliser Supabase client ou abstractions)
- ❌ Console.log en production (utiliser console.error pour logs serveur)

## ✅ Priorités

1. **Fonctionnalité > Perfection**
   - MVP qui marche > code parfait

2. **UX fluide > Features nombreuses**
   - Loading states partout
   - Messages d'erreur clairs
   - Feedback immédiat

3. **Code lisible > Code clever**
   - Noms explicites
   - Commentaires uniquement pour logique complexe

4. **Mobile-first > Desktop**
   - Responsive par défaut

5. **Type-safety > Rapidité**
   - Prendre le temps de typer correctement

## 📦 File Structure Standard

```
app/
├── (auth)/          # Layout auth
│   ├── login/
│   └── signup/
├── (dashboard)/     # Layout dashboard
│   ├── upload/
│   ├── videos/
│   └── clips/
└── api/             # API routes
    ├── transcribe/
    └── clips/
```

## 🧪 Testing (si temps)

- Tests unitaires : Vitest
- Tests E2E : Playwright
- MVP = Validation manuelle OK pour l'instant

## 🔄 Git Workflow

**Commits atomiques :**
- `feat: Add video upload`
- `fix: Supabase auth redirect`
- `refactor: Extract upload logic`
- `docs: Update README`

**Branches :**
- `main` : production
- `feature/nom-feature` : développement
- Squash avant merge

## 🚀 Performance Targets

- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size < 200KB initial

## 📱 Responsive Breakpoints

- `sm` : 640px (mobile landscape)
- `md` : 768px (tablet)
- `lg` : 1024px (desktop)
- `xl` : 1280px (large desktop)

## 🎯 When in Doubt

1. **Chercher dans la doc officielle** (Next.js, Supabase)
2. **Suivre les patterns existants** dans le code
3. **Demander à Claude** avec contexte complet
4. **Tester immédiatement** (`npm run dev`)

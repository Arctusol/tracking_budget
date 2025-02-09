# Stories

Ce dossier contient les stories Storybook pour les composants de l'application.

## Objectif

Les stories permettent de :
- Documenter les composants
- Tester les composants de manière isolée
- Visualiser les différents états des composants
- Faciliter le développement et le design

## Structure

- Un fichier story par composant
- Organisation miroir du dossier `components`
- Documentation des props et des cas d'utilisation

## Convention de Nommage

```typescript
// ComponentName.stories.tsx
export default {
  title: 'Category/ComponentName',
  component: ComponentName,
} as Meta;
```

## Bonnes Pratiques

1. Créer des stories pour tous les états possibles du composant
2. Documenter les props avec des descriptions claires
3. Utiliser des contrôles pour les props dynamiques
4. Inclure des exemples d'utilisation
5. Ajouter des tests d'accessibilité

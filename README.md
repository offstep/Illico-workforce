# ILLICO Bot

Bot Discord de gestion de workers : onboarding, formation, quiz, mission d'essai,
livraison par ticket privé, contrôle qualité et validation.

## Prérequis
- Node.js 20+
- PostgreSQL
- Une application Discord avec un bot (aucun intent privilégié requis)
- Invitation du bot avec les scopes `bot` et `applications.commands`,
  permission Administrateur recommandée

## Installation
```bash
cp .env.example .env      # puis remplir DISCORD_TOKEN, GUILD_ID, DATABASE_URL
npm install               # génère aussi le client Prisma
npx prisma migrate dev    # crée les tables
npm run dev               # lance le bot
```

## Mise en place du serveur Discord
1. `/setup-illico` : crée salons, rôles et permissions (relançable)
2. `/publier-panneaux` : publie les panneaux interactifs
3. Se donner le rôle 🔎 QA pour tester l'évaluation des livraisons

Le rôle du bot doit être placé **au-dessus** des rôles ILLICO.

## Structure
```
prisma/schema.prisma     modèle de données
src/config/structure.ts  salons, rôles et accès du serveur
src/content/             formation, quiz, mission d'essai (textes à adapter)
src/services/            logique métier
src/interactions/        boutons, menus, formulaires (routeur par customId)
src/ui/                  embeds et composants
src/setup/               /setup-illico et /publier-panneaux
```

## Réglages utiles
- Note minimale du quiz : `PASS_PERCENT` dans `src/content/quiz.ts`
- Note minimale d'une livraison : `PASS_SCORE` dans `src/services/delivery.service.ts`
- Textes de formation : `src/content/training.ts`

## Production
```bash
npm run build && npm start
```
Utiliser un hébergeur ou un gestionnaire de process (Railway, VPS + pm2…) pour garder le bot allumé.

## Pas encore développé
Missions réelles, paiements, tableau de bord worker, panneau Direction,
tickets d'assistance, envoi de fichiers dans les livraisons.

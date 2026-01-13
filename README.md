## Lane Kitchen (Expo / React Native)

Three-lane lane-switching runner where **recipes are power-ups** (via TheMealDB).

### Run locally

```bash
npm install
npm run start
```

- **Web**: `npm run web`
- **Android/iOS**: use the Expo Go app or a simulator

### Deploy to Vercel (Expo Web)

This project is configured for static web export.

```bash
npm run build:web
```

Vercel settings:

- **Build Command**: `npm run build:web`
- **Output Directory**: `dist`

### Game controls

- **Swipe** left/right on the road to change lanes
- Or use the **◀ / ▶** buttons

### Recipe power-ups

Recipes are fetched from TheMealDB (`https://www.themealdb.com/api/json/v1/1`) and spawn as collectibles.
Collecting one applies an effect (shield/boost/slow/x2) and lets you open a recipe detail modal.


# GAR-008: integrating GarageScene into /garage

> **Status (review, 2026-10-24):** integrated. GarageSelector.tsx renders `<GarageScene>` (returning/onEnter/TileMeta as in the snippet below), CarSwitcher.tsx names the current thumbnail with `carTransitionName`, and the three preview files are deleted. Verified in GAR-008.

The scene was built and previewable on its own before integration.

## Files
- `src/blog/GarageScene.tsx`: the component (one bay per car, any number of cars, 2 per row, one per row at ≤600 px)
- `src/blog/garageScene.css`: its styles (imported by the component)
- `src/blog/garageSceneTransition.ts`: `carTransitionName`, `returningCar`, `rememberEnteredCar`, `clearReturningCar`
- Dev-only preview: `scene-preview.html` + `src/scenePreview.tsx` + `src/blog/GarageScenePreview.tsx`. Open `/scene-preview.html` under `npx vite`; `?n=3` adds copies of the cars to check wrapping. These files are not a build input (vite.config uses index.html only; `dist/` has no trace of them). Delete all three once it's integrated.

## Props
| Prop | Type | Notes |
|---|---|---|
| `cars` | `Car[]` | from `cars.ts` |
| `onEnter?` | `(carId) => void \| Promise<unknown>` | Runs after the roll-out (~820 ms), inside `document.startViewTransition` when supported. The transition waits for the returned promise and then for the scene to unmount (max 1 s), so a lazy route is fine. Without it, the page does `location.assign(href)`. |
| `hrefFor?` | `(car) => string` | Default `carPath(car.id)`. Each bay is a real `<a href>`; ctrl/cmd/middle-click open a new tab without the animation. |
| `returning?` | `string \| null` | Car id that reverses into its bay on mount (≈850 ms), then its door rolls down. |
| `onReturned?` | `() => void` | Fires when it has parked. The scene clears the stored id itself. |
| `renderMeta?` | `(car) => ReactNode` | Extra lines under a bay's description (status chips, post count, "Latest:" link). |
| `className?` | `string` | |

## Snippet (GarageSelector.tsx)
```tsx
import { GarageScene } from './GarageScene';
import { returningCar } from './garageSceneTransition';
const navigate = useNavigate();
const [back] = useState(returningCar); // id of the car that last drove out in this tab
<GarageScene cars={cars} returning={back} onEnter={(id) => navigate(carPath(id))} renderMeta={(car) => <TileMeta car={car} />} />
```
(`TileMeta` = the status chips / stats / latest-post lines from the current `CarTile`, if you want to keep them.)

## Morph into the sidebar thumbnail
- The departing car gets `view-transition-name: garage-car-<id>`, i.e. `carTransitionName(car.id)` (non-alphanumerics become `-`).
- Give the **current car's** sidebar thumbnail (CarThumb / car switcher in GarageBlog) the same name, only for the car being viewed (names must be unique on the page): `style={{ viewTransitionName: carTransitionName(car.id) }}`. Also add `view-transition-class: garage-car` to it if you want the scene's 0.5 s morph easing (`::view-transition-group(*.garage-car)` in garageScene.css) instead of the default 0.25 s.
- Without a named thumbnail the car just cross-fades out with the page; nothing breaks.
- Reverse morph (thumbnail → car) is optional: the returning car carries the same name while it parks, so wrapping the "← Garage" navigation in `document.startViewTransition` (or `<Link viewTransition>` won't work with BrowserRouter, so use startViewTransition by hand) gives the morph. The browser Back button just plays the reverse-in animation.

## Other notes
- The scene draws its own "THE GARAGE" neon sign, so the `<h1 class="garage-title">` can become visually hidden (keep it for screen readers / page title).
- Arrow keys / Home / End move between bays, like the old tile grid.
- Touch (`hover: none`): the bay in view (≥60 %) opens, like the old tiles' `is-inview`.
- Headlight positions live in `RIGS` at the top of GarageScene.tsx (fractions of the art box, plus `drive: 1|-1` for which way the car faces). A new car without an entry gets a centred default; add an entry when its art lands (GAR-007 redraws the AZ-1, so re-check its lamps then).
- Reduced motion: no flicker, roll or drive; states fade in 0.2 s, click goes straight to `onEnter` (plain page cross-fade).
- Overrides of `.background-layer` / `.foreground-layer` (App.css forces the coloured layer at ≤991 px) are neutralised inside `.gs-art` only; the scene doesn't use `.garage-art`, so garage.css rules don't interfere.

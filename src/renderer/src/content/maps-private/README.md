# Private maps (test only)

Same folder layout as `../maps/` (`<realm>/<map>/<layout>.png`), but for images you may NOT ship yet,
for example layouts you are still waiting for permission to use.

- They show up in the Map detection page like any other map, so you can test how they look.
- This folder is ignored by git.
- `npm run build` (and every build:* script) stops with an error while images are in here, so they can
  never end up in an installer by accident.
- When you have permission: move the image into `../maps/`, add the credit in `../credits.ts`.

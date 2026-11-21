# Map layouts

Put map images here. GKC finds them automatically, no code or list to edit.

```
maps/
  <realm>/
    <map>/
      <layout>.png
```

Example:

```
maps/macmillan-estate/coal-tower/layout-1.png
maps/macmillan-estate/coal-tower/layout-2.png
maps/the-game/the-game/layout-1.png
```

- Folder and file names become the display names (`coal-tower` becomes "Coal Tower").
- Use lowercase names with dashes. Supported formats: png, jpg, jpeg, webp.
- A map with one image shows one layout, a map with several images lets you pick between them.
- Use square or near-square images. A transparent background looks best on the overlay.
- Only add images you made or have the right to use. Game art belongs to Behaviour Interactive.

Images you are still waiting for permission to use go into `../maps-private/` instead. They show up
in the app for testing, but the build refuses to run while they are there.

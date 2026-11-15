# sprite-kit

> Billboard sprite materials and the atlas texture they sample, for any scene that draws pixel-art sprites.

## 1. Identity

- Role: render-kit

## 2. Boundaries

| Concern                              | Owner                                           |
| ------------------------------------ | ----------------------------------------------- |
| Which frame a sprite shows when      | arcade-domain                                   |
| Shadow maps and other renderer state | arcade-engine                                   |
| Loading the atlas image              | `@scope/arcade:arcade-engine#SpriteAtlasAssets` |

## 3. Owned Resources

| Resource                                     | Owner                                      | Disposer                                   | Notes                                                              |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| One sprite material per atlas and blend mode | `@scope/arcade:sprite-kit#SpriteMaterials` | `@scope/arcade:sprite-kit#SpriteMaterials` | Keyed by atlas and blend mode; entries live as long as the engine. |

## 4. Decisions

| ID  | Decision                                                | Checked by | Why                                          |
| --- | ------------------------------------------------------- | ---------- | -------------------------------------------- |
| D1  | Sprite materials take the atlas texture as an argument. | review     | One atlas serves every sprite of one engine. |

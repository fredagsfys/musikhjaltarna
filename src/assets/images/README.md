# Images

Components pick each file up by name (any of .png, .jpg, .webp, .avif) and fall back to a placeholder until it
exists. Astro generates AVIF/WebP and responsive sizes at build time. To change an image, replace the file and keep
the name. Prefer transparent PNG for characters.

The current files come from the client's asset folder ("Landing page", November 2026).

| File name            | Content now                                              | Source file                                  | Used in                     |
| -------------------- | -------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| `emblem`             | MH logo on white, square                                 | `Logga MH teal.png`                          | Header (round emblem)       |
| `hero-photo`         | Child practising at the piano with the app (4:3)         | `Produkt i miljö/Produkt 3.png`              | Hero, inside the arch       |
| `app-example-avatar` | Gilbert G-klav, head and shoulders (square)              | Cropped from `Mock-up2.png`                  | Practice example card       |
| `family-mascot`      | Gilbert G-klav, full figure, transparent background      | Cut out of `Mock-up.png` (app screen)        | "För hela familjen" section |
| `pedagogue-photo`    | Suzana Spasevska Hermansen (3:4)                         | `Suzana + elev/Suzana Pianotopia profil.PNG` | Pedagogue section           |
| `pedagogue-mascot`   | Gilbert G-klav, same cut-out                             | Cut out of `Mock-up.png` (app screen)        | Pedagogue, beside the photo |
| `pricing-avatar`     | Klara Klang, upper body, transparent background (square) | `Team MH/Klara Klang.png`                    | Subscription card           |

The folder has no separate file of Gilbert G-klav (the frog), so he is cut out of the app screen in `Mock-up.png`
(291 × 483 px, enough for the sizes used). A higher-resolution cut-out, or the thumbs-up pose and the photo of
Suzana with Gilbert from the mock-ups, can replace `family-mascot` and `pedagogue-mascot` by name. With a combined
photo of Suzana and Gilbert, put it in `pedagogue-photo` and remove `pedagogue-mascot` from `Pedagogue.astro`.

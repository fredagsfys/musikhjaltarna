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
| `family-mascot`      | Maja, sticker with transparent background                | `Klistermärke Maja.png`                      | "För hela familjen" section |
| `pedagogue-photo`    | Suzana Spasevska Hermansen (3:4)                         | `Suzana + elev/Suzana Pianotopia profil.PNG` | Pedagogue section           |
| `pricing-avatar`     | Klara Klang, upper body, transparent background (square) | `Team MH/Klara Klang.png`                    | Subscription card           |

Missing from the asset folder, and worth asking for: Gilbert G-klav (the frog) as a cut-out with transparent
background. The client's mock-ups show him giving a thumbs up in the family section and next to Suzana in the
pedagogue photo; with that file, `family-mascot` and `pedagogue-photo` can be swapped by name.

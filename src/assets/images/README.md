# Images

Components pick each file up by name (any of .png, .jpg, .webp, .avif) and fall back to a placeholder until it
exists. Astro generates AVIF/WebP and responsive sizes at build time. To change an image, replace the file and keep
the name. Prefer transparent PNG for characters.

The current files come from the client's asset folder ("Landing page", November 2026, adjusted 12 November).

| File name            | Content now                                               | Source file                                             | Used in                     |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------- | --------------------------- |
| `emblem`             | MH logo on white, square                                  | `Logga MH teal.png`                                     | Subscription card           |
| `wordmark`           | "Musikhjältarna" title banner, transparent background     | Cut out of `Produkt i miljö/Rubrik Musikhjältarna.jpeg` | Header, subscription card   |
| `hero-photo`         | Girl at the piano with the app and Gilbert G-klav (4:3)   | `app+Gilbert+flicka vid pianot.png`, cropped            | Hero, in the wide arch      |
| `step-start`         | Child using the app on a tablet (photo)                   | `Suzana + elev/Real-life user.png`                      | "Så fungerar", step 1       |
| `step-practise`      | The app's piano keys with Gilbert                         | `Mock-up2.png`, cropped                                 | "Så fungerar", step 2       |
| `step-reward`        | Three gold stars in the app's medallion (round)           | Built from `Mock-up.png` (ring and stars)               | "Så fungerar", step 3       |
| `app-example-avatar` | Gilbert G-klav, head and shoulders (square)               | Cropped from `Mock-up2.png`                             | Practice example card       |
| `family-photo`       | Child giving Gilbert G-klav a high five on the sofa       | `Suzana + elev/Elev+Gilbert.png`                        | "För hela familjen" section |
| `pedagogue-photo`    | Suzana Spasevska Hermansen with Gilbert's idea pose (4:5) | `suzana+gilbert1.png`, cropped                          | Pedagogue section           |

Waiting for the client: "Gyllene handskar Gilbert klistermärke.png" for `step-reward` (step 3). Save it as
`step-reward.png` and delete the old file. Photos fill the step frame; app art and stickers are shown whole (see
`stepImages` in `HowItWorks.astro`).

# Images

Components pick each file up by name (any of .png, .jpg, .webp, .avif) and fall back to a placeholder until it
exists. Astro generates AVIF/WebP and responsive sizes at build time. To change an image, replace the file and keep
the name. Prefer transparent PNG for characters.

The current files come from the client's asset folder ("Landing page", November 2026, adjusted 12 November).

| File name            | Content now                                              | Source file                                              | Used in                     |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------- | --------------------------- |
| `emblem`             | MH logo on white, square                                 | `Logga MH teal.png`                                      | Subscription card           |
| `wordmark`           | "Musikhjältarna" title banner, transparent background    | `Rubrik Musikhjältarna text.svg`, rendered and trimmed   | Header, subscription card   |
| `hero-photo`         | Girl at the piano with the app and Gilbert G-klav (4:3)  | The hero image in the copy document, white sides trimmed | Hero, in the wide arch      |
| `step-start`         | Child using the app on a tablet (photo)                  | `Suzana + elev/Real-life user.png`                       | "Så fungerar", step 1       |
| `step-practise`      | The app's piano keys with Gilbert                        | `Mock-up2.png`, cropped                                  | "Så fungerar", step 2       |
| `step-reward`        | Gilbert with golden gloves, sticker on white             | `Gyllene handskar Gilbert klistermärke.png`              | "Så fungerar", step 3       |
| `app-example-avatar` | Gilbert G-klav, head and shoulders (square)              | Cropped from `Mock-up2.png`                              | Practice example card       |
| `family-photo`       | Child giving Gilbert G-klav a high five on the sofa      | `Suzana + elev/Elev+Gilbert.png`                         | "För hela familjen" section |
| `pedagogue-photo`    | Suzana Spasevska Hermansen (3:4)                         | `Suzana + elev/Suzana Pianotopia profil.PNG`             | Pedagogue section           |
| `pedagogue-mascot`   | Gilbert G-klav with a light bulb, transparent background | Cut out of `Gilbert ide.jpeg`                            | Pedagogue, beside the photo |

Photos fill the step frame; app art and stickers are shown whole (see
`stepImages` in `HowItWorks.astro`).

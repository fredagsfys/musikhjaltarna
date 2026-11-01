# Redigera innehåll på musikhjaltarna.se

Guide för Humanize och Suzanna. Du behöver inte kunna programmera och inget behöver installeras: allt görs i
webbläsaren på GitHub.

## Vad kan jag ändra?

Allt innehåll finns i **en fil**: [`src/content/copy.yaml`](../src/content/copy.yaml). Där finns:

- rubriker, brödtext och knapptexter på erbjudandesidan
- pris och prisperiod (ändras på ett ställe och slår igenom överallt)
- texter i köpsteget, besked och uppdateringsval, felmeddelanden och bekräftelser
- informationen om personuppgifter i köpsteget
- kontakt-, villkors- och integritetssidorna
- bildbeskrivningar och etiketter
- länken till Pianotopias webbplats

Bilder byts genom att ladda upp filer, se [Byta bilder](#byta-bilder).

## Så ändrar du en text

1. Logga in på GitHub och öppna [`src/content/copy.yaml`](../src/content/copy.yaml) i projektet `fredagsfys/musikhjaltarna`.
2. Klicka på pennan (**Edit this file**) uppe till höger.
3. Ändra **bara texten efter kolon**. Ordet före kolon (till exempel `title:`) är en nyckel som koden använder. Den får inte
   ändras eller översättas.
4. Klicka på **Commit changes…**, skriv kort vad du ändrat och klicka **Commit changes** igen.

Ändringen publiceras automatiskt och syns på musikhjaltarna.se efter ungefär en till två minuter.

### Regler för filen

- **Indrag spelar roll.** Behåll samma antal mellanslag i början av raden som det var innan.
- **Listor** börjar med `- ` (bindestreck och mellanslag). Du kan lägga till eller ta bort punkter i listor, till
  exempel i prenumerationsrutorna eller stegen i "Så fungerar övningen". Under "Framsteg som ryms i vardagen" ska det
  finnas exakt tre fördelar, eftersom varje fördel har en egen ikon.
- **Långa texter** kan skrivas på flera rader efter `>-`. Raderna slås ihop till ett stycke.
- **Kolon i en text**: sätt hela texten inom citattecken, till exempel `title: "Pris: 79 kr"`.
- **Priset** skrivs som en siffra utan "kr": `price: 79`.
- **Kommentarer** efter `#` är hjälptext och syns inte på sidan.
- `{epost}` i tack-texten ersätts med besökarens e-postadress. Låt den stå kvar.

### Om något blir fel

Varje ändring kontrolleras innan den publiceras. Om filen innehåller ett fel, till exempel ett borttaget kolon, en
felstavad nyckel eller ett pris med bokstäver, **publiceras inte ändringen och den gamla sidan ligger kvar**. Ingen
besökare påverkas.

Så ser du att något gick fel:

- På GitHub visas ett rött kryss vid din ändring i listan över ändringar (_commits_).
- Klicka på krysset och sedan på **Details** vid kontrollen **CI**. Där står vad som är fel, till exempel:

  ```
  src/content/copy.yaml is not valid:
    - offer.price: Invalid input: expected number, received string
    - pedagogue: Unrecognized key: "titel"
  ```

  Raden talar om var felet finns (`offer.price` betyder raden `price` under `offer`). Rätta felet i filen på samma sätt
  som ovan, så publiceras sidan.

## Byta bilder

Bilderna ligger i [`src/assets/images/`](../src/assets/images/README.md) och hittas på sitt filnamn. Tills en bild finns
visas en platshållare.

1. Öppna mappen `src/assets/images/` på GitHub.
2. Klicka **Add file → Upload files** och ladda upp bilden med **exakt** det filnamn som står i
   [mappens README](../src/assets/images/README.md), till exempel `gilbert-thumbs-up.png`.
3. Klicka **Commit changes**.

PNG, JPG, WebP och AVIF fungerar. Sidan gör automatiskt mindre och snabbare versioner för olika skärmar. För att byta en
bild laddar du upp en ny fil med samma namn. Bildbeskrivningen för skärmläsare ändras i `copy.yaml` (till exempel
`photoAlt`).

## Det här ska inte ändras

Sektionernas och knapparnas ID:n (till exempel `sektion_hero`, `kop_hero`, `kop_namn`, `uppdatering_ja`) används för
mätningen. De finns i koden, inte i `copy.yaml`, så de kan inte ändras av misstag när du redigerar innehåll. Ändra inga
andra filer än `copy.yaml` och bilderna utan att prata med den som utvecklar sidan.

## Åtkomst

Du behöver ett GitHub-konto med skrivbehörighet till `fredagsfys/musikhjaltarna`. Be den som äger projektet att bjuda in
dig under **Settings → Collaborators**.

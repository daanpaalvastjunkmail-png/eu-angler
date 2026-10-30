# Europa Angler — Atelier 3.4.0

Een geïllustreerde visgame met losse hengelpresets, Europese viswateren, wedstrijden en een eigen visbedrijf.

[Spelen](https://europa-angler.daanpaalvastjunkmail.workers.dev/) · [GitHub](https://github.com/daanpaalvastjunkmail-png/eu-angler)

De Atelier-editie geeft alle schermen een nieuwe stijl met marineblauw, zand, teal, koper en goud. Vier geschilderde landschappen en nieuwe SVG-illustraties brengen vissen, hengels, aas, materiaal en schepen in beeld. Het soortenboek bevat 54 vissen en karpervarianten plus rivierkreeft: 34 toevoegingen, met zoekfunctie, filters, leefgebieden en vangstrecords.

De gekozen hengel bepaalt de vismethode. De planner toont bruikbare hengelplaatsen onder elkaar, tot zes hengels binnen de level- en scholingsgrenzen; maximaal twee dobber-, vier feeder- en vier karperhengels. In de werkplaats verwijzen genummerde onderdelen naar de keuzes voor hengel, molen, lijn, lood of voerkorf, onderlijn en haak.

## Aas kiezen en je sessie afronden

Hengelpresets bewaren je materiaal. Kies vóór vertrek in **Plan je sessie → Kies je aas** het aas, de grootte en eventueel een liquid voor elke hengel. Aascombinaties staan tussen de gewone aasopties in hetzelfde menu. De paklijst en kosten passen zich direct aan.

Tijdens het vissen heeft elke hengel een knop **Aas wisselen**. Je ziet vooraf welke voorraad voor de resterende sessie ontbreekt en wat deze kost. Bevestigen koopt alleen die voorraad en werpt uitsluitend deze hengel opnieuw in. Andere hengels blijven vissen; je sessietijd, vergunning en vangsten blijven behouden. Bij een lopende beet handel je die eerst af voordat je die hengel opnieuw beaast.

De sessietimer en **Sessie stoppen** staan bovenaan in het waterbeeld. Stoppen opent direct de vangstafhandeling, ook wanneer de sessie vanzelf afloopt. Kies per vis of voor alle vissen verkopen, terugzetten of overzetten naar je eigen viswater. Geld en bonus-XP worden pas toegekend wanneer je bevestigt. Sluiten van het venster bewaart alle openstaande vissen; je moet ze afhandelen vóór de volgende sessie.

## Account, synchronisatie en ranglijst

Open **Account** op het apparaat met je huidige voortgang en maak een account met een gebruikersnaam en een wachtwoord van minimaal 12 tekens. Download de eenmalige herstelcode: daarmee kun je een vergeten wachtwoord vervangen. Er is geen e-mailadres nodig; zonder wachtwoord of herstelcode kun je niet opnieuw inloggen.

Open op je telefoon of computer hetzelfde speladres en log in met hetzelfde account. Kies bij de eerste koppeling de cloudopslag om daar verder te spelen. Bij verschillende lokale en online saves toont de game beide voortgangen en vraagt welke je wilt gebruiken. Er wordt eerst een reservekopie bewaard. Saldo's en vangsten worden niet opgeteld.

Tijdens online spelen wordt iedere 30 seconden gesynchroniseerd, en opnieuw wanneer je terugkeert naar het tabblad. Gebruik **Nu synchroniseren** en wacht op bevestiging voordat je van apparaat wisselt. Zonder internet kun je lokaal doorspelen; een gelijktijdig gewijzigde cloudsave vraagt bij terugkomst om een keuze. De maximale cloudsave is 4 MiB. Je kunt altijd een eigen opslagbestand downloaden.

De openbare **Ranglijst** toont de beste 100 spelers en je eigen positie, met sortering op prestige/XP, gevangen vissen of zwaarste vis. Alleen gebruikersnaam en spelstatistieken worden gepubliceerd. Scores worden bij synchronisatie bijgewerkt. Omdat de game ook offline werkt en lokale saves importeerbaar zijn, is dit een communityranglijst zonder garantie tegen aangepaste saves.

Wachtwoorden worden met scrypt gehasht. Inloggen gebruikt een beveiligde HttpOnly-cookie; cloudopslag staat in een Cloudflare SQLite Durable Object. Zie [server/API.md](server/API.md) voor het API-contract, opslag en beveiligingsgrenzen.

## Bouwen en publiceren

Benodigd: Node.js 22 en npm.

```sh
npm install
npm run build:cloudflare
```

Dit voert syntaxcontroles, speltests, releasetests en een verplichte servertest in workerd/Miniflare uit. De servertest gebruikt een tijdelijke SQLite-database, zonder productieaccounts. De webbuild komt in `build/web/`; de zelfstandige offlinegame in `build/Europa-Angler.html`. Accounts zijn beschikbaar op de gehoste website; de zelfstandige HTML blijft lokaal spelen.

Cloudflare Workers Builds gebruikt de bestaande GitHub-koppeling met `daanpaalvastjunkmail-png/eu-angler`, productiebranch `main`:

- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler deploy`
- Worker: `europa-angler`, geconfigureerd in `wrangler.json`

Een nieuwe commit op `main` start automatisch een build en publicatie op hetzelfde speladres. Controleer de GitHub-check `Workers Builds: europa-angler` voor de uitkomst.

De eerste publicatie van 3.3.0 maakt via `accounts-v1` de SQLite Durable Object-klasse `AccountHub` aan. Behoud de migratie, klassenaam, binding `ACCOUNTS` en objectnaam bij volgende updates, zodat bestaande accounts en saves bereikbaar blijven. Er zijn geen extra D1-database, API-sleutels of handmatige databasecommando's nodig.

## Opslag en updates

Je bestaande lokale voortgang blijft beschikbaar, ook zonder account. De onlinegame gebruikt de bestaande opslagsleutel `europa-angler-progress`. Opslag uit schema 4 wordt automatisch naar schema 5 overgezet; versie 3.4.0 behoudt schema 5. Accountkoppelingen en synchronisatiegegevens hebben aparte opslagsleutels.

Bij een beschikbare app-update bewaart **Save & update** eerst de voortgang. Gebruik **Instellingen → Opslagbestand downloaden** voor een eigen back-up; daar kun je ook een export importeren. De zelfstandige HTML heeft browseropslag die losstaat van het onlineadres: draag voortgang via export/import over.

## Artwork

De vier landschappen in `dist/assets/` zijn met de ingebouwde image-generationtool gemaakt. De volledige prompts staan in [docs/ART-PROMPTS.json](docs/ART-PROMPTS.json). Vis- en materiaalillustraties staan als SVG-code in `species-art.js`, `art.js`, `atelier-ui.js`, `visuals.js` en `assembly-diagram.js`; lettertypelicenties staan in `dist/vendor/`.

Karperschubpatronen worden als varianten behandeld. Gewichten, zeldzaamheid en vangstkansen volgen de spelbalans.

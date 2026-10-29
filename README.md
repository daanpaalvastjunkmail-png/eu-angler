# Europa Angler — Atelier 3.2.0

Een geïllustreerde visgame met losse hengelpresets, Europese viswateren, wedstrijden en een eigen visbedrijf.

[Spelen](https://europa-angler.daanpaalvastjunkmail.workers.dev/) · [GitHub](https://github.com/daanpaalvastjunkmail-png/eu-angler)

De Atelier-editie geeft alle schermen een nieuwe stijl met marineblauw, zand, teal, koper en goud. Vier geschilderde landschappen en nieuwe SVG-illustraties brengen vissen, hengels, aas, materiaal en schepen in beeld. Het soortenboek bevat 54 vissen en karpervarianten plus rivierkreeft: 34 toevoegingen, met zoekfunctie, filters, leefgebieden en vangstrecords.

De gekozen hengel bepaalt de vismethode. De planner toont bruikbare hengelplaatsen onder elkaar, tot zes hengels binnen de level- en scholingsgrenzen; maximaal twee dobber-, vier feeder- en vier karperhengels. In de werkplaats verwijzen genummerde onderdelen naar de keuzes voor hengel, molen, lijn, lood of voerkorf, onderlijn, haak en aas.

## Bouwen en publiceren

Benodigd: Node.js 22 en npm.

```sh
npm install
npm run build:cloudflare
```

Dit voert syntaxcontroles, speltests en releasetests uit. De webbuild komt in `build/web/`; de zelfstandige offlinegame in `build/Europa-Angler.html`.

Cloudflare Workers Builds gebruikt de bestaande GitHub-koppeling met `daanpaalvastjunkmail-png/eu-angler`, productiebranch `main`:

- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler deploy`
- Worker: `europa-angler`, geconfigureerd in `wrangler.json`

Een nieuwe commit op `main` start automatisch een build en publicatie op hetzelfde speladres. Controleer de GitHub-check `Workers Builds: europa-angler` voor de uitkomst.

## Opslag en updates

Speel op hetzelfde adres en in hetzelfde browserprofiel om je voortgang te blijven gebruiken. De onlinegame gebruikt de bestaande opslagsleutel `europa-angler-progress`. Opslag uit schema 4 wordt automatisch naar schema 5 overgezet; dit schema ondersteunt de uitgebreide soortenlijst en beschermt nieuwe opslag tegen schrijven door oudere clients.

Bij een beschikbare app-update bewaart **Save & update** eerst de voortgang. Gebruik **Instellingen → Opslagbestand downloaden** voor een eigen back-up; daar kun je ook een export importeren. De zelfstandige HTML heeft browseropslag die losstaat van het onlineadres: draag voortgang via export/import over.

## Artwork

De vier landschappen in `dist/assets/` zijn met de ingebouwde image-generationtool gemaakt. De volledige prompts staan in [docs/ART-PROMPTS.json](docs/ART-PROMPTS.json). Vis- en materiaalillustraties staan als SVG-code in `species-art.js`, `art.js`, `atelier-ui.js`, `visuals.js` en `assembly-diagram.js`; lettertypelicenties staan in `dist/vendor/`.

Karperschubpatronen worden als varianten behandeld. Gewichten, zeldzaamheid en vangstkansen volgen de spelbalans.

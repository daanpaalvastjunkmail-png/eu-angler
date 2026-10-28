# Europa Angler — Fishing Idle 3.1.1

Een speelbare lokale idle-visgame met Engels als standaard en een direct beschikbare Nederlandse taalkeuze. Je bouwt van één hengel naar een visbedrijf met meerdere lijnen, eigen viswater en een vloot. De vormgeving, content en spelregels zijn oorspronkelijk; Melvor Idle was alleen een genre-inspiratie.

## Bestaande hosting

Het door de speler opgegeven adres is https://europa-angler.daanpaalvastjunkmail.workers.dev/ — Cloudflare Workers. Werk de bestaande Worker `europa-angler` bij in hetzelfde account. `npm run build:workers` maakt `build/workers/` met de gebouwde game, een Wrangler-configuratie en `UPDATEN.txt`. Uploaden gebeurt vanuit die map met `npx wrangler@4 deploy --config wrangler.json`, na aanmelden. Dit verandert de vaste savesleutel niet. De eerdere Pages-route blijft alleen van toepassing op installaties die daadwerkelijk op Pages staan.

## Automatische updates via GitHub

Zet de inhoud van deze broncodemap direct in een eigen GitHub-repository voor Europa Angler. `package.json`, `wrangler.json`, `dist/`, `scripts/` en `tests/` horen bovenaan in de repository te staan, zonder extra omvattende map. De lokale mapnaam `dist/` bevat hier de leesbare spelbroncode en moet dus ook mee. Upload geen `node_modules/`, `build/`, `.openai/` of persoonlijke saves.

Koppel de bestaande Worker `europa-angler` via Settings > Builds > Connect aan die repository. Gebruik deze instellingen:

| Instelling | Waarde |
| --- | --- |
| Production branch | `main` (of de gekozen hoofdbranch van de repository) |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npx wrangler deploy` |
| Root directory / Path | Leeg laten, of `/` als een waarde verplicht is |
| Disable builds | Uit |

Cloudflare installeert de npm-afhankelijkheden. De build voert syntaxcontroles, alle spelsuites en de daadwerkelijke standalone- en webreleasecontroles uit. Een fout stopt het proces voor publicatie. De Wrangler-configuratie bovenaan wijst naar `build/web/` en houdt de bestaande Worker-naam aan. De afzonderlijke configuratie in `workers/` is voor het handmatige updatepakket, niet voor de rootdirectory van deze Git-koppeling.

Een push naar de gekozen productiebranch triggert de volgende build en publicatie. De eerste geslaagde deployment moet in Cloudflare worden gecontroleerd; alleen toegang aan GitHub geven of deze bestanden lokaal voorbereiden activeert de verbinding nog niet. Speel op het bestaande speladres met hetzelfde browserprofiel om dezelfde save te blijven gebruiken. Er is geen synchronisatie tussen apparaten.

## Indeling — 3.1.1

De sessieplanner toont alleen gekochte hengelplaatsen die je op je huidige level mag gebruiken, altijd in één kolom. Boven de lijst staat het volgende vrijspeellevel. Zodra een extra plaats op jouw level beschikbaar is, verschijnt daar de aankoopknop; toekomstige lege slottegels worden niet getoond.

De hengelwerkplaats toont een vrijstaande hengeltekening en een aparte vergrote montage. Lood of voerkorf, wartel, onderlijn, haak en aas zijn zichtbaar. Genummerde aanwijslijnen koppelen onderdelen aan hun keuzeblok onder de tekening; aanklikken of bedienen met het toetsenbord brengt de bijbehorende keuze in beeld. Op kleinere schermen staan de tekeningen en keuzeblokken onder elkaar.

## Hengelpresets en sessiekeuze — 3.1.0

Volledige loadoutpresets zijn vervangen door losse hengelpresets. In **Hengelpresets** bouw, benoem, wijzig en repareer je elke fysieke hengel afzonderlijk. Er is geen keuzemenu voor de vismethode: het gekozen hengelonderdeel bepaalt automatisch feeder, karper, dobber of zee. De bouwer toont passende molens en montages; bezette onderdelen blijven herkenbaar en kunnen niet dubbel worden gebruikt.

Bij **Plan je sessie → 01 Kies je hengels** kies je direct een opgeslagen hengelpreset per beschikbare plaats. De selectie wordt meteen bewaard en rekent paklijst, scholingspunten, kosten en verwachtingen opnieuw uit. Een lege plaats is toegestaan; om te starten is minstens één geldige hengel nodig. Elke fysieke hengel kan één keer mee. Je kunt je hengels tijdens een lopende sessie niet omwisselen.

| Grens | Maximum |
| --- | --- |
| Alle ingezette hengels samen | 6 |
| Dobber | 2 |
| Feeder | 4 |
| Karper | 4 |
| Zee | 3 |

Deze grenzen vervangen de levelprogressie niet. Plaatsen komen vrij op level **1, 10, 40, 90, 170 en 300** en worden met spelgeld gekocht. De visacademie begrenst daarnaast de zwaarte van de combinatie: T1–T7 gebruiken **2, 3, 5, 8, 12, 18 en 26 scholingspunten** per hengel, op basis van de hoogste tier van hengel of molen. Twee T1-hengels kunnen vanaf level 10; T1 + T2 vanaf 15 en twee T2 vanaf 18.

### Bestaande voortgang

Opslagschema **4** zet de huidige selectie uit oude loadouts om naar de gekozen losse hengels. Opgeslagen hengelontwerpen, fysieke onderdelen, conditie, geld, XP, vispassen, vangsten en betaalde lopende sessies blijven behouden. Oudere v2-ontwerpen worden eerst omgezet naar losse fysieke hengels; ontwerpen zonder vrije onderdelen blijven bewaard als **Nog te bouwen**.

Het vaste opslagadres is `europa-angler-progress`, met herstelkopie `europa-angler-progress-backup`. De oude sleutel `europa-angler-idle-v2` wordt niet overschreven. De game beschermt onleesbare saves, saves uit nieuwere schema's en voortgang uit een ander tabblad. Blijf op hetzelfde websiteadres in hetzelfde browserprofiel spelen. Er is geen automatische overdracht tussen apparaten; daarvoor gebruik je JSON-export/import.

## Spelen

Kies je hengels, viswater, sessieduur en voerreserve in de planner. Starten koopt ontbrekende voorraad en een passende vispas. Alle ingezette hengels blijven tegelijk zichtbaar, met een eigen beetmelding en aanslagknop. Met toetsen 1–6 sla je aan op de overeenkomstige plaats; spatie kiest een beet die aandacht vraagt. De assistent vist automatisch.

Na de sessie kies je voor iedere vangst verkopen, terugzetten voor XP of uitzetten in je eigen vijver. Verwerk de vangsten voordat je een volgende sessie begint. De geschiedenis blijft bij **Sessies & vangsten** staan.

De game heeft 300 vislevels, tien wateren, twintig vissoorten plus rivierkreeften, rigbouw, wedstrijden tegen computervissers, een eigen viswater, een vloot en vrijwillige prestige. Engels is de standaardtaal; Nederlands is direct beschikbaar. Alle voortgang staat lokaal in de browser. Offline voortgang wordt bij terugkomst berekend, binnen je vrijgespeelde tijdslimiet.

## Bouwen en controleren

Benodigd: een recente Node.js-runtime. De release is getest met Node.js 22.

```sh
npm install
npm run build:cloudflare
```

De Cloudflare-build voert syntaxcontroles, alle spel- en interfacetestgroepen en controles van de daadwerkelijke standalone- en webrelease uit. De webversie komt in `build/web/`; de zelfstandige versie in `build/Europa-Angler.html`. De webbuild gebruikt bestanden met inhoudshashes en een serviceworker met gecontroleerde activering na het opslaan van voortgang.

De tests omvatten de methode die uit de hengel volgt, alle stijlgrenzen, het totaal van zes, dubbele fysieke onderdelen, level- en opleidingsgrenzen, bewaren/herladen en migratie van echte 2.8.1- en 3.0.0-savefixtures. De interfacetests controleren DOM en daadwerkelijke spelacties; ze vervangen geen visuele controle op een echte telefoon.

## Belangrijke bronbestanden

- `dist/app.js`: navigatie, sessieplanning en bediening.
- `dist/session-rods-ui.js`: rechtstreekse hengelkeuze bij stap 01.
- `dist/assembly-ui.js`: individuele hengelpresets, automatisch afgeleide methode en reparaties.
- `dist/engine.js`: simulatie, selectievalidatie, aankopen, sessies en migratie.
- `dist/tackle.js`: unieke fysieke onderdelen, bezetting en opslagstructuur.
- `dist/training.js`: scholingspunten, materiaalbelasting en breukrisico.
- `dist/data.js`: prijzen, stijlgrenzen, content en levelmijlpalen.
- `dist/save-store.js`, `save-codec.js`, `updates.js`: stabiele opslag, compacte vangstgeschiedenis en veilige app-updates.


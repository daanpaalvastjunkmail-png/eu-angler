# Europa Angler — Fishing Idle 3.0.0

Een speelbare lokale idle-visgame met Engels als standaard en een direct beschikbare Nederlandse taalkeuze. Je bouwt van één hengel naar een visbedrijf met meerdere lijnen, eigen viswater en een vloot. De vormgeving, content en spelregels zijn oorspronkelijk; Melvor Idle was alleen een genre-inspiratie.

## Bestaande hosting

Het door de speler opgegeven adres is https://europa-angler.daanpaalvastjunkmail.workers.dev/ — Cloudflare Workers. Werk de bestaande Worker `europa-angler` bij in hetzelfde account. `npm run build:workers` maakt `build/workers/` met de gebouwde game, een Wrangler-configuratie en `UPDATEN.txt`. Uploaden gebeurt vanuit die map met `npx wrangler@4 deploy --config wrangler.json`, na aanmelden. Dit verandert de vaste savesleutel niet. Het openbare adres kon vanuit deze bouwomgeving niet worden opgehaald; de live versie is dus niet bevestigd en er is geen deployment uitgevoerd. De eerdere Pages-route blijft alleen van toepassing op installaties die daadwerkelijk op Pages staan.

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

## Spelen

Open het meegeleverde zelfstandige bestand `Europa-Angler.html` in een moderne browser. Alles voor de game zit in dit ene bestand; een server of internetverbinding is niet nodig. Ververs het bestand als er nog een oude versie open staat.

De taalknop rechtsboven wisselt tussen English en Nederlands. De keuze wordt met je voortgang bewaard; je eigen namen worden niet vertaald.

De normale website staat in `dist/`. Start hiervoor bijvoorbeeld:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. De normale bronversie gebruikt modules en werkt daarom via HTTP, niet door `dist/index.html` direct als bestand te openen.

## Eerste sessie

1. Kies een opgeslagen loadout en een water.
2. Kies met één schuifregelaar de duur van je sessie én vispas: 1, 5, 10, 15, 30 of 45 minuten, daarna per uur tot 8 uur, per 2 uur tot 16 uur, per 4 uur tot 24 uur en daarna 2, 3, 4, 5, 6 of 7 dagen. De vispasprijs en paklijst veranderen direct mee. Stel eventueel je voerreserve in.
3. Controleer paklijst en kosten. Starten koopt de ontbrekende voorraad, de benodigde pas en eventueel een charter.
4. De assistent vist automatisch. Kijk naar echte aanbeten: tikjes gaan over in een buigende feedertop, een aflopende karpermolen of een duikende dobber. Iedere hengel blijft tegelijk zichtbaar, met een eigen beetmelding en inhaal-/aanslagknop eronder. Klik de hengel of druk de bijbehorende toets 1–6; spatie kiest een beet die aandacht vraagt.
5. Zelf op tijd aanslaan geeft extra XP en een kortere volgende worp. Een gemiste aanslag van de assistent kun je nog redden. Te vroeg aanslaan kost de beet.
6. Je vangsten verschijnen direct onder het waterscherm. Verkopen is standaard geselecteerd. Gebruik de knoppen boven de lijst voor alles verkopen, alles terugzetten voor XP of alles naar de vijver; individuele uitzonderingen kun je daarna nog aanpassen. Alles deselecteren wist alleen je keuzes, zonder vissen te verliezen of geld uit te betalen. Terugzetten geeft 20% bonus-XP (minimaal 3); een rivierkreeft geeft 1 basis-XP. De keuze betaalt pas uit wanneer je die verwerkt. Tijdens het vissen kun je gekozen vissen alvast verwerken.
7. Na afloop controleer je de bestemming van **iedere** overgebleven vis; standaard staat die op verkopen. **Afhandelen & water verlaten** verwerkt de gekozen bestemmingen samen. Zolang je niet verwerkt hebt blijven de vissen aan het water. Je kunt geen vissen meenemen naar een nieuwe sessie. De volledige geschiedenis blijft bij **Sessies & vangsten** staan.

Zonder sessie kun je de stek opruimen voor € 0,10 per tik. Aandacht herstelt elke tien seconden. Zo kun je ook na een onverstandige aankoop weer een vispas verdienen.

## Wat werkt

- Vislevel 1–300; zes hengelplaatsen op level 1, 10, 40, 90, 170 en 300. Na het level koop je de plaats met spelgeld.
- Feeder, karper, dobber en later zee; maximaal 2 feeders, 3 karperhengels, 1 dobber of 3 zeehengels, met maximaal 6 hengels tegelijk.
- Tot 12 volledige loadoutpresets en 120 individuele gebouwde hengels/ontwerpen. Selecteer bovenaan een loadout; kies per plaats een opgeslagen hengel. In de werkplaats staan keuzemenu's bij de zichtbare hengel en zijn bezette onderdelen herkenbaar. Hengel, molen, lijn, haak, montage, beetmelder en optionele zelfgemaakte rig horen bij één fysieke set. Alternatieve loadouts mogen dezelfde set gebruiken, maar nooit twee keer tegelijk. Wijzigen werkt door naar alle loadouts; uit elkaar halen verwijdert de hengel uit alle loadouts en maakt onderdelen vrij. Aas en liquids blijven gedeelde verbruiksvoorraad.
- Visacademie: T1–T7 kosten 2, 3, 5, 8, 12, 18 of 26 punten per hengel, bepaald door de hoogste tier van hengel of molen. Level 10 geeft 4 punten (twee T1), level 15 geeft 5 (T1 + T2), level 18 geeft 6 (twee T2); de opleiding groeit tot 156 punten op level 300. Het aantal gekochte plaatsen en de stijlgrenzen blijven gelden. De volledige opleiding staat bij loadouts en voortgang.
- Overbelasting door een grote haak, groot aas of een zware vis aan sterke lijn kan conditie kosten en een hengel breken. De bouwer toont hengelgrens, veilige setgrens en worpschadekans. Een gebroken hengel stopt met vissen en verbruiken; andere hengels gaan door. Alle hengels gebroken beëindigt de sessie met behoud van de vangsten. De drie oorspronkelijke starterhengels worden gratis gerepareerd; gekochte hengels, ook gekochte Field-modellen, kosten naar schade maximaal 35% van de nieuwprijs. Uit elkaar halen of opnieuw laden herstelt geen schade.
- 10 wateren, 20 vissoorten plus rivierkreeften, 106 materiaalartikelen, 14 voorraden en 5 rigrecepten.
- Aan het water zijn Je vangsten, Plan je sessie en het activiteitenlog inklapbaar via hun kopje. De keuze wordt bewaard; vissen en live aantallen blijven doorgaan. Bij verplichte afhandeling opent de vangstlijst automatisch.
- Eén duurregelaar voor sessie en vispas, met automatisch berekende paskosten en voorraad. Nieuwe passen volgen de gekozen duur; eerder betaalde geldigheid blijft behouden. Voerreserve: 0%, 10% of 25%.
- Vaste vispastarieven met duurkorting, zonder toeslag per hengel. Op het Poldermeer kost 8 uur €9 en één week €32, exclusief voorraad. Ook zeecharters volgen een duurkorting. De planner toont geschatte visverkoop, werkelijk voer-/aasverbruik en sessiewinst na pas, boot en verbruik. Dit veronderstelt uitvissen en alle vangsten verkopen.
- Lagere spelprijzen: starterhengel €25, tweede hengelplaats €90, lokvoer €3/kg en 100 maden €2. Nieuwe spelers beginnen met €150. Visverkoop gebruikt kiloprijzen en centen; geld, uitrusting en oude vangstwaarden in bestaande saves veranderen niet.
- De paklijst toont per artikel de benodigde hoeveelheid, totale waarde inclusief reserve, ontbrekende hoeveelheid en bijkoopkosten. Kopjes voor lokvoer, haakaas en liquids tellen de daadwerkelijke bijkoopkosten op; reeds betaalde voorraad wordt niet opnieuw afgerekend. Zelfgemaakte rigs zijn al op de hengel gemonteerd en worden niet opnieuw gekocht of per sessie verbruikt. Alleen vrije exemplaren kunnen worden verkocht.
- Werkelijk verbruik van voer, aas en liquids. Een sessie stopt bij het geplande einde, lege voorraad, een verlopen pas of een volle vangstopslag.
- Bijvangst op karpermontages: brasem kan ook maïs, pellets en boilies nemen. Kleine haken en klein aas laten meer voorn en andere witvis toe; grotere haken en selectiever aas verminderen die bijvangst. Rivierkreeften komen alleen in zoetwater voor, bij vrijwel ieder aas, met meer kans op de bodem en op sommige wateren. Ze klemmen zich aan aas vast en vallen daarom niet onder de minimale haakmaat. Een kreeft levert normaal €0,01–€0,06 en 2 basis-XP op; terugzetten geeft 1 basis-XP. Ze tellen niet voor wedstrijdgewicht en kunnen niet naar de eigen vijver. De statistieken gebruiken dezelfde selectie als de simulatie.
- Gewichtselectie per haak; lijnsterkte en hengelkracht begrenzen wat je kunt landen. Aasvoorkeuren, cocktails, liquids en zelfgemaakte rigs werken mee.
- Een visuele loadoutbouwer met aanklikbare hengel, molen, lijn, haak, montage, aas en beetmelder. Materiaal en visstijl veranderen de tekening.
- De grote hengel, echte beetfasen, aanslagknop en redden van gemiste beten zitten samen in het waterscherm. Alle uitgelegde hengels zijn tegelijk zichtbaar, met per hengel een eigen beetstatus, reactievenster en inhaal-/aanslagknop onder het beeld. Je kunt ook direct op een hengel klikken. Er is geen wisselknop tussen hengels. Er zijn reactiebonussen en statistieken per sessie. De assistent reageert na 3,2 seconden en kan missen. Zelf inhalen/aanslaan geeft een korte zichtbare lift van de gekozen hengel, met meebewegende molen en lijn; rustige weergave gebruikt een stille markering.
- Zeven beetmelders: feederbel/LED-clip, pieper/ontvanger, neon/glow-dobber en offshore-alarm. Geluid activeer je zelf; het komt procedureel uit Web Audio.
- Vijf extra algemene upgrades: polaroidbril, banksticks, schepnet/onthaakmat, assistenttraining en camouflage.
- Een aparte Statistics / Statistieken-pagina met soortkansen, gewichtsverdeling, automatische/actieve uurramingen en uitleg van aasvoorkeur, haak en lijn. Kies de geplande loadout of de lopende sessie en alle hengels of één specifieke hengel; bekijken kost niets.
- Complete vangstlijst per sessie, inclusief automatisch verkochte vissen. Sorteer huidige vangsten en sessiegeschiedenis op gewicht, prijs of vangsttijd, in beide richtingen, ook voordat je meer regels laadt. Individueel verkopen, terugzetten voor XP en uitzetten; verplichte afhandeling vóór vertrek en batchcontrole op vijverruimte; trofeebescherming en een soortenboek.
- Offline berekening: standaard 8 uur, met upgrades naar 16, 24, 48, 96 en 168 uur. Een sessie mag altijd tot één week worden gepland; de planner meldt je huidige offline limiet en mogelijke opslagbeperking. Geen extra opbrengst buiten de limiet.
- Rigbouw met een eigen vaardigheid 1–99, batches, materiaalverbruik, verkoop en tijdelijke sessiebonussen.
- 5 wedstrijden tegen computervissers, op werkelijk door jou gevangen wedstrijdgewicht, met eenmalig te innen prijzen.
- Eigen viswater vanaf level 80: vissen uitzetten, soortpopulaties, elke zes uur kweek vanaf twee bewoners, bezoekersinkomsten en uitbreidingen.
- Zeevissen vanaf level 120, eigen vloot vanaf 150: boten kopen, verhuren of op betaalde bemanningsreis sturen. Een vrije eigen boot bespaart charterkosten.
- Vrijwillige prestige vanaf level 100, met een concrete resetbevestiging, blijvende kennis en speciale latere toegang.
- Automatische lokale opslag en JSON-export/import voor een back-up of handmatige overdracht naar een ander apparaat.

## Opslag

Lange vangstgeschiedenis wordt intern verliesloos gecomprimeerd. Een testweek met zes hengels en 118.645 vangsten gebruikt circa 1,92 MB in plaats van 10,93 MB; de complete lijst en leesbare JSON-export blijven beschikbaar.

De voortgang gebruikt de vaste `localStorage`-sleutel `europa-angler-progress`, onafhankelijk van de appversie. Opslagschema 3 migreert bestaande v2-idle-saves automatisch. `europa-angler-idle-v2` blijft ongewijzigd bewaard; oudere tabbladen kunnen daarmee geen nieuwe voortgang overschrijven. De herstelkopie heet `europa-angler-progress-backup`. Onleesbare primaire opslag probeert de herstelkopie; als geen geldige opslag beschikbaar is, blokkeert de app overschrijven. Een toekomstig schema wordt beschermd. Bij ruimtegebrek mag alleen de rollende herstelkopie vervallen, niet de huidige save of de oude migratiebron. Importeren dat niet kan opslaan behoudt de vorige game. Een verouderd tabblad dat nieuwe voortgang van een ander tabblad ziet, blokkeert zijn eigen schrijfacties.

Een echte 2.8.1-save is als compatibiliteitsfixture opgenomen in `tests/fixtures/`. Migratie bewaart geld, XP, vangsten, vispassen, lopende sessies en ontwerpen. Vroeger onbeperkt gedeelde lijn-/haak-/montagesets worden eenmalig toegewezen aan sets waarvoor daadwerkelijk hengels en molens aanwezig zijn. Alternatieve ontwerpen zonder vrije fysieke hengel/molen blijven als ‘Nog te bouwen’ bewaard. De reeds betaalde lopende sessie wordt niet afgebroken vanwege de nieuwe scholingsregels; nieuwe sessies moeten daaraan voldoen.

Voor Pages: publiceer `build/web/` of het meegeleverde Android-web.zip als productie-update in hetzelfde project en speel op exact hetzelfde vaste HTTPS-adres. Browseropslag hoort bij het websiteadres; een afzonderlijke preview-URL heeft eigen opslag. Gebruik hetzelfde browserprofiel. Een ander apparaat/adres of verwijderde browsergegevens vraagt een JSON-back-up; er is geen cloudsave. De oude 3D-game wordt niet geïmporteerd. [Cloudflare: nieuwe deployment](https://developers.cloudflare.com/pages/get-started/direct-upload/#create-a-new-deployment), [MDN: lokale browseropslag](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

De webbuild bundelt JavaScript en geeft JS/CSS inhoudshashes. De service worker cachet één samenhangende versie, wacht op activering en vernieuwt na ‘Save & update’ pas nadat voortgang succesvol is opgeslagen. `_headers` bevat het Pages-cachebeleid. Wis bij een update geen websitegegevens en verander de savesleutel niet. Verhoog voor volgende releases `release.js`, `package.json` en de serviceworkerversie; voeg schemamigraties toe zodra het opslagformaat verandert.

Offline voortgang wordt pas bij het openen of terugkeren berekend. Er draait geen achtergrondserver. Tijdsverloop gebruikt de apparaatklok. Dit is een lokale singleplayer-economie; wedstrijden en bezoekers zijn gesimuleerd.

De huidige en laatste sessie bewaren iedere vangst. Tot acht recente sessies worden bewaard; oudere geschiedenis wordt bij in totaal 40.000 vangsten opgeruimd. De volledige huidige of laatste sessie blijft behouden, ook als die groter is. Onafgehandelde vissen blijven aan het water totdat je hun bestemming kiest. Dat blijft ook na sluiten/heropenen zo; je kunt pas verder reizen of een nieuwe sessie starten nadat alle vissen zijn afgehandeld. Bij oude v2-opslagen worden bewaarde vissen als onafgehandelde vangsten overgenomen; er gaat geen vis stilzwijgend verloren. Al verkochte oude vissen kunnen niet worden gereconstrueerd. Vangstgeschiedenis blijft bij prestige behouden.

## Ontwikkeling

Benodigd voor bouwen/testen: een recente Node.js-runtime.

```sh
npm install
npm test
npm run build
npm run build:web
npm run test:release
```

De zelfstandige game komt in `build/Europa-Angler.html`. Zonder build kun je de normale bronversie direct via een statische server draaien.

- `dist/data.js`: content, prijzen, levels, recepten en mijlpalen.
- `dist/engine.js`: tijdsimulatie, economie, opslag en alle spelacties, zonder DOM-afhankelijkheid.
- `dist/economy.js`: vaste watertarieven, duurkortingen en week-/offlinelimieten.
- `dist/save-codec.js`: verliesloze compacte lokale opslag van volledige vangstgeschiedenis.
- `dist/app.js`: pagina's, planning en bediening.
- `dist/training.js`: opleiding, capaciteitsbudget, hengelsterkte en overbelasting.
- `dist/tackle.js` en `dist/assembly-ui.js`: fysieke onderdelen, exclusieve assemblages, migratie en visuele werkplaats.
- `dist/save-store.js`, `dist/updates.js` en `dist/release.js`: versieonafhankelijke opslag, herstel, tabbladbeveiliging en gecontroleerde updates.
- `scripts/build-web.mjs`: productie-uitgave met bestands- en cachehashes en Pages-headers.
- `dist/rig-presets.js` en `dist/loadout-ui.js`: individuele hengelpresets, vaste hengelplaatsen en de presetbibliotheek.
- `dist/i18n.js` en `dist/i18n-data.js`: Engels/Nederlands, inclusief dynamische meldingen en behoud van eigen namen.
- `dist/forecast.js`: analytische kansen en uurramingen van dezelfde visregels.
- `dist/journal.js`, `dist/session-ui.js` en `dist/inline-catches.js`: sessiegeschiedenis, verplichte afhandeling en vangstlijst onder het spel.
- `dist/catch-sort.js`: sorteren van de complete vangstlijst zonder vangstkeuzes of opgeslagen geschiedenis te wijzigen.
- `dist/session-planner.js`: schuifregelaar en minuten-, uur- en dagstappen voor sessie en vispas.
- `dist/packing-list.js`: benodigde voorraad, prijs per artikel en categorietotalen voor bijkopen.
- `dist/game-view.js` en `dist/fishing-scene.js`: geïntegreerde visstek, grote hengel en signalen van alle lijnen.
- `dist/angling-ui.js`, `dist/angling-visuals.js` en `dist/bite-audio.js`: visuele beetfasen, loadoutstudio en geluid.
- `dist/art.js` en `dist/visuals.js`: oorspronkelijke SVG-illustraties.
- `dist/style.css`: responsive vormgeving.
- `tests/`: economische en DOM-integratietests met gecontroleerde tijd.

## Webapp en latere appversie

`dist/` bevat een manifest, 192/512-pixeliconen en een service worker. Publiceer de gegenereerde `build/web/` voor Pages; die bevat ook de bundelhashes en headers. Via HTTPS kan de gehoste bronversie als webapp worden geïnstalleerd en gecachet. De eerste installatie heeft internet nodig; de zelfstandige HTML-uitgave werkt meteen lokaal. Installatie en browserweergave zijn in deze bouwomgeving niet visueel getest.

De scheiding tussen simulatie, opslag en interface maakt een latere mobiele verpakking mogelijk. Appwinkelpublicatie, accounts, cloudopslag, echte online tegenstanders, betalingen en servercontrole horen nog bij een volgende productiefase. De huidige balans is een eerste afstelling; er is geen bewezen aantal speeluren of bewezen commerciële gereedheid.

## Validatie

193 geautomatiseerde testgroepen in 27 suites zijn geslaagd, inclusief de bestaande sessie-, economische, kans-, vangst-, vertaal- en bedieningstests. Nieuw: echte 2.8.1-opslag migreren, reservekopieherstel, toekomstige/beschadigde opslag beschermen, verouderde tabbladen, volle opslag, updateactivering na opslaan, fysieke reserveringen, opleiding, breuk/reparatie en dezelfde schade bij live/offline simulatie. De zelfstandige HTML-uitgave heeft 12 releasecontroles; de echte productie-webbundel heeft 3 releasegroepen voor assetintegriteit, migratie/herladen en herstelbediening. Beide voeren de daadwerkelijke app uit in JSDOM. De serviceworkerlevenscyclus is met testdubbels gecontroleerd. Een echte browserlayout, Android-installatie en echte Android-serviceworker zijn hier niet getest.

Fonts: DM Sans en Manrope, SIL Open Font License. Licenties staan in `dist/vendor` en zijn ook opgenomen in het zelfstandige bestand.

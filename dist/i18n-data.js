import {SPECIES_INFO} from './species-info.js';
// The simulation and saved games retain their stable Dutch source strings.
// Translations are presentation-only; no saved item IDs or custom names change.
const entries = `
Inklappen|Collapse
Uitklappen|Expand
Rivierkreeft|Crayfish
Lastpak|Nuisance catch
Lastpak bij zoetwatervissen|Freshwater nuisance catch
niet voor kreeften|not for crayfish
BIJVANGST & LASTPAKKEN|BYCATCH & NUISANCE CATCHES
van je verwachte vangsten · al meegerekend in waarde en aantallen|of expected catches · already included in value and catch totals
Je visstijl is een doel, geen garantie: witvis kan op karperaas bijten en rivierkreeften kunnen aas vastpakken.|Your fishing style sets a target, not a guarantee: coarse fish may take carp bait and crayfish may cling to it.
Een rivierkreeft klampt zich vast aan je aas. Veel gedoe, vrijwel geen verkoopwaarde.|A crayfish clung to your bait. Plenty of trouble, almost no sale value.
Bijvangst: een brasem heeft je karperaas gevonden. Ook maïs, pellets en boilies trekken witvis aan.|Bycatch: a bream found your carp bait. Corn, pellets and boilies also attract coarse fish.
Bijvangst: witvis aan je karperhengel. Klein aas en een lichte haak laten ook kleine vissen toe.|Bycatch: a coarse fish on your carp rod. Small bait and a light hook also allow small fish.
Lastpak: rivierkreeften eten allerlei aas en kunnen eraan blijven hangen. Haakmaat houdt ze niet tegen.|Nuisance catch: crayfish eat many baits and may cling to them. Hook size does not keep them away.
Bij dobbervissen is de kans lager dan bij bodemaas.|Float fishing has a lower chance than fishing bait on the bottom.
Bodemaas is goed bereikbaar voor rivierkreeften; de overlast verschilt per water.|Bottom bait is easy for crayfish to reach; nuisance levels vary by water.
Vrijwel geen verkoopwaarde, weinig XP en geen wedstrijdgewicht. Niet geschikt voor je eigen vijver.|Almost no sale value, little XP and no competition weight. Unsuitable for your fishery.
Bijvangst bij karpervissen: brasem eet ook maïs, pellets en boilies.|Carp-fishing bycatch: bream also eat corn, pellets and boilies.
Bijvangst bij karpervissen: vooral klein aas en lichte haken laten witvis toe.|Carp-fishing bycatch: small bait and light hooks especially allow coarse fish.
De aasgrootte en eetlust van deze soort tellen extra mee in de selectie.|Bait size and this species’ feeding preferences also affect selection.
Alleen zoetwatervissen kunnen naar je vijver; rivierkreeften en zeevis niet.|Only freshwater fish can enter your fishery; crayfish and sea fish cannot.
Een rivierkreeft geeft 1 basis-XP.|A crayfish gives 1 base XP.
Rivierkreeft teruggezet. Je ontvangt 1 basis-XP.|Crayfish released. You receive 1 base XP.
Aan het water|At the water
AAN HET WATER|AT THE WATER
Mijn loadouts|My loadouts
Wateren & vispassen|Waters & fishing licences
Sessies & vangsten|Sessions & catches
Wedstrijden|Competitions
WERK & INKOMEN|WORK & INCOME
Hengelsportwinkel|Tackle shop
De werkbank|The workbench
Eigen viswater|My fishery
Mijn vloot|My fleet
MIJN VERHAAL|MY STORY
Voortgang & prestige|Progress & prestige
Instellingen|Settings
Speluitleg|How to play
EEN HENGEL. DUIZEND MOGELIJKHEDEN.|ONE ROD. A THOUSAND POSSIBILITIES.
De oever roept.|The bank is calling.
Bouw je visimperium, één vangst tegelijk.|Build your fishing empire, one catch at a time.
VISSEN GEVANGEN|FISH CAUGHT
HENGELS BESCHIKBAAR|ROD SLOTS AVAILABLE
TOTAAL VERDIEND|TOTAL EARNED
OFFLINE VOORTGANG|OFFLINE PROGRESS
Plan je sessie|Plan your session
SESSIE ACTIEF|SESSION ACTIVE
Resterende sessietijd|Session time remaining
Sessie stoppen|Stop session
Kies je uitrusting en water. Wij rekenen uit wat je nodig hebt.|Choose your tackle and water. We will calculate what you need.
Loadout voor je sessie|Loadout for your session
VISWATER|WATER
Viswater kiezen|Choose a water
Reserve voor aas & voer|Bait & groundbait reserve
Voerreserve|Groundbait reserve
JE PAKLIJST|YOUR PACKING LIST
Lokvoer|Groundbait
Haakaas|Hookbait
Liquids & toevoegingen|Liquids & additives
Bij te kopen|To buy
Waarde|Value
Uit je voorraad|From your inventory
Zelfgemaakte rigs|Crafted rigs
Nog te maken:|Still to craft:
Klaar voor je sessie|Ready for your session
Waarde is inclusief je reserve. Alleen ontbrekende voorraad wordt gekocht; de kopjes tellen die kosten bij elkaar op.|Value includes your reserve. Only missing supplies are purchased; each heading totals those costs.
Vispas|Fishing licence
Ontbrekende voorraad|Missing supplies
Charterboot|Charter boat
Nu te betalen|Total due now
Je sessie loopt|Session in progress
Inkopen & sessie starten|Buy supplies & start session
Voorraad aanvullen|Top up supplies
Aan de waterkant|At the water's edge
ACTIVITEIT|ACTIVITY
Je eerste vangst krijgt hier|Your first catch gets
een plek in het verhaal.|a place in the story here.
nieuw record|new record
zelf aangeslagen|hooked manually
JE VOLGENDE HOOFDSTUK|YOUR NEXT CHAPTER
JOUW MANIER VAN VISSEN|YOUR WAY TO FISH
Een goede set maakt het verschil.|A good setup makes all the difference.
Bewaar tot 12 loadouts. Hengels en molens koop je per stuk; lijn- en haaksets zijn herbruikbaar.|Save up to 12 loadouts. Buy rods and reels individually; line and hook sets are reusable.
IN BEZIT|OWNED
Je huidige sessie gebruikt een kopie van je startuitrusting. Veranderingen hieronder gelden voor je volgende sessie.|Your current session uses a copy of your starting tackle. Changes below apply to your next session.
Opgeslagen loadouts|Saved loadouts
Nieuwe loadout|New loadout
NAAM VAN JE LOADOUT|LOADOUT NAME
Naam loadout|Loadout name
Hengel toevoegen|Add rod
Verwijderen|Delete
Loadout opslaan|Save loadout
HENGEL|ROD
MOLEN|REEL
HOOFDLIJN|MAIN LINE
HAAK|HOOK
MONTAGE|TERMINAL TACKLE
AAS|BAIT
AASCOMBINATIE|BAIT COMBINATION
ZELFGEMAAKTE RIG|HANDMADE RIG
BEETMELDER|BITE INDICATOR
Vrijloopspoel (standaard)|Baitrunner spool (standard)
Standaardsignaal|Standard indicator
Geen liquid|No liquid
Geen extra rig|No extra rig
Hengel verwijderen|Remove rod
Koop passend materiaal|Buy suitable tackle
Trekkracht|Breaking strain
Haakbereik|Hook weight range
Beetkans|Bite chance
ONTDEK EEN NIEUWE OEVER.|DISCOVER A NEW BANK.
Een wereld aan water.|A world of waters.
Kies je volgende bestemming. Iedere stek heeft zijn eigen vissen, niveau en vispas.|Choose your next destination. Each water has its own species, level and fishing licence.
JOUW VOLGENDE STEK|YOUR NEXT FISHING SPOT
Kies je water.|Choose your water.
Vispassen|Fishing licences
Vispas geldig|Licence valid
Vispas verlopen|Licence expired
GESELECTEERD|SELECTED
Selecteren|Select
Hier vissen|Fish here
Plan hier je sessie|Plan a session here
EEN BEETJE SPANNING AAN DE OEVER.|A LITTLE COMPETITION ON THE BANK.
Vissen voor de beker.|Fishing for the cup.
Totaal gevangen gewicht bepaalt je positie. Je speelt tegen vijf computervissers; alleen vangsten in het wedstrijdwater tellen.|Your total catch weight determines your position. You compete against five computer anglers; only catches at the competition water count.
Plan een wedstrijdsessie|Plan a competition session
Tussenstand|Standings
SIMULATIE|SIMULATION
Prijs innen|Claim prize
Uitslag opslaan|Save result
Goud|Gold
Zilver|Silver
Brons|Bronze
INSCHRIJFGELD|ENTRY FEE
Wedstrijd actief|Competition active
Inschrijven|Enter competition
Vorige uitslagen|Previous results
OVERWINNINGEN|WINS
WEDSTRIJD|COMPETITION
PLAATS|POSITION
GEWICHT|WEIGHT
PRIJS|PRIZE
MAAK VAN JE BESTE VANGST EEN TOEKOMST.|GIVE YOUR BEST CATCH A FUTURE.
Een eigen stukje water.|A water of your own.
Investeer in een visbestand dat blijft groeien en een plek waar vissers graag komen.|Invest in a growing fish population and a place anglers love to visit.
Van gast aan de oever|From a guest on the bank
naar eigenaar van het water.|to the owner of the water.
Koop een eigen visplas, zet je beste vangsten uit en bouw een aantrekkelijke populatie op. Vanaf twee vissen van dezelfde soort komt er iedere zes uur een nakomeling bij. Gesimuleerde bezoekers betalen voor een visdag.|Buy your own lake, stock your best catches and build an attractive fish population. With at least two fish of the same species, one offspring is born every six hours. Simulated visitors pay to fish for the day.
Een eigen oever. Een blijvende bron van inkomsten.|Your own bank. A lasting source of income.
Naam wijzigen|Rename
VISPOPULATIE|FISH POPULATION
NETTO PER UUR|NET PER HOUR
BEZOEKERS|VISITORS
GEKWEEKT|BRED
Jouw visbestand|Your fish stock
De eerste bewoners ontbreken.|Your first residents are waiting.
Ga naar Sessies & vangsten en zet je beste zoetwatervissen uit. Twee van dezelfde soort starten de kweek.|Go to Sessions & catches and stock your best freshwater fish. Two of the same species start breeding.
Naar je vangsten|View your catches
Ruimte voor groei|Room to grow
INVESTERING|INVESTMENT
Meer soorten, grotere recordvissen en meer bewoners trekken extra bezoekers. De inkomsten zijn al verminderd met dagelijkse verzorging en onderhoud.|More species, bigger record fish and a larger population attract more visitors. Income already includes the cost of daily care and maintenance.
VOLGENDE KWEEKRONDE|NEXT BREEDING CYCLE
JE VISWATER IS MAXIMAAL UITGEBREID|YOUR FISHERY IS FULLY EXPANDED
DE HORIZON IS JE VOLGENDE INVESTERING.|THE HORIZON IS YOUR NEXT INVESTMENT.
Van hengel naar handelsvloot.|From fishing rod to commercial fleet.
Koop maximaal tien boten. Verhuur ze voor doorlopende inkomsten of stuur je bemanning op een betaalde visreis.|Buy up to ten boats. Rent them out for ongoing income or send your crew on a paid fishing trip.
BOTEN IN JE VLOOT|BOATS IN YOUR FLEET
VLOOTKAS|FLEET ACCOUNT
VERHUURD|RENTED OUT
OP VISREIS|ON A FISHING TRIP
Vlootopbrengst innen|Collect fleet income
JE VIST HIER|YOU ARE FISHING HERE
IN DE HAVEN|IN PORT
Haven|Port
Verhuren|Rent out
Visreis|Fishing trip
Je vloot uitbreiden|Expand your fleet
GROTE INVESTERINGEN. GROTE MOGELIJKHEDEN.|BIG INVESTMENTS. BIG OPPORTUNITIES.
Zet koers naar een|Set sail for a
groter imperium.|larger empire.
Vanaf level 120 kun je een charter huren voor zeevissen. Vanaf level 150 koop je je eigen schepen. Een vrije boot bespaart de charterkosten van je sessie. Bootverhuur en bemanningsreizen leveren aparte inkomsten op.|Hire a sea-fishing charter from level 120. Buy your own boats from level 150. An available boat saves your session's charter fee. Boat rentals and crew fishing trips earn additional income.
Deze boot is ingezet voor je lopende vissessie.|This boat is being used for your current fishing session.
Vrij voor zeevissen, verhuur of een visreis.|Available for sea fishing, rental or a crew fishing trip.
Boot kopen|Buy boat
EEN LANGE WEG LANGS HET WATER.|A LONG JOURNEY ALONG THE WATER.
Van eerste worp tot oeverlegende.|From your first cast to a legend of the bank.
300 levels, steeds moeilijkere hengelplaatsen en nieuwe bronnen van inkomsten. Jij bepaalt wanneer je een nieuw seizoen begint.|300 levels, increasingly challenging rod slots and new sources of income. You decide when to start a new season.
VISLEVEL|FISHING LEVEL
ERVARINGSPUNTEN|EXPERIENCE POINTS
WEDSTRIJDEN GEWONNEN|COMPETITIONS WON
PRESTIGESEIZOEN|PRESTIGE SEASON
EEN NIEUW SEIZOEN|A NEW SEASON
Neem je kennis mee.|Take your knowledge with you.
Vanaf level 100 kun je vrijwillig opnieuw beginnen. Je krijgt één prestigepunt per 50 bereikte levels.|From level 100, you can choose to start again. You receive one prestige point for every 50 levels reached.
Opnieuw: vislevel, geld, materiaal, voorraad, hengelplaatsen, loadouts en winkelupgrades.|Reset: fishing level, money, tackle, supplies, rod slots, loadouts and shop upgrades.
Behouden: rigbouwvaardigheid, soortenboek, records, totale statistieken, eigen viswater, vloot en prestigebonussen.|Keep: rig-building skill, species journal, records, lifetime statistics, fishery, fleet and prestige bonuses.
Je viswater en verhuurde boten blijven inkomsten opleveren. Actieve visreizen, sessies, werkopdrachten en wedstrijden moeten eerst klaar zijn.|Your fishery and rented boats keep earning income. Finish active fishing trips, sessions, work orders and competitions first.
Beschikbaar vanaf level 100.|Available from level 100.
Rond actieve werkzaamheden eerst af.|Finish your active work first.
Je kunt je reset eerst bekijken en daarna bevestigen.|Review your reset before confirming it.
Blijvende kennis|Permanent knowledge
Ervaring|Experience
Watergevoel|Water instinct
Handelskennis|Market knowledge
Jouw soortenboek|Your species journal
ONTDEKT|DISCOVERED
Nog niet gevangen|Not caught yet
JE IMPERIUM. VEILIG BEWAARD.|YOUR EMPIRE. SAFELY SAVED.
Maak het jouw visdag.|Make it your fishing day.
Je spel staat in deze browser. Download regelmatig een opslagbestand om je voortgang mee te nemen naar een ander apparaat.|Your game is saved in this browser. Download a save file regularly to carry your progress to another device.
Spel & opslag|Game & save data
LOKAAL|LOCAL
Geluiden aan de waterkant|Sounds at the water's edge
Feederbel, aflopende vrijloopspoel, beetpieper of molenratel. Welke je hoort hangt af van de visstijl en uitgeruste beetmelder.|A feeder bell, running baitrunner spool, bite alarm or reel ratchet. What you hear depends on your fishing style and equipped bite indicator.
Automatisch verkopen|Automatic selling
Verkoop elke nieuwe vangst meteen. Beschermde trofeeën blijven tijdens je sessie aan het water voor je eigen keuze. Direct verkochte vissen kun je achteraf niet meer terugzetten of overzetten. De permanente upgrade komt vrij op level 15.|Sell each new catch immediately. Protected trophies stay at the water during your session for you to decide. Fish already sold cannot be released or transferred later. The permanent upgrade unlocks at level 15.
Trofeeën beschermen|Protect trophies
Bescherm vissen die minstens 85% van het maximale soortgewicht halen. Deze bescherming geldt voor de automatische vismarkt. Bij de sessieafhandeling kies je zelf een bestemming voor iedere trofee.|Protect fish weighing at least 85% of the species' maximum weight. This applies to automatic selling. When settling a session, you decide what happens to each trophy.
Rustige weergave|Reduced motion
Minder beweging in het water en in de interface.|Reduce movement in the water and interface.
Opslagbestand downloaden|Download save file
Een volledige kopie van je voortgang, loadouts, vispassen en eigendommen. Bewaar dit bestand om op een ander apparaat verder te gaan.|A complete copy of your progress, loadouts, licences and property. Keep this file to continue on another device.
Opslagbestand laden|Load save file
Laadt een eerder gedownload JSON-bestand. Je krijgt een bevestiging voordat je huidige spel wordt vervangen.|Load a previously downloaded JSON file. You will be asked to confirm before your current game is replaced.
Laden|Load
Offline voortgang|Offline progress
Hoe bouw je je visimperium?|How do you build your fishing empire?
Deze versie werkt als lokale idle-game met gesimuleerde wedstrijden en bezoekers. Wanneer je hem via HTTPS host, ondersteunt de broncode installatie als webapp. Accounts, cloudopslag, online spelers en appwinkelpublicatie zijn nog geen onderdeel van deze versie.|This version is a local idle game with simulated competitions and visitors. When hosted over HTTPS, the source supports installation as a web app. Accounts, cloud saves, online players and app-store publishing are not included in this version.
Bouw een loadout|Build a loadout
Plan een sessie|Plan a session
Laat de lijnen werken|Let your lines work
Lees de echte beet|Read the real bite
Kies de juiste haak|Choose the right hook
Kies wat je met je vangst doet|Decide what to do with your catch
Bouw iets blijvends|Build something lasting
Je krijgt een feeder-, karper- en dobberset. Begin met één hengel. Op level 10, 40, 90, 170 en 300 kun je de volgende hengelplaats kopen. Maximaal 2 feeders, 3 karperhengels, 1 dobber of 3 zeehengels, samen nooit meer dan 6.|You start with feeder, carp and float setups and one rod slot. Buy additional slots at levels 10, 40, 90, 170 and 300. Use up to 2 feeder rods, 3 carp rods, 1 float rod or 3 sea rods, with at most 6 rods in total.
Kies je water en stel met één schuifregelaar de duur van je sessie én vispas in. De paklijst rekent voer en aas uit met je gekozen reserve. Starten koopt de ontbrekende voorraad en passende vispas in één keer.|Choose your water and set both session and licence duration with one slider. The packing list calculates bait and groundbait including your chosen reserve. Starting buys your missing supplies and matching licence together.
De game vist automatisch. Verzorg je stek met actieve tikken om de volgende worp 2,5 seconden te vervroegen. Je aandacht herstelt elke 10 seconden. Zonder sessie kun je de stek opruimen voor € 0,10 per tik; zo kun je altijd weer genoeg voor een vispas verdienen.|Fishing runs automatically. Tend your spot with active clicks to bring the next cast forward by 2.5 seconds. Focus recovers every 10 seconds. Outside a session, clean the bank for €0.10 per click to earn enough for another licence.
Korte tikjes zijn voorbeten. Bij een doorgebogen feedertop, aflopende karperspoel of duikende dobber sla je aan met de hengelknop, 1–6 of spatie. Je kunt de assistent vóór zijn of zijn gemiste aanslag redden. Een snelle aanslag geeft meer XP en een kortere volgende worp. Geluid zet je zelf aan; belletjes, piepers en neon/glow-antennes koop en monteer je per hengel.|Short taps are tentative nibbles. When the feeder tip bends, the carp spool runs or the float dives, strike using the rod button, 1–6 or Space. Beat the assistant or rescue a bite it missed. A quick strike earns extra XP and an earlier next cast. Enable audio yourself; buy and fit bells, alarms and neon/glow tips to each rod.
Iedere haak selecteert een gewichtsklasse. Een te grote haak mist kleine vissen; een te kleine haak mist grote vissen. Je lijn en hengel moeten het visgewicht ook aankunnen. Aas, cocktails, liquids en rigs verhogen passende kansen.|Each hook targets a weight range. Oversized hooks miss small fish; undersized hooks miss large fish. Your line and rod must also handle the fish's weight. Bait, combinations, liquids and rigs improve suitable chances.
Bij Sessies & vangsten kies je per vis verkopen, terugzetten voor bonus-XP of overzetten naar je eigen water. Tijdens het vissen kun je keuzes alvast verwerken. Na afloop geef je alle vissen een bestemming voordat je vertrekt. Verkoop rigs voor extra inkomen en doe mee aan wedstrijden tegen computervissers. Je kunt tegelijkertijd vissen en werken aan een batch onderlijnen.|In Sessions & catches, choose to sell, release for bonus XP or transfer each fish to your fishery. You can process choices while fishing. When the session ends, settle all fish before leaving. Sell rigs for extra income and compete against computer anglers. You can fish and craft a batch of rigs at the same time.
Vanaf level 80 koop je een viswater. Twee bewoners van dezelfde zoetwatersoort beginnen een kweek. Vanaf level 150 bouw je een vloot. Prestige op level 100+ geeft blijvende bonussen en opent later speciale uitbreidingen.|Buy a fishery from level 80. Two residents of the same freshwater species start breeding. Build a fleet from level 150. Prestige at level 100+ grants permanent bonuses and opens special expansions later.
Oeverlegende|Legend of the bank
Visondernemer|Fishing entrepreneur
Meester aan de oever|Master angler
Ervaren sportvisser|Experienced angler
Waterkenner|Water expert
Beginnend visser|Beginner angler
Geen sessie actief|No active session
Je eerste hoofdstuk begint met een sessie.|Your first chapter begins with a session.
Lokaal opgeslagen|Saved locally
Opslag niet beschikbaar|Saving unavailable
Je voortgang wordt automatisch bewaard|Your progress is saved automatically
Gebruik Download opslag om je voortgang te bewaren|Use Download save to keep your progress
Annuleren|Cancel
Je opslagbestand is gedownload.|Your save file has been downloaded.
Een visimperium begint klein.|A fishing empire starts small.
Naar de oever|Back to the bank
Je sessie beëindigen?|End your session?
Na het stoppen kies je voor elke vangst: verkopen, terugzetten voor XP of naar je eigen viswater. Pas daarna kun je vertrekken. Je ongebruikte voorraad en de resterende geldigheid van je vispas blijven behouden.|After stopping, choose to sell, release for XP or transfer every catch to your fishery. Then you can leave. Unused supplies and remaining licence validity are kept.
Hengelplaats kopen|Buy rod slot
Je kunt maximaal twaalf loadouts bewaren.|You can save up to twelve loadouts.
Loadout verwijderen?|Delete loadout?
Een eigen viswater kopen?|Buy your own fishery?
Je investeert € 25.000 in je eigen visplas. Het water begint leeg. Zet tijdens je volgende sessie vissen uit om bezoekersinkomsten en kweek te starten.|Invest €25,000 in your own lake. It starts empty. Stock fish during your next session to start breeding and earn visitor income.
Viswater kopen|Buy fishery
Je viswater uitbreiden?|Expand your fishery?
Uitbreiden|Expand
Hoe heet jouw viswater?|What is your fishery called?
NAAM VAN JE VISWATER|FISHERY NAME
Naam opslaan|Save name
Een nieuw seizoen beginnen?|Start a new season?
Nieuw seizoen beginnen|Start new season
Dit bestand is te groot voor een spelopslag.|This file is too large for a game save.
Opgeslagen imperium laden?|Load a saved empire?
Dit vervangt je huidige spel door de inhoud van het geselecteerde opslagbestand. Download eerst een kopie als je de huidige voortgang wilt bewaren.|This replaces your current game with the selected save file. Download a copy first if you want to keep your current progress.
Opslag laden|Load save
Welkom terug aan de oever.|Welcome back to the bank.
DIRECT VERDIEND|EARNED DIRECTLY
Verder bouwen|Keep building
Beetgeluiden uit.|Bite sounds off.
Beetgeluiden aan. De uitgeruste beetmelders bepalen wat je hoort.|Bite sounds on. Your equipped indicators determine what you hear.
Deze browser kan het geluid nu niet starten.|This browser cannot start audio right now.
Een neon- of glow-antenne is een zichtbare beetmelder.|A neon or glow tip is a visual bite indicator.
Deze browser kan het voorbeeldgeluid niet starten.|This browser cannot play the sound preview.
Geluid aan ✓|Sound on ✓
Geluid activeren|Activate sound
Geluid inschakelen|Enable sound
Klaar|Ready
Beet!|Bite!
Red de beet!|Rescue the bite!
Tikjes|Nibbles
Geland|Landed
Gemist|Missed
Wachten|Waiting
SESSIE AFGELOPEN|SESSION ENDED
JE STEK IS KLAAR|YOUR SPOT IS READY
Vangsten afhandelen ↓|Settle catches ↓
Sessie plannen|Plan session
Red de beet — aanslaan!|Rescue the bite — strike!
Nu aanslaan!|Strike now!
Tikjes — nog wachten|Nibbles — keep waiting
Vis geland!|Fish landed!
Beet gemist|Bite missed
Wachten op een beet|Waiting for a bite
Handel alle sessievangsten af|Settle all session catches
Let op de dunne top: tikjes worden een doorbuiging.|Watch the fine tip: nibbles develop into a bend.
Volg de dobber: sla aan wanneer hij onderduikt.|Watch the float: strike when it dives.
Let op de molen: bij een run loopt de spoel af.|Watch the reel: the spool runs when a fish takes off.
Je blijft aan de stek tot elke vis verkocht, teruggezet of overgezet is.|Stay at the water until every fish is sold, released or transferred.
Kies je water en uitrusting. Je assistent vist straks met je mee.|Choose your water and tackle. Your assistant will fish alongside you.
De assistent mist. Je kunt de vis nog zelf haken!|The assistant missed. You can still hook the fish yourself!
De beet zet door. Klik hier, op je hengel of druk spatie.|The bite develops. Click here, click your rod or press Space.
Een kort tikje. Wacht tot de beet echt doorzet.|A short tap. Wait for the bite to develop.
Beetvoorbeeld actief…|Bite preview running…
Beetvoorbeeld ▷|Preview bite ▷
WACHT OP EEN BEET|WAITING FOR A BITE
VOORBEET · NOG WACHTEN|NIBBLES · KEEP WAITING
BEET! SLA NU AAN|BITE! STRIKE NOW
ASSISTENT MIST — RED DE BEET|ASSISTANT MISSED — RESCUE THE BITE
MOOI GELAND|NICELY LANDED
BEET GEMIST|BITE MISSED
TE VROEG · OPNIEUW INLEGGEN|TOO EARLY · RECASTING
DE BEET VERTELT HET VERHAAL|THE BITE TELLS THE STORY
Live aan je lijnen|Your lines, live
Visstand|Fishing mode
Ontspannen|Relaxed
Actief opletten|Active fishing
Vrijloopspoel · standaard|Baitrunner spool · standard
Quivertop · standaard|Quiver tip · standard
Klassieke dobber|Classic float
Molenratel|Reel ratchet
Start eerst je sessie|Start a session first
Je assistent vist automatisch mee.|Your assistant fishes automatically.
Hier lees je straks de beet van deze hengel.|You will see this rod's bite here.
ZELF GEVANGEN|CAUGHT MANUALLY
DOOR ASSISTENT|BY THE ASSISTANT
BETEN GERED|BITES RESCUED
BETEN GEMIST|BITES MISSED
Ook in idle kun je op tijd zelf aanslaan. De assistent blijft werken als je weg bent.|You can strike manually in idle mode too. The assistant keeps working while you are away.
Hengel|Rod
Molen|Reel
Lijn|Line
Haak|Hook
Aas|Bait
Beetmelder|Bite indicator
Veilige setgrens|Safe setup limit
Assistent|Assistant
Aanslagtijd|Strike window
Klik een onderdeel in de tekening of de kaartjes om het hieronder aan te passen. Een beetvoorbeeld verandert je sessie niet.|Click a part in the drawing or its card to adjust it below. A bite preview does not affect your session.
Lopende sessie|Current session
Geplande loadout|Planned loadout
WEET WAT ER ONDER WATER GEBEURT|KNOW WHAT HAPPENS UNDERWATER
Je vangstkansen uitgelegd|Your catch chances explained
Berekening voor|Calculate for
Bron voor vangstkansen|Source for catch forecast
Hengel voor vangstkansen|Rod for catch forecast
Alle hengels samen|All rods combined
AUTOMATISCH|AUTOMATIC
Inclusief gemiste aanslagen|Includes missed strikes
ACTIEF AANSLAAN|MANUAL STRIKES
VIS-XP PER UUR|FISHING XP PER HOUR
Automatisch → actief|Automatic → active
BRUTO VISWAARDE|GROSS FISH VALUE
Welke vis kun je landen?|Which fish can you land?
Aandeel = aandeel in je verwachte automatische vangsten|Share = proportion of your expected automatic catches
VISSOORT|SPECIES
AANDEEL VANGST|CATCH SHARE
PER 100 WORPEN|PER 100 CASTS
LANDBARE MAAT|LANDABLE WEIGHT
AUTO / ACTIEF PER UUR|AUTO / ACTIVE PER HOUR
WAAROM?|WHY?
Niet landbaar|Cannot be landed
Zo werkt je set|How your setup works
Bekijk de beperking|View the limitation
Verdeling van het vangstgewicht|Catch weight distribution
Van de vissen die je automatisch landt|Of the fish you land automatically
Gewichtsklassen van verwachte vangsten|Weight classes of expected catches
Met deze combinatie is geen vis landbaar. Bekijk de beperkingen in de tabel.|This combination cannot land any fish. Check the limitations in the table.
De stappen van een vangst|The stages of a catch
Echte beet → soortselectie → passende maat → aanslag|Real bite → species selection → suitable weight → strike
Echte beet/worp|Real bite/cast
Past bij haak & lijn|Fits hook & line
Assistent reageert|Assistant reacts
Bekijk beetbonussen en materiaalgrenzen|View bite bonuses and tackle limits
Beetkans maximaal 97%. Aasvoorkeur beïnvloedt de relatieve soortselectie apart van deze beetkans.|Bite chance is capped at 97%. Bait preference affects relative species selection separately from this bite chance.
Dit zijn verwachtingen van het spelmodel. Een individuele sessie kan hoger of lager uitvallen. Vis die niet bij je haak of veilige setgrens past, wordt ook bij snel aanslaan niet ineens landbaar.|These are expectations from the game model. Individual sessions may be better or worse. A fast strike cannot land a fish outside your hook range or safe setup limit.
Interactieve visstek|Interactive fishing spot
Je hengels aan de waterkant|Your rods at the water's edge
SESSIE AFGELOPEN · ROND JE VANGSTEN AF|SESSION ENDED · SETTLE YOUR CATCHES
KLAAR VOOR EEN NIEUWE SESSIE|READY FOR A NEW SESSION
SPATIE|SPACE
Je assistent vist mee. Jij houdt de beet in de gaten.|Your assistant fishes alongside you. Watch for the bite.
Plan rechts een sessie om je hengel in te leggen.|Plan a session on the right to cast your rod.
Stek verzorgen|Tend your spot
Stek opruimen|Clean the bank
Volgende worp eerder|Bring the next cast forward
+ € 0,10 voor de visclub|+ €0.10 from the fishing club
Hengel in beeld|Rod in view
De assistent vist mee. Je kunt altijd zelf aanslaan.|The assistant fishes alongside you. You can always strike manually.
Actief|Active
Na je eigen vangst leg je 35% eerder opnieuw in.|After a manual catch, you recast 35% sooner.
VANGSTEN|CATCHES
TOTAAL GEWICHT|TOTAL WEIGHT
ZELF GELAND|LANDED MANUALLY
Beet gered|Bite rescued
Zelf aangeslagen|Hooked manually
Eerdere vangst|Earlier catch
Trofee|Trophy
Persoonlijk record ·|Personal best ·
VOOR JE HET WATER VERLAAT|BEFORE YOU LEAVE THE WATER
DEZE SESSIE|THIS SESSION
LAATSTE SESSIE|LAST SESSION
Rond je sessie af|Settle your session
Je vangsten|Your catches
Alle sessies & vangsten ↗|All sessions & catches ↗
Verkopen is voorgeselecteerd. Pas je keuzes aan en handel alle vissen af.|Selling is selected by default. Adjust your choices and settle every fish.
Verkopen staat standaard aan. Pas je keuzes aan en verwerk ze hieronder.|Selling is selected by default. Adjust your choices and process them below.
Je laatst gevangen vissen, nieuwste bovenaan.|Your recent catches, newest first.
Totale vangstwaarde|Total catch value
VANGST|CATCH
WAARDE|VALUE
TIJD / XP|TIME / XP
JOUW KEUZE|YOUR CHOICE
Meer vangsten tonen|Show more catches
Je eerste vangst verschijnt hier.|Your first catch will appear here.
Houd je lijnen in de gaten. Kies hier na elke vangst of je verkoopt, terugzet voor XP of overzet.|Watch your lines. After each catch, choose to sell, release for XP or transfer it here.
Start een sessie en houd je lijnen in de gaten. Daarna kies je hier wat je met je vissen doet.|Start a session and watch your lines. Then choose what to do with your fish here.
Vangstkeuzes verwerken|Process catch choices
Verkocht|Sold
Nog af te handelen|Awaiting settlement
In je eigen viswater|In your fishery
Teruggezet|Released
Automatisch verkocht|Automatically sold
Keuze voor alle openstaande vangsten|Choice for all pending catches
Alles verkopen|Sell all
Alles terugzetten voor XP|Release all for XP
Alles naar eigen vijver|Transfer all to fishery
Alles deselecteren|Deselect all
Alle zoetwatervissen overzetten naar je eigen vijver.|Transfer all freshwater fish to your fishery.
Koop eerst je eigen viswater vanaf level 80.|Buy your own fishery from level 80 first.
Eigen viswater vanaf level 80|Fishery available from level 80
Niet meer aan het water|No longer at the water
Kies wat je doet…|Choose an action…
Verkopen|Sell
Terugzetten|Release
Naar eigen viswater|Transfer to fishery
Kies voor elke vis|Choose for every fish
Afhandelen & water verlaten|Settle & leave the water
Gekozen vissen verwerken|Process selected fish
VOOR JE VERTREKT|BEFORE YOU LEAVE
JOUW KEUZES|YOUR CHOICES
Handel alle vissen af om dit water te verlaten. Je kunt geen vissen meenemen.|Settle every fish before leaving this water. You cannot take fish away.
Vissen zonder keuze blijven aan dit water tot je ze afhandelt.|Fish without a choice stay at this water until you settle them.
Verwerk je geselecteerde vangsten.|Process your selected catches.
JE SESSIE IS AFGELOPEN|YOUR SESSION HAS ENDED
ELKE VANGST TELT|EVERY CATCH COUNTS
Rond je sessie af.|Settle your session.
Sessies & vangsten.|Sessions & catches.
Kies voor elke vis: verkopen, terugzetten voor XP of overzetten naar je eigen viswater. Handel alles af voordat je het water verlaat.|For every fish, choose to sell, release for XP or transfer to your fishery. Settle everything before leaving the water.
Verkopen is voorgeselecteerd. Verander per vis of voor alles tegelijk de bestemming en verwerk daarna je keuzes.|Selling is selected by default. Change the action for each fish or all at once, then process your choices.
Naar de waterkant ↗|Back to the water ↗
Per sessie|By session
Openstaande vangsten|Pending catches
Handel eerst alle vangsten af|Settle all catches first
SESSIE BEKIJKEN|VIEW SESSION
Sessie voor vangstlijst|Session for catch list
Laatste sessie|Last session
Deze sessie loopt. Nieuwe vangsten komen erbij.|This session is running. New catches will be added.
Sessie afgerond.|Session complete.
Start je eerste sessie aan de waterkant.|Start your first session at the water.
Tot 8 recente sessies blijven in je vangstgeschiedenis staan.|Your catch history stores up to 8 recent sessions.
Deze vissen moeten allemaal een bestemming krijgen voordat je een nieuwe sessie kunt starten.|Settle all these fish before starting a new session.
Hier staan alle vissen die nog aan het water wachten op je keuze.|All fish still waiting at the water for your decision appear here.
Terugzetten geeft 20% bonus-XP, met minimaal 3 XP per vis. Je kunt geen vissen meenemen naar een volgende sessie.|Releasing earns 20% bonus XP, with at least 3 XP per fish. You cannot carry fish into your next session.
NOG AF TE HANDELEN|AWAITING SETTLEMENT
GEVANGEN IN DEZE SESSIE|CAUGHT THIS SESSION
BRUTO VANGSTWAARDE|GROSS CATCH VALUE
NOG AAN HET WATER|STILL AT THE WATER
GEEF ELKE VIS EEN BESTEMMING|CHOOSE AN ACTION FOR EVERY FISH
JOUW EERSTE SESSIE|YOUR FIRST SESSION
Wat doe je met je vissen?|What will you do with your fish?
Hier begint je vangstverhaal|Your catch story starts here
LIVE VANGSTLIJST|LIVE CATCH LIST
OPENSTAAND|PENDING
NOG GEEN SESSIE|NO SESSION YET
GEVANGEN|CAUGHT
Alle vangsten zijn afgehandeld.|All catches have been settled.
Je volgende vangst komt hier.|Your next catch will appear here.
Er liggen geen vissen meer op je keuze te wachten.|No fish are waiting for your decision.
Start een sessie of laat je hengels even hun werk doen.|Start a session or let your rods do their work.
Automatische vismarkt staat aan: die vangsten zijn direct verkocht. Zet dit uit bij Instellingen als je per vis wilt kiezen.|Automatic selling is enabled: those catches are sold immediately. Disable it in Settings to choose for each fish.
Verkopen, terugzetten of uitzetten gebeurt pas als je hieronder je keuzes verwerkt.|Fish are only sold, released or stocked when you process your choices below.
SESSIE & VISPAS|SESSION & LICENCE
DEZELFDE DUUR|SAME DURATION
Duur van je sessie en vispas|Session and licence duration
Bodem & voerkorf|Bottom fishing & feeder
Karper|Carp
Boilies & geduld|Boilies & patience
Dobber|Float
Licht & precies|Light & precise
Zee|Sea
Diep water & grote vis|Deep water & big fish
voerkorf|feeder basket
zee-montage|sea rig
Meer draagkracht en efficiënter vissen.|More lifting power and more efficient fishing.
Betere controle en een hogere landingskans.|Better control and a higher landing chance.
Een verfijnde montage voor deze visstijl.|Refined terminal tackle for this fishing style.
Trekkracht begrenst de vis die je veilig kunt landen.|Breaking strain limits the fish you can safely land.
Fijne haak #16|Fine-wire hook #16
Grote haken selecteren grotere vis.|Large hooks select larger fish.
Dubbel topbelletje|Twin tip bell
LED quiverclip & bel|LED quiver clip & bell
Digitale beetpieper|Digital bite alarm
Draadloze pieperset|Wireless alarm set
Neon antenne|Neon tip
Glow-in-the-dark topje|Glow-in-the-dark tip
Offshore lijnalarm|Offshore line alarm
Rinkelend belletje bij een echte feederbeet. +6 procentpunt assistentreactie en 0,8s extra aanslagtijd.|A ringing bell for a real feeder bite. +6 percentage points to assistant reaction and 0.8s extra strike time.
Een lichtclip met dubbel belletje. +13 procentpunt assistentreactie en 1,3s extra aanslagtijd.|An illuminated clip with twin bells. +13 percentage points to assistant reaction and 1.3s extra strike time.
Een pieper en LED bij een run. +8 procentpunt assistentreactie en 1,2s extra aanslagtijd.|An alarm and LED during a run. +8 percentage points to assistant reaction and 1.2s extra strike time.
Een gevoeligere pieper met ontvanger. +16 procentpunt assistentreactie en 2s extra aanslagtijd.|A more sensitive alarm with receiver. +16 percentage points to assistant reaction and 2s extra strike time.
Een goed zichtbaar neon topje. +4 procentpunt assistentreactie en 0,7s extra aanslagtijd.|A highly visible neon tip. +4 percentage points to assistant reaction and 0.7s extra strike time.
Een oplichtende antenne met halo. +8 procentpunt assistentreactie en 1,4s extra aanslagtijd.|A glowing antenna with halo. +8 percentage points to assistant reaction and 1.4s extra strike time.
Een krachtige ratel bij een zeebeet. +12 procentpunt assistentreactie en 1,5s extra aanslagtijd.|A strong ratchet during a sea-fishing bite. +12 percentage points to assistant reaction and 1.5s extra strike time.
Allround lokvoer|All-round groundbait
Grondvoer voor je stek.|Groundbait for your spot.
Maden|Maggots
Zoete maïs|Sweetcorn
Wormen|Worms
Spekblokjes|Bacon cubes
Aasvis|Baitfish
Inktvis|Squid
Verse krill|Fresh krill
Onderlijnmateriaal|Hooklink material
Materiaal voor zelfgemaakte rigs.|Materials for handmade rigs.
Haken & wartels|Hooks & swivels
Onderdelen voor de werkbank.|Parts for the workbench.
Enkel aas|Single bait
Maïs + made|Corn + maggot
Worm + made|Worm + maggot
Boilie + maïs|Boilie + corn
Spek + worm|Bacon + worm
Inktvis + krill|Squid + krill
Blankvoorn|Roach
Ruisvoorn|Rudd
Brasem|Bream
Zeelt|Tench
Kroeskarper|Crucian carp
Schubkarper|Common carp
Spiegelkarper|Mirror carp
Winde|Ide
Barbeel|Barbel
Baars|Perch
Snoek|Pike
Graskarper|Grass carp
Europese meerval|Wels catfish
Siberische steur|Siberian sturgeon
Zeebaars|Sea bass
Kabeljauw|Cod
Atlantische heilbot|Atlantic halibut
Geelvintonijn|Yellowfin tuna
Blauwvintonijn|Bluefin tuna
Zwaardvis|Swordfish
Nederland|Netherlands
België|Belgium
Duitsland|Germany
Frankrijk|France
Roemenië|Romania
Noorwegen|Norway
Atlantische Oceaan|Atlantic Ocean
Tussen riet en polder|Between reeds and polder
Ruimte voor je eerste karper|Room for your first carp
Het groene hart van de Ardennen|The green heart of the Ardennes
Een oude arm van de Rijn|An old branch of the Rhine
Oude karpers in de Bourgogne|Old carp in Burgundy
Een labyrint van stil water|A maze of still water
Zout op je gezicht|Salt on your face
Koud water. Grote verwachtingen.|Cold water. Great expectations.
De blauwe horizon|The blue horizon
Voor de beste vissers van Europa|For Europe's finest anglers
EERSTE STEK|FIRST FISHING SPOT
KARPERWATER|CARP WATER
BOSMEER|FOREST LAKE
STROMEND WATER|FLOWING WATER
SPECIMENWATER|SPECIMEN WATER
TROFEEWATER|TROPHY WATER
ZEEVISSEN|SEA FISHING
DIEPZEE|DEEP SEA
LEGENDEWATER|LEGENDARY WATER
Luw water, lichte montages en de rust van een vroege ochtend.|Sheltered water, light rigs and the peace of an early morning.
Mosselbanken en diepe geulen. Een grotere haak opent nieuwe kansen.|Mussel beds and deep channels. A larger hook opens new opportunities.
Zoek de overgang tussen de lelies en de donkere bodem.|Find the transition between the lilies and the dark lakebed.
Zware voerkorven, sterke lijnen en de eerste echte krachtpatsers.|Heavy feeders, strong lines and your first powerful fish.
Grote karpers belonen een slimme combinatie van aas en rig.|Big carp reward a clever combination of bait and rig.
Hier wordt je materiaal getest door de grootste zoetwatervissen.|The largest freshwater fish will test your tackle here.
Gebruik zeehengels. Een eigen boot of ingehuurde charter is nodig.|Use sea rods. You need your own boat or a hired charter.
Diepe fjorden en zware heilbot. Een sterke voorslag is onmisbaar.|Deep fjords and heavy halibut. A strong leader is essential.
Je vloot en beste loadout krijgen toegang tot de Atlantische rijkdom.|Your fleet and best loadout gain access to the Atlantic's riches.
Een prestigebestemming voor een nieuwe generatie vislegendes.|A prestige destination for a new generation of fishing legends.
Nette onderlijn|Neat hooklink
Signature montage|Signature rig
Je eerste verkoopbare onderlijn. +6% beetkans voor een sessie.|Your first saleable hooklink. +6% bite chance for one session.
Preciezer geknoopt. +12% beetkans voor een sessie.|Tied with greater precision. +12% bite chance for one session.
Voorzichtig afgewerkt. +20% beetkans voor een sessie.|Carefully finished. +20% bite chance for one session.
Een sterke zee-onderlijn. +28% beetkans voor een sessie.|A strong sea-fishing leader. +28% bite chance for one session.
Jouw handtekening aan de haak. +40% beetkans voor een sessie.|Your signature on the hook. +40% bite chance for one session.
De ochtendbeker|The Morning Cup
CLUBWEDSTRIJD|CLUB COMPETITION
REGIONAAL|REGIONAL
LEGENDE|LEGEND
Polaroid vissersbril|Polarised fishing glasses
Stabiele verstelbare banksticks|Stable adjustable banksticks
Ruim schepnet & onthaakmat|Large landing net & unhooking mat
Training voor je visassistent|Fishing assistant training
Stille stek & camouflage|Quiet spot & camouflage
Grotere vangstopslag|Larger catch storage
Langere offline voortgang|Longer offline progress
Automatische vismarkt|Automatic fish market
Grotere werkbank|Larger workbench
Oeverroutine|Bankside routine
Meer contrast in de beetweergave en 0,8 seconde extra tijd om aan te slaan.|Higher contrast in bite signals and 0.8 seconds of extra strike time.
Efficiënter opnieuw inleggen: +3,5% worpsnelheid per upgrade.|More efficient recasting: +3.5% casting speed per upgrade.
Per niveau +0,8 procentpunt handmatig landen (max. 99,5%) en +4% handmatige vangst-XP.|Per rank: +0.8 percentage points to manual landing (max. 99.5%) and +4% manual catch XP.
De assistent mist minder echte beten: +5 procentpunt reactiekans per niveau.|The assistant misses fewer real bites: +5 percentage points to reaction chance per rank.
Minder verstoring bij je lijnen. +2 procentpunt echte beetkans per upgrade.|Less disturbance around your lines. +2 percentage points to real bite chance per upgrade.
Verdubbel je opslag per upgrade. Begin met 200 vangsten.|Double your storage with each upgrade. Start with 200 catches.
8 uur extra offline voortgang per upgrade, tot 48 uur.|8 additional hours of offline progress per upgrade, up to 48 hours.
Verkoop vangsten meteen. Trofeeën kun je uitzonderen.|Sell catches immediately. You can exclude trophies.
10 extra rigs per werkopdracht. Je begint met batches van 5.|10 extra rigs per work order. You start with batches of 5.
Twee extra actieve tikken opslaan, vanaf 6 energie.|Store two extra active clicks, starting at 6 energy.
Je eerste zakelijke schip. Verhuur of stuur de bemanning op vangst.|Your first commercial boat. Rent it out or send the crew fishing.
Grotere vangsten en een betrouwbaar charterinkomen.|Larger catches and reliable charter income.
Een investering voor een internationale visonderneming.|An investment in an international fishing business.
Het eerste verhaal|The first story
Een hengel, drie visstijlen en de Rietplas.|One rod, three fishing styles and De Rietplas.
Maak onderlijnen, verdien vakmanschap en verkoop rigs.|Craft hooklinks, develop your skills and sell rigs.
Doe mee aan wedstrijden tegen computervissers.|Enter competitions against computer anglers.
Twee lijnen in het water|Two lines in the water
Koop je tweede hengelplaats.|Buy your second rod slot.
Meer dan een hobby|More than a hobby
Nieuwe wateren en automatisch verkopen.|New waters and automatic selling.
De perfecte cocktail|The perfect combination
Combineer aas en bouw een grotere werkbank.|Combine baits and build a larger workbench.
Drie hengels|Three rods
Een complete meervoudige loadout.|A complete multi-rod loadout.
Een eigen stukje water|A water of your own
Koop je viswater, zet vis uit en ontvang bezoekers.|Buy your fishery, stock fish and welcome visitors.
Vier hengels|Four rods
Meer lijnen, grotere ambities.|More lines, bigger ambitions.
Een nieuw seizoen|A new season
Prestige: begin opnieuw met blijvende kennis.|Prestige: start again with permanent knowledge.
Voorbij de kust|Beyond the coast
Ontdek zeevissen en huur een charter.|Discover sea fishing and hire a charter.
Jouw eerste schip|Your first boat
Koop boten, verhuur ze of stuur ze op visreis.|Buy boats, rent them out or send them on fishing trips.
Vijf hengels|Five rods
Een uitrusting voor de gevorderde ondernemer.|Tackle for the advanced entrepreneur.
Atlantische rijkdom|Atlantic riches
Tonijn, zwaardvis en grote investeringen.|Tuna, swordfish and big investments.
Zes hengels. Eén imperium.|Six rods. One empire.
De moeilijkste hengelplaats en de titel Oeverlegende.|The hardest rod slot and the Legend of the bank title.
Basisbeetkans|Base bite chance
Materiaal|Tackle
Aascocktail|Bait combination
Zelfgemaakte rig|Handmade rig
Prestige watergevoel|Prestige water instinct
Je aas/cocktail geeft deze soort 3,5× selectieweging.|Your bait/combination gives this species 3.5× selection weight.
Geen aasvoorkeur: normale selectieweging.|No bait preference: normal selection weight.
De haak is te klein voor deze soort.|The hook is too small for this species.
De haak selecteert groter dan wat hier zwemt.|The hook selects fish larger than those found here.
Lijn en hengel kunnen het geselecteerde gewicht niet dragen.|The line and rod cannot handle the selected weight.
Lijn/hengelkracht sluit de zwaarste vissen uit.|Line/rod strength excludes the heaviest fish.
Lijn en hengel dragen alle vissen binnen je haakbereik.|The line and rod can handle all fish within your hook range.
Vrijloopspoel|Baitrunner spool
Quivertop|Quiver tip
Deze actie is nu niet beschikbaar.|This action is not available right now.
Je sessie is afgelopen. Kies voor elke vis: verkopen, terugzetten voor XP of naar je eigen vijver.|Your session has ended. Choose to sell, release for XP or transfer each fish to your fishery.
Handel eerst je sessievangsten af. Je kunt geen vissen meenemen van de stek.|Settle your session catches first. You cannot take fish away from the water.
Deze vismodus bestaat niet.|This fishing mode does not exist.
Deze visstijl bestaat niet.|This fishing style does not exist.
Zeevissen opent op level 120.|Sea fishing unlocks at level 120.
Je bezit geen passende, vrijgespeelde beetmelder.|You do not own a suitable unlocked bite indicator.
Dit aas is nog niet beschikbaar.|This bait is not available yet.
Deze aascombinatie is nog niet vrijgespeeld.|This bait combination has not been unlocked yet.
Kies voor deze cocktail een van de bijbehorende aassoorten.|Choose one of the matching baits for this combination.
Deze liquid is nog niet vrijgespeeld.|This liquid has not been unlocked yet.
Deze zelfgemaakte rig is nog niet beschikbaar.|This handmade rig is not available yet.
Je loadout past niet in je gekochte hengelplaatsen.|Your loadout does not fit your purchased rod slots.
Kies voor elke hengel een unieke, gekochte hengelplaats.|Choose a different purchased slot for each rod.
Handel eerst alle vangsten van je sessie af voordat je het water verlaat.|Settle all catches from your session before leaving the water.
Dit water vraagt een hoger level of prestige.|This water requires a higher level or prestige.
Deze loadout bestaat niet.|This loadout does not exist.
Je kunt maximaal 12 loadouts bewaren.|You can save up to 12 loadouts.
Loadout opgeslagen. Een lopende sessie houdt zijn oorspronkelijke uitrusting.|Loadout saved. A running session keeps its original tackle.
Deze hengelsetup bestaat niet.|This rod preset does not exist.
Je kunt maximaal 30 hengelsetups bewaren.|You can save up to 30 rod presets.
Hengelsetup opgeslagen.|Rod preset saved.
Hengelsetup verwijderd.|Rod preset deleted.
Deze hengelplaats is nog niet gekocht.|This rod slot has not been purchased yet.
Deze taal bestaat niet.|This language does not exist.
Bewaar ten minste één loadout.|Keep at least one loadout.
Loadout verwijderd.|Loadout deleted.
Alle zes hengelplaatsen zijn vrij.|All six rod slots are unlocked.
Je hebt onvoldoende euro voor deze hengelplaats.|You do not have enough money for this rod slot.
Dit materiaal is nog niet vrijgespeeld.|This tackle has not been unlocked yet.
Je bezit dit materiaal al.|You already own this tackle.
Je hebt onvoldoende euro.|You do not have enough money.
Deze voorraad is nog niet beschikbaar.|These supplies are not available yet.
Je hebt onvoldoende euro voor deze voorraad.|You do not have enough money for these supplies.
Kies een water.|Choose a water.
Kies eerst voor al je vangsten: verkopen, terugzetten voor XP of naar je eigen viswater.|First choose to sell, release for XP or transfer every catch to your fishery.
Gebruik een zee-loadout voor zee en een zoetwater-loadout voor binnenwater.|Use a sea loadout at sea and a freshwater loadout on inland waters.
Je haken of lijnen passen niet bij de vissen in dit water. Pas je loadout aan.|Your hooks or lines do not suit this water's fish. Adjust your loadout.
Deze sessie is langer dan je huidige offline limiet.|This session exceeds your current offline limit.
Je leefnet is vol. Verkoop of zet vangsten uit.|Your catch storage is full. Sell or stock fish.
Dit water is nog niet beschikbaar.|This water is not available yet.
Onvoldoende euro voor de vispas.|Not enough money for the fishing licence.
Onvoldoende euro voor de ontbrekende voorraad.|Not enough money for the missing supplies.
De berekende voorraad is aangevuld.|The calculated supplies have been topped up.
Handel eerst alle vangsten af. Je kunt geen vissen meenemen naar een nieuwe sessie.|Settle all catches first. You cannot carry fish into a new session.
Stop eerst je huidige sessie.|Stop your current session first.
Onvoldoende euro voor voorraad, vispas en eventuele charter.|Not enough money for supplies, licence and any charter fee.
Je lijnen liggen in het water. Je kunt de game sluiten; de sessie loopt door.|Your lines are in the water. You can close the game; the session will continue.
Je hebt de sessie beëindigd.|You ended the session.
Er loopt geen sessie.|No session is running.
Geef de stek heel even rust.|Let the spot rest for a moment.
Je aandacht herstelt vanzelf, één punt per 10 seconden.|Your focus recovers automatically, one point every 10 seconds.
Je ruimt de stek op voor de visclub. +€ 0,10.|You clean the bank for the fishing club. +€0.10.
Er is al activiteit op alle lijnen. Kijk naar de beet en sla aan!|All lines are already active. Watch the bite and strike!
Je verzorgt de stek. De volgende worp komt dichterbij.|You tend the spot. The next cast comes sooner.
Een kort tikje, geen doorzettende beet.|A short tap, without a developing bite.
De vis liet los.|The fish let go.
De assistent mist de aanslag. Je kunt deze beet nog redden!|The assistant missed the strike. You can still rescue this bite!
Te laat: de vis liet het aas los.|Too late: the fish let go of the bait.
De haak was te groot voor deze vis.|The hook was too large for this fish.
De vis was te groot voor deze haak.|The fish was too large for this hook.
De lijn en hengel waren niet sterk genoeg voor deze vis.|The line and rod were not strong enough for this fish.
Kies een hengel in je lopende sessie.|Choose a rod in your current session.
Laat de hengel even tot rust komen.|Let the rod settle for a moment.
Te vroeg aangeslagen. Wacht op doorbuigen, een run of een duikende dobber.|You struck too early. Wait for a bend, a run or a diving float.
Deze hengel heeft nu geen beet om aan te slaan.|This rod has no bite to strike right now.
Goed gereageerd, maar de vis schoot los bij het landen.|Good reaction, but the fish came off while landing.
Leefnet vol: sessie gestopt.|Catch storage full: session stopped.
Vangstopslag vol met beschermde trofeeën: laatste vis teruggezet, sessie gestopt.|Catch storage full of protected trophies: last fish released, session stopped.
Beet gered — handmatig geland.|Bite rescued — landed manually.
Perfect aangeslagen — bonus-XP!|Perfect strike — bonus XP!
Zelf aangeslagen — bonus-XP!|Manual strike — bonus XP!
Automatisch aangeslagen en geland.|Hooked and landed automatically.
Geen verkoopbare vissen. Beschermde trofeeën blijven in je leefnet.|No saleable fish. Protected trophies stay in your catch storage.
Deze vis zit niet in je leefnet.|This fish is not in your catch storage.
Vis teruggezet. Je ontvangt 20% bonus-XP.|Fish released. You earn 20% bonus XP.
Deze upgrade is nog niet beschikbaar of al maximaal.|This upgrade is unavailable or already at its maximum.
Onvoldoende euro voor deze upgrade.|Not enough money for this upgrade.
Deze instelling bestaat niet.|This setting does not exist.
Koop eerst de automatische vismarkt.|Buy the automatic fish market first.
De werkbank is nog bezig.|The workbench is still busy.
Je vislevel of rigbouwvaardigheid is nog te laag.|Your fishing level or rig-building skill is too low.
Onvoldoende euro voor de ontbrekende materialen.|Not enough money for the missing materials.
De werkbank is gestart. Je kunt ondertussen vissen.|Workbench started. You can fish while it works.
Er liggen geen rigs klaar om te verkopen.|There are no completed rigs to sell.
Handel eerst al je vangsten af voordat je naar een wedstrijd gaat.|Settle all catches before going to a competition.
Je doet al mee aan een wedstrijd.|You are already in a competition.
Deze wedstrijd is nog niet vrijgespeeld.|This competition has not been unlocked yet.
Onvoldoende euro voor het inschrijfgeld.|Not enough money for the entry fee.
Jij|You
Deze uitslag is al verwerkt.|This result has already been processed.
Uitslag opgeslagen. Volgende keer een nieuwe kans.|Result saved. Another chance next time.
Een eigen viswater opent op level 80.|Your own fishery unlocks at level 80.
Je bezit al een viswater.|You already own a fishery.
Je hebt € 25.000 nodig voor je eigen viswater.|You need €25,000 for your own fishery.
Je eigen viswater is geopend. Zet zoetwatervissen uit om bezoekers aan te trekken.|Your fishery is open. Stock freshwater fish to attract visitors.
Koop eerst je eigen viswater.|Buy your own fishery first.
Een zoetwaterplas is niet geschikt voor zeevis.|A freshwater lake is unsuitable for sea fish.
Je viswater zit vol. Breid het eerst uit.|Your fishery is full. Expand it first.
Je viswater is nog niet gekocht of al maximaal.|Your fishery has not been purchased or is already fully expanded.
De laatste uitbreidingen vragen prestige 1 en level 180.|The final expansions require prestige 1 and level 180.
Onvoldoende euro voor de uitbreiding.|Not enough money for the expansion.
Je viswater is uitgebreid. Meer ruimte en hogere netto bezoekersinkomsten.|Your fishery has been expanded. More space and higher net visitor income.
Er is nog geen bezoekersinkomen om te innen.|There is no visitor income to collect yet.
Deze boot is nog niet vrijgespeeld.|This boat has not been unlocked yet.
Je vloot kan maximaal tien boten bevatten.|Your fleet can contain at most ten boats.
Onvoldoende euro voor deze boot.|Not enough money for this boat.
Deze boot of opdracht bestaat niet.|This boat or assignment does not exist.
Deze boot wordt gebruikt voor je lopende vissessie.|This boat is being used for your current fishing session.
De boot is onderweg en keert na de visreis terug.|The boat is away and will return after the fishing trip.
Onvoldoende euro voor brandstof en bemanning.|Not enough money for fuel and crew.
De boot verdient nu netto charterinkomsten.|The boat is now earning net charter income.
De bemanning is op visreis. De opbrengst komt in je vlootkas.|The crew is on a fishing trip. Its income will go into your fleet account.
De boot ligt weer in de haven.|The boat is back in port.
Er ligt nog geen opbrengst in de vlootkas.|There is no income in the fleet account yet.
Handel eerst alle vangsten af voordat je een nieuw seizoen begint.|Settle all catches before starting a new season.
Prestige vraagt level 100. Rond actieve sessies, wedstrijden, werkopdrachten en visreizen eerst af.|Prestige requires level 100. Finish active sessions, competitions, work orders and fishing trips first.
Een nieuw seizoen begint. Je eigendommen, soortenboek en rigbouwkennis blijven behouden.|A new season begins. You keep your property, species journal and rig-building knowledge.
Je hebt geen beschikbaar prestigepunt.|You have no available prestige points.
Blijvende kennis verbeterd.|Permanent knowledge improved.
Je geplande sessie is afgelopen.|Your planned session has ended.
Je vispas is verlopen.|Your fishing licence has expired.
Je aas of voer is op. De sessie is gestopt.|Your bait or groundbait has run out. The session has stopped.
Offline limiet bereikt. Ongebruikte voorraad blijft bewaard.|Offline limit reached. Unused supplies are kept.
Dit bestand bevat geen geldige Europa Angler Idle-opslag.|This file does not contain a valid Europa Angler Idle save.
Je opgeslagen imperium is geladen.|Your saved empire has been loaded.
Sessie afgelopen.|Session ended.
Vangsten aan het water|Catches at the water
Kies verkopen, terugzetten voor XP of overzetten naar je eigen viswater.|Choose to sell, release for XP or transfer to your fishery.
Selecteer eerst een vangst.|Select a catch first.
Een van deze vissen is niet meer beschikbaar. Ververs je selectie.|One of these fish is no longer available. Refresh your selection.
Je kunt alleen zoetwatervis overzetten naar je eigen, gekochte viswater.|You can only transfer freshwater fish to your own purchased fishery.
Er zijn geen vangsten om af te handelen.|There are no catches to settle.
Kies eerst wat je met je vangsten wilt doen.|Choose what to do with your catches first.
Koop eerst een eigen viswater.|Buy a fishery first.
Zeevis kan niet naar je zoetwaterplas.|Sea fish cannot be transferred to your freshwater lake.
Alle vangsten zijn afgehandeld.|All catches have been settled.
Taal|Language
Speltaal|Game language
Kies de taal van de game. Je voortgang en eigen namen blijven behouden.|Choose the game language. Your progress and custom names are preserved.
Hengelsetups|Rod presets
Opgeslagen hengelsetups|Saved rod presets
Hengelsetup opslaan|Save rod preset
Setup opslaan|Save preset
Setup toepassen|Apply preset
Setup laden|Load preset
Hengelsetup kiezen|Choose rod preset
Hengelplaats|Rod slot
Lege hengelplaats|Empty rod slot
Plaats leegmaken|Clear slot
Selecteer een hengelsetup|Select a rod preset
Totale loadout|Full loadout
Hele loadout opslaan|Save full loadout
Gemengde loadout|Mixed loadout
Feeder en karper tegelijk|Feeder and carp together
Naam hengelsetup|Rod preset name
NAAM HENGELSETUP|ROD PRESET NAME
Opslaan als nieuwe setup|Save as new preset
Geselecteerde hengel|Selected rod
Nog geen opgeslagen hengelsetups.|No saved rod presets yet.
Standaard|Standard
Engels|English
Nederlands|Dutch
`.trim().split('\n').filter(line=>line.includes('|')).map(line=>line.split('|'));
const fragments = `
Menu sluiten|Close menu
Navigatie openen|Open navigation
Sluiten|Close
Een nieuw verhaal aan de oever|A new story on the bank
Jouw tempo. Jouw visimperium.|Your pace. Your fishing empire.
MIJN IMPERIUM|MY EMPIRE
Al je hengels tegelijk aan de waterkant|All your rods at the water's edge
Iedere hengel heeft zijn eigen aanslagknop. Klik op de hengel, de knop eronder of gebruik de cijfertoets.|Each rod has its own strike button. Click the rod, the button below it or use its number key.
Beetmeldingen en aanslagknoppen per hengel|Bite signals and strike buttons for each rod
Hengelplaatsen in je loadout|Rod slots in your loadout
STEL JE LIJNEN SAMEN|BUILD YOUR LINE-UP
Kies een hengelplaats|Choose a rod slot
bezet · 6 plaatsen in totaal|occupied · 6 slots in total
VRIJSPELEN|UNLOCK
Onvoldoende geld|Not enough money
Lege plaats|Empty slot
Hengelsetup|Rod preset
KIES EEN SETUP|CHOOSE A PRESET
Geselecteerd|Selected
Setup aanpassen|Edit setup
Combineer je visstijlen: feeder en karper kunnen tegelijk in dezelfde loadout. Iedere bezette plaats gebruikt één hengel en één molen uit je inventaris.|Combine fishing styles: feeder and carp can be used together in the same loadout. Each occupied slot uses one rod and one reel from your inventory.
Speel deze hengelplaats eerst vrij.|Unlock this rod slot first.
ÉÉN HENGEL, COMPLEET OPGESLAGEN|ONE ROD, FULLY SAVED
Hengelpresets|Rod presets
Hengel opgeslagen. Hij is uit je sessiekeuze gehaald omdat de stijlgrens is bereikt.|Rod saved. It was removed from your session selection because the method limit has been reached.
Een preset gebruikt je eigen spullen. De keuze wordt meegenomen wanneer je de totale loadout opslaat.|A preset uses your own tackle. Your choice is included when you save the full loadout.
Hengelpreset verwijderen|Delete rod preset
Je eerste hengelpreset|Your first rod preset
Stel hieronder een hengel samen en sla de setup op. Daarna kun je deze met één klik in een andere loadout gebruiken.|Build a rod below and save the preset. Then use it in another loadout with one click.
Deze hengelsetup bewaren|Save this rod preset
Bewaar de geselecteerde hengelsetup|Save the selected rod preset
NAAM HENGELPRESET|ROD PRESET NAME
Naam hengelpreset|Rod preset name
Bijvoorbeeld: lichte feeder|For example: light feeder
Preset bijwerken|Update preset
Als nieuwe preset opslaan|Save as new preset
Kies eerst een hengelsetup voor deze plaats.|Choose a rod preset for this slot first.
Kies hieronder een complete setup voor hengelplaats|Choose a complete setup below for rod slot
Hengel, molen, lijn, haak, aas en montage worden samen geplaatst.|Rod, reel, line, hook, bait and terminal tackle are applied together.
Op plaats|Apply to slot
zetten|apply
De preset bewaart alleen plaats|The preset saves only slot
De knop “Loadout opslaan” bewaart alle hengelplaatsen samen.|The “Save loadout” button saves all rod slots together.
Kies de taal van je game. Je namen en opgeslagen spel blijven hetzelfde.|Choose your game language. Your custom names and save data are preserved.
Hengelpreset opslaan|Save rod preset
Hengelpreset bijwerken|Update rod preset
Hengelpreset verwijderen?|Delete rod preset?
De opgeslagen setup wordt verwijderd. Je spullen blijven in je inventaris.|The saved preset will be deleted. Your tackle stays in your inventory.
Een preset voor iedere hengel, een loadout voor al je lijnen.|A preset for each rod, a loadout for all your lines.
Bewaar hengelsetups apart en combineer ze in maximaal 12 totale loadouts. Feeder en karper kunnen samen aan het water.|Save rod presets separately and combine them in up to 12 full loadouts. Feeder and carp can fish together.
Geselecteerde plaats|Selected slot
Deze plaats is nog leeg.|This slot is empty.
Kies hierboven een opgeslagen hengelsetup voor deze plaats.|Choose a saved rod preset above for this slot.
Hengel uit deze plaats halen|Remove rod from this slot
Pas de hengel hieronder aan en sla de complete loadout op.|Adjust the rod below and save the complete loadout.
De laatste hengel kan niet uit je loadout worden gehaald.|The last rod cannot be removed from your loadout.
Bewaar minstens één hengel in je loadout.|Keep at least one rod in your loadout.
Viswater en vispassen|Waters and fishing licences
Jouw volgende oever.|Your next bank.
VAN RIETKRAAG TOT OCEAAN.|FROM REED BED TO OCEAN.
Elke stek heeft zijn eigen soorten en grotere uitdagingen. Je koopt een vispas voor precies de duur die jij wilt vissen.|Every spot has its own species and bigger challenges. Buy a fishing licence for exactly as long as you want to fish.
Vispas per uur|Licence per hour
VISPAS|LICENCE
Vissoorten in dit water|Species in this water
Beschikbaar|Available
Geldig|Valid
Plannen|Plan
GEEN VISPAS|NO LICENCE
Aas & voorraad|Bait & supplies
Hengels|Rods
Molens|Reels
Lijnen|Lines
Haken|Hooks
Montages|Terminal tackle
Beetmelders|Bite indicators
Permanente upgrades|Permanent upgrades
Verbruik geldt alleen tijdens actieve vissessies.|Supplies are only used during active fishing sessions.
Aantal verpakkingen|Number of packs
LOKVOER|GROUNDBAIT
Voorkeur van|Favoured by
Voorraad kopen|Buy supplies
Voltooid|Completed
Verbeteren|Upgrade
Visstijlfilter|Fishing style filter
Alle visstijlen|All fishing styles
Aantal stuks|Quantity
Aantal hengels of molens|Number of rods or reels
Eenmaal kopen, herbruikbaar in je loadouts.|Buy once, reuse in your loadouts.
ALLE VISSTIJLEN|ALL FISHING STYLES
Luister naar het beetgeluid ▷|Preview bite sound ▷
Bereik|Range
Kracht|Power
Herbruikbaar|Reusable
In bezit|Owned
Kopen|Buy
GOED GEREEDSCHAP VERDIENT ZICH TERUG.|GOOD TACKLE PAYS FOR ITSELF.
De hengelsportwinkel.|The tackle shop.
Investeer je vangsten in betere spullen, voorraad en blijvende verbeteringen.|Invest your catches in better tackle, supplies and lasting upgrades.
KNOOP VOOR KNOOP BETER.|BETTER WITH EVERY KNOT.
Van onderlijn naar handtekening.|From hooklink to signature rig.
Bouw rigs voor je sessies of verkoop ze. Je vakmanschap blijft behouden als je later een nieuw seizoen begint.|Craft rigs for your sessions or sell them. You keep your craftsmanship when you start a new season later.
Rigbouw|Rig building
vaardigheids-XP|skill XP
rigs gemaakt|rigs crafted
De werkbank opent op vislevel 5. Je ziet alvast welke rigs je later kunt maken en verkopen.|The workbench unlocks at fishing level 5. Preview the rigs you can craft and sell later.
WERKOPDRACHT ACTIEF|WORK ORDER ACTIVE
Ontbrekende materialen worden bij de start ingekocht.|Missing materials are purchased at the start.
rigs per opdracht.|rigs per order.
Batchgrootte|Batch size
Batchgrootte rigs|Rig batch size
RIGBOUW|RIG BUILDING
onderlijnmateriaal|hooklink material
haken & wartels|hooks & swivels
Inkopen|Purchase
verkoopwaarde|sale value
rigs klaar|rigs ready
Verkoop|Sell
Zelfgemaakte rigs gaan één volledige sessie mee en geven extra beetkans. Je kiest ze per hengel in je loadout. De gewone montages uit de winkel blijven altijd beschikbaar.|Handmade rigs last one full session and increase bite chance. Choose them for each rod in your loadout. Standard shop terminal tackle stays available permanently.
Nog te gaan|Time remaining
gewogen|weighed
Doelindicatie voor de winst|Estimated target to win
plaats|position
SCHIP|BOAT
uur netto charterinkomsten.|hour net charter income.
onderweg. Geschatte vangst|away. Estimated catch value
kosten|cost
opbrengst.|income.
verhuur|rental
Visreis:|Fishing trip:
Nieuw seizoen|New season
punten|points
PUNTEN|POINTS
vis-XP per punt|fishing XP per point
procentpunt beetkans per punt|percentage points to bite chance per point
visverkoopwaarde per punt|fish sale value per point
punt|point
Tot|Up to
in de game|in the game
gevangen · record|caught · record
Je sessies, werkbank, kweek en inkomsten worden bij terugkomst berekend, maximaal|Your sessions, workbench, breeding and income are calculated when you return, up to
Je sessie stopt bij het geplande einde, een verlopen pas, volle opslag of lege voorraad.|Your session stops at the planned end, an expired licence, full storage or empty supplies.
AAN DE WATERKANT|AT THE WATER'S EDGE
al geldig|already valid
Je hebt meer euro nodig voor deze planning. Verkoop vangsten of plan een kortere sessie.|You need more money for this plan. Sell catches or plan a shorter session.
op voorraad|in stock
Voorbeeld|Preview
Hengelplaats|Rod slot
hengelplaats|rod slot
hengelplaatsen|rod slots
hengels|rods
hengel|rod
molen|reel
lijn|line
haak|hook
aas|bait
karperhengels|carp rods
zee­hengels|sea rods
zee|sea
karper|carp
dobber|float
per worp|per cast
minuut|min
minuten|minutes
uur|hour
UUR|HOURS
Doelgewicht|Target weight
extra|extra
klaar|ready
stuk|piece
stuks|pieces
st|pcs
Haak laat|The hook allows
van de lokale gewichtsklasse toe.|of the local weight range.
Past bij|Suitable for
niet bij deze|unsuitable for this
Zelf aanslaan|Strike manually
sneller opnieuw vissen|faster recasting
meer bij tijdig reageren|more with a timely reaction
In dit water|In this water
De actieve raming gaat uit van aanslaan op iedere echte beet na ongeveer|The active estimate assumes you strike every real bite after approximately
seconde|seconds
Maten en soorten komen uit dit water, je aas, haakbereik en lijn/hengelkracht. Voorraad, opslagruimte, vispas- en voerkosten zijn niet in het uurtotaal verwerkt.|Weights and species depend on this water, your bait, hook range and line/rod strength. Supplies, storage space, licence fees and groundbait costs are excluded from the hourly total.
landingskans op een passende beet. Beschikbare aanslagtijd:|landing chance on a suitable bite. Available strike window:
Assistent reageert na 3,2s. Een gemiste aanslag kun je tot het eind van dat venster redden.|The assistant reacts after 3.2s. You can rescue a missed strike until the end of that window.
Interval zonder beetafhandeling:|Interval excluding bite handling:
hengelfactor|rod factor
veilige setgrens|safe setup limit
Keuze voor alle|Choice for all
openstaande vissen:|pending fish:
Keuze voor|Choice for
verkopen|sell
terugzetten|release
overzetten|transfer
vis wacht|fish is waiting
vissen wachten|fish are waiting
nog op een keuze.|for a choice.
vrije plaatsen in je eigen viswater.|free places in your fishery.
van je verwachte automatische vangsten|of your expected automatic catches
vangsten · de samenvatting telt alle openstaande vissen mee.|catches · the summary includes every pending fish.
vangsten|catches
opslagplaatsen|storage places
Meer tonen|Show more
Oudere sessiegeschiedenis wordt bij 40.000 vangsten opgeruimd; je huidige of laatste sessie blijft compleet.|Older session history is pruned at 40,000 catches; your current or latest session is kept complete.
Verkopen is standaard geselecteerd. Je kunt per vis of met de knoppen bovenaan een andere bestemming kiezen. Tijdens je sessie kun je de keuzes alvast verwerken. Na afloop moet iedere vis een bestemming krijgen. Bij een volle vangstopslag stopt de sessie.|Selling is selected by default. Choose another action per fish or with the buttons above. Process your choices during the session if you wish. After the session, settle every fish. The session stops when catch storage is full.
bekijken|view
De volgende hengelplaats vraagt level|The next rod slot requires level
Je bezit geen passende|You do not own a suitable
Maximaal|Maximum
hengels voor|rods for
Je hebt|You need
nodig; je bezit er|required; you own
Dit water vraagt level|This water requires level
en prestige|and prestige
Maak of koop voldoende|Craft or buy enough
Vispas voor|Fishing licence for
verlengd.|extended.
Sessie gestart bij|Session started at
Beet gered!|Bite rescued!
Perfect aangeslagen!|Perfect strike!
Vis gehaakt!|Fish hooked!
nieuw record van|new record of
verkocht voor|sold for
gekocht.|purchased.
gekocht! Pas je loadout aan.|purchased! Update your loadout.
verbeterd.|upgraded.
voltooid.|completed.
Ingeschreven. Start een sessie bij|Entry confirmed. Start a session at
om gewicht te scoren.|to score weight.
afgelopen: plaats|finished: position
Wedstrijdprijs ontvangen:|Competition prize received:
uitgezet. Vanaf twee vissen van dezelfde soort groeit die populatie elke zes uur.|stocked. With two fish of the same species, the population grows every six hours.
bezoekersinkomen ontvangen.|visitor income collected.
toegevoegd aan je vloot.|added to your fleet.
uit de vlootkas ontvangen.|collected from your fleet account.
prestigepunten verdiend.|prestige points earned.
terug:|returned:
vangstopbrengst.|catch income.
bereikt! Kijk bij je voortgang wat er nieuw is.|reached! Check your progress for new unlocks.
Kies voor alle vissen wat je ermee doet. Nog|Choose an action for every fish. Still
op een keuze: verkopen, terugzetten voor XP of naar je eigen viswater.|awaiting a choice: sell, release for XP or transfer to your fishery.
Je viswater heeft nog|Your fishery has
plaatsen. Kies minder vissen om over te zetten.|spaces left. Select fewer fish to transfer.
Vangsten afgehandeld:|Catches settled:
verkocht,|sold,
teruggezet,|released,
naar je eigen viswater.|to your fishery.
ontvangen.|received.
teruggezet|released
vangsten wachten nog aan het water.|catches are still waiting at the water.
Inschrijven voor|Enter
Je betaalt|You pay
inschrijfgeld. De wedstrijd duurt|entry fee. The competition lasts
en begint meteen. Alleen vangsten in|and starts immediately. Only catches at
tellen mee.|count.
Vispas, voorraad en een vissessie plan je daarna apart. Tegenstanders zijn computervissers.|Plan a licence, supplies and fishing session separately afterwards. Your opponents are computer anglers.
kopen?|buy?
Je investeert|You invest
De boot kan verhuurd worden voor|The boat can be rented out for
per uur, beschikbaar blijven voor jouw zeevissessie of met bemanning op visreis gaan.|per hour, stay available for your sea-fishing session or take a crew on a fishing trip.
Een visreis starten?|Start a fishing trip?
Betaal|Pay
voor brandstof en bemanning. Over|for fuel and crew. In
komt de boot terug met een geschatte vangstwaarde van|the boat returns with an estimated catch value of
en|and
Visreis starten|Start fishing trip
Je was|You were away for
weg. We hebben|We calculated
voortgang doorgerekend, binnen je offline limiet.|of progress within your offline limit.
echte beten gemist door de assistent.|real bites missed by the assistant.
rigs voltooid.|rigs completed.
Je viswater verdiende|Your fishery earned
Je vlootkas groeide met|Your fleet account grew by
Alle vangsten vind je bij Sessies & vangsten; inkomsten van eigendommen staan klaar om te innen.|Find all catches in Sessions & catches; property income is ready to collect.
Deze hengelsetup wordt verwijderd. Je materiaal blijft in je inventaris.|This rod preset will be deleted. Your tackle stays in your inventory.
Je verwijdert|You are deleting
Al je gekochte spullen blijven in bezit.|All purchased tackle stays in your inventory.
Investeer|Invest
om tegelijk met|to fish with
te kunnen vissen. Je hebt voor elke extra hengel ook een eigen hengel en molen nodig.|at once. Each extra rod also needs its own rod and reel.
De uitbreiding kost|The expansion costs
en vergroot je visbestand met 100 plaatsen. Het netto bezoekersinkomen neemt toe.|and adds 100 fish spaces. Net visitor income increases.
Je ontvangt|You receive
prestigepunten|prestige points
Je huidige vislevel, geld, materiaal, voorraad, hengelplaatsen, loadouts en winkelupgrades worden opnieuw gestart.|Your current fishing level, money, tackle, supplies, rod slots, loadouts and shop upgrades are reset.
Je vangstgeschiedenis, rigbouwkennis, soortenboek, records, statistieken, viswater, vloot en eerdere prestigebonussen blijven behouden. Download vooraf een opslagbestand als je een kopie wilt bewaren.|You keep your catch history, rig-building knowledge, species journal, records, statistics, fishery, fleet and previous prestige bonuses. Download a save file first if you want a copy.
plus|plus
Geef je hengelsetup een naam.|Give your rod preset a name.
Kies een opgeslagen setup om bij te werken.|Choose a saved preset to update.
Een ochtend aan de plas|A morning at the lake
Tussen de karpers|Among the carp
Langs het riet|Along the reeds
Mijn Oever|My Bank
Mijn feeder|My feeder
Mijn karperhengel|My carp rod
Mijn dobberhengel|My float rod
Loadoutpresets|Loadout presets
Kies bovenaan een hengelplaats.|Choose a rod slot above.
Kies een opgeslagen hengelsetup voor deze lege plaats.|Choose a saved rod preset for this empty slot.
Geen vrije passende hengel beschikbaar. Koop eerst een extra hengel en molen.|No suitable spare rod is available. Buy an extra rod and reel first.
Engels is de standaard. Je kunt op elk moment naar Nederlands wisselen.|English is the default. You can switch to Dutch at any time.
VAN POLDERRIET TOT OCEAAN|FROM POLDER REEDS TO OCEAN
Europa ligt aan je voeten.|Europe lies at your feet.
Elke stek heeft andere soorten, grotere kansen en een eigen vispas. Tijd loopt alleen door tot je pas of sessie eindigt.|Every spot has different species, bigger opportunities and its own licence. Fishing continues until your licence or session ends.
Een vispas blijft geldig na een korte sessie. De planner gebruikt een bestaande pas als die je hele volgende sessie dekt. Verlengen telt op bij de resterende geldigheid.|A licence stays valid after a short session. The planner uses an existing licence if it covers your entire next session. Extensions add to its remaining validity.
Zeehengel + boot|Sea rod + boat
Zoetwater|Freshwater
Vispas nog|Licence valid for another
geldig|valid
VISPAS ACTIEF|LICENCE ACTIVE
TIJDELIJKE VISPAS|TEMPORARY LICENCE
JOUW FEEDERSET IN BEELD|YOUR FEEDER SETUP
JOUW KARPERSET IN BEELD|YOUR CARP SETUP
JOUW DOBBERSET IN BEELD|YOUR FLOAT SETUP
JOUW ZEESET IN BEELD|YOUR SEA SETUP
JE MONTAGE|YOUR RIG
JOUW EIGEN VISWATER|YOUR OWN FISHERY
NIVEAU|LEVEL
SOORTEN|SPECIES
Inkomsten innen|Collect income
Beste vis|Best fish
Populatie groeit iedere 6 uur|Population grows every 6 hours
Nog eenzelfde vis nodig om te kweken|One more of the same species needed to breed
+100 plaatsen en hogere inkomsten. Niveaus 4 en 5 vragen prestige 1 en vislevel 180.|+100 spaces and higher income. Levels 4 and 5 require prestige 1 and fishing level 180.
VANAF LEVEL|FROM LEVEL
Bekijk je groeipad|View your progression
Visuitrusting|Fishing tackle
Europese zoetwatervis|European freshwater fish
Kaart van het viswater|Map of the fishing water
Visser met persoonlijke uitrusting|Angler with personal tackle
Vissersboot|Fishing boat
Een vissersboot op zee|A fishing boat at sea
Een rustige Europese visplas met een houten steiger|A peaceful European fishing lake with a wooden jetty
Feeder met buigende quivertop|Feeder with a bending quiver tip
Karperhengel met zichtbare vrijloopmolen|Carp rod with a visible baitrunner reel
Matchhengel met goed zichtbare dobber|Match rod with a highly visible float
Zeehengel met lijnratel|Sea rod with a line ratchet
aanpassen|adjust
Wachten op beet|Waiting for a bite
Voorzichtige tikjes|Tentative nibbles
Beet — sla nu aan|Bite — strike now
Vis geland|Fish landed
Opnieuw uitwerpen|Recasting
Beet|Bite
Indicatie:|Estimate:
Haak, aas en lijn bepalen wat je werkelijk landt. Je vispas duurt even lang als je sessie en wordt automatisch meegerekend.|Your hook, bait and line determine what you actually land. Your licence lasts as long as your session and is included automatically.
Maak|Craft
grootste vis|largest fish
1,5 seconde|1.5 seconds
+14% beetkans. Verbruik 0,5 ml per hengel/min.|+14% bite chance. Uses 0.5 ml per rod/min.
+22% beetkans. Verbruik 0,5 ml per hengel/min.|+22% bite chance. Uses 0.5 ml per rod/min.
Inhalen — aanslaan!|Reel in — strike!
Red de beet — inhalen!|Rescue the bite — reel in!

dagen|days
Bij afwezigheid wordt maximaal|While you are away, up to
uur voortgang berekend.|hours of progress are calculated.
Je sessie kan eerder stoppen door volle opslag of lege aas- en voervoorraad.|Your session can end sooner if catch storage fills up or you run out of bait or groundbait.
Verhoog offline voortgang van 8 naar 16, 24, 48, 96 en uiteindelijk 168 uur.|Increase offline progress from 8 to 16, 24, 48, 96 and finally 168 hours.
Geschatte sessieopbrengst|Estimated session earnings
ALS JE ALLE VANGSTEN VERKOOPT|IF YOU SELL EVERY CATCH
Verwachte visverkoop|Expected fish sales
Verbruik voer & aas|Groundbait & bait used
Geschatte sessiewinst|Estimated session profit
Na vispas, boot en werkelijk verbruik. Voorraad die je al bezit telt mee als verbruikskosten; ongebruikte reserve blijft van jou.|After licence, boat and actual supplies used. Supplies you already own count towards consumption costs; unused reserves stay yours.
plaatsen in je vangstopslag.|spaces in your catch storage.
Bij deze vangstsnelheid kan die na ongeveer|At this catch rate it may fill in about
vol zijn.|.
Verwerk tussendoor je vangsten of gebruik de automatische vismarkt vanaf level 15.|Process catches as you go, or use the automatic fish market from level 15.
Kies je water en stel met één schuifregelaar de duur van je sessie én vispas in, tot maximaal één week.|Choose your water and use one slider to set both session and licence duration, up to one week.
Loadoutpreset kiezen|Choose a loadout preset
LOADOUTPRESET|LOADOUT PRESET
Opgeslagen loadout kiezen|Choose a saved loadout
Nieuwe loadout (nog niet opgeslagen)|New loadout (not saved yet)
Opgeslagen hengelsetup kiezen|Choose a saved rod setup
HENGELPRESET|ROD PRESET
HENGELPLAATS|ROD SLOT
Doelplaats voor hengelpreset|Target slot for rod preset
Nog geen hengelpresets|No rod presets yet
Statistieken|Statistics
Statistieken.|Statistics.
Statistieken bekijken|View statistics
JE VANGSTEN EN JE KANSEN|YOUR CATCHES AND YOUR CHANCES
Bekijk gewichten, soortkansen en de invloed van je uitrusting op wat je kunt vangen.|Explore weights, species chances and how your tackle affects what you can catch.
GROOTSTE VANGST|BIGGEST CATCH
Vangsten sorteren|Sort catches
Sorteer op|Sort by
Vangsten sorteren op|Sort catches by
Wanneer gevangen|Time caught
Prijs|Price
Volgorde|Order
Sorteervolgorde|Sort order
Nieuwste eerst|Newest first
Oudste eerst|Oldest first
Hoogste eerst|Highest first
Laagste eerst|Lowest first
Je vangsten, gesorteerd op jouw keuze.|Your catches, sorted your way.
Hengelsetup bekijken en bewaren|Inspect and save a rod setup
OPGESLAGEN SETUP|SAVED SETUP
OPGESLAGEN HENGEL KIEZEN|CHOOSE A SAVED ROD
OPGESLAGEN HENGEL|SAVED ROD
Kies een hengelsetup|Choose a rod setup
Nog geen opgeslagen hengels|No saved rods yet
Nog geen opgeslagen hengels. Stel een hengel samen en bewaar je eerste setup.|No saved rods yet. Build a rod and save your first setup.
Vrij vanaf level|Unlocks at level
Opgeslagen hengel kiezen voor plaats|Choose a saved rod for slot
Geen zelfgemaakte rig|No crafted rig
Hengelsetup|Rod setup
`.trim().split('\n').filter(line=>line.includes('|')).map(line=>line.split('|'));
const equipmentEntries = `
Je opslag is beschermd. Laad je geldige voortgang voordat je verder speelt.|Your save is protected. Load valid progress before continuing.

HENGEL GEBROKEN|BROKEN ROD
Gebroken · reparatie nodig|Broken · repair needed

gemonteerd|mounted
Kies passend materiaal|Choose suitable tackle
Je krijgt een feeder-, karper- en dobberset. Stel hengels samen met eigen onderdelen en bewaar ze op naam. Een onderdeel past maar in één gebouwde hengel tegelijk. Vanaf level 10 passen twee T1-hengels in je opleiding; T1 + T2 vanaf 15 en twee T2 vanaf 18. Meer plaatsen koop je op level 40, 90, 170 en 300.|You start with feeder, carp and float setups. Assemble rods with their own components and save them by name. A component can belong to only one assembled rod at a time. Training supports two T1 rods from level 10, T1 + T2 from 15 and two T2 from 18. More slots unlock at levels 40, 90, 170 and 300.
Haakmaat en aasgrootte beïnvloeden wat je vangt. Een te grote haak, grote aasbundel of te zware vis kan een zwakke hengel beschadigen en breken. Controleer de setgrens en schadeverwachting in de bouwer. Starterhengels repareer je gratis; gekochte hengels voor maximaal 35% van de nieuwprijs.|Hook and bait size influence your catch. An oversized hook, large bait bunch or heavy fish can damage and break a weak rod. Check the setup limit and damage risk in the builder. Original starter rods have free repairs; purchased rods cost up to 35% of their new price.
Iedere plaats gebruikt een complete gebouwde hengel met eigen onderdelen. Je scholingspunten bepalen hoe zwaar de combinatie mag zijn.|Each slot uses a complete assembled rod with its own components. Your training points determine how heavy the combination can be.
Zelfgemaakte rigs blijven op je gebouwde hengel zitten en geven extra beetkans. Gemonteerde rigs zijn bezet; alleen vrije rigs kun je verkopen. Haal een hengel uit elkaar om de onderdelen opnieuw te gebruiken.|Handmade rigs stay on your assembled rod and improve bite chance. Mounted rigs are reserved; only spare rigs can be sold. Dismantle a rod to reuse its components.

Bouw je hengels. Kies je team.|Build your rods. Choose your team.
Elke opgeslagen hengel heeft zijn eigen onderdelen. Stel je loadout samen uit de hengels die je hebt gebouwd.|Each saved rod has its own components. Build your loadout from the rods you have assembled.

VISACADEMIE|ANGLING ACADEMY
Je scholingscapaciteit|Your training capacity
Elke ingezette hengel gebruikt punten. Het hoogste niveau van hengel of molen bepaalt de belasting.|Each deployed rod uses points. The higher tier of the rod or reel determines its load.
Bekijk je opleiding en volgende lessen|View your training and upcoming lessons
Basisopleiding|Basic training
Steviger materiaal|Stronger tackle
Twee lichte hengels|Two light rods
Gemengde uitrusting|Mixed equipment
Twee T2-hengels|Two T2 rods
Riviertraining|River training
Dubbele riviermontage|Two river setups
Drie lijnen beheren|Managing three lines
Specimentraining|Specimen training
Gevorderde controle|Advanced control
Zware montages|Heavy setups
Vier lijnen beheren|Managing four lines
Zeeopleiding|Sea training
Offshorecontrole|Offshore control
Vijf lijnen beheren|Managing five lines
Expeditietraining|Expedition training
Big-gameopleiding|Big game training
Meesteropleiding|Master training
Legendarische controle|Legendary control
Zes meesterhengels|Six master rods
Mijn gebouwde hengels|My assembled rods
Nieuwe hengel bouwen|Build a new rod
Een hengel mag in meerdere loadoutpresets staan, maar slechts één keer tegelijk worden ingezet.|A rod can belong to several loadout presets, but can only be deployed once at a time.
BOUW JE EIGEN HENGEL|BUILD YOUR OWN ROD
Hengel aanpassen|Edit rod
Nieuwe hengel|New rod
Mijn nieuwe hengel|My new rod
NAAM VAN JE HENGEL|ROD NAME
Naam van je hengel|Rod name
Deze hengel vist nu. Je kunt hem aanpassen zodra de sessie is beëindigd.|This rod is fishing. You can edit it after the session ends.
Onderdelen van je hengel|Rod components
ONDERLIJN / MONTAGE|LEADER / RIG
AASGROOTTE|BAIT SIZE
ZELFGEMAAKTE RIG|HANDMADE RIG
CONDITIE|CONDITION
HENGELGRENS|ROD LIMIT
VEILIGE SETGRENS|SAFE SETUP LIMIT
WORPSCHADEKANS|CAST DAMAGE CHANCE
Deze haak of aasgrootte overbelast de hengel. Je riskeert schade en uiteindelijk breuk. Kies lichter materiaal of een sterkere hengel.|This hook or bait size overloads the rod. It risks damage and eventually breakage. Choose lighter tackle or a stronger rod.
Deze montage geeft geen extra worpschade. Een te zware vis aan een sterke lijn kan de hengel alsnog beschadigen.|This setup adds no casting damage risk. An oversized fish on strong line can still damage the rod.
Hengel, molen, lijn, haak, montage en beetmelder zijn bezet zodra je opslaat. Aas, voer en liquids komen uit je gedeelde voorraad.|Saving reserves the rod, reel, line, hook, rig and bite indicator. Bait, feed and liquids come from your shared supplies.
Uit elkaar halen|Dismantle
Repareren|Repair
gratis|free
Onderdelen kopen|Buy components
Hengel bijwerken|Update rod
Hengel bouwen & opslaan|Build & save rod
Klein aas|Small bait
Normaal aas|Regular bait
Groot aas / grote tros|Large bait / large bunch
Kies een vrij onderdeel|Choose an available component
bezet door|reserved by
gebroken|broken
vrij|available
conditie|condition
Nog te bouwen|Awaiting assembly
Gebroken|Broken
IN GEBRUIK|IN USE
Reparatiewerkplaats|Repair workshop
Los onderdeel|Loose component
Starterhengel|Original starter rod
Gekocht materiaal|Purchased tackle
Al je hengels zijn in goede staat.|All your rods are in good condition.
Je oorspronkelijke starterhengels herstel je gratis. Gekochte hengels kosten maximaal 35% van de nieuwprijs om te repareren.|Repairs to your original starter rods are free. Purchased rods cost up to 35% of their new price to repair.
Combineer je visstijlen: feeder en karper kunnen tegelijk in dezelfde loadout. Iedere plaats gebruikt een opgeslagen fysieke hengel. Scholingspunten begrenzen de zwaarte van je combinatie.|Mix your fishing styles: feeder and carp rods can share a loadout. Each slot uses a saved physical rod. Training points limit the weight of your combination.
Stel complete hengels samen met eigen onderdelen. Bewaar ze en verdeel ze over je hengelplaatsen.|Build complete rods from your own components. Save them and assign them to your rod slots.
Hengel uit elkaar halen?|Dismantle this rod?
De onderdelen worden vrijgegeven. Deze hengel verdwijnt uit alle loadoutpresets waarin hij staat.|The components become available. This rod is removed from every loadout preset that uses it.
Geen vrij onderdeel|No available component
Repareer deze hengel voordat je hem monteert.|Repair this rod before assembling it.
Geen vrije zelfgemaakte onderlijn. Maak er een bij of haal een andere hengel uit elkaar.|No available handmade rig. Craft another or dismantle a different rod.
Deze hengel is nog niet compleet. Monteer eerst de ontbrekende onderdelen.|This rod is incomplete. Fit the missing components first.
Een onderdeel ontbreekt of is al bezet.|A component is missing or already reserved.
Deze hengel is gebroken. Repareer hem of vervang de hengel.|This rod is broken. Repair it or replace the rod.
Kies opgeslagen hengels voor je gekochte hengelplaatsen.|Choose saved rods for your purchased rod slots.
Bouw en bewaar deze hengel eerst voordat je hem in een loadout zet.|Build and save this rod before assigning it to a loadout.
Dezelfde fysieke hengel kan niet op twee plaatsen tegelijk staan.|The same physical rod cannot occupy two slots at once.
Deze hengel heeft geen reparatie nodig.|This rod does not need repairs.
Beëindig de sessie voordat je deze hengel repareert.|End the session before repairing this rod.
Onvoldoende geld voor de reparatie.|Not enough money for the repair.
Hengel gerepareerd.|Rod repaired.
Hengel gebroken door overbelasting. Repareer hem na je sessie.|Rod broken by overloading. Repair it after your session.
Alle hengels zijn gebroken. Je vangsten blijven aan het water.|All rods have broken. Your catches remain at the water.
Deze hengel is in gebruik. Beëindig eerst je sessie.|This rod is in use. End your session first.
Je kunt maximaal 120 hengelsetups bewaren.|You can save up to 120 rod setups.
Hengel gebouwd. De onderdelen zijn nu bezet.|Rod assembled. Its components are now reserved.
Hengel uit elkaar gehaald. Onderdelen zijn vrij en de hengel is uit je loadouts verwijderd.|Rod dismantled. Its components are available and the rod has been removed from your loadouts.
App-updates & herstel|App updates & recovery
Upload updates naar dezelfde Cloudflare-app en blijf op hetzelfde vaste websiteadres spelen. Je spelopslag staat los van de appbestanden.|Upload updates to the same Cloudflare app and keep playing at the same production address. Your save is stored separately from the app files.
De vorige versie van je save wordt als herstelkopie bewaard wanneer er voldoende opslagruimte is. Een onleesbare of nieuwere opslag wordt nooit automatisch vervangen door een nieuw spel.|The previous save is kept as a recovery copy when storage space allows. An unreadable save or one from a newer version is never automatically replaced with a new game.
Controleren op updates|Check for updates
Beschermde opslag downloaden|Download protected save
Je opslag is beschermd. Heropen de nieuwste app of importeer een geldige back-up om verder te spelen.|Your save is protected. Reopen the latest app or import a valid backup to continue.
Je opslag is beschermd.|Your save is protected.
De opgeslagen voortgang is niet leesbaar of komt uit een nieuwere versie. We hebben niets overschreven. Open de nieuwste app of laad via Instellingen een geldige back-up.|Your saved progress is unreadable or comes from a newer version. Nothing was overwritten. Open the latest app or import a valid backup in Settings.
Naar Instellingen|Go to Settings
Je voortgang is hersteld uit de reservekopie.|Your progress was restored from the backup.
Je bestaande voortgang is veilig overgezet naar de nieuwe versie.|Your existing progress has been transferred to the new version.
Een nieuwe versie staat klaar. Je voortgang wordt eerst opgeslagen.|An update is ready. Your progress will be saved first.
Opslaan & bijwerken|Save & update
De updatecontrole is nu niet bereikbaar.|The update check is currently unavailable.
Updates zijn beschikbaar via je vaste online speladres.|Updates are available at your usual online game address.
Je voortgang kon niet worden opgeslagen. Download eerst een opslagbestand; de update is niet gestart.|Your progress could not be saved. Download a save file first; the update has not started.
Voortgang geopend in een ander tabblad.|Progress opened in another tab.
Herlaad dit tabblad om de nieuwste voortgang te gebruiken. Dit tabblad overschrijft je andere spel niet.|Reload this tab to use your latest progress. This tab will not overwrite your other game.
Nieuwste voortgang laden|Load latest progress
Importeren lukt niet: onvoldoende opslagruimte. Je vorige spel is behouden.|Import failed: insufficient storage space. Your previous game was preserved.
(begrensd door de hengel) → veilige setgrens|(capped by the rod) → safe setup limit
De raming gaat uit van onbeschadigde hengels; overbelasting kan je sessie inkorten.|The estimate assumes undamaged rods; overloading may shorten your session.
Aantal onderdelen|Number of components
`.trim().split('\n').filter(line=>line.includes('|')).map(line=>line.split('|'));
const rodSelectionEntries = `
Hengelpresets|Rod presets
Hengel opgeslagen. Hij is uit je sessiekeuze gehaald omdat de stijlgrens is bereikt.|Rod saved. It was removed from your session selection because the method limit has been reached.
Bouw je eigen hengelpresets.|Build your own rod presets.
Kies een hengel: de vismethode volgt automatisch. Bewaar elke complete hengel apart en kies je hengels bij Plan je sessie.|Choose a rod: its fishing method follows automatically. Save each complete rod separately and choose your rods when planning a session.
KIES JE HENGELS|CHOOSE YOUR RODS
Kies je hengels|Choose your rods
De gekozen hengel bepaalt je vismethode. Elke fysieke hengel kan één keer mee.|Your chosen rod determines the fishing method. Each physical rod can be used once.
Geen hengel|No rod
Kies een opgeslagen hengelpreset|Choose a saved rod preset
Gekozen hengels|Selected rods
Hengelpresets bouwen & aanpassen →|Build & edit rod presets →
Scholingspunten|Training points
Vrijspelen|Unlock
VISMETHODE|FISHING METHOD
Kies eerst een hengel|Choose a rod first
Wordt bepaald door je hengel|Determined by your rod
Gekozen voor je sessie|Selected for your session
Bewaar hier losse hengelpresets. Bij Plan je sessie kies je welke hengels meegaan.|Save individual rod presets here. Choose which rods to take when planning your session.
Je sessie loopt. Kies je volgende hengels zodra deze is afgelopen.|Your session is running. Choose your next rods once it has ended.
Kies je hengels voor deze sessie.|Choose your rods for this session.
Deze hengelplaats is nog niet vrijgespeeld of gekocht.|This rod slot has not been unlocked or purchased yet.
Bouw en bewaar deze hengel eerst voordat je hem voor een sessie kiest.|Build and save this rod before choosing it for a session.
Hengel uit elkaar gehaald. Onderdelen zijn vrij en de hengel is uit je sessiekeuze verwijderd.|Rod dismantled. Its components are free and it has been removed from your session selection.
Kies zeehengels voor zee en zoetwaterhengels voor binnenwater.|Choose sea rods for the sea and freshwater rods for inland waters.
Je haken of lijnen passen niet bij de vissen in dit water. Kies je hengels in de sessieplanner.|Your hooks or lines do not suit the fish in this water. Choose your rods in the session planner.
De onderdelen worden vrijgegeven. Deze hengel verdwijnt uit je sessiekeuze.|The components will be freed. This rod will be removed from your session selection.
Een volledige kopie van je voortgang, hengelpresets, vispassen en eigendommen.|A complete copy of your progress, rod presets, permits and property.
Bouw je hengelpresets|Build your rod presets
Je krijgt een feeder-, karper- en dobberhengel. De hengel bepaalt automatisch je vismethode. Stel hengels samen met eigen onderdelen en bewaar ze op naam. Een onderdeel past maar in één gebouwde hengel tegelijk. Vanaf level 10 passen twee T1-hengels in je opleiding; T1 + T2 vanaf 15 en twee T2 vanaf 18. Meer plaatsen koop je op level 40, 90, 170 en 300.|You receive a feeder, carp and float rod. The rod automatically determines your fishing method. Build rods with separate components and save each by name. A component fits only one assembled rod at a time. Training allows two T1 rods from level 10, T1 + T2 from 15 and two T2 rods from 18. Buy more slots at levels 40, 90, 170 and 300.
Kies bij stap 01 je losse hengels: maximaal zes in totaal, met maximaal twee dobberhengels, vier feeders en vier karperhengels. Je level, gekochte plaatsen en scholingspunten blijven gelden. Kies je water en stel met één schuifregelaar de duur van je sessie én vispas in, tot maximaal één week. De paklijst rekent voer en aas uit met je gekozen reserve. Starten koopt de ontbrekende voorraad en passende vispas in één keer.|Choose individual rods in step 01: up to six in total, with no more than two float rods, four feeders and four carp rods. Your level, purchased slots and training points still apply. Choose a water and set the duration of your session and permit with one slider, up to one week. The packing list calculates feed and bait with your selected reserve. Starting buys missing supplies and a suitable permit together.
Combineer drie van je hengelpresets.|Combine three of your rod presets.
sessiekeuze|session selection
`.trim().split('\n').map(line=>line.split('|'));
const workshopLayoutEntries=`
Volgende hengelplaats|Next rod slot
Extra hengelplaats beschikbaar|Extra rod slot available
Alle zes hengelplaatsen zijn vrijgespeeld.|All six rod slots are unlocked.
Hengelplaats kopen|Buy rod slot
Je hengel|Your rod
Voerkorf & onderlijn|Feeder cage & hooklink
Dobber, lood & onderlijn|Float, weights & hooklink
Lood & hair-rig|Weight & hair rig
Lood & zeemontage|Weight & sea rig
Uitvergroot|Close-up
Lood|Weight
Voerkorf|Feeder cage
Onderlijn|Hooklink
LOOD / MONTAGE|WEIGHT / RIG
VOERKORF / MONTAGE|FEEDER CAGE / RIG
DOBBER / LOOD|FLOAT / WEIGHTS
BEETMELDING|BITE SIGNAL
Hengel met molen en hoofdlijn|Rod with reel and main line
Vergrote montage met lood, onderlijn, haak en aas|Enlarged rig with weight, hooklink, hook and bait
Klik op een genummerd onderdeel om de bijbehorende keuze te openen.|Select a numbered component to open its matching control.
Hengel aanpassen|Edit rod
Molen aanpassen|Edit reel
Hoofdlijn aanpassen|Edit main line
Beetmelder aanpassen|Edit bite indicator
Lood / montage aanpassen|Edit weight / rig
Haak aanpassen|Edit hook
Aas aanpassen|Edit bait
`.trim().split('\n').map(line=>line.split('|'));
const speciesExpansionEntries=`
Lineaire spiegelkarper|Linear mirror carp
Rijenkarper|Row-scaled carp
Lederkarper|Leather carp
Volschubspiegel|Fully scaled mirror carp
Giebel|Prussian carp
Riviergrondel|Common gudgeon
Witvinriviergrondel|White-finned gudgeon
Zwartbekgrondel|Round goby
Marmergrondel|Western tubenose goby
Kolblei|Silver bream
Alver|Bleak
Pos|Ruffe
Kopvoorn|European chub
Serpeling|Common dace
Sneep|Common nase
Blauwneus|Vimba bream
Snoekbaars|Zander
Paling|European eel
Kwabaal|Burbot
Beekforel|Brown trout
Regenboogforel|Rainbow trout
Vlagzalm|European grayling
Roofblei|Asp
Bot|European flounder
Schol|European plaice
Schar|Common dab
Wijting|Whiting
Schelvis|Haddock
Koolvis|Saithe
Makreel|Atlantic mackerel
Leng|Common ling
Zeewolf|Atlantic wolffish
Goudmakreel|Mahi-mahi
Wahoo|Wahoo
Karperachtigen|Cyprinids
Baarsachtigen|Perch family
Snoeken|Pikes
Meervallen|Catfishes
Steuren|Sturgeons
Zeebaarzen|Sea basses
Kabeljauwachtigen|Cod relatives
Platvissen|Flatfishes
Makreelachtigen|Mackerels and tunas
Goudmakrelen|Dolphinfishes
Zwaardvissen|Swordfishes
Rivierkreeften|Crayfishes
Palingachtigen|Eels
Zalmachtigen|Salmonids
Zeewolven|Wolffishes
Grondels|Gobies
Karpers & varianten|Carp & variants
Roofvis & forel|Predators & trout
Bodemvissen|Bottom dwellers
Zee & oceaan|Sea & ocean
Algemeen|Common
Ongewoon|Uncommon
Zeldzaam|Rare
Bijzonder|Special
`.trim().split('\n').map(line=>line.split('|'));
const speciesNotesEnglish = {
 "voorn": [
  "Silver flanks, red eyes and warm reddish-brown fins.",
  "Plant margins, lakes and quiet river arms."
 ],
 "ruisvoorn": [
  "A golden sheen, red fins and a slightly upturned mouth.",
  "Sunny reed beds and lily patches."
 ],
 "brasem": [
  "A deep, flattened flank with a long anal fin.",
  "Soft beds in lakes and slow-flowing rivers."
 ],
 "zeelt": [
  "Olive green with fine scales, red eyes and rounded fins.",
  "Warm, weedy lakes with a soft bottom."
 ],
 "kroes": [
  "A bronze cyprinid without barbels and with a gently convex dorsal fin.",
  "Sheltered ponds, ditches and weedy margins."
 ],
 "schub": [
  "Regular scales cover the entire flank of this carp form.",
  "Lakes, old river arms and spacious, weedy waters."
 ],
 "spiegel": [
  "Large, irregular scales create a distinctive flank pattern.",
  "Warm lakes, ponds and quiet river arms."
 ],
 "winde": [
  "A silver flank, solid build and reddish lower fins.",
  "Broad rivers, canals and connected lakes."
 ],
 "barbeel": [
  "Four barbels identify this powerful bottom-feeding fish.",
  "Flowing river reaches with sand, gravel and stones."
 ],
 "baars": [
  "Dark vertical bands, a spiny dorsal fin and orange-red lower fins.",
  "Bankside structure, weed beds and drop-offs."
 ],
 "snoek": [
  "A long body with light spots and a broad, flattened mouth.",
  "Weedy lakes and quiet river arms."
 ],
 "graskarper": [
  "An elongated cyprinid with dark-edged scales and a blunt head.",
  "Warm fresh water with abundant aquatic plants."
 ],
 "meerval": [
  "A broad head, long barbels and a smooth, marbled flank.",
  "Deep freshwater channels and sheltered river arms."
 ],
 "steur": [
  "Rows of bony scutes and a pointed snout define its profile.",
  "Deeper freshwater zones; stocked in this game water."
 ],
 "zeebaars": [
  "A silver hunter with two dorsal fins and a powerful tail.",
  "Coastal water, tidal currents and rocky margins."
 ],
 "kabeljauw": [
  "Mottled flanks, three dorsal fins and a chin barbel.",
  "Cool seas, wrecks and deep bottom structure."
 ],
 "heilbot": [
  "A large, elongated flatfish with both eyes on one side.",
  "Cold marine sand and gravel beds."
 ],
 "tonijn": [
  "Streamlined steel blue with yellow fins and finlets.",
  "Warm ocean water around current seams and baitfish."
 ],
 "blauwvintonijn": [
  "A powerful tuna with a dark blue back and silver belly.",
  "Open Atlantic water and large baitfish shoals."
 ],
 "zwaardvis": [
  "Its long, flattened, sword-like upper jaw is unmistakable.",
  "Open ocean, deep water layers and current fronts."
 ],
 "rivierkreeft": [
  "A clawed crustacean that may cling to bait on the bottom.",
  "Freshwater beds with plenty of shelter."
 ],
 "linear_spiegel": [
  "A mirror carp form with a striking row of large scales along its flank.",
  "Carp lakes and old river arms."
 ],
 "rijenkarper": [
  "A carp form with prominent scale rows and large areas of bare skin.",
  "Quiet carp waters and broad river arms."
 ],
 "lederkarper": [
  "An almost scaleless carp form with a smooth outline.",
  "Sheltered, warm carp lakes."
 ],
 "volschub_spiegel": [
  "A mirror carp form covered in many large, irregularly arranged scales.",
  "Established carp waters with soft and hard bottom zones."
 ],
 "giebel": [
  "A silvery-grey cyprinid without barbels and with a concave dorsal-fin edge.",
  "Quiet lakes, ditches and river arms."
 ],
 "riviergrondel": [
  "A small bottom fish with flank spots, spotted fins and two barbels.",
  "Sand and gravel beds, often in a gentle current."
 ],
 "witvinriviergrondel": [
  "A slender gudgeon-like fish with pale fins and long barbels.",
  "Sandy beds of large, flowing rivers."
 ],
 "zwartbekgrondel": [
  "A stocky bottom fish with a black spot on its first dorsal fin.",
  "Stony banks and sandy beds in rivers and lakes."
 ],
 "marmergrondel": [
  "A small, marbled goby with tubular nostrils.",
  "Shallow margins with plants, stones or mud."
 ],
 "kolblei": [
  "A compact, silver bream relative with conspicuously large eyes.",
  "Quiet rivers, canals and weedy lakes."
 ],
 "alver": [
  "A small, silver surface fish with an upturned mouth.",
  "Open water and sheltered margins."
 ],
 "pos": [
  "A spotted, sandy-coloured bottom fish with a tall, spiny dorsal fin.",
  "Sandy or silty beds of lakes and rivers."
 ],
 "kopvoorn": [
  "A broad head, large mouth and dark-edged scales.",
  "Riverbanks, overhanging trees and current seams."
 ],
 "serpeling": [
  "A slender silver fish with a small, slightly downward-facing mouth.",
  "Clear rivers and streams over sand and gravel."
 ],
 "sneep": [
  "Its projecting snout sits above a straight, downward-facing mouth.",
  "Flowing river sections with a stony bottom."
 ],
 "blauwneus": [
  "Silver flanks and a dark snout above a small mouth.",
  "Lower river reaches and adjoining deep arms."
 ],
 "snoekbaars": [
  "An elongated predator with two dorsal fins, dark bands and sharp fangs.",
  "Drop-offs and turbid lakes or rivers."
 ],
 "paling": [
  "A smooth, snake-like body with a continuous fin fringe.",
  "Bottom structure, dark margins and connected inland waters."
 ],
 "kwabaal": [
  "A mottled freshwater cod relative with a clear chin barbel.",
  "Cool water and deep river beds."
 ],
 "beekforel": [
  "A golden flank scattered with dark and red spots.",
  "Cool, oxygen-rich inflows and margins."
 ],
 "regenboogforel": [
  "Black spots and a pink-purple stripe along a silver flank.",
  "Cool lakes and well-oxygenated fresh water."
 ],
 "vlagzalm": [
  "A large, colourful, sail-like dorsal fin above silvery-grey flanks.",
  "Clear, cool currents over gravel."
 ],
 "roofblei": [
  "A silver predator with a large mouth and deeply forked tail.",
  "Current seams and open water in large rivers."
 ],
 "bot": [
  "A greenish-brown flatfish with irregular dark markings.",
  "Sandy and muddy beds along coasts and estuaries."
 ],
 "schol": [
  "Orange spots stand out across its brown upper side.",
  "Shallow sandy beds in cool seas."
 ],
 "schar": [
  "A small, sandy-coloured flatfish with a strongly arched lateral line.",
  "Sandy coastal beds and open shallows."
 ],
 "wijting": [
  "Slender and silvery, with three dorsal fins and a dark pectoral-fin spot.",
  "Cool coastal water over sand and silt."
 ],
 "schelvis": [
  "A black lateral line and dark shoulder spot contrast with silver-grey skin.",
  "Cool seabeds of sand, gravel and shells."
 ],
 "koolvis": [
  "A dark green back, silver belly and light lateral line.",
  "Rocky coasts, fjords and open northern seas."
 ],
 "makreel": [
  "A blue-green sheen with dark, wavy bars across its back.",
  "Open-water shoals above the continental shelf."
 ],
 "leng": [
  "An elongated sea fish with a chin barbel and long dorsal fin.",
  "Deep rocky beds, ledges and wrecks."
 ],
 "zeewolf": [
  "A solid head, powerful teeth and dark vertical bands.",
  "Cold rocky beds with holes and shellfish."
 ],
 "goudmakreel": [
  "A high forehead, long blue dorsal fin and bright golden-green flanks.",
  "Warm open ocean, often near floating material."
 ],
 "wahoo": [
  "A very slender ocean hunter with blue vertical bands and a pointed mouth.",
  "Warm Atlantic water around current seams and baitfish shoals."
 ]
};
const speciesNotesEntries=Object.entries(speciesNotesEnglish).flatMap(([id,[description,habitat]])=>[[SPECIES_INFO[id].description,description],[SPECIES_INFO[id].habitat,habitat]]);
export const ENGLISH = Object.fromEntries([...entries,...fragments,...equipmentEntries,...rodSelectionEntries,...workshopLayoutEntries,...speciesExpansionEntries,...speciesNotesEntries]);

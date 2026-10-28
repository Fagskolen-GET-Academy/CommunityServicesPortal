# Leveranserapport – baseline

Kontrollert 28. oktober 2026. Baseline er implementert og kontrollert. Ingen senere undervisningsvariant er opprettet.

## Arkitektur og filer

- .NET 8 Minimal API, SQLite og Dapper i ett hovedprosjekt med `Endpoints`, `Application`, `Domain`, `Infrastructure` og `Authentication`.
- Frontend følger Intro/Emne 2: én global `model`, egne view/controller-par for sju sider, vanlige script-tagger og ingen klasser, moduler eller byggsteg.
- Kommunikasjon følger `Controller → domainApi.js → api.js → backend`. Bare `api.js` bruker `fetch`.
- Full filstruktur, oppstart og endepunkttabell: [README.md](README.md). Nummererte regler: [SYSTEM_RULES.md](SYSTEM_RULES.md).

## Implementerte use cases og API

Innlogging/utlogging, offentlige lister og detaljer, type-/statusfilter, opprettelse av alle tre sakstyper, publiseringsvalg, Mine saker, privat samtale, saksbehandleroversikt, tildeling, statusendringer med historikk og unik støtte er implementert.

Alle forespurte rutegrupper finnes: `/api/auth`, `/api/public/cases`, `/api/cases`, `/api/caseworker/cases` og `/api/test/reset`. I tillegg finnes `/api/auth/csrf` og `/api/caseworker/workers`. Offentlig API bruker egen DTO; private citizen-kall kontrollerer eierskap. Alle skrivekall krever CSRF-token.

## Seed og reset

Fire demo-brukere er opprettet med de avtalte navnene, e-postene og rollene; passord er hashet. Faste saker 1001–1003 følger oppdraget. Sak 1004 er en ekstra offentlig vedlikeholdssak. Meldinger, sammenhengende historikk og én støtte følger med.

Reset er testet både gjennom integrasjonstest og `scripts/Reset-Demo.ps1` mot vanlig Development-oppstart. Endepunktet krever CaseWorker og finnes bare i Development/Testing. Production seedes ikke med demo-kontoer.

## Verifikasjon

| Kontroll | Resultat |
| --- | --- |
| Bygg av hele løsningen | Bestått, 0 advarsler og 0 feil |
| NUnit/application/API | 32 av 32 bestått |
| Playwright .NET / Chromium | 6 av 6 bestått |
| Vanlig `dotnet run` og HTTP-smoke | Bestått, forside svarer 200 |
| Citizen-/CaseWorker-innlogging | Kari og Nora kontrollert mot kjørende app |
| Public/private | Offentlig: 1001, 1002, 1004; 1003 skjules; anonymisert sak uten navn |
| Eierskap | Kari får 404 ved privat oppslag på Ahmeds sak |
| Seed og reset | Fire saker gjenopprettes med avtalte statuser og meldinger |
| Samtidighet | Dobbelt støtte og samtidige statusendringer kontrollert |
| Visuell kontroll | Desktop 1280 px og mobil 390 px; ingen horisontal overflyt i offentlig oversikt |
| NuGet-kontroll, også transitive pakker | Ingen kjente sårbare pakker rapportert av konfigurerte kilder |

Bygget retter seg mot `net8.0`; kontrollmiljøet brukte SDK 10.0.403 og .NET 8-runtime. Testkjøreren og Chromium krevde kjøring utenfor verktøyets sandbox for prosesskommunikasjon. Dette er en begrensning ved verifikasjonsmiljøet og innfører ingen ekstra oppstartskrav i prosjektet.

Testresultater ligger lokalt under testprosjektenes `TestResults/baseline.trx`. Playwright-skjermbilder ligger under `CommunityServicesPortal.E2E/bin/Debug/net8.0/TestResults`. Genererte resultater og lokale databaser er utelatt fra Git. Dette er et avgrenset testsett og en smoke-/layoutkontroll, ikke en fullstendig tilgjengelighets- eller sikkerhetsrevisjon.

## Avvik og valg før videre undervisningsarbeid

Ingen vesentlige avvik fra oppdraget. Disse enkle baselinevalgene er eksplisitte i systemreglene:

- Støtte finnes på problem og vedlikehold, kan også gis til egen sak og kan ikke trekkes tilbake.
- Offentlige detaljer viser felles beskrivelse; typespesifikke felt holdes i privat saksvisning.
- Saksbehandler endrer status manuelt etter innbyggerens svar. Meldinger tillates også etter avslutning, uten gjenåpning.
- Tildeling angir ansvar; alle CaseWorkers har tilgang til alle saker.
- Testmiljøets navn er `Testing`; normal lokal oppstart bruker `Development`.

Vurder disse regelvalgene før en senere variant, og behold systemreglene og de grønne testene som referansepunkt. Kart, opplasting, juridisk innsyn, registrering og produksjonsutrulling ligger utenfor denne leveransen, som avtalt.

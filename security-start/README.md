# Community Services Portal

```text
src/CommunityServicesPortal.Frontend
    HTML/CSS/JavaScript-grensesnittet
src/CommunityServicesPortal.Api
    ASP.NET Core API, applikasjonslogikk og SQLite
tests/CommunityServicesPortal.UnitTests
    Tester enkel logikk isolert
tests/CommunityServicesPortal.ApiTests
    API-/integrasjonstester gjennom WebApplicationFactory
tests/CommunityServicesPortal.E2ETests
    Playwright-tester gjennom ekte nettleser
scripts
    Hjelpeverktøy for lokal utvikling og undervisning
```

Startversjon for sikkerhetsundervisning i **Testing og kvalitetssikring av programvare**. Innbyggere melder problemer, vedlikeholdsbehov og forbedringsforslag gjennom én kommunal kanal. Saksbehandlere tildeler saker, sender meldinger og følger status. Bruk varianten lokalt med demo-data; forventet adferd beskrives av systemreglene.

## Start

Du trenger .NET 8 SDK, eller nyere SDK med .NET 8-runtime. Første restore trenger NuGet-tilgang. Ingen Node, npm, bundler, Docker eller ekstern identitetsleverandør trengs.

Kjør fra denne variantens rot:

```sh
dotnet restore CommunityServicesPortal.sln
dotnet run --project src/CommunityServicesPortal.Api
```

Åpne [localhost:5081](http://localhost:5081). Launch-profilen bruker Development og oppretter demo-database automatisk. Fra API-mappen kan du kjøre bare `dotnet run`.

## Demo-kontoer

Dette er **demo-kontoer med fiktive data**, til lokal undervisning. Felles passord: **Demo123!**. Passord hashes i databasen med ASP.NET Core `PasswordHasher<User>`.

| Navn | E-post | Rolle |
| --- | --- | --- |
| Kari Nordmann | citizen1@example.test | Citizen |
| Ahmed Hassan | citizen2@example.test | Citizen |
| Nora Hansen | worker1@example.test | CaseWorker |
| Jonas Berg | worker2@example.test | CaseWorker |

## Kode og navigasjon

Backend har ett lett lagdelt prosjekt: Endpoints mottar HTTP og håndhever policies, Application inneholder use cases og regler, Domain inneholder enkle modeller/enums, og Infrastructure bruker parameterisert Dapper/SQL. Innlogging bruker ASP.NET Core cookies, claims og roller.

Frontend følger Intro/Emne 2 med vanlige script-tagger, navngitte funksjoner, eksplisitte `if`/`for` og lesbar HTML. API-kall bruker `async`/`await`.

```text
View → Controller → domainApi.js → api.js → backend
                           respons → model → updateView() → View

location.hash → handleHashChange() → riktig page-controller
                                   → data inn i model → updateView()
```

`model.app` inneholder innlogget bruker. `model.viewState` inneholder skjemautkast, filtre, midlertidige valg, ventetilstand og feil. Domenedata ligger direkte på `model`, for eksempel `myCases` og `currentCase`.

`getRoute()` i `js/app.js` tolker hashen. `window.onhashchange` kjører `handleHashChange()`, som velger controller. Hver page-controller viser lasting, henter data og oppdaterer visningen. `updateView()` leser route og velger view. Side og route-ID kopieres ikke til modellen.

Hash-lenker som `#my/1001` og `#worker/1003` støtter direkte oppslag, refresh og browser back/forward. De sju sidene har hvert sitt view/controller-par. Offentlig detalj bruker PublicCasesPage. UI-events står direkte i HTML; `escapeHtml()` brukes for dynamisk innhold.

`api.js` kjenner bare HTTP, JSON, credentials, status og generelle feil. `domainApi.js` uttrykker handlinger som `getMyCases()` og `createCase()`, og henter CSRF-token før skrivekall. Bare `api.js` bruker `fetch`.

## Bygg og publisering

Frontend-mappen er eneste kilde. API-prosjektets `.csproj` har ett enkelt `CopyFrontend`-target som kopierer kildefilene til generert `wwwroot` under bygg. `wwwroot` ignoreres av Git og følger vanlig publisering. Endre kildefilene i Frontend og bygg/start appen igjen.

```sh
dotnet build CommunityServicesPortal.sln
dotnet publish src/CommunityServicesPortal.Api -o .local/publish
```

Den publiserte mappen inneholder API og statiske filer. Kjør den publiserte DLL-en fra denne mappen. `Production` seedes ikke med demo-kontoer og har ikke reset-endepunkt; lokal demo-start bruker Development.

`Directory.Build.props` på variantroten samler net8.0, nullable, implicit usings og warnings-as-errors. `scripts/` inneholder undervisnings-/utviklingsverktøy, ikke applikasjonskode.

Solutionen viser `src` med API og en Frontend-mappe med Solution Items, `tests` med tre testprosjekter, `Documentation` med README/systemregler/felles byggeinnstillinger og `Scripts` med reset-skriptet. Frontend er ikke et eget .NET-prosjekt.

## Database og reset

SQLite er en relasjonsdatabase som kjører embedded i applikasjonen og typisk lagrer databasen i én fil. Studentene har tidligere brukt SQL Server; SQLite brukes her fordi undervisningscaset skal være enkelt å starte og nullstille.

Databasen ligger i `src/CommunityServicesPortal.Api/App_Data/community-services.db`. ASP.NET Data Protection-nøkler ligger i `App_Data/keys`. Hver variant har sin egen mappe og database. `Database__Path` kan overstyre filstien; relative stier regnes fra API-ets innholdsrot.

Mens appen kjører, kjør fra variantroten:

```powershell
./scripts/Reset-Demo.ps1
```

Skriptet logger inn som Nora og kaller `POST /api/test/reset` med CSRF-token. Bare CaseWorker kan nullstille, og bare i Development/Testing. Reset gjenoppretter alle demo-data i én transaksjon. Du kan også stoppe appen og slette kun databasefilen; neste Development-start oppretter den igjen.

| ID | Eier | Sak | Status | Publisering | Saksbehandler |
| --- | --- | --- | --- | --- | --- |
| 1001 | Kari | Tre over turstien | InProgress | PublicAnonymous | Nora |
| 1002 | Kari | Sykkelparkering ved holdeplassen | Submitted | PublicWithName | Ikke tildelt |
| 1003 | Ahmed | Knust vindu i kommunalt bygg | WaitingForCitizen | NotPublished | Jonas |
| 1004 | Ahmed | Erosjon ved bekken | InProgress | PublicAnonymous | Nora |

1001 har melding fra Nora og én støtte fra Ahmed. 1003 har et spørsmål fra Jonas. Alle saker har sammenhengende statushistorikk. Nye saker begynner på 1005 etter reset.

## Tester

```sh
dotnet test tests/CommunityServicesPortal.UnitTests
dotnet test tests/CommunityServicesPortal.ApiTests
```

UnitTests tester enkel applikasjonslogikk uten webvert. ApiTests bruker NUnit, WebApplicationFactory, HttpClient og isolert testdatabase.

Bygg først, installer Chromium én gang, og kjør nettlesertestene:

```powershell
pwsh tests/CommunityServicesPortal.E2ETests/bin/Debug/net8.0/playwright.ps1 install chromium
dotnet test tests/CommunityServicesPortal.E2ETests
```

På Windows kan PowerShell-skriptet også kjøres direkte. På Linux kan `install --with-deps chromium` være nødvendig.

E2E (End-to-End) bruker Playwright og tester hele kjeden fra ekte nettleser gjennom frontend og API til database. Testene starter/stenger egen Kestrel-server på en ledig port og bruker separat testdatabase. Appen trenger ikke kjøre på forhånd. Alle nivåene kan kjøres med `dotnet test CommunityServicesPortal.sln`. TRX/skjermbilder ligger under genererte TestResults-mapper.

`bin`, `obj`, `.vs`, TestResults, generert `wwwroot`, SQLite og nettlesercacher ignoreres av Git. En eventuell `.local` på utviklermaskinen er kun verktøycache, lokale publiseringsresultater og smoke-artefakter, og er ikke nødvendig for å bruke prosjektet. Ingen slike filer følger en ren checkout.

## Hovedflyter og API

Innbygger: logg inn → Mine saker/offentlige saker → Meld inn sak → velg type og publisering → bekreftelse → detaljer og meldinger. Saksbehandler: Saksoversikt → tildeling → Under behandling → melding / Venter på innbygger → les svar → Under behandling → Løst → Avsluttet.

API-grupper: `/api/auth` (csrf, login, logout, me), `/api/public/cases` (liste, detalj, support), `/api/cases` (opprett, my, detalj, messages), `/api/caseworker` (workers og cases med assignment/status/messages), og `/api/test/reset`.

JSON bruker camelCase og tekst-enums. Skrivekall krever øktens `X-CSRF-TOKEN`. Forretningsfeil gir `{ "message": "..." }`. [SYSTEM_RULES.md](SYSTEM_RULES.md) er autoritativt testgrunnlag og beskriver forventet systemadferd.

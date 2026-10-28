# Community Services Portal

Et lite, fungerende undervisningscase for fagskoleutdanningen **Testing og kvalitetssikring av programvare**. Innbyggere kan melde inn problemer, vedlikeholdsbehov og forbedringsforslag gjennom én kommunal kanal. Saksbehandlere følger opp med tildeling, meldinger og status.

## Start lokalt

Du trenger .NET 8 SDK, eller nyere SDK med .NET 8-runtime. Første restore trenger tilgang til NuGet. Ingen Node, frontendbygg, Docker eller ekstern identitetsleverandør er nødvendig.

```sh
dotnet run --project CommunityServicesPortal.Api
```

Åpne [http://localhost:5080](http://localhost:5080). Alternativt: gå inn i `CommunityServicesPortal.Api` og kjør `dotnet run`. Launch-profilen velger `Development`; første start oppretter database og demo-data automatisk. Stopp med Ctrl+C.

## Demo-kontoer

Dette er **demo-kontoer med fiktive data**, kun til lokal undervisning og testing. Felles passord er **`Demo123!`**. Passordet hashes ved seeding; databasen inneholder ikke klartekstpassord.

| Navn | E-post | Rolle |
| --- | --- | --- |
| Kari Nordmann | citizen1@example.test | Citizen |
| Ahmed Hassan | citizen2@example.test | Citizen |
| Nora Hansen | worker1@example.test | CaseWorker |
| Jonas Berg | worker2@example.test | CaseWorker |

Det finnes ikke registrering, passordbytte eller Admin. Vanlig oppstart er for lokal bruk. `Production` oppretter skjema uten demo-brukere og har ikke reset-endepunkt.

## Arkitektur og filstruktur

```text
CommunityServicesPortal.Api/
  Program.cs                  # Oppsett av app, cookies, policies, CSRF og tjenester
  Endpoints/                  # HTTP inn/ut og eksplisitte rollekrav
  Application/                # Use cases, validering, eierskap, statusregler, DTO-er
  Domain/                     # Små datamodeller og enums
  Infrastructure/             # Parameterisert Dapper/SQL, SQLite, transaksjoner, seed
  Authentication/             # Current user og policynavn
  wwwroot/
    index.html                # Vanlige script-tagger i eksplisitt rekkefølge
    css/site.css
    js/
      model.js                # Én global modell
      api.js                  # Generisk fetch/JSON/status/credentials
      domainApi.js            # Domenehandlinger og URL-er
      app.js                  # Enkel sidenavigasjon og updateView()
      commonViews.js          # Små HTML-funksjoner, norske navn, escaping
      pages/                  # XxxPageView.js + XxxPageController.js
CommunityServicesPortal.Tests/ # NUnit: applikasjonsregler og WebApplicationFactory
CommunityServicesPortal.E2E/   # NUnit + Playwright .NET, egen lokal Kestrel-server
scripts/Reset-Demo.ps1
SYSTEM_RULES.md                # Autoritativt testgrunnlag
```

Backend har én lett lagdelt assembly. Endepunkter henter innlogget bruker og kaller tjenester. Tjenester håndhever regler og eierskap; repositories utfører SQL. Status og historikk lagres atomisk. Offentlige svar bruker en egen DTO med eksplisitt feltliste. Innlogging bruker ASP.NET Core cookie authentication, claims, rollepolicies og `PasswordHasher<User>`.

Frontend viderefører Intro/Emne 2: views leser modellen og returnerer HTML, controllere håndterer handlinger og oppdaterer modellen, så kalles `updateView()`. `model.app` er global app-state, `model.viewState` inneholder utkast og filtre, og `model.data` inneholder domenedata fra API. Det finnes ingen JS-moduler, klasser eller frontend-framework.

```text
Brukerhandling → Controller → domainApi.js → api.js → ASP.NET API
                         respons → model → updateView() → View
```

Et konkret spor er `submitNewCase()` → `createCase()` → `apiPost()` → `POST /api/cases` → `CaseService.Create()` → SQLite. `fetch` finnes bare i `api.js`; controllerne kjenner domenefunksjoner fremfor HTTP-ruter. CSRF-token hentes av `domainApi.js` før skriveoperasjoner. Dynamiske tekster escapes før HTML-visning.

## SQLite og nullstilling

SQLite er en relasjonsdatabase som kjører embedded i applikasjonen og typisk lagrer databasen i én fil. Studentene har tidligere brukt SQL Server; SQLite brukes her fordi undervisningscaset skal være enkelt å starte og nullstille.

Standardfilen er `CommunityServicesPortal.Api/App_Data/community-services.db`. ASP.NET Data Protection-nøkler lagres i `App_Data/keys`. Disse lokale dataene ignoreres av Git. `Database__Path` kan angi en annen databasefil; relative stier regnes fra API-prosjektets innholdsrot.

Mens appen kjører, nullstill til undervisningstilstand fra PowerShell i prosjektroten:

```powershell
./scripts/Reset-Demo.ps1
```

Skriptet logger inn med Nora som demo-saksbehandler og kaller `POST /api/test/reset` med CSRF-token. Reset sletter nye saker og meldinger og gjenoppretter seed-data i én transaksjon. Bare `CaseWorker` kan bruke endepunktet, og bare i `Development`/`Testing`.

Du kan også stoppe appen og slette **kun databasefilen** nevnt over. Neste start i Development oppretter seed-tilstanden igjen. Ingen SQLite-administrasjon er nødvendig.

## Faste seed-data

| ID | Innsender | Sak | Status | Publisering | Saksbehandler |
| --- | --- | --- | --- | --- | --- |
| 1001 | Kari | Problem: Tre over turstien | InProgress | PublicAnonymous | Nora |
| 1002 | Kari | Forbedring: Sykkelparkering ved holdeplassen | Submitted | PublicWithName | Ikke tildelt |
| 1003 | Ahmed | Vedlikehold: Knust vindu i kommunalt bygg | WaitingForCitizen | NotPublished | Jonas |
| 1004 | Ahmed | Vedlikehold: Erosjon ved bekken | InProgress | PublicAnonymous | Nora |

1001 har melding fra Nora og én støtte fra Ahmed. 1003 har et spørsmål fra Jonas. Alle fire saker har sammenhengende statushistorikk. Bruker-ID-er er Kari=1, Ahmed=2, Nora=3, Jonas=4. Nye saker begynner på 1005 etter reset.

## Hovedflyter og sider

- **Innbygger:** logg inn → Offentlige saker eller Mine saker → Meld inn sak → type, felles felt, typefelt og publisering → bekreftelse og Min sak → meldinger og status.
- **Saksbehandler:** logg inn → Saksoversikt → Saksbehandling → tildeling → Under behandling → melding og eventuelt Venter på innbygger → les svar → Under behandling → Løst → Avsluttet.
- **Offentlig:** les oversikt/detalj uten innlogging, filtrer på type/status, se støtteantall. Innlogget citizen kan markere «Jeg opplever dette også» én gang på problem-/vedlikeholdssaker.

De sju sidene har hvert sitt view/controller-par. Offentlig detalj bruker PublicCasesPage. Sidenavigasjon bruker enkle hash-lenker, for eksempel `#my/1001` og `#worker/1003`.

## API

JSON bruker camelCase-felter og enum-verdiene fra domenet, for eksempel `Problem` og `PublicAnonymous`. Datoer er UTC ISO 8601. Forretningsfeil returnerer `{ "message": "..." }`. Ugyldig requeststruktur gir 400; manglende økt gir 401, feil rolle 403, ukjent/utilgjengelig sak 404 og konflikt 409.

| Tilgang | Metode og rute | Handling |
| --- | --- | --- |
| Alle | GET /api/auth/csrf | Token til neste skrivekall |
| Alle | POST /api/auth/login | Logg inn med email/password |
| Innlogget | POST /api/auth/logout | Logg ut |
| Innlogget | GET /api/auth/me | Gjeldende bruker |
| Alle | GET /api/public/cases?type=&status= | Publiserte saker |
| Alle | GET /api/public/cases/{id} | Offentlig detalj |
| Citizen | POST /api/public/cases/{id}/support | Registrer støtte |
| Citizen | POST /api/cases | Opprett sak |
| Citizen | GET /api/cases/my | Egne saker |
| Citizen | GET /api/cases/{id} | Egen privat detalj |
| Citizen | POST /api/cases/{id}/messages | Melding på egen sak |
| CaseWorker | GET /api/caseworker/workers | Mulige saksbehandlere |
| CaseWorker | GET /api/caseworker/cases?status=&assignedTo= | Saksoversikt |
| CaseWorker | GET /api/caseworker/cases/{id} | Saksdetaljer |
| CaseWorker | PUT /api/caseworker/cases/{id}/assignment | `{ "caseWorkerId": 3 }`, null fjerner tildeling |
| CaseWorker | PUT /api/caseworker/cases/{id}/status | `{ "status": "InProgress" }` |
| CaseWorker | POST /api/caseworker/cases/{id}/messages | `{ "text": "..." }` |
| CaseWorker, Development/Testing | POST /api/test/reset | Gjenopprett seed |

Alle skrivekall krever headeren `X-CSRF-TOKEN` fra `/api/auth/csrf` og tilhørende cookies. Hent nytt token etter inn-/utlogging fordi tokenet er knyttet til identiteten. `Reset-Demo.ps1` og API-testene viser hele sekvensen.

## Bygg og tester

```sh
dotnet build CommunityServicesPortal.sln
dotnet test CommunityServicesPortal.Tests
```

NUnit-testene tester regler, innlogging/utlogging, alle tre typer, privat eierskap, alle rollebeskyttede skriveoperasjoner, offentlige felt, unik støtte, CSRF, full statusflyt med meldinger, passordhashing og reset. Production testes separat. WebApplicationFactory bruker en egen midlertidig database per testvert; API-testene resetter før hver test.

Installer Chromium én gang etter bygg, og kjør E2E:

```powershell
pwsh CommunityServicesPortal.E2E/bin/Debug/net8.0/playwright.ps1 install chromium
dotnet test CommunityServicesPortal.E2E
```

På Windows kan skriptet også kjøres direkte fra PowerShell. På Linux kan `install --with-deps chromium` være nødvendig. Se [Playwrights nettleseroppsett](https://playwright.dev/dotnet/docs/browsers).

Playwright .NET leverer sin egen driver. Du trenger ikke installere Node. Seks smoke-tester dekker opprettelse for hver sakstype, Mine saker, citizen-svar, saksbehandlerens tildeling/status/melding og offentlige saker på desktop/mobil. Testene starter og stopper egen Kestrel-server på en ledig port og bruker separat testdatabase. Appen trenger ikke kjøre på forhånd. Skjermbilder lagres under testens `TestResults`-mappe.

Etter installasjon kan alle tester kjøres samlet med `dotnet test CommunityServicesPortal.sln`. Nettlesertestene feiler tydelig hvis Chromium ikke er installert.

## Avklarte baselinevalg

- Offentlig visning omfatter felles beskrivelse, men ikke typespesifikke data. Privat samtale og historikk vises bare for eier/saksbehandlere.
- Støtte gjelder problem og vedlikehold, også egne saker. Den kan ikke trekkes tilbake.
- Saksbehandler endrer status eksplisitt etter citizen-svar. Meldinger kan sendes også etter avslutning, uten automatisk gjenåpning.
- Alle saksbehandlere kan behandle alle saker. Tildeling angir ansvar og begrenser ikke lesetilgang.
- Skjema/database opprettes automatisk; det finnes ikke migreringsrammeverk. Ved modellendringer i dette caset kan den lokale databasen opprettes på nytt.

De presise, nummererte reglene står i [SYSTEM_RULES.md](SYSTEM_RULES.md). Bruk dem som forventet resultat i manuelle og automatiserte tester.

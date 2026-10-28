# Systemregler – Community Services Portal baseline

Dette er det autoritative testgrunnlaget. Alle tekster trimmes før lagring. Lengder angis i tegn etter trimming.

## Roller og innlogging

R01. Systemet har bare rollene `Citizen` og `CaseWorker`.
R02. Innlogging krever korrekt e-post og passord. E-post er ikke skiftsensitiv. Feil innlogging gir 401. Utlogging avslutter økten i nettleseren.
R03. Private endepunkter krever innlogging (401 uten økt). Endepunkter for feil rolle gir 403.
R04. Skrivende API-kall krever gyldig CSRF-token for gjeldende økt (400 uten token). Maksimalt 30 innloggingsforsøk per minutt og IP-adresse tillates (deretter 429).

## Opprettelse og felt

R05. Bare `Citizen` kan opprette saker. Innsender hentes fra innloggingen; klienten kan ikke velge eier, status, ID eller saksbehandler.
R06. En ny sak får status `Submitted`, ingen saksbehandler og et historikkinnslag fra ingen status til `Submitted`. ID og UTC-tidspunkt settes av serveren.
R07. Tittel er obligatorisk (1–120), beskrivelse er obligatorisk (1–4000), og sted er obligatorisk tekst (1–300).
R08. Sakstype må være `Problem`, `MaintenanceObservation` eller `ImprovementSuggestion`.
R09. `Problem` krever `ImpactLevel` (`Low`, `Medium`, `High`) og et eksplisitt boolsk `IsSafetyRisk`. `false` er et gyldig svar.
R10. `MaintenanceObservation` krever `ObservedChange` (1–1000) og et eksplisitt boolsk `MayGetWorse`. `false` er et gyldig svar.
R11. `ImprovementSuggestion` krever `ProposedImprovement` (1–1000) og `ExpectedBenefit` (1–1000).
R12. Felt for andre sakstyper ignoreres og lagres som null. Ugyldige eller manglende påkrevde verdier gir 400. JSON-enums bruker tekstverdier; tall er ikke gyldige enum-verdier.

## Publisering og offentlige data

R13. `PublicationSetting` er `PublicAnonymous` (standard), `PublicWithName` eller `NotPublished`.
R14. Offentlig oversikt og offentlig detalj kan leses uten innlogging. De inneholder bare publiserte saker. Direkte offentlig oppslag på `NotPublished` eller ukjent ID gir 404, også når innsenderen er innlogget.
R15. Offentlige svar inneholder bare ID, type, tittel, beskrivelse, sted, status, opprettelses-/oppdateringstid, eventuelt innsendernavn, støtteantall og indikatorene `SupportedByMe` og `CanSupport`.
R16. `PublicAnonymous` har null som innsendernavn, uansett hvem som leser offentlig API. `PublicWithName` viser innsenderens navn. E-post, eier-ID, saksbehandlerdata, typespesifikke felt, meldinger og statuslogg finnes ikke i offentlige svar.
R17. Publiseringsvalget gjelder denne portalen. Systemet implementerer ingen andre regler for offentlighet eller innsyn.
R18. Offentlige saker kan filtreres på type og status. Lister sorteres med nyeste opprettelsestid først, deretter høyeste ID.

## Eierskap og meldinger

R19. `Citizen` ser bare egne saker under Mine saker og gjennom private citizen-endepunkter. Oppslag og meldingsforsøk på andres saker gir 404, også hvis saken ellers er offentlig.
R20. Bare eieren og `CaseWorker` kan lese den private samtalen i en sak. Alle saksbehandlere kan lese og sende meldinger på alle saker, uavhengig av tildeling.
R21. Meldinger krever tekst med 1–2000 tegn. Forfatter og tidspunkt settes av serveren. Ingen kan sende på vegne av en annen bruker.
R22. Meldinger vises i kronologisk rekkefølge. Meldinger endrer ikke status automatisk. Meldinger kan også sendes i løste eller avsluttede saker; de gjenåpner ikke saken.

## Saksbehandling og status

R23. `CaseWorker` kan se alle saker, også upubliserte, og kan tildele alle saker til seg selv eller en annen `CaseWorker`. Null fjerner tildeling. Andre bruker-ID-er gir 400.
R24. Bare `CaseWorker` kan endre status. Tildeling er ikke et vilkår for å behandle saken.
R25. Tillatte statusoverganger er nøyaktig:

| Fra | Til |
| --- | --- |
| `Submitted` | `InProgress` |
| `InProgress` | `WaitingForCitizen` |
| `WaitingForCitizen` | `InProgress` |
| `InProgress` | `Resolved` |
| `Resolved` | `Closed` |

R26. Alle andre overganger, inkludert samme status og gjenåpning av `Closed`, gir 409. Ugyldig enum-verdi gir 400.
R27. Hver vellykket statusendring lagrer fra-status, til-status, saksbehandler og UTC-tid i samme transaksjon som endringen. Avvist overgang oppretter ingen historikk. Samtidige endringer fra samme gamle status gir høyst én vellykket endring; den andre gir 409.
R28. Tildeling, melding og statusendring oppdaterer sakens `UpdatedAt`.

## «Jeg opplever dette også»

R29. Bare innlogget `Citizen` kan støtte publiserte `Problem` og `MaintenanceObservation`. Dette gjelder også egne saker. Forbedringsforslag gir 400, upubliserte/ukjente saker gir 404.
R30. En innbygger kan registrere støtte én gang per sak. Første gang gir 204; gjentakelse gir 409 uten å øke antallet. Dette gjelder også samtidige kall.
R31. Offentlige lesere ser samlet antall. Identiteten til dem som støtter publiseres ikke. En innlogget citizen ser om egen støtte er registrert. Det finnes ingen fjerning av støtte, kommentarer eller rangering.

## Demo og reset

R32. `Development` og `Testing` oppretter fire demo-kontoer og sakene 1001–1004 når databasen er tom. Passord hashes med ASP.NET Core `PasswordHasher<User>`.
R33. `POST /api/test/reset` krever `CaseWorker` og CSRF-token og finnes bare i `Development`/`Testing`. Reset erstatter data med fast seed-tilstand, inkludert meldinger, historikk og støtte.
R34. `Production` har ikke reset-endepunkt og oppretter ikke demo-kontoer. Databasens skjema opprettes også i dette miljøet.

# Community Services Portal

Undervisningscase for fagskoleutdanningen **Testing og kvalitetssikring av programvare**.

- [baseline](baseline/README.md): den funksjonelt korrekte referanseimplementasjonen.
- [security-start](security-start/README.md): startversjon for sikkerhetsundervisning, med et begrenset antall bevisst introduserte sikkerhetsproblemer som studentene skal finne gjennom testing og analyse.

Begge varianter er selvstendige med egen solution, kildekode, frontend, tester, systemregler, scripts og lokal SQLite-database. Det deles ingen produksjonskode mellom dem.

```sh
dotnet run --project baseline/src/CommunityServicesPortal.Api
dotnet run --project security-start/src/CommunityServicesPortal.Api
```

Baseline bruker [localhost:5080](http://localhost:5080), Security Start bruker [localhost:5081](http://localhost:5081). Demo-kontoer og test-/reset-kommandoer står i hver variants README. Bruk Security Start lokalt med demo-data.

Senere kommer varianter for tilgjengelighet, brukervennlighet og integrert testing. Disse er ikke opprettet ennå.

# Community Services Portal

Undervisningscase for fagskoleutdanningen **Testing og kvalitetssikring av programvare**.

- [baseline](baseline/README.md): den funksjonelt korrekte referanseimplementasjonen.
- [security-start](security-start/README.md): startversjon for sikkerhetsundervisning, med et begrenset antall bevisst introduserte sikkerhetsproblemer som studentene skal finne gjennom testing og analyse.
- [accessibility-start](accessibility-start/README.md): startversjon for tilgjengelighetsundervisning, med et begrenset antall bevisst introduserte barrierer.

Alle variantene er selvstendige med egen solution, kildekode, frontend, tester, systemregler, scripts og lokal SQLite-database. Det deles ingen produksjonskode mellom dem.

```sh
dotnet run --project baseline/src/CommunityServicesPortal.Api
dotnet run --project security-start/src/CommunityServicesPortal.Api
dotnet run --project accessibility-start/src/CommunityServicesPortal.Api
```

Baseline bruker [localhost:5080](http://localhost:5080), Security Start bruker [localhost:5081](http://localhost:5081), og Accessibility Start bruker [localhost:5082](http://localhost:5082). Demo-kontoer og test-/reset-kommandoer står i hver variants README.

Senere kommer varianter for brukervennlighet og integrert testing. Disse er ikke opprettet ennå.

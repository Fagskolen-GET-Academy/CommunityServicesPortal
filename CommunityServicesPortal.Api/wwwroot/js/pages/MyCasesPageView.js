function myCasesPageView() {
    return `<div class="page-heading"><div>${headingView('Mine saker', 'Følg status og les meldinger fra kommunen.')}</div><a class="button" href="#new">Meld inn sak</a></div>
        <div class="case-list">${model.data.myCases.map(item => caseCardView(item, 'my')).join('') || '<p class="empty">Du har ingen saker ennå. Velg «Meld inn sak» for å begynne.</p>'}</div>`;
}

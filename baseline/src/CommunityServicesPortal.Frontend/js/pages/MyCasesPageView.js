function myCasesPageView() {
    let cases = '';
    for (let i = 0; i < model.myCases.length; i++) {
        cases += caseCardView(model.myCases[i], 'my', false);
    }
    if (model.myCases.length === 0) {
        cases = /*HTML*/`<p class="empty">Du har ingen saker ennå. Velg «Meld inn sak» for å begynne.</p>`;
    }
    return /*HTML*/`
        <div class="page-heading">
            <div>${headingView('Mine saker', 'Følg status og les meldinger fra kommunen.')}</div>
            <a class="button" href="#new">Meld inn sak</a>
        </div>
        <div class="case-list">${cases}</div>
    `;
}

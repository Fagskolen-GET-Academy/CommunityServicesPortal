function publicCasesPageView() {
    if (model.publicCase !== null) return publicCaseDetailsView();

    let createLink = '';
    if (model.app.currentUser === null) {
        createLink = /*HTML*/`<a class="button" href="#login">Logg inn for å melde inn</a>`;
    } else if (model.app.currentUser.role === 'Citizen') {
        createLink = /*HTML*/`<a class="button" href="#new">Meld inn sak</a>`;
    }

    let cases = '';
    for (let i = 0; i < model.publicCases.length; i++) {
        cases += caseCardView(model.publicCases[i], 'public', true);
    }
    if (model.publicCases.length === 0) cases = /*HTML*/`<p class="empty">Ingen saker passer til filtrene.</p>`;

    const filters = model.viewState.publicFilters;
    return /*HTML*/`
        <div class="page-heading">
            <div>${headingView('Sammen om nærmiljøet', 'Se hva som er meldt inn. Del et problem, et vedlikeholdsbehov eller en idé som gjør nærmiljøet bedre.')}</div>
            ${createLink}
        </div>
        <h2>Offentlige saker</h2>
        <form id="public-filters" onsubmit="event.preventDefault(); submitPublicFilters()" class="filters">
            <div class="field">
                <label for="filter-type">Sakstype</label>
                <select id="filter-type" onchange="model.viewState.publicFilters.type = this.value" name="type">${optionsView(typeNames, filters.type, 'Alle typer')}</select>
            </div>
            <div class="field">
                <label for="filter-status">Status</label>
                <select id="filter-status" onchange="model.viewState.publicFilters.status = this.value" name="status">${optionsView(statusNames, filters.status, 'Alle statuser')}</select>
            </div>
            <button id="public-filter-submit" class="secondary">Vis saker</button>
        </form>
        <p class="result-count">${model.publicCases.length} offentlige saker</p>
        <div class="case-list">${cases}</div>
    `;
}

function publicCaseDetailsView() {
    const item = model.publicCase;
    let citizenName = '';
    if (item.citizenName) citizenName = /*HTML*/`<dt>Innsender</dt><dd>${escapeHtml(item.citizenName)}</dd>`;
    return /*HTML*/`<p><a href="#public">← Alle offentlige saker</a></p>` +
        headingView(item.title, '', 'Offentlig sak #' + item.id) + /*HTML*/`
        <section class="panel narrow">
            ${statusView(item.status)}
            <dl>
                <dt>Sakstype</dt><dd>${escapeHtml(typeNames[item.type])}</dd>
                <dt>Beskrivelse</dt><dd class="preserve">${escapeHtml(item.description)}</dd>
                <dt>Sted</dt><dd>${escapeHtml(item.location)}</dd>
                ${citizenName}
                <dt>Sendt inn</dt><dd>${escapeHtml(dateText(item.createdAt))}</dd>
            </dl>
            <div class="card-bottom">${supportView(item)}</div>
        </section>
    `;
}

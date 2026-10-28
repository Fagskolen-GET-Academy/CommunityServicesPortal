function publicCasesPageView() {
    const selected = model.data.publicCase;
    if (selected) return `<p><a href="#public">← Alle offentlige saker</a></p>` + headingView(selected.title, '', 'Offentlig sak #' + selected.id) +
        `<section class="panel narrow">${statusView(selected.status)}<dl><dt>Sakstype</dt><dd>${escapeHtml(typeNames[selected.type])}</dd><dt>Beskrivelse</dt><dd class="preserve">${escapeHtml(selected.description)}</dd>
        <dt>Sted</dt><dd>${escapeHtml(selected.location)}</dd>${selected.citizenName ? `<dt>Innsender</dt><dd>${escapeHtml(selected.citizenName)}</dd>` : ''}
        <dt>Sendt inn</dt><dd>${escapeHtml(dateText(selected.createdAt))}</dd></dl><div class="card-bottom">${supportView(selected)}</div></section>`;
    const filters = model.viewState.publicFilters;
    return `<div class="page-heading"><div>${headingView('Sammen om nærmiljøet', 'Se hva som er meldt inn. Del et problem, et vedlikeholdsbehov eller en idé som gjør nærmiljøet bedre.')}</div>
        ${model.app.user?.role === 'Citizen' ? '<a class="button" href="#new">Meld inn sak</a>' : !model.app.user ? '<a class="button" href="#login">Logg inn for å melde inn</a>' : ''}</div>
        <h2>Offentlige saker</h2><form id="public-filters" class="filters"><div class="field"><label for="filter-type">Sakstype</label><select id="filter-type" name="type">${optionsView(typeNames, filters.type, 'Alle typer')}</select></div>
        <div class="field"><label for="filter-status">Status</label><select id="filter-status" name="status">${optionsView(statusNames, filters.status, 'Alle statuser')}</select></div><button class="secondary">Vis saker</button></form>
        <p class="result-count">${model.data.publicCases.length} offentlige saker</p><div class="case-list">${model.data.publicCases.map(item => caseCardView(item, 'public', true)).join('') || '<p class="empty">Ingen saker passer til filtrene.</p>'}</div>`;
}

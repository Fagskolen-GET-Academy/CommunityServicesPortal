function workerCasesPageView() {
    const filters = model.viewState.workerFilters;
    let cases = '';
    for (let i = 0; i < model.workerCases.length; i++) {
        cases += caseCardView(model.workerCases[i], 'worker', false);
    }
    if (model.workerCases.length === 0) cases = /*HTML*/`<p class="empty">Ingen saker passer til filtrene.</p>`;
    return headingView('Saksoversikt', 'Se henvendelser, fordel ansvar og følg opp innbyggerne.', 'Saksbehandler') + /*HTML*/`
        <form id="worker-filters" class="filters">
            <div class="field">
                <label for="worker-status">Status</label>
                <select id="worker-status" name="status">${optionsView(statusNames, filters.status, 'Alle statuser')}</select>
            </div>
            <div class="field">
                <label for="assigned-to">Tildelt saksbehandler</label>
                <select id="assigned-to" name="assignedTo">${caseWorkerOptionsView(model.workers, filters.assignedTo, 'Alle saksbehandlere')}</select>
            </div>
            <button id="worker-filter-submit" class="secondary">Vis saker</button>
        </form>
        <p class="result-count">${model.workerCases.length} saker</p>
        <div class="case-list">${cases}</div>
    `;
}

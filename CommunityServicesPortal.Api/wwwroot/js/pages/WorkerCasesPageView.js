function workerCasesPageView() {
    const filters = model.viewState.workerFilters;
    return headingView('Saksoversikt', 'Se henvendelser, fordel ansvar og følg opp innbyggerne.', 'Saksbehandler') +
        `<form id="worker-filters" class="filters"><div class="field"><label for="worker-status">Status</label><select id="worker-status" name="status">${optionsView(statusNames, filters.status, 'Alle statuser')}</select></div>
        <div class="field"><label for="assigned-to">Tildelt saksbehandler</label><select id="assigned-to" name="assignedTo">${optionsView(Object.fromEntries(model.data.workers.map(worker => [worker.id, worker.name])), filters.assignedTo, 'Alle saksbehandlere / ikke tildelt')}</select></div><button class="secondary">Vis saker</button></form>
        <p class="result-count">${model.data.workerCases.length} saker</p><div class="case-list">${model.data.workerCases.map(item => caseCardView(item, 'worker')).join('') || '<p class="empty">Ingen saker passer til filtrene.</p>'}</div>`;
}

async function loadWorkerCasesPage() {
    if (!requireRole('CaseWorker')) return;
    model.viewState.loading = true;
    model.viewState.error = '';
    model.viewState.loadFailed = false;
    updateView();
    try {
        model.workerCases = await getWorkerCases(model.viewState.workerFilters);
        model.workers = await getCaseWorkers();
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

async function submitWorkerFilters() {
    await loadWorkerCasesPage();
}

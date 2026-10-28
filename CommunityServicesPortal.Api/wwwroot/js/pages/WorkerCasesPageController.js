async function loadWorkerCasesPage() {
    model.data.workerCases = await getWorkerCases(model.viewState.workerFilters);
    model.data.workers = await getCaseWorkers();
}
function bindWorkerCasesPage() {
    const form = document.getElementById('worker-filters');
    form.onsubmit = async event => {
        event.preventDefault();
        model.viewState.workerFilters = { status: form.elements.status.value, assignedTo: form.elements.assignedTo.value };
        await performAction(loadWorkerCasesPage);
    };
}

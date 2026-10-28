async function loadWorkerCasesPage() {
    model.workerCases = await getWorkerCases(model.viewState.workerFilters);
    model.workers = await getCaseWorkers();
}

function bindWorkerCasesPage() {
    document.getElementById('worker-status').onchange = changeWorkerStatusFilter;
    document.getElementById('assigned-to').onchange = changeWorkerAssignmentFilter;
    document.getElementById('worker-filters').onsubmit = submitWorkerFilters;
}

function changeWorkerStatusFilter(event) {
    model.viewState.workerFilters.status = event.target.value;
}

function changeWorkerAssignmentFilter(event) {
    model.viewState.workerFilters.assignedTo = event.target.value;
}

async function submitWorkerFilters(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        await loadWorkerCasesPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function loadCaseWorkPage(caseId) {
    if (!requireRole('CaseWorker')) return;
    model.viewState.loading = true;
    model.viewState.error = '';
    model.viewState.loadFailed = false;
    model.viewState.message = '';
    model.currentCase = null;
    updateView();
    try {
        model.currentCase = await getWorkerCase(caseId);
        model.workers = await getCaseWorkers();
        model.viewState.assignment = '';
        if (model.currentCase.case.assignedCaseWorkerId !== null) {
            model.viewState.assignment = model.currentCase.case.assignedCaseWorkerId;
        }
        model.viewState.nextStatus = '';
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

async function submitAssignment() {
    if (!beginAction()) return;
    try {
        let workerId = null;
        if (model.viewState.assignment !== '') workerId = Number(model.viewState.assignment);
        const caseId = getRoute().id;
        await assignCase(caseId, workerId);
        model.currentCase = await getWorkerCase(caseId);
        model.viewState.notice = 'Tildelingen er lagret.';
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function submitStatus() {
    if (!beginAction()) return;
    try {
        const caseId = getRoute().id;
        await changeCaseStatus(caseId, model.viewState.nextStatus);
        model.currentCase = await getWorkerCase(caseId);
        model.viewState.nextStatus = '';
        model.viewState.notice = 'Status er oppdatert.';
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function submitWorkerMessage() {
    if (!beginAction()) return;
    try {
        const caseId = getRoute().id;
        await addWorkerMessage(caseId, model.viewState.message);
        model.viewState.message = '';
        model.currentCase = await getWorkerCase(caseId);
        model.viewState.notice = 'Meldingen er sendt. Endre status til «Venter på innbygger» dersom du trenger et svar.';
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

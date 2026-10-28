async function loadCaseWorkPage() {
    model.currentCase = await getWorkerCase(model.app.currentCaseId);
    model.workers = await getCaseWorkers();
    model.viewState.assignment = '';
    if (model.currentCase.case.assignedCaseWorkerId !== null) {
        model.viewState.assignment = model.currentCase.case.assignedCaseWorkerId;
    }
    model.viewState.nextStatus = '';
}

function bindCaseWorkPage() {
    document.getElementById('assignment').onchange = changeAssignment;
    document.getElementById('assignment-form').onsubmit = submitAssignment;
    const statusForm = document.getElementById('status-form');
    if (statusForm !== null) {
        document.getElementById('next-status').onchange = changeNextStatus;
        statusForm.onsubmit = submitStatus;
    }
    document.getElementById('message').oninput = changeWorkerMessage;
    document.getElementById('message-form').onsubmit = submitWorkerMessage;
}

function changeAssignment(event) {
    model.viewState.assignment = event.target.value;
}

function changeNextStatus(event) {
    model.viewState.nextStatus = event.target.value;
}

function changeWorkerMessage(event) {
    model.viewState.message = event.target.value;
}

async function submitAssignment(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        let workerId = null;
        if (model.viewState.assignment !== '') workerId = Number(model.viewState.assignment);
        await assignCase(model.app.currentCaseId, workerId);
        model.viewState.notice = 'Tildelingen er lagret.';
        await loadCaseWorkPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function submitStatus(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        await changeCaseStatus(model.app.currentCaseId, model.viewState.nextStatus);
        model.viewState.notice = 'Status er oppdatert.';
        await loadCaseWorkPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function submitWorkerMessage(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        await addWorkerMessage(model.app.currentCaseId, model.viewState.message);
        model.viewState.message = '';
        model.viewState.notice = 'Meldingen er sendt. Endre status til «Venter på innbygger» dersom du trenger et svar.';
        await loadCaseWorkPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

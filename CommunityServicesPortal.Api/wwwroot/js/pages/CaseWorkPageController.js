async function loadCaseWorkPage() {
    model.data.caseDetails = await getWorkerCase(model.app.caseId);
    model.data.workers = await getCaseWorkers();
    model.viewState.assignment = model.data.caseDetails.case.assignedCaseWorkerId ?? '';
    model.viewState.nextStatus = '';
}
function bindCaseWorkPage() {
    const assignment = document.getElementById('assignment-form');
    assignment.onchange = () => { model.viewState.assignment = assignment.elements.caseWorkerId.value; };
    assignment.onsubmit = async event => {
        event.preventDefault();
        await performAction(async () => {
            await assignCase(model.app.caseId, model.viewState.assignment === '' ? null : Number(model.viewState.assignment));
            model.app.notice = 'Tildelingen er lagret.';
            await loadCaseWorkPage();
        });
    };
    const status = document.getElementById('status-form');
    if (status) {
        status.onchange = () => { model.viewState.nextStatus = status.elements.status.value; };
        status.onsubmit = async event => {
            event.preventDefault();
            await performAction(async () => {
                await changeCaseStatus(model.app.caseId, model.viewState.nextStatus);
                model.app.notice = 'Status er oppdatert.';
                await loadCaseWorkPage();
            });
        };
    }
    const messages = document.getElementById('message-form');
    messages.oninput = () => { model.viewState.message = messages.elements.text.value; };
    messages.onsubmit = async event => {
        event.preventDefault();
        await performAction(async () => {
            await addWorkerMessage(model.app.caseId, model.viewState.message);
            model.viewState.message = '';
            model.app.notice = 'Meldingen er sendt. Endre status til «Venter på innbygger» dersom du trenger et svar.';
            await loadCaseWorkPage();
        });
    };
}

async function loadMyCasePage() {
    model.currentCase = await getCase(model.app.currentCaseId);
}

function bindMyCasePage() {
    document.getElementById('message').oninput = changeCitizenMessage;
    document.getElementById('message-form').onsubmit = submitCitizenMessage;
}

function changeCitizenMessage(event) {
    model.viewState.message = event.target.value;
}

async function submitCitizenMessage(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        await addCaseMessage(model.app.currentCaseId, model.viewState.message);
        model.viewState.message = '';
        model.viewState.notice = 'Meldingen er sendt.';
        await loadMyCasePage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

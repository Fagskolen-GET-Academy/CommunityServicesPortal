async function loadMyCasePage(caseId) {
    if (!requireRole('Citizen')) return;
    model.viewState.loading = true;
    model.viewState.error = '';
    model.viewState.loadFailed = false;
    model.viewState.message = '';
    model.currentCase = null;
    updateView();
    try {
        model.currentCase = await getCase(caseId);
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

async function submitCitizenMessage() {
    if (!beginAction()) return;
    try {
        const caseId = getRoute().id;
        await addCaseMessage(caseId, model.viewState.message);
        model.viewState.message = '';
        model.viewState.notice = 'Meldingen er sendt.';
        model.currentCase = await getCase(caseId);
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

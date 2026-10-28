async function loadPublicCasesPage(caseId) {
    model.viewState.loading = true;
    model.viewState.error = '';
    model.viewState.loadFailed = false;
    model.publicCase = null;
    updateView();
    try {
        if (caseId !== null) model.publicCase = await getPublicCase(caseId);
        else model.publicCases = await getPublicCases(model.viewState.publicFilters);
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

async function submitPublicFilters() {
    await loadPublicCasesPage(null);
}

async function submitSupport(caseId) {
    if (!beginAction()) return;
    try {
        await supportCase(caseId);
        model.viewState.notice = 'Registrert. Takk for at du bidrar.';
        await loadPublicCasesPage(getRoute().id);
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

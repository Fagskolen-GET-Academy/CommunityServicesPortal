async function loadMyCasesPage() {
    if (!requireRole('Citizen')) return;
    model.viewState.loading = true;
    model.viewState.error = '';
    model.viewState.loadFailed = false;
    updateView();
    try {
        model.myCases = await getMyCases();
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

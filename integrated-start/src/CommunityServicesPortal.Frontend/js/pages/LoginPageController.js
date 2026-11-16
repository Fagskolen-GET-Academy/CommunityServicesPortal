function showLoginPage() {
    model.viewState.loading = false;
    model.viewState.loadFailed = false;
    model.viewState.error = '';
    updateView();
    focusPageHeading();
}

async function submitLogin() {
    if (!beginAction()) return;
    try {
        const draft = model.viewState.login;
        model.app.currentUser = await login(draft.email, draft.password);
        draft.password = '';
        model.viewState.notice = 'Du er logget inn.';
        if (model.app.currentUser.role === 'CaseWorker') location.hash = '#worker';
        else location.hash = '#my';
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

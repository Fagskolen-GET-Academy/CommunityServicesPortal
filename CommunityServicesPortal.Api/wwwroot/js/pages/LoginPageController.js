function bindLoginPage() {
    document.getElementById('email').oninput = changeLoginEmail;
    document.getElementById('password').oninput = changeLoginPassword;
    document.getElementById('login-form').onsubmit = submitLogin;
}

function changeLoginEmail(event) {
    model.viewState.login.email = event.target.value;
}

function changeLoginPassword(event) {
    model.viewState.login.password = event.target.value;
}

async function submitLogin(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        const draft = model.viewState.login;
        model.app.currentUser = await login(draft.email, draft.password);
        draft.password = '';
        model.viewState.notice = 'Du er logget inn.';
        if (model.app.currentUser.role === 'CaseWorker') {
            navigate('worker');
        } else {
            navigate('my');
        }
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

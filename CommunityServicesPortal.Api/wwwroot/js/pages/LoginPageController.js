function bindLoginPage() {
    const form = document.getElementById('login-form');
    form.oninput = () => {
        model.viewState.login.email = form.elements.email.value;
        model.viewState.login.password = form.elements.password.value;
    };
    form.onsubmit = submitLogin;
}
async function submitLogin(event) {
    event.preventDefault();
    await performAction(async () => {
        const draft = model.viewState.login;
        model.app.user = await login(draft.email, draft.password);
        draft.password = '';
        model.app.notice = 'Du er logget inn.';
        navigate(model.app.user.role === 'CaseWorker' ? 'worker' : 'my');
    });
}

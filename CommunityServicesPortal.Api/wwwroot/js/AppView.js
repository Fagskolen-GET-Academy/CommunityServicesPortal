function navigationView() {
    const page = model.app.currentPage;
    const user = model.app.currentUser;
    let html = navigationLinkView('public', 'Offentlige saker', page);
    if (user === null) {
        html += navigationLinkView('login', 'Logg inn', page);
    } else {
        if (user.role === 'Citizen') {
            html += navigationLinkView('my', 'Mine saker', page);
            html += navigationLinkView('new', 'Meld inn sak', page);
        }
        if (user.role === 'CaseWorker') {
            html += navigationLinkView('worker', 'Saksoversikt', page);
        }
        html += /*HTML*/`
            <span class="identity">${escapeHtml(user.name)}</span>
            <button id="logout-button" ${disabledAttribute()}>Logg ut</button>
        `;
    }
    return html;
}

function navigationLinkView(route, label, currentPage) {
    let current = '';
    if (route === currentPage) current = 'aria-current="page"';
    return /*HTML*/`<a href="#${route}" ${current}>${label}</a> `;
}

function feedbackView() {
    let html = '';
    if (model.viewState.error !== '') {
        html += /*HTML*/`<div id="error-message" class="error" role="alert" tabindex="-1">${escapeHtml(model.viewState.error)}</div>`;
    }
    if (model.viewState.notice !== '') {
        html += /*HTML*/`<div class="notice" role="status">${escapeHtml(model.viewState.notice)}</div>`;
    }
    return html;
}

function currentPageView() {
    if (model.viewState.loading) return /*HTML*/`<p>Laster …</p>`;
    if (model.viewState.loadFailed) return headingView('Kunne ikke åpne siden', 'Gå tilbake til oversikten og prøv igjen.');

    const page = model.app.currentPage;
    const user = model.app.currentUser;
    if (page === 'public') return publicCasesPageView();
    if (page === 'login') return loginPageView();
    if (user !== null && user.role === 'Citizen') {
        if (page === 'new') return newCasePageView();
        if (page === 'my') {
            if (model.app.currentCaseId !== null && model.currentCase !== null) return myCasePageView();
            return myCasesPageView();
        }
    }
    if (user !== null && user.role === 'CaseWorker' && page === 'worker') {
        if (model.app.currentCaseId !== null && model.currentCase !== null) return caseWorkPageView();
        return workerCasesPageView();
    }
    return headingView('Siden er ikke tilgjengelig', 'Bruk hovedmenyen for å gå videre.');
}

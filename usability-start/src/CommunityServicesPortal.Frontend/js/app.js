// Hashen er eneste kilde til hvilken side og sak som er valgt.
function getRoute() {
    let hash = location.hash;
    if (hash === '') hash = '#public';
    const parts = hash.substring(1).split('/');
    const route = { page: parts[0], id: null };
    if (parts.length > 1) {
        if (parts.length !== 2 || !/^\d+$/.test(parts[1]) || Number(parts[1]) < 1) {
            route.page = '';
        } else {
            route.id = Number(parts[1]);
        }
    }
    return route;
}

async function handleHashChange() {
    const route = getRoute();
    if (route.page === 'public') {
        await loadPublicCasesPage(route.id);
    } else if (route.page === 'login') {
        showLoginPage();
    } else if (route.page === 'new') {
        showNewCasePage();
    } else if (route.page === 'my' && route.id === null) {
        await loadMyCasesPage();
    } else if (route.page === 'my') {
        await loadMyCasePage(route.id);
    } else if (route.page === 'worker' && route.id === null) {
        await loadWorkerCasesPage();
    } else if (route.page === 'worker') {
        await loadCaseWorkPage(route.id);
    } else {
        location.hash = '#public';
    }
}

function updateView() {
    const route = getRoute();
    document.getElementById('navigation').innerHTML = navigationView();
    document.getElementById('feedback').innerHTML = feedbackView();
    const pageElement = document.getElementById('page');
    pageElement.setAttribute('aria-busy', String(model.viewState.loading));
    pageElement.innerHTML = currentPageView(route);
    const headings = pageElement.getElementsByTagName('h1');
    let title = 'Laster';
    if (headings.length > 0) title = headings[0].textContent;
    document.title = title + ' | Community Services Portal';
}

// Bare en hjelp til brukerreisen. API-et håndhever tilgang på serveren.
function requireRole(role) {
    if (model.app.currentUser === null) {
        location.hash = '#login';
        return false;
    }
    if (model.app.currentUser.role !== role) {
        model.viewState.loading = false;
        model.viewState.loadFailed = true;
        model.viewState.error = 'Du har ikke tilgang til denne siden.';
        updateView();
        focusPageHeading();
        return false;
    }
    return true;
}

// Små hjelpere for ventetilstand og fokus ved skrivehandlinger.
function beginAction() {
    if (model.viewState.busy) return false;
    model.viewState.focusedElementId = '';
    if (document.activeElement !== null) model.viewState.focusedElementId = document.activeElement.id;
    model.viewState.actionRoute = location.hash;
    model.viewState.busy = true;
    model.viewState.error = '';
    model.viewState.notice = '';
    updateView();
    return true;
}

function endAction() {
    model.viewState.busy = false;
    updateView();
    const errorMessage = document.getElementById('error-message');
    if (errorMessage !== null) {
        errorMessage.focus();
    } else if (location.hash === model.viewState.actionRoute && model.viewState.focusedElementId !== '') {
        const previousElement = document.getElementById(model.viewState.focusedElementId);
        if (previousElement !== null) previousElement.focus();
    }
}

function focusPageHeading() {
    const headings = document.getElementById('page').getElementsByTagName('h1');
    if (headings.length > 0) headings[0].focus();
}

function focusMainContent(event) {
    event.preventDefault();
    document.getElementById('main').focus();
}

async function submitLogout() {
    if (!beginAction()) return;
    try {
        await logout();
        model.app.currentUser = null;
        model.currentCase = null;
        model.myCases = [];
        model.workerCases = [];
        model.workers = [];
        model.viewState.message = '';
        resetNewCaseDraft();
        model.viewState.notice = 'Du er logget ut.';
        if (location.hash === '#public') await loadPublicCasesPage(null);
        else location.hash = '#public';
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function startApp() {
    try {
        model.app.currentUser = await getCurrentUser();
    } catch (error) {
        if (error.status !== 401) model.viewState.error = error.message;
    }
    if (location.hash === '') location.hash = '#public';
    else await handleHashChange();
}

window.onhashchange = handleHashChange;
startApp();

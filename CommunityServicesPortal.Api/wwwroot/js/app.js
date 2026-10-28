// Enkel sidenavigasjon og updateView(), uten rammeverk eller generelt event-system.
function navigate(route) {
    location.hash = route;
}

async function loadPage() {
    if (location.hash === '#main') {
        document.getElementById('main').focus();
        return;
    }

    const routeParts = location.hash.slice(1).split('/');
    model.app.currentPage = routeParts[0];
    if (model.app.currentPage === '') model.app.currentPage = 'public';

    model.app.currentCaseId = null;
    if (routeParts.length > 1 && /^\d+$/.test(routeParts[1])) {
        model.app.currentCaseId = Number(routeParts[1]);
    }

    model.viewState.error = '';
    model.viewState.loadFailed = false;
    model.viewState.loading = true;
    model.currentCase = null;
    model.publicCase = null;
    model.viewState.message = '';
    updateView();

    try {
        const page = model.app.currentPage;
        if ((page === 'new' || page === 'my' || page === 'worker') && model.app.currentUser === null) {
            navigate('login');
            return;
        }

        if (page === 'public') {
            await loadPublicCasesPage();
        } else if (page === 'login') {
            // Innloggingssiden bruker bare utkastet som allerede ligger i modellen.
        } else if (page === 'my' && model.app.currentUser.role === 'Citizen') {
            if (model.app.currentCaseId !== null) {
                await loadMyCasePage();
            } else {
                await loadMyCasesPage();
            }
        } else if (page === 'worker' && model.app.currentUser.role === 'CaseWorker') {
            if (model.app.currentCaseId !== null) {
                await loadCaseWorkPage();
            } else {
                await loadWorkerCasesPage();
            }
        } else if (page === 'new' && model.app.currentUser.role === 'Citizen') {
            // Skjemautkastet ligger allerede i model.viewState.newCase.
        } else {
            throw new Error('Du har ikke tilgang til denne siden.');
        }
    } catch (error) {
        model.viewState.error = error.message;
        model.viewState.loadFailed = true;
    } finally {
        model.viewState.loading = false;
        updateView();
        focusPageHeading();
    }
}

function updateView() {
    document.getElementById('navigation').innerHTML = navigationView();
    document.getElementById('feedback').innerHTML = feedbackView();

    const pageElement = document.getElementById('page');
    pageElement.setAttribute('aria-busy', String(model.viewState.loading));
    pageElement.innerHTML = currentPageView();

    // Små, direkte bindinger bevarer CSP uten å tillate inline JavaScript i HTML.
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton !== null) logoutButton.onclick = submitLogout;

    if (!model.viewState.loading && !model.viewState.loadFailed) {
        bindCurrentPage();
    }

    const headings = pageElement.getElementsByTagName('h1');
    let title = 'Laster';
    if (headings.length > 0) title = headings[0].textContent;
    document.title = title + ' | Community Services Portal';
}

function bindCurrentPage() {
    const page = model.app.currentPage;
    const user = model.app.currentUser;
    if (page === 'public') {
        bindPublicCasesPage();
    } else if (page === 'login') {
        bindLoginPage();
    } else if (user !== null && user.role === 'Citizen') {
        if (page === 'new') bindNewCasePage();
        if (page === 'my' && model.app.currentCaseId !== null && model.currentCase !== null) bindMyCasePage();
    } else if (user !== null && user.role === 'CaseWorker' && page === 'worker') {
        if (model.app.currentCaseId !== null && model.currentCase !== null) {
            bindCaseWorkPage();
        } else {
            bindWorkerCasesPage();
        }
    }
}

// Controllerne har eksplisitt try/await/catch/finally. Disse to funksjonene deler
// bare visning av ventetilstand og tastaturfokus, ikke selve handlingen.
function beginAction() {
    if (model.viewState.busy) return false;

    model.viewState.focusedElementId = '';
    if (document.activeElement !== null) {
        model.viewState.focusedElementId = document.activeElement.id;
    }
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
        // Utkast tilhører innbyggeren som er logget inn, også på en delt PC.
        resetNewCaseDraft();
        model.viewState.notice = 'Du er logget ut.';
        if (location.hash === '#public') {
            await loadPublicCasesPage();
        } else {
            navigate('public');
        }
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

function focusMainContent(event) {
    event.preventDefault();
    document.getElementById('main').focus();
}

async function startApp() {
    try {
        model.app.currentUser = await getCurrentUser();
    } catch (error) {
        if (error.status !== 401) model.viewState.error = error.message;
    }
    await loadPage();
}

window.onhashchange = loadPage;
document.getElementById('skip-link').onclick = focusMainContent;
startApp();

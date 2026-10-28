// A small page switch and explicit controllers; no framework or event bus.
function navigate(route) { location.hash = route; }

async function loadPage() {
    if (location.hash === '#main') { document.getElementById('main').focus(); return; }
    const [route = 'public', id] = location.hash.slice(1).split('/');
    model.app.page = route || 'public';
    model.app.caseId = id && /^\d+$/.test(id) ? Number(id) : null;
    model.app.error = '';
    model.app.loadFailed = false;
    model.app.loading = true;
    model.data.caseDetails = null;
    model.data.publicCase = null;
    model.viewState.message = '';
    updateView();
    try {
        const page = model.app.page;
        if (['new', 'my', 'worker'].includes(page) && !model.app.user) { navigate('login'); return; }
        if (page === 'public') await loadPublicCasesPage();
        else if (page === 'my' && model.app.user.role === 'Citizen') {
            if (model.app.caseId) await loadMyCasePage(); else await loadMyCasesPage();
        } else if (page === 'worker' && model.app.user.role === 'CaseWorker') {
            if (model.app.caseId) await loadCaseWorkPage(); else await loadWorkerCasesPage();
        } else if (page === 'new' && model.app.user.role === 'Citizen') { /* Draft is already in the model. */ }
        else if (page !== 'login') throw new Error('Du har ikke tilgang til denne siden.');
    } catch (error) { model.app.error = error.message; model.app.loadFailed = true; }
    finally {
        model.app.loading = false;
        updateView();
        document.querySelector('#page h1')?.focus();
    }
}

function updateView() {
    const app = model.app;
    document.getElementById('navigation').innerHTML = `<a href="#public" ${app.page === 'public' ? 'aria-current="page"' : ''}>Offentlige saker</a>` +
        (app.user?.role === 'Citizen' ? `<a href="#my" ${app.page === 'my' ? 'aria-current="page"' : ''}>Mine saker</a><a href="#new" ${app.page === 'new' ? 'aria-current="page"' : ''}>Meld inn sak</a>` : '') +
        (app.user?.role === 'CaseWorker' ? `<a href="#worker" ${app.page === 'worker' ? 'aria-current="page"' : ''}>Saksoversikt</a>` : '') +
        (app.user ? `<span class="identity">${escapeHtml(app.user.name)}</span><button id="logout-button" ${app.busy ? 'disabled' : ''}>Logg ut</button>` : `<a href="#login" ${app.page === 'login' ? 'aria-current="page"' : ''}>Logg inn</a>`);
    document.getElementById('logout-button')?.addEventListener('click', submitLogout);
    document.getElementById('feedback').innerHTML = (app.error ? `<div class="error" role="alert" tabindex="-1">${escapeHtml(app.error)}</div>` : '') +
        (app.notice ? `<div class="notice" role="status">${escapeHtml(app.notice)}</div>` : '');
    const page = document.getElementById('page');
    page.setAttribute('aria-busy', app.loading ? 'true' : 'false');
    if (app.loading) { page.innerHTML = '<p>Laster …</p>'; return; }
    if (app.loadFailed) {
        page.innerHTML = headingView('Kunne ikke åpne siden', 'Gå tilbake til oversikten og prøv igjen.'); return;
    }
    if (app.page === 'public') { page.innerHTML = publicCasesPageView(); bindPublicCasesPage(); }
    else if (app.page === 'login') { page.innerHTML = loginPageView(); bindLoginPage(); }
    else if (app.page === 'new' && app.user?.role === 'Citizen') { page.innerHTML = newCasePageView(); bindNewCasePage(); }
    else if (app.page === 'my' && app.user?.role === 'Citizen') {
        if (app.caseId && model.data.caseDetails) { page.innerHTML = myCasePageView(); bindMyCasePage(); }
        else { page.innerHTML = myCasesPageView(); bindMyCasesPage(); }
    } else if (app.page === 'worker' && app.user?.role === 'CaseWorker') {
        if (app.caseId && model.data.caseDetails) { page.innerHTML = caseWorkPageView(); bindCaseWorkPage(); }
        else { page.innerHTML = workerCasesPageView(); bindWorkerCasesPage(); }
    } else page.innerHTML = headingView('Siden er ikke tilgjengelig', 'Bruk hovedmenyen for å gå videre.');
    document.title = (page.querySelector('h1')?.textContent || 'Laster') + ' | Community Services Portal';
}

async function performAction(action) {
    if (model.app.busy) return;
    const focusedId = document.activeElement?.id;
    const originalRoute = location.hash;
    model.app.busy = true;
    model.app.error = '';
    model.app.notice = '';
    updateView();
    try { await action(); }
    catch (error) { model.app.error = error.message; }
    finally {
        model.app.busy = false;
        updateView();
        const errorMessage = document.querySelector('#feedback .error');
        if (errorMessage) errorMessage.focus();
        else if (location.hash === originalRoute && focusedId) document.getElementById(focusedId)?.focus();
    }
}
async function submitLogout() {
    await performAction(async () => {
        await logout();
        model.app.user = null;
        model.data.caseDetails = null;
        model.data.myCases = [];
        model.data.workerCases = [];
        model.data.workers = [];
        model.viewState.message = '';
        // Drafts belong to the signed-in citizen, including on a shared classroom computer.
        Object.assign(model.viewState.newCase, { type: 'Problem', title: '', description: '', location: '', publicationSetting: 'PublicAnonymous', impactLevel: '', isSafetyRisk: '', observedChange: '', mayGetWorse: '', proposedImprovement: '', expectedBenefit: '' });
        model.app.notice = 'Du er logget ut.';
        if (location.hash === '#public') await loadPublicCasesPage(); else navigate('public');
    });
}
async function startApp() {
    try { model.app.user = await getCurrentUser(); }
    catch (error) { if (error.status !== 401) model.app.error = error.message; }
    await loadPage();
}
window.addEventListener('hashchange', loadPage);
document.querySelector('.skip-link').onclick = event => {
    event.preventDefault();
    document.getElementById('main').focus();
};
startApp();

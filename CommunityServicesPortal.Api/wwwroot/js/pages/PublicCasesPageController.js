async function loadPublicCasesPage() {
    model.publicCase = null;
    if (model.app.currentCaseId !== null) {
        model.publicCase = await getPublicCase(model.app.currentCaseId);
    } else {
        model.publicCases = await getPublicCases(model.viewState.publicFilters);
    }
}

function bindPublicCasesPage() {
    const form = document.getElementById('public-filters');
    if (form !== null) {
        document.getElementById('filter-type').onchange = changePublicTypeFilter;
        document.getElementById('filter-status').onchange = changePublicStatusFilter;
        form.onsubmit = submitPublicFilters;
    }

    if (model.publicCase !== null) {
        bindSupportButton(model.publicCase.id);
    } else {
        for (let i = 0; i < model.publicCases.length; i++) {
            bindSupportButton(model.publicCases[i].id);
        }
    }
}

function bindSupportButton(caseId) {
    const button = document.getElementById('support-' + caseId);
    if (button !== null) button.onclick = submitSupport;
}

function changePublicTypeFilter(event) {
    model.viewState.publicFilters.type = event.target.value;
}

function changePublicStatusFilter(event) {
    model.viewState.publicFilters.status = event.target.value;
}

async function submitPublicFilters(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        await loadPublicCasesPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

async function submitSupport(event) {
    const caseId = Number(event.currentTarget.dataset.caseId);
    if (!beginAction()) return;
    try {
        await supportCase(caseId);
        model.viewState.notice = 'Registrert. Takk for at du bidrar.';
        await loadPublicCasesPage();
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

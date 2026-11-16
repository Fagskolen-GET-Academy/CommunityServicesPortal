function showNewCasePage() {
    if (!requireRole('Citizen')) return;
    model.viewState.loading = false;
    model.viewState.loadFailed = false;
    model.viewState.error = '';
    updateView();
    focusPageHeading();
}

function changeCaseType(value) {
    model.viewState.newCase.type = value;
    updateView();
    document.getElementById('type').focus();
}

function createCaseRequestFromDraft(draft) {
    const request = {
        type: draft.type,
        title: draft.title,
        description: draft.description,
        location: draft.location,
        publicationSetting: draft.publicationSetting
    };
    // Native select-felt har tekstverdier. API-et forventer boolske ja/nei-svar.
    if (draft.type === 'Problem') {
        request.impactLevel = draft.impactLevel;
        request.isSafetyRisk = draft.isSafetyRisk === 'true';
    } else if (draft.type === 'MaintenanceObservation') {
        request.observedChange = draft.observedChange;
        request.mayGetWorse = draft.mayGetWorse === 'true';
    } else if (draft.type === 'ImprovementSuggestion') {
        request.proposedImprovement = draft.proposedImprovement;
        request.expectedBenefit = draft.expectedBenefit;
    }
    return request;
}

async function submitNewCase() {
    if (!beginAction()) return;
    try {
        const caseData = createCaseRequestFromDraft(model.viewState.newCase);
        const created = await createCase(caseData);
        resetNewCaseDraft();
        model.viewState.notice = 'Sak #' + created.id + ' er sendt inn. Du finner den under Mine saker.';
        location.hash = '#my/' + created.id;
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

function resetNewCaseDraft() {
    model.viewState.newCase = createEmptyCaseDraft();
}


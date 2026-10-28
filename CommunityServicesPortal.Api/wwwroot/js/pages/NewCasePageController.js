function bindNewCasePage() {
    document.getElementById('type').onchange = changeCaseType;
    document.getElementById('title').oninput = changeNewCaseTitle;
    document.getElementById('description').oninput = changeNewCaseDescription;
    document.getElementById('location').oninput = changeNewCaseLocation;
    document.getElementById('publication-PublicAnonymous').onchange = changePublicationSetting;
    document.getElementById('publication-PublicWithName').onchange = changePublicationSetting;
    document.getElementById('publication-NotPublished').onchange = changePublicationSetting;
    document.getElementById('new-case-form').onsubmit = submitNewCase;

    const type = model.viewState.newCase.type;
    if (type === 'Problem') {
        document.getElementById('impactLevel').onchange = changeImpactLevel;
        document.getElementById('isSafetyRisk').onchange = changeSafetyRisk;
    } else if (type === 'MaintenanceObservation') {
        document.getElementById('observedChange').oninput = changeObservedChange;
        document.getElementById('mayGetWorse').onchange = changeMayGetWorse;
    } else {
        document.getElementById('proposedImprovement').oninput = changeProposedImprovement;
        document.getElementById('expectedBenefit').oninput = changeExpectedBenefit;
    }
}

function changeCaseType(event) {
    model.viewState.newCase.type = event.target.value;
    updateView();
    document.getElementById('type').focus();
}

// Tekstendringer lagres i modellen uten å tegne skjemaet på nytt for hvert tegn.
function changeNewCaseTitle(event) {
    model.viewState.newCase.title = event.target.value;
}

function changeNewCaseDescription(event) {
    model.viewState.newCase.description = event.target.value;
}

function changeNewCaseLocation(event) {
    model.viewState.newCase.location = event.target.value;
}

function changePublicationSetting(event) {
    model.viewState.newCase.publicationSetting = event.target.value;
}

function changeImpactLevel(event) {
    model.viewState.newCase.impactLevel = event.target.value;
}

function changeSafetyRisk(event) {
    model.viewState.newCase.isSafetyRisk = event.target.value;
}

function changeObservedChange(event) {
    model.viewState.newCase.observedChange = event.target.value;
}

function changeMayGetWorse(event) {
    model.viewState.newCase.mayGetWorse = event.target.value;
}

function changeProposedImprovement(event) {
    model.viewState.newCase.proposedImprovement = event.target.value;
}

function changeExpectedBenefit(event) {
    model.viewState.newCase.expectedBenefit = event.target.value;
}

async function submitNewCase(event) {
    event.preventDefault();
    if (!beginAction()) return;
    try {
        const draft = model.viewState.newCase;
        const caseData = {
            type: draft.type,
            title: draft.title,
            description: draft.description,
            location: draft.location,
            publicationSetting: draft.publicationSetting
        };
        // Native select-felt har tekstverdier. API-et forventer boolske ja/nei-svar.
        if (draft.type === 'Problem') {
            caseData.impactLevel = draft.impactLevel;
            caseData.isSafetyRisk = draft.isSafetyRisk === 'true';
        } else if (draft.type === 'MaintenanceObservation') {
            caseData.observedChange = draft.observedChange;
            caseData.mayGetWorse = draft.mayGetWorse === 'true';
        } else if (draft.type === 'ImprovementSuggestion') {
            caseData.proposedImprovement = draft.proposedImprovement;
            caseData.expectedBenefit = draft.expectedBenefit;
        }
        const created = await createCase(caseData);
        resetNewCaseDraft();
        model.viewState.notice = 'Sak #' + created.id + ' er sendt inn. Du finner den under Mine saker.';
        navigate('my/' + created.id);
    } catch (error) {
        model.viewState.error = error.message;
    } finally {
        endAction();
    }
}

function resetNewCaseDraft() {
    model.viewState.newCase = {
        type: 'Problem',
        title: '',
        description: '',
        location: '',
        publicationSetting: 'PublicAnonymous',
        impactLevel: '',
        isSafetyRisk: '',
        observedChange: '',
        mayGetWorse: '',
        proposedImprovement: '',
        expectedBenefit: ''
    };
}

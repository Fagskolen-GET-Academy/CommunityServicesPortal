function bindNewCasePage() {
    const form = document.getElementById('new-case-form');
    form.oninput = () => {
        for (const [name, value] of new FormData(form)) model.viewState.newCase[name] = value;
    };
    document.getElementById('type').onchange = () => {
        form.oninput();
        updateView();
        document.getElementById('type').focus();
    };
    form.onsubmit = submitNewCase;
}
async function submitNewCase(event) {
    event.preventDefault();
    await performAction(async () => {
        const draft = model.viewState.newCase;
        const data = { type: draft.type, title: draft.title, description: draft.description, location: draft.location, publicationSetting: draft.publicationSetting };
        if (draft.type === 'Problem') Object.assign(data, { impactLevel: draft.impactLevel, isSafetyRisk: draft.isSafetyRisk === 'true' });
        if (draft.type === 'MaintenanceObservation') Object.assign(data, { observedChange: draft.observedChange, mayGetWorse: draft.mayGetWorse === 'true' });
        if (draft.type === 'ImprovementSuggestion') Object.assign(data, { proposedImprovement: draft.proposedImprovement, expectedBenefit: draft.expectedBenefit });
        const created = await createCase(data);
        Object.assign(draft, { type: 'Problem', title: '', description: '', location: '', publicationSetting: 'PublicAnonymous', impactLevel: '', isSafetyRisk: '', observedChange: '', mayGetWorse: '', proposedImprovement: '', expectedBenefit: '' });
        model.app.notice = `Sak #${created.id} er sendt inn. Du finner den under Mine saker.`;
        navigate('my/' + created.id);
    });
}

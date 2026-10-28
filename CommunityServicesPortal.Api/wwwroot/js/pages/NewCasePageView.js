function newCasePageView() {
    const draft = model.viewState.newCase;
    return headingView('Meld inn sak', 'Alle felt er obligatoriske. Velg først hva henvendelsen gjelder.') +
        `<form id="new-case-form" class="panel narrow"><div class="field"><label for="type">Hva vil du melde inn?</label><select id="type" name="type">${optionsView(typeNames, draft.type)}</select></div>
        <div class="field"><label for="title">Kort tittel</label><input id="title" name="title" required maxlength="120" value="${escapeHtml(draft.title)}"></div>
        <div class="field"><label for="description">Beskrivelse</label><textarea id="description" name="description" required maxlength="4000">${escapeHtml(draft.description)}</textarea></div>
        <div class="field"><label for="location">Sted</label><p class="hint" id="location-help">Beskriv stedet slik at kommunen kan finne fram, for eksempel turstien 200 meter nord for parkeringsplassen.</p><input id="location" name="location" required maxlength="300" aria-describedby="location-help" value="${escapeHtml(draft.location)}"></div>
        <fieldset><legend>${escapeHtml(typeNames[draft.type])}</legend>${newCaseTypeFieldsView(draft)}</fieldset>
        <fieldset><legend>Visning i den åpne portalen</legend>${Object.entries(publicationNames).map(([value, label]) => `<label class="radio-option"><input type="radio" name="publicationSetting" value="${value}" ${draft.publicationSetting === value ? 'checked' : ''}><span><strong>${escapeHtml(label)}</strong><span class="hint">${{
            PublicAnonymous: 'Andre kan se saken og stedet, men ikke hvem som meldte den.',
            PublicWithName: 'Andre kan se saken, stedet og navnet på innsender.',
            NotPublished: 'Saken behandles fortsatt av kommunen, men vises ikke i den offentlige oversikten.'
        }[value]}</span></span></label>`).join('')}
        <p class="hint">Dette valget gjelder visning i denne portalen. Andre regler om offentlighet og innsyn kan gjelde uavhengig av dette.</p>
        <p class="hint">Unngå personopplysninger om deg selv eller andre i tekst som skal publiseres.</p></fieldset>
        <div class="actions"><button ${model.app.busy ? 'disabled' : ''}>${model.app.busy ? 'Sender …' : 'Send inn sak'}</button><a href="#my">Til Mine saker</a></div></form>`;
}
function newCaseTypeFieldsView(draft) {
    if (draft.type === 'Problem') return `<div class="field"><label for="impactLevel">Hvor mye påvirker problemet bruk av området?</label><select id="impactLevel" name="impactLevel" required>${optionsView(impactNames, draft.impactLevel, 'Velg påvirkningsgrad')}</select></div>${yesNoFieldView('isSafetyRisk', 'Er problemet en sikkerhetsrisiko?', draft.isSafetyRisk)}`;
    if (draft.type === 'MaintenanceObservation') return `<div class="field"><label for="observedChange">Hva har du observert?</label><textarea id="observedChange" name="observedChange" required maxlength="1000">${escapeHtml(draft.observedChange)}</textarea></div>${yesNoFieldView('mayGetWorse', 'Kan tilstanden bli verre?', draft.mayGetWorse)}`;
    return `<div class="field"><label for="proposedImprovement">Foreslått forbedring</label><textarea id="proposedImprovement" name="proposedImprovement" required maxlength="1000">${escapeHtml(draft.proposedImprovement)}</textarea></div><div class="field"><label for="expectedBenefit">Forventet nytte</label><textarea id="expectedBenefit" name="expectedBenefit" required maxlength="1000">${escapeHtml(draft.expectedBenefit)}</textarea></div>`;
}
function yesNoFieldView(name, label, selected) {
    return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" required>${optionsView({ true: 'Ja', false: 'Nei' }, selected, 'Velg ja eller nei')}</select></div>`;
}

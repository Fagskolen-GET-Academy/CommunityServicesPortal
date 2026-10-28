const typeNames = {
    Problem: 'Problem som bør løses',
    MaintenanceObservation: 'Vedlikeholdsbehov / observasjon',
    ImprovementSuggestion: 'Forslag til forbedring'
};
const statusNames = {
    Submitted: 'Sendt inn',
    InProgress: 'Under behandling',
    WaitingForCitizen: 'Venter på innbygger',
    Resolved: 'Løst',
    Closed: 'Avsluttet'
};
const publicationNames = {
    PublicAnonymous: 'Publiser anonymisert',
    PublicWithName: 'Publiser med navnet mitt',
    NotPublished: 'Ikke vis saken i den åpne portalen'
};
const impactNames = { Low: 'Lav', Medium: 'Middels', High: 'Høy' };
const allowedTransitions = {
    Submitted: ['InProgress'],
    InProgress: ['WaitingForCitizen', 'Resolved'],
    WaitingForCitizen: ['InProgress'],
    Resolved: ['Closed'],
    Closed: []
};

// Alle dynamiske verdier escapes før de settes inn i HTML.
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    let text = String(value);
    text = text.replaceAll('&', '&amp;');
    text = text.replaceAll('<', '&lt;');
    text = text.replaceAll('>', '&gt;');
    text = text.replaceAll('"', '&quot;');
    text = text.replaceAll("'", '&#39;');
    return text;
}

function dateText(value) {
    const date = new Date(value);
    return date.toLocaleString('nb-NO', { dateStyle: 'medium', timeStyle: 'short' });
}

function disabledAttribute() {
    if (model.viewState.busy) return 'disabled';
    return '';
}

function optionView(value, label, selected) {
    let selectedAttribute = '';
    if (String(selected) === String(value)) selectedAttribute = 'selected';
    return /*HTML*/`<option value="${escapeHtml(value)}" ${selectedAttribute}>${escapeHtml(label)}</option>`;
}

function optionsView(names, selected, emptyLabel) {
    let html = '';
    if (emptyLabel) html += optionView('', emptyLabel, selected);
    for (const value in names) {
        html += optionView(value, names[value], selected);
    }
    return html;
}

function workerOptionsView(selected, emptyLabel) {
    let html = optionView('', emptyLabel, selected);
    for (let i = 0; i < model.workers.length; i++) {
        const worker = model.workers[i];
        html += optionView(worker.id, worker.name, selected);
    }
    return html;
}

function statusView(status) {
    return /*HTML*/`<span class="badge ${escapeHtml(status)}">${escapeHtml(statusNames[status])}</span>`;
}

function headingView(title, intro, eyebrow) {
    if (eyebrow === undefined) eyebrow = 'Nærmiljøet vårt';
    let html = /*HTML*/`
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 tabindex="-1">${escapeHtml(title)}</h1>
    `;
    if (intro) html += /*HTML*/`<p class="intro">${escapeHtml(intro)}</p>`;
    return html;
}

function caseCardView(item, route, isPublic) {
    let citizenName = '';
    let support = '';
    if (isPublic) {
        support = supportView(item);
        if (item.citizenName) citizenName = ' · ' + escapeHtml(item.citizenName);
    }
    return /*HTML*/`
        <article class="case-card">
            <div class="card-top">
                <span class="meta">#${item.id} · ${escapeHtml(typeNames[item.type])}</span>
                ${statusView(item.status)}
            </div>
            <h2><a href="#${route}/${item.id}">${escapeHtml(item.title)}</a></h2>
            <p>${escapeHtml(item.location)}</p>
            <div class="card-bottom">
                <span class="meta">Sendt inn ${escapeHtml(dateText(item.createdAt))}${citizenName}</span>
                ${support}
            </div>
        </article>
    `;
}

function supportView(item) {
    if (item.type !== 'Problem' && item.type !== 'MaintenanceObservation') return '';

    let action = '';
    if (item.supportedByMe) {
        action = /*HTML*/`<strong class="meta">· Registrert av deg</strong>`;
    } else if (item.canSupport) {
        if (model.app.currentUser === null) {
            action = /*HTML*/`<a href="#login">Logg inn for å støtte</a>`;
        } else if (model.app.currentUser.role === 'Citizen') {
            action = /*HTML*/`
                <button id="support-${item.id}" type="button" class="secondary support-button"
                    data-case-id="${item.id}" ${disabledAttribute()}>
                    Jeg opplever dette også<span class="visually-hidden">: ${escapeHtml(item.title)}</span>
                </button>
            `;
        }
    }
    return /*HTML*/`<div><span class="meta">${item.supportCount} opplever dette også</span> ${action}</div>`;
}

function typeDetailsView(item) {
    if (item.type === 'Problem') {
        let safetyRisk = 'Nei';
        if (item.isSafetyRisk) safetyRisk = 'Ja';
        return /*HTML*/`
            <dt>Påvirkningsgrad</dt><dd>${impactNames[item.impactLevel]}</dd>
            <dt>Sikkerhetsrisiko</dt><dd>${safetyRisk}</dd>
        `;
    }
    if (item.type === 'MaintenanceObservation') {
        let mayGetWorse = 'Nei';
        if (item.mayGetWorse) mayGetWorse = 'Ja';
        return /*HTML*/`
            <dt>Observert endring</dt><dd class="preserve">${escapeHtml(item.observedChange)}</dd>
            <dt>Kan bli verre</dt><dd>${mayGetWorse}</dd>
        `;
    }
    return /*HTML*/`
        <dt>Foreslått forbedring</dt><dd class="preserve">${escapeHtml(item.proposedImprovement)}</dd>
        <dt>Forventet nytte</dt><dd class="preserve">${escapeHtml(item.expectedBenefit)}</dd>
    `;
}

function privateDetailsView(details) {
    const item = details.case;
    let workerName = 'Ikke tildelt';
    if (details.assignedCaseWorkerName) workerName = details.assignedCaseWorkerName;
    return /*HTML*/`
        <section class="panel">
            <h2>Om saken</h2>
            <dl>
                <dt>Sakstype</dt><dd>${escapeHtml(typeNames[item.type])}</dd>
                <dt>Beskrivelse</dt><dd class="preserve">${escapeHtml(item.description)}</dd>
                <dt>Sted</dt><dd>${escapeHtml(item.location)}</dd>
                ${typeDetailsView(item)}
                <dt>Publiseringsvalg</dt><dd>${escapeHtml(publicationNames[item.publicationSetting])}</dd>
                <dt>Innsender</dt><dd>${escapeHtml(details.citizenName)}</dd>
                <dt>Saksbehandler</dt><dd>${escapeHtml(workerName)}</dd>
                <dt>Sendt inn</dt><dd>${escapeHtml(dateText(item.createdAt))}</dd>
            </dl>
        </section>
    `;
}

function messagesView(details) {
    let messages = /*HTML*/`<p>Ingen meldinger ennå.</p>`;
    if (details.messages.length > 0) {
        messages = '';
        for (let i = 0; i < details.messages.length; i++) {
            const message = details.messages[i];
            let authorRole = 'Innbygger';
            if (message.authorRole === 'CaseWorker') authorRole = 'Saksbehandler';
            messages += /*HTML*/`
                <article class="message">
                    <strong>${escapeHtml(message.authorName)}</strong>
                    <span class="meta">· ${authorRole} · ${escapeHtml(dateText(message.createdAt))}</span>
                    <p class="preserve">${escapeHtml(message.text)}</p>
                </article>
            `;
        }
    }
    return /*HTML*/`
        <section class="panel">
            <h2>Meldinger</h2>
            <p class="hint">Samtalen er synlig for innsenderen og kommunens saksbehandlere.</p>
            ${messages}
            <form id="message-form">
                <div class="field">
                    <label for="message">Ny melding</label>
                    <textarea id="message" name="text" required maxlength="2000">${escapeHtml(model.viewState.message)}</textarea>
                </div>
                <button id="send-message" ${disabledAttribute()}>Send melding</button>
            </form>
        </section>
    `;
}

function historyView(details) {
    let entries = '';
    for (let i = 0; i < details.statusHistory.length; i++) {
        const entry = details.statusHistory[i];
        let transition = '';
        if (entry.fromStatus) transition = statusNames[entry.fromStatus] + ' → ';
        transition += statusNames[entry.toStatus];
        entries += /*HTML*/`
            <li>${escapeHtml(transition)}<br><span class="meta">${escapeHtml(dateText(entry.changedAt))}</span></li>
        `;
    }
    return /*HTML*/`<section class="panel"><h2>Statushistorikk</h2><ol class="timeline">${entries}</ol></section>`;
}

const typeNames = { Problem: 'Problem som bør løses', MaintenanceObservation: 'Vedlikeholdsbehov / observasjon', ImprovementSuggestion: 'Forslag til forbedring' };
const statusNames = { Submitted: 'Sendt inn', InProgress: 'Under behandling', WaitingForCitizen: 'Venter på innbygger', Resolved: 'Løst', Closed: 'Avsluttet' };
const publicationNames = { PublicAnonymous: 'Publiser anonymisert', PublicWithName: 'Publiser med navnet mitt', NotPublished: 'Ikke vis saken i den åpne portalen' };
const impactNames = { Low: 'Lav', Medium: 'Middels', High: 'Høy' };
const allowedTransitions = { Submitted: ['InProgress'], InProgress: ['WaitingForCitizen', 'Resolved'], WaitingForCitizen: ['InProgress'], Resolved: ['Closed'], Closed: [] };

// Escape every dynamic value before placing it in generated HTML.
function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function dateText(value) { return new Date(value).toLocaleString('nb-NO', { dateStyle: 'medium', timeStyle: 'short' }); }
function optionsView(names, selected, emptyLabel) {
    return (emptyLabel ? `<option value="">${escapeHtml(emptyLabel)}</option>` : '') +
        Object.entries(names).map(([key, name]) => `<option value="${escapeHtml(key)}" ${String(selected) === key ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('');
}
function statusView(status) { return `<span class="badge ${escapeHtml(status)}">${escapeHtml(statusNames[status])}</span>`; }
function headingView(title, intro, eyebrow = 'Nærmiljøet vårt') {
    return `<p class="eyebrow">${escapeHtml(eyebrow)}</p><h1 tabindex="-1">${escapeHtml(title)}</h1>${intro ? `<p class="intro">${escapeHtml(intro)}</p>` : ''}`;
}
function caseCardView(item, route, isPublic = false) {
    return `<article class="case-card"><div class="card-top"><span class="meta">#${item.id} · ${escapeHtml(typeNames[item.type])}</span>${statusView(item.status)}</div>
        <h2><a href="#${route}/${item.id}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.location)}</p>
        <div class="card-bottom"><span class="meta">Sendt inn ${escapeHtml(dateText(item.createdAt))}${isPublic && item.citizenName ? ' · ' + escapeHtml(item.citizenName) : ''}</span>
        ${isPublic ? supportView(item) : ''}</div></article>`;
}
function supportView(item) {
    if (!item.canSupport) return '';
    return `<div><span class="meta">${item.supportCount} opplever dette også</span> ${item.supportedByMe ? '<strong class="meta">· Registrert av deg</strong>' :
        model.app.user?.role === 'Citizen' ? `<button type="button" class="secondary support-button" data-case-id="${item.id}" ${model.app.busy ? 'disabled' : ''}>Jeg opplever dette også<span class="visually-hidden">: ${escapeHtml(item.title)}</span></button>` :
        !model.app.user ? '<a href="#login">Logg inn for å støtte</a>' : ''}</div>`;
}
function typeDetailsView(item) {
    if (item.type === 'Problem') return `<dt>Påvirkningsgrad</dt><dd>${impactNames[item.impactLevel]}</dd><dt>Sikkerhetsrisiko</dt><dd>${item.isSafetyRisk ? 'Ja' : 'Nei'}</dd>`;
    if (item.type === 'MaintenanceObservation') return `<dt>Observert endring</dt><dd class="preserve">${escapeHtml(item.observedChange)}</dd><dt>Kan bli verre</dt><dd>${item.mayGetWorse ? 'Ja' : 'Nei'}</dd>`;
    return `<dt>Foreslått forbedring</dt><dd class="preserve">${escapeHtml(item.proposedImprovement)}</dd><dt>Forventet nytte</dt><dd class="preserve">${escapeHtml(item.expectedBenefit)}</dd>`;
}
function privateDetailsView(details) {
    const item = details.case;
    return `<section class="panel"><h2>Om saken</h2><dl><dt>Sakstype</dt><dd>${escapeHtml(typeNames[item.type])}</dd>
        <dt>Beskrivelse</dt><dd class="preserve">${escapeHtml(item.description)}</dd><dt>Sted</dt><dd>${escapeHtml(item.location)}</dd>${typeDetailsView(item)}
        <dt>Publiseringsvalg</dt><dd>${escapeHtml(publicationNames[item.publicationSetting])}</dd><dt>Innsender</dt><dd>${escapeHtml(details.citizenName)}</dd>
        <dt>Saksbehandler</dt><dd>${escapeHtml(details.assignedCaseWorkerName || 'Ikke tildelt')}</dd><dt>Sendt inn</dt><dd>${escapeHtml(dateText(item.createdAt))}</dd></dl></section>`;
}
function messagesView(details) {
    return `<section class="panel"><h2>Meldinger</h2><p class="hint">Samtalen er synlig for innsenderen og kommunens saksbehandlere.</p>
        ${details.messages.length ? details.messages.map(message => `<article class="message"><strong>${escapeHtml(message.authorName)}</strong>
            <span class="meta">· ${message.authorRole === 'CaseWorker' ? 'Saksbehandler' : 'Innbygger'} · ${escapeHtml(dateText(message.createdAt))}</span><p class="preserve">${escapeHtml(message.text)}</p></article>`).join('') : '<p>Ingen meldinger ennå.</p>'}
        <form id="message-form"><div class="field"><label for="message">Ny melding</label><textarea id="message" name="text" required maxlength="2000">${escapeHtml(model.viewState.message)}</textarea></div>
        <button ${model.app.busy ? 'disabled' : ''}>Send melding</button></form></section>`;
}
function historyView(details) {
    return `<section class="panel"><h2>Statushistorikk</h2><ol class="timeline">${details.statusHistory.map(entry => `<li>${escapeHtml(entry.fromStatus ? statusNames[entry.fromStatus] + ' → ' : '')}${escapeHtml(statusNames[entry.toStatus])}<br><span class="meta">${escapeHtml(dateText(entry.changedAt))}</span></li>`).join('')}</ol></section>`;
}

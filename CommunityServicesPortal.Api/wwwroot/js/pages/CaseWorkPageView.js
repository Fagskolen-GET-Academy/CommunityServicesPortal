function caseWorkPageView() {
    const details = model.data.caseDetails;
    const item = details.case;
    const transitions = Object.fromEntries(allowedTransitions[item.status].map(status => [status, statusNames[status]]));
    return '<p><a href="#worker">← Saksoversikt</a></p>' + headingView(item.title, '', 'Saksbehandling #' + item.id) +
        `<p>${statusView(item.status)}</p><div class="two-columns"><div>${privateDetailsView(details)}${messagesView(details)}</div><aside>
        <section class="panel"><h2>Ansvar og status</h2><form id="assignment-form"><div class="field"><label for="assignment">Saksbehandler</label><select id="assignment" name="caseWorkerId">${optionsView(Object.fromEntries(model.data.workers.map(worker => [worker.id, worker.name])), model.viewState.assignment, 'Ikke tildelt')}</select></div><button class="secondary" ${model.app.busy ? 'disabled' : ''}>Lagre tildeling</button></form>
        ${Object.keys(transitions).length ? `<hr><form id="status-form"><div class="field"><label for="next-status">Ny status</label><select id="next-status" name="status" required>${optionsView(transitions, model.viewState.nextStatus, 'Velg neste status')}</select></div><button ${model.app.busy ? 'disabled' : ''}>Endre status</button></form>` : '<p>Saken er avsluttet.</p>'}</section>${historyView(details)}</aside></div>`;
}

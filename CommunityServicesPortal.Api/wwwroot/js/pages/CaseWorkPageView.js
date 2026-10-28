function caseWorkPageView() {
    const details = model.currentCase;
    const item = details.case;
    return /*HTML*/`<p><a href="#worker">← Saksoversikt</a></p>` +
        headingView(item.title, '', 'Saksbehandling #' + item.id) + /*HTML*/`
        <p>${statusView(item.status)}</p>
        <div class="two-columns">
            <div>${privateDetailsView(details)}${messagesView(details)}</div>
            <aside>
                <section class="panel">
                    <h2>Ansvar og status</h2>
                    <form id="assignment-form">
                        <div class="field">
                            <label for="assignment">Saksbehandler</label>
                            <select id="assignment" name="caseWorkerId">${caseWorkerOptionsView(model.workers, model.viewState.assignment, 'Ikke tildelt')}</select>
                        </div>
                        <button id="assignment-submit" class="secondary" ${disabledAttribute()}>Lagre tildeling</button>
                    </form>
                    ${statusFormView(item.status)}
                </section>
                ${historyView(details)}
            </aside>
        </div>
    `;
}

function statusFormView(currentStatus) {
    const transitions = allowedTransitions[currentStatus];
    if (transitions.length === 0) return /*HTML*/`<p>Saken er avsluttet.</p>`;

    let options = optionView('', 'Velg neste status', model.viewState.nextStatus);
    for (let i = 0; i < transitions.length; i++) {
        const status = transitions[i];
        options += optionView(status, statusNames[status], model.viewState.nextStatus);
    }
    return /*HTML*/`
        <hr>
        <form id="status-form">
            <div class="field">
                <label for="next-status">Ny status</label>
                <select id="next-status" name="status" required>${options}</select>
            </div>
            <button id="status-submit" ${disabledAttribute()}>Endre status</button>
        </form>
    `;
}

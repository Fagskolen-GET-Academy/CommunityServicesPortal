async function loadPublicCasesPage() {
    model.data.publicCase = null;
    if (model.app.caseId) model.data.publicCase = await getPublicCase(model.app.caseId);
    else model.data.publicCases = await getPublicCases(model.viewState.publicFilters);
}
function bindPublicCasesPage() {
    const form = document.getElementById('public-filters');
    if (form) form.onsubmit = async event => {
        event.preventDefault();
        model.viewState.publicFilters = { type: form.elements.type.value, status: form.elements.status.value };
        await performAction(loadPublicCasesPage);
    };
    document.querySelectorAll('.support-button').forEach(button => {
        button.onclick = async () => {
            const id = Number(button.dataset.caseId);
            await performAction(async () => {
                await supportCase(id);
                model.app.notice = 'Registrert. Takk for at du bidrar.';
                await loadPublicCasesPage();
            });
        };
    });
}

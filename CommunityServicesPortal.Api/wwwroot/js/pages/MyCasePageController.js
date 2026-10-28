async function loadMyCasePage() { model.data.caseDetails = await getCase(model.app.caseId); }
function bindMyCasePage() {
    const form = document.getElementById('message-form');
    form.oninput = () => { model.viewState.message = form.elements.text.value; };
    form.onsubmit = async event => {
        event.preventDefault();
        await performAction(async () => {
            await addCaseMessage(model.app.caseId, model.viewState.message);
            model.viewState.message = '';
            model.app.notice = 'Meldingen er sendt.';
            await loadMyCasePage();
        });
    };
}

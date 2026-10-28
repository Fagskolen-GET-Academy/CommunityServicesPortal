async function loadMyCasesPage() {
    model.myCases = await getMyCases();
}

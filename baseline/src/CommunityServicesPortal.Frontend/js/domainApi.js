// Domenefunksjoner og ruter. Controllerne trenger bare å kjenne funksjonsnavnene.
// Et nytt CSRF-token hentes før hvert skrivekall, for gjeldende innlogget bruker.
async function getRequestToken() {
    const response = await apiGet('/api/auth/csrf');
    return response.token;
}

async function login(email, password) {
    const token = await getRequestToken();
    return await apiPost('/api/auth/login', { email: email, password: password }, token);
}

async function logout() {
    const token = await getRequestToken();
    return await apiPost('/api/auth/logout', {}, token);
}

async function getCurrentUser() {
    return await apiGet('/api/auth/me');
}

async function getPublicCases(filters) {
    let url = '/api/public/cases';
    const query = caseFilterQuery(filters);
    if (query !== '') url += '?' + query;
    return await apiGet(url);
}

async function getPublicCase(id) {
    return await apiGet('/api/public/cases/' + id);
}

async function supportCase(id) {
    const token = await getRequestToken();
    return await apiPost('/api/public/cases/' + id + '/support', {}, token);
}

async function getMyCases() {
    return await apiGet('/api/cases/my');
}

async function getCase(id) {
    return await apiGet('/api/cases/' + id);
}

async function createCase(caseData) {
    const token = await getRequestToken();
    return await apiPost('/api/cases', caseData, token);
}

async function addCaseMessage(id, text) {
    const token = await getRequestToken();
    return await apiPost('/api/cases/' + id + '/messages', { text: text }, token);
}

async function getWorkerCases(filters) {
    let url = '/api/caseworker/cases';
    const query = caseFilterQuery(filters);
    if (query !== '') url += '?' + query;
    return await apiGet(url);
}

async function getWorkerCase(id) {
    return await apiGet('/api/caseworker/cases/' + id);
}

async function getCaseWorkers() {
    return await apiGet('/api/caseworker/workers');
}

async function assignCase(id, caseWorkerId) {
    const token = await getRequestToken();
    return await apiPut('/api/caseworker/cases/' + id + '/assignment', { caseWorkerId: caseWorkerId }, token);
}

async function changeCaseStatus(id, status) {
    const token = await getRequestToken();
    return await apiPut('/api/caseworker/cases/' + id + '/status', { status: status }, token);
}

async function addWorkerMessage(id, text) {
    const token = await getRequestToken();
    return await apiPost('/api/caseworker/cases/' + id + '/messages', { text: text }, token);
}

function caseFilterQuery(filters) {
    // Ikke send tomme filterverdier. URLSearchParams sørger for korrekt URL-koding.
    const query = new URLSearchParams();
    if (filters.type) query.set('type', filters.type);
    if (filters.status) query.set('status', filters.status);
    if (filters.assignedTo) query.set('assignedTo', filters.assignedTo);
    return query.toString();
}

// Domain intentions and routes. A fresh CSRF token follows the current login identity.
async function getRequestToken() { return (await apiGet('/api/auth/csrf')).token; }
async function login(email, password) { return await apiPost('/api/auth/login', { email, password }, await getRequestToken()); }
async function logout() { return await apiPost('/api/auth/logout', {}, await getRequestToken()); }
async function getCurrentUser() { return await apiGet('/api/auth/me'); }
async function getPublicCases(filters) { return await apiGet('/api/public/cases?' + caseFilterQuery(filters)); }
async function getPublicCase(id) { return await apiGet('/api/public/cases/' + id); }
async function supportCase(id) { return await apiPost('/api/public/cases/' + id + '/support', {}, await getRequestToken()); }
async function getMyCases() { return await apiGet('/api/cases/my'); }
async function getCase(id) { return await apiGet('/api/cases/' + id); }
async function createCase(data) { return await apiPost('/api/cases', data, await getRequestToken()); }
async function addCaseMessage(id, text) { return await apiPost('/api/cases/' + id + '/messages', { text }, await getRequestToken()); }
async function getWorkerCases(filters) { return await apiGet('/api/caseworker/cases?' + caseFilterQuery(filters)); }
async function getWorkerCase(id) { return await apiGet('/api/caseworker/cases/' + id); }
async function getCaseWorkers() { return await apiGet('/api/caseworker/workers'); }
async function assignCase(id, caseWorkerId) { return await apiPut('/api/caseworker/cases/' + id + '/assignment', { caseWorkerId }, await getRequestToken()); }
async function changeCaseStatus(id, status) { return await apiPut('/api/caseworker/cases/' + id + '/status', { status }, await getRequestToken()); }
async function addWorkerMessage(id, text) { return await apiPost('/api/caseworker/cases/' + id + '/messages', { text }, await getRequestToken()); }
function caseFilterQuery(filters) {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(filters)) if (value !== '') query.set(name, value);
    return query.toString();
}

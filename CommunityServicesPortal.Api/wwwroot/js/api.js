// Generic HTTP only. This file knows nothing about users, cases or API routes.
async function apiRequest(url, options = {}) {
    let response;
    try {
        response = await fetch(url, {
            credentials: 'same-origin', ...options,
            headers: { Accept: 'application/json', ...options.headers }
        });
    } catch {
        throw new Error('Kunne ikke kontakte serveren. Kontroller forbindelsen og prøv igjen.');
    }
    const isJson = response.headers.get('content-type')?.includes('json');
    const data = response.status === 204 ? null : isJson ? await response.json() : null;
    if (!response.ok) {
        const defaults = { 400: 'Kontroller feltene og prøv igjen.', 401: 'Logg inn for å fortsette.',
            403: 'Du har ikke tilgang til denne handlingen.', 404: 'Fant ikke siden eller saken.',
            409: 'Handlingen kan ikke utføres nå.', 429: 'For mange forespørsler. Vent litt og prøv igjen.' };
        const error = new Error(data?.message || defaults[response.status] || 'En feil oppstod. Prøv igjen senere.');
        error.status = response.status;
        throw error;
    }
    return data;
}

async function apiGet(url) { return await apiRequest(url, { method: 'GET' }); }
async function apiPost(url, data, securityToken) {
    return await apiRequest(url, { method: 'POST', body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': securityToken } });
}
async function apiPut(url, data, securityToken) {
    return await apiRequest(url, { method: 'PUT', body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': securityToken } });
}

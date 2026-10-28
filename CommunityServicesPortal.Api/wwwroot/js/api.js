// Bare HTTP-mekanikk. Denne filen kjenner ingen domenefunksjoner eller API-ruter.
async function apiRequest(url, options) {
    options.credentials = 'same-origin';
    options.headers.Accept = 'application/json';

    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error('Kunne ikke kontakte serveren. Kontroller forbindelsen og prøv igjen.');
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (response.status !== 204 && contentType !== null && contentType.indexOf('json') !== -1) {
        data = await response.json();
    }

    if (!response.ok) {
        let message = apiErrorMessage(response.status);
        if (data !== null && data.message) {
            message = data.message;
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}

function apiErrorMessage(status) {
    if (status === 400) return 'Kontroller feltene og prøv igjen.';
    if (status === 401) return 'Logg inn for å fortsette.';
    if (status === 403) return 'Du har ikke tilgang til denne handlingen.';
    if (status === 404) return 'Fant ikke det du ba om.';
    if (status === 409) return 'Handlingen kan ikke utføres nå.';
    if (status === 429) return 'For mange forespørsler. Vent litt og prøv igjen.';
    return 'En feil oppstod. Prøv igjen senere.';
}

async function apiGet(url) {
    return await apiRequest(url, {
        method: 'GET',
        headers: {}
    });
}

async function apiPost(url, data, securityToken) {
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': securityToken
        }
    });
}

async function apiPut(url, data, securityToken) {
    return await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': securityToken
        }
    });
}

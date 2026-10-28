// One shared model, as in Intro. API data and drafts have separate homes.
const model = {
    app: { page: 'public', caseId: null, user: null, loading: true, busy: false, loadFailed: false, error: '', notice: '' },
    data: { publicCases: [], publicCase: null, myCases: [], workerCases: [], caseDetails: null, workers: [] },
    viewState: {
        login: { email: '', password: '' },
        publicFilters: { type: '', status: '' },
        workerFilters: { status: '', assignedTo: '' },
        newCase: {
            type: 'Problem', title: '', description: '', location: '', publicationSetting: 'PublicAnonymous',
            impactLevel: '', isSafetyRisk: '', observedChange: '', mayGetWorse: '', proposedImprovement: '', expectedBenefit: ''
        },
        message: '', assignment: '', nextStatus: ''
    }
};

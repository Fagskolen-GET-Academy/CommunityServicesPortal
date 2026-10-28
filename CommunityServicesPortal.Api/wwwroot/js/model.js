// Én modell: appvalg, arbeidsutkast og domenedata har hver sin plass.
const model = {
    app: {
        currentPage: 'public',
        currentCaseId: null,
        currentUser: null
    },

    viewState: {
        loading: true,
        busy: false,
        loadFailed: false,
        error: '',
        notice: '',
        focusedElementId: '',
        actionRoute: '',
        login: {
            email: '',
            password: ''
        },
        publicFilters: {
            type: '',
            status: ''
        },
        workerFilters: {
            status: '',
            assignedTo: ''
        },
        newCase: {
            type: 'Problem',
            title: '',
            description: '',
            location: '',
            publicationSetting: 'PublicAnonymous',
            impactLevel: '',
            isSafetyRisk: '',
            observedChange: '',
            mayGetWorse: '',
            proposedImprovement: '',
            expectedBenefit: ''
        },
        message: '',
        assignment: '',
        nextStatus: ''
    },

    publicCases: [],
    publicCase: null,
    myCases: [],
    currentCase: null,
    workerCases: [],
    workers: []
};

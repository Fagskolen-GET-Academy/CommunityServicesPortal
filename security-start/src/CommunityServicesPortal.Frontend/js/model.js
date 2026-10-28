// Én modell: appvalg, arbeidsutkast og domenedata har hver sin plass.
function createEmptyCaseDraft() {
    return {
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
    };
}

const model = {
    app: {
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
        newCase: createEmptyCaseDraft(),
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

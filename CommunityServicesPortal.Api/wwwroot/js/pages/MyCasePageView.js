function myCasePageView() {
    const details = model.data.caseDetails;
    return '<p><a href="#my">← Mine saker</a></p>' + headingView(details.case.title, '', 'Min sak #' + details.case.id) +
        `<p>${statusView(details.case.status)}</p><div class="two-columns"><div>${privateDetailsView(details)}${messagesView(details)}</div><aside>${historyView(details)}</aside></div>`;
}

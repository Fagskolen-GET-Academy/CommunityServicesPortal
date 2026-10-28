function loginPageView() {
    return headingView('Logg inn', 'Følg dine egne saker eller behandle henvendelser som saksbehandler.', 'Velkommen') +
        `<div class="two-columns"><section class="panel"><h2>Din demokonto</h2><form id="login-form">
        <div class="field"><label for="email">E-post</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254" value="${escapeHtml(model.viewState.login.email)}"></div>
        <div class="field"><label for="password">Passord</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" value="${escapeHtml(model.viewState.login.password)}"></div>
        <button ${model.app.busy ? 'disabled' : ''}>${model.app.busy ? 'Logger inn …' : 'Logg inn'}</button></form></section>
        <aside class="panel"><h2>Prøv portalen</h2><p>Dette er demo-kontoer med fiktive data. Alle bruker passordet <strong>Demo123!</strong></p>
        <ul class="demo-list"><li><strong>Kari Nordmann · Innbygger</strong><br>citizen1@example.test</li><li><strong>Ahmed Hassan · Innbygger</strong><br>citizen2@example.test</li>
        <li><strong>Nora Hansen · Saksbehandler</strong><br>worker1@example.test</li><li><strong>Jonas Berg · Saksbehandler</strong><br>worker2@example.test</li></ul>
        <a href="#public">Se offentlige saker uten å logge inn</a></aside></div>`;
}

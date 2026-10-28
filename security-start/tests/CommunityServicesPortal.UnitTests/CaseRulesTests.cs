using CommunityServicesPortal.Api.Application;
using CommunityServicesPortal.Api.Domain;
using NUnit.Framework;

namespace CommunityServicesPortal.UnitTests;

[TestFixture]
public class CaseRulesTests
{
    [TestCase(CaseStatus.Submitted, CaseStatus.InProgress)]
    [TestCase(CaseStatus.InProgress, CaseStatus.WaitingForCitizen)]
    [TestCase(CaseStatus.WaitingForCitizen, CaseStatus.InProgress)]
    [TestCase(CaseStatus.InProgress, CaseStatus.Resolved)]
    [TestCase(CaseStatus.Resolved, CaseStatus.Closed)]
    public void Normal_transitions_are_allowed(CaseStatus from, CaseStatus to) =>
        Assert.That(CaseRules.CanTransition(from, to), Is.True);

    [TestCase(CaseStatus.Submitted, CaseStatus.Closed)]
    [TestCase(CaseStatus.Closed, CaseStatus.InProgress)]
    [TestCase(CaseStatus.WaitingForCitizen, CaseStatus.Resolved)]
    [TestCase(CaseStatus.InProgress, CaseStatus.InProgress)]
    public void Other_transitions_are_rejected(CaseStatus from, CaseStatus to) =>
        Assert.That(CaseRules.CanTransition(from, to), Is.False);

    [Test]
    public void Problem_requires_an_explicit_answer_to_safety_question() => Assert.Throws<RuleException>(() =>
        CaseRules.Create(new(CaseType.Problem, "Tittel", "Beskrivelse", "Sted", ImpactLevel: ImpactLevel.High), 1));

    [Test]
    public void Maintenance_requires_observation_and_explicit_worsening_answer()
    {
        Assert.Throws<RuleException>(() => CaseRules.Create(new(CaseType.MaintenanceObservation, "T", "B", "S", MayGetWorse: false), 1));
        Assert.Throws<RuleException>(() => CaseRules.Create(new(CaseType.MaintenanceObservation, "T", "B", "S", ObservedChange: "Skade"), 1));
    }

    [Test]
    public void Suggestion_requires_expected_benefit() => Assert.Throws<RuleException>(() =>
        CaseRules.Create(new(CaseType.ImprovementSuggestion, "T", "B", "S", ProposedImprovement: "En benk"), 1));

    [Test]
    public void Creation_trims_text_and_discards_fields_for_other_types()
    {
        var item = CaseRules.Create(new(CaseType.Problem, " Tittel ", " Beskrivelse ", " Sted ",
            ImpactLevel: ImpactLevel.Low, IsSafetyRisk: false, ExpectedBenefit: "Ikke relevant"), 2);
        Assert.Multiple(() =>
        {
            Assert.That(item.Title, Is.EqualTo("Tittel"));
            Assert.That(item.CitizenId, Is.EqualTo(2));
            Assert.That(item.Status, Is.EqualTo(CaseStatus.Submitted));
            Assert.That(item.PublicationSetting, Is.EqualTo(PublicationSetting.PublicAnonymous));
            Assert.That(item.ExpectedBenefit, Is.Null);
            Assert.That(item.IsSafetyRisk, Is.False);
        });
    }

    [TestCase("")]
    [TestCase("   ")]
    public void Empty_text_is_rejected(string value) => Assert.Throws<RuleException>(() => CaseRules.RequiredText(value, "Tittel", 120));

    [Test]
    public void Too_long_text_is_rejected() => Assert.Throws<RuleException>(() => CaseRules.RequiredText(new string('x', 121), "Tittel", 120));
}

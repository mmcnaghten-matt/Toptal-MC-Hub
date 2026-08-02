import type { DiagnosticConfig } from '../types';

const erpPmoMaturity: DiagnosticConfig = {
  slug: 'erp-pmo-maturity',
  title: 'ERP PMO Maturity Diagnostic',
  description:
    'Assess your ERP program management maturity across five pillars — Strategy, Governance & Executive Alignment, Estimation Accuracy & Earned Value Analytics, Scope, Process Standardization & Change Management, Delivery Execution, Risk & Multi-Vendor Management, and Data Integration, PPM Tooling & Advanced PMO Analytics — and receive a prioritized improvement roadmap.',
  scoreDisplay: 'normalized',
  dimensions: [
    { id: 'strategy-governance', label: 'Strategy, Governance & Executive Alignment',                     shortName: 'Strategy & Gov.' },
    { id: 'estimation-schedule', label: 'Estimation Accuracy, Schedule Governance & Earned Value Analytics', shortName: 'Estimation & EVM' },
    { id: 'scope-change',        label: 'Scope, Process Standardization & Change Management',              shortName: 'Scope & Change' },
    { id: 'delivery-risk',       label: 'Delivery Execution, Risk & Multi-Vendor Management',              shortName: 'Delivery & Risk' },
    { id: 'data-ppm',            label: 'Data Integration, PPM Tooling & Advanced PMO Analytics',          shortName: 'Data & PPM' },
  ],
  questions: [
    // ── PILLAR 1: Strategy, Governance & Executive Alignment ─────────────────
    {
      id: 'p1q1',
      dimension: 'strategy-governance',
      text: 'Does the program operate under a formal charter with explicit executive decision rights and enforced SLA escalation response times?',
      options: [
        'No charter exists; decision rights and escalation paths are undefined or ignored',
        'A charter exists, but decision rights are informal and escalations are negotiated offline',
        'A formal charter defines decision rights, with escalation SLAs enforced across governance tiers',
        'Charter-defined SLAs are tracked quantitatively, and governance is re-evaluated at each stage-gate',
        'Governance rigor adapts dynamically to real-time risk, with decision tracking automated in the PPM platform',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy-governance',
      text: 'Are executive business sponsors and Business Process Owners (BPOs) actively accountable for project direction and stage-gate sign-offs?',
      options: [
        'Business leadership delegates key decisions to tactical IT teams; sponsors are passive',
        'Sponsors and BPOs are named, but attendance and accountability vary meeting to meeting',
        'Dedicated BPOs hold explicit decision rights and sign-off authority for their process areas',
        'BPOs are evaluated on stage-gate outcomes using objective cost-performance data',
        'Sponsors and BPOs operate as an integrated strategic execution team, continuously realigning to business conditions',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy-governance',
      text: 'Is there explicit, documented alignment connecting business case strategic KPIs to ERP workstream deliverables?',
      options: [
        'No documented connection exists between strategic KPIs and workstream deliverables',
        "A general strategic narrative exists but isn't traced to specific deliverables",
        'Direct traceability formally connects corporate objectives to ERP workstream deliverables',
        'Alignment is re-evaluated at every stage-gate against evolving business conditions',
        'Business transformation and ERP release cadence are continuously synchronized in real time',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy-governance',
      text: 'Does the Steering Committee utilize quantitative metric dashboards and scenario planning models to evaluate trade-offs?',
      options: [
        'The Steering Committee meets irregularly and focuses on short-term fire-fighting, not trade-off analysis',
        'Milestone progress is reviewed, but trade-offs lack any structured evaluation framework',
        'The Steering Committee reviews standardized KPI dashboards on a fixed cadence',
        'The Steering Committee uses forward-looking metrics and risk-probability models to drive proactive choices',
        'Governance dynamically adapts oversight rigor based on real-time, automated risk dashboards',
      ],
    },
    {
      id: 'p1q5',
      dimension: 'strategy-governance',
      text: 'Is the PMO recognized as a strategic Centre of Excellence (CoE) rather than an administrative status desk?',
      options: [
        'The PMO is viewed purely as an administrative status compiler',
        'The PMO is gaining credibility but is still primarily consulted for status, not strategy',
        'The PMO is recognized as the enforcement body for standardized governance frameworks',
        'The PMO is treated as a trusted strategic advisor to executive leadership',
        'The PMO operates as an enterprise Centre of Excellence, setting transformation standards org-wide',
      ],
    },

    // ── PILLAR 2: Estimation Accuracy, Schedule Governance & EVM ────────────
    {
      id: 'p2q1',
      dimension: 'estimation-schedule',
      text: 'Are program schedules baselined and managed with full line-of-sight visibility into critical path tasks across all workstreams?',
      options: [
        'Schedules are kept in static, standalone spreadsheets updated irregularly',
        'Milestones are tracked, but completion is logged by effort spent rather than verified output',
        'Approved schedule baselines are locked and managed in a central PPM platform',
        'Schedule health is actively managed using automated SPI/CPI trend lines against the baseline',
        'Real-time, single-source-of-truth visibility provides instant line-of-sight into critical path dependencies',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'estimation-schedule',
      text: 'Does the program regularly measure Earned Value Management metrics, including Schedule Performance Index (SPI) and Cost Performance Index (CPI)?',
      options: [
        'SPI, EV, and CPI are not tracked at all',
        'SPI is calculated manually and infrequently, offering little forward visibility',
        'SPI and CPI are tracked on a fixed cadence (e.g., bi-weekly) using Planned and Earned Value data',
        'SPI and CPI are calculated automatically and tracked as trend lines to forecast schedule health',
        'SPI variance automatically triggers real-time resource reallocation and schedule rebalancing',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'estimation-schedule',
      text: 'Is work remaining dynamically evaluated using Estimate to Complete (ETC) and Estimate at Completion (EAC) calculations?',
      options: [
        "Work remaining isn't calculated at all; delays are discovered only after deadlines are missed",
        'Work remaining is estimated by subtracting elapsed calendar days, not evaluating actual remaining scope',
        'ETC and EAC are calculated systematically from a central schedule baseline',
        'ETC/EAC are modeled using Monte Carlo simulation to forecast probable completion windows',
        'ETC/EAC recalculate continuously from real-time execution data, with estimation error approaching zero',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'estimation-schedule',
      text: 'Does the PMO track estimation error rates and maintain a retrospective feedback loop to refine future task estimation rules?',
      options: [
        'Estimation errors are neither tracked nor reviewed',
        'Errors are acknowledged informally, but no formal review process exists',
        'Post-stage estimation reviews formally analyze root causes of variance',
        'Estimation variance is tracked as a primary PMO metric and used to recalibrate sizing rules',
        'A closed-loop engine continuously recalibrates estimates from live execution data',
      ],
    },
    {
      id: 'p2q5',
      dimension: 'estimation-schedule',
      text: 'Are standardized task sizing frameworks (e.g., complexity weighting, historical velocity models) consistently applied during baseline updates?',
      options: [
        'Task durations are estimated without any standardized sizing metrics or historical reference',
        'Estimating relies on individual team opinion, without formal complexity weighting',
        'Standardized sizing frameworks (e.g., three-point estimation) are applied consistently across all workstreams',
        'Sizing models incorporate historical program velocity and complexity data',
        'Models analyze execution speed across workstreams to automatically adjust future sizing rules',
      ],
    },

    // ── PILLAR 3: Scope, Process Standardization & Change Management ─────────
    {
      id: 'p3q1',
      dimension: 'scope-change',
      text: 'Is a "fit-to-standard" policy enforced by a formal Change Control Board (CCB) to prevent unnecessary custom coding?',
      options: [
        'Customization requests are routinely approved without any formal architectural review',
        'Scope changes require a standard form, but evaluation of the request remains lenient',
        'A formal CCB evaluates all software modifications against strict fit-to-standard criteria',
        'Proposed scope changes are evaluated with quantitative models measuring cost, schedule, and quality impact',
        'Every proposed scope change is evaluated across technical, financial, and operational dimensions using automated impact analysis',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'scope-change',
      text: 'Are Organizational Change Management (OCM) readiness metrics integrated directly into project phase-gate exit criteria?',
      options: [
        'OCM activity is limited to basic emails sent right before deployment',
        'OCM operates independently, on its own timeline, separate from technical delivery',
        'OCM impact assessments and readiness plans are formally tied to project phase-gates',
        'Predictive user-adoption and readiness metrics directly inform release planning decisions',
        'Enterprise change management capability is built permanently into the post-go-live operating model',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'scope-change',
      text: 'Does the program track process standardization percentages across core functional areas?',
      options: [
        'There is no tracking of how standardized versus customized core processes actually are',
        'Standardization is discussed qualitatively but not measured as a percentage',
        'Process standardization percentage is measured and formally reported to executive leadership',
        'Standardization metrics are tracked alongside quantitative benefit-realization value drivers',
        'A continuous-improvement culture actively pushes standardization higher on the permanent cloud core platform',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'scope-change',
      text: 'Are proposed scope changes evaluated using quantitative models measuring schedule, cost, and risk impacts?',
      options: [
        'Scope change requests are approved or rejected on informal judgment, with no impact model',
        "A basic change-request form exists, but evaluation criteria aren't quantified",
        'The CCB evaluates changes against defined business criteria, though modeling is largely qualitative',
        'Quantitative impact models measure the schedule, cost, and quality effects of every proposed change',
        'Automated models evaluate proposed changes across technical, financial, and operational dimensions simultaneously',
      ],
    },
    {
      id: 'p3q5',
      dimension: 'scope-change',
      text: 'Is there a formal mechanism to track business case benefit realization following system deployment?',
      options: [
        'Business case benefits are never tracked or mapped to technical deliverables',
        'Initial benefit targets are defined, but there is no post-go-live tracking mechanism',
        'Target benefits are baselined and formally mapped to specific business processes',
        'Value drivers from the business case are actively tracked during execution to protect benefit realization',
        'Benefit realization tracking is fully integrated into permanent, post-go-live operational reporting',
      ],
    },

    // ── PILLAR 4: Delivery Execution, Risk & Multi-Vendor Management ─────────
    {
      id: 'p4q1',
      dimension: 'delivery-risk',
      text: 'Is a unified ERP delivery methodology (e.g., hybrid Agile/Waterfall) documented and enforced across internal and vendor teams?',
      options: [
        'Workstreams follow disparate tracking methods, templates, and delivery tools, with no common standard',
        'Standard delivery templates exist, but updates are manually compiled and often delayed',
        'A single ERP methodology (e.g., a structured Agile-Waterfall hybrid) is enforced across all workstreams',
        'Testing velocity and defect-density analytics quantitatively forecast deployment readiness within the methodology',
        'Automated release tooling streamlines configuration transport and deployment within the delivery methodology',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'delivery-risk',
      text: 'Are mandatory quality stage-gate criteria strictly enforced before workstreams advance between project phases?',
      options: [
        'Quality stage-gates are missing entirely, or treated as informal checklists',
        'Stage-gate reviews occur, but workstreams are often allowed to advance despite open defects',
        'Mandatory phase-gate exit criteria require formal sign-off before any workstream advances',
        'Quantitative risk modeling (e.g., Monte Carlo simulation) determines contingency reserves at each gate',
        'Real-time playbooks enable instant bottleneck mitigation as workstreams approach each gate',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'delivery-risk',
      text: 'Is an enterprise RAID log actively maintained, with clear mitigation ownership for open items?',
      options: [
        'Risk registers are rarely updated and lack any actionable mitigation plans',
        'RAID logs are maintained, but only at the individual workstream level, with a fire-fighting focus',
        'A single enterprise RAID log is managed centrally, with assigned risk mitigation owners',
        'Cross-workstream technical dependencies are mapped automatically, flagging downstream RAID impacts early',
        'Risk engines continuously scan execution data to flag emerging RAID items before they materialize',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'delivery-risk',
      text: 'Are System Integrators (SIs) and external vendors managed using objective KPI scorecards and SLA tracking?',
      options: [
        'SI performance goes unmonitored until a major budget or timeline overrun occurs',
        'Vendor deliverables are checked against contract milestones, but quality checks remain subjective',
        'Objective vendor KPI scorecards track deliverable quality, staffing continuity, and SLA metrics',
        'SI payments and incentives are directly linked to verified quality and schedule outcomes',
        'Vendor partnerships operate on shared-risk/shared-reward commercial structures tied to program outcomes',
      ],
    },
    {
      id: 'p4q5',
      dimension: 'delivery-risk',
      text: 'Does the program use quantitative risk modeling (e.g., Monte Carlo simulations) to determine needed schedule and cost contingency reserves?',
      options: [
        'Contingency reserves are set arbitrarily, with no modeling behind the number',
        'A flat contingency percentage is applied uniformly, without workstream-specific risk analysis',
        'Contingency is derived from a documented, structured risk-register review',
        'Monte Carlo or equivalent quantitative simulation determines contingency reserves by workstream',
        'Contingency modeling updates continuously as an automated function of live execution risk data',
      ],
    },

    // ── PILLAR 5: Data Integration, PPM Tooling & Advanced PMO Analytics ─────
    {
      id: 'p5q1',
      dimension: 'data-ppm',
      text: 'Is program management anchored in a centralized cloud PPM platform serving as the single source of truth?',
      options: [
        'No single source of truth exists; schedule, cost, and resource data are fragmented across teams',
        'Standalone project management software is used, but inputs require manual compilation',
        'An integrated PPM platform is deployed enterprise-wide across internal and vendor teams',
        'The PPM platform feeds predictive analytics models that forecast dates, budget burn, and bottlenecks',
        "The PPM platform's telemetry architecture serves as an enterprise benchmark for transformation governance",
      ],
    },
    {
      id: 'p5q2',
      dimension: 'data-ppm',
      text: 'Is the PPM platform connected via automated integration to developer execution tools (e.g., Jira) and financial ledgers?',
      options: [
        'No integration exists; data is re-entered manually across systems',
        'Some manual exports/imports occur between systems, but no live connection exists',
        'Automated connectors link the PPM platform directly with ALM tools and financial ledgers',
        'Integrated data feeds real-time EVM engines that calculate SPI and CPI automatically',
        'Automated workflows handle change-request routing and status aggregation across all connected systems',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'data-ppm',
      text: 'Are automated, real-time executive dashboards used in place of manually compiled slide decks and spreadsheets?',
      options: [
        'Status reporting depends entirely on manual data collection from workstream spreadsheets',
        'Standardized dashboard templates exist, but are still manually assembled for monthly reporting',
        'Role-based, real-time executive dashboards have replaced static slide decks',
        'Root-cause analysis dashboards identify lagging workstreams and delays instantly',
        'Real-time scenario-planning dashboards let sponsors simulate scope, budget, and timeline adjustments live',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'data-ppm',
      text: 'Is data migration velocity (cleansing, mapping, loading) tracked using automated profiling analytics?',
      options: [
        'Data migration metrics are tracked offline, in isolation from the rest of the program',
        "Migration progress is updated periodically but isn't integrated with testing timelines",
        'Automated data-profiling dashboards track cleansing and migration velocity',
        'Data migration readiness models predict cutover duration from load-test execution speeds',
        'Migration telemetry is fully automated and feeds real-time cutover-readiness scenario models',
      ],
    },
    {
      id: 'p5q5',
      dimension: 'data-ppm',
      text: 'Does the PMO leverage predictive analytics or automated telemetry to flag emerging bottlenecks, resource conflicts, and schedule risks early?',
      options: [
        "Bottlenecks and resource conflicts are discovered only after they've already caused delay",
        'Basic capacity planning is done manually through periodic spreadsheet review',
        'Predictive analytics models are in place and used to forecast completion and resource risk',
        'Predictive models actively drive proactive schedule and resource rebalancing decisions',
        'Automated models detect performance anomalies and resource conflicts in real time',
      ],
    },
  ],
};

export default erpPmoMaturity;

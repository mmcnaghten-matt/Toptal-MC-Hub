import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'ai-value-realization',
  scoreDisplay: 'normalized' as const,
  title: 'AI Value Realization Maturity Checkup',
  description: 'Assess your organization\'s ability to translate AI investments into auditable, sustained financial and operational returns across five capability pillars and receive a personalized transformation roadmap.',
  dimensions: [
    {
      id: 'strategy',
      label: 'Strategy, Value Taxonomy, & Targeting',
      shortName: 'Strategy & Targeting',
      description: 'Assesses how an organization targets, categorizes, and prioritizes AI initiatives based on potential financial and operational impact — measuring the transition from technology-driven exploration to a disciplined, ROI-first pipeline aligned with core business priorities.',
    },
    {
      id: 'data',
      label: 'Data Context & Workflow Baselines',
      shortName: 'Data & Workflows',
      description: 'Evaluates an organization\'s capability to document pre-AI "before" states and prepare high-context, clean data pipelines — the critical prerequisite for proving post-implementation ROI and preventing costly data-preparation overruns.',
    },
    {
      id: 'instrumentation',
      label: 'Instrumentation, Telemetry, & Control Logic',
      shortName: 'Telemetry & Control',
      description: 'Focuses on the technical and financial architecture used to track AI performance — measuring the transition from vanity metrics to automated, real-time telemetry that traces an unbroken line from model output to P&L impact.',
    },
    {
      id: 'organization',
      label: 'Organizational Alignment, Steerage, & Collaboration',
      shortName: 'Org & Steerage',
      description: 'Evaluates the structure, decision rights, and organizational entities tasked with directing AI investments — assessing the progression from localized IT governance to a highly empowered, C-suite led Value Realization Control Tower.',
    },
    {
      id: 'technology',
      label: 'Technology Lifecycle & Continuous Value Capture',
      shortName: 'Tech Lifecycle',
      description: 'Evaluates how organizations manage AI over time — measuring the shift from a "project-completion" mindset to a "continuous program lifecycle," focusing on mitigating value decay, maximizing asset reuse, and optimizing total cost of ownership.',
    },
  ],
  questions: [
    // Pillar 1: Strategy, Value Taxonomy, & Targeting
    {
      id: 'p1q1',
      dimension: 'strategy',
      text: 'How does your organization select and prioritize AI use cases?',
      options: [
        'Ad-hoc and reactionary, driven by market hype, FOMO, or individual vendor pitches with no cohesive strategic alignment.',
        'Done on a project-by-project basis with basic, non-standardized cost-benefit projections that rely heavily on speculative assumptions.',
        'Managed through a standardized Prioritization Scorecard that evaluates business value and technical feasibility, categorizing use cases into vertical (direct P&L) and horizontal (enabling capability) domains.',
        'Determined through quantitative modeling of risk-adjusted returns, adoption ramp curves, and total cost of ownership (TCO).',
        'Managed dynamically as a balanced corporate investment portfolio with the authority to instantly scale, pivot, or retire initiatives based on live telemetry.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'What is the primary focus of your organization\'s AI budget allocation?',
      options: [
        'Technology acquisitions and software licenses alone, with zero allocation or plan for workflow redesign.',
        'Localized department purchases with basic financial modeling that ignores total cost of ownership or ongoing maintenance.',
        'Balanced budget allocation that splits funding between core technology and human enablement/process change.',
        'AI is funded in tandem with complete technology-estate modernization (cloud, modern data pipelines, and connectivity tools).',
        'Focused on business-model monetization and revenue creation, treating AI as a programmatic growth layer.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'Who owns accountability for AI benefit realization?',
      options: [
        'Nobody, or left entirely to external vendors and general IT administrators.',
        'Individual project managers who lack the formal authority to modify corporate budgets or workflows.',
        'Named business-unit leaders and process owners with end-to-end accountability.',
        'A dedicated AI Value Realization Office that actively tracks actual outcomes against planned benefits.',
        'A C-suite-led Value Realization Control Tower with absolute authority over capital reallocation.',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy',
      text: 'How are pre-implementation business cases formulated?',
      options: [
        'Non-existent, or based strictly on qualitative promises and general productivity assumptions.',
        'Calculated via basic payback periods using localized, speculative task-level speed metrics.',
        'Modeled using repeatable benefit quantification formulas (e.g., labor leverage, error reduction, customer conversion).',
        'Modeled dynamically to estimate multi-year Net Present Value (NPV) using risk-adjusted discount rates (8% to 15%).',
        'Modeled to account for continuous total cost of ownership, including real-time token/compute spend, cloud infrastructure, and human-in-the-loop validation overhead.',
      ],
    },
    {
      id: 'p1q5',
      dimension: 'strategy',
      text: 'How is AI strategy aligned across the enterprise?',
      options: [
        'Strategy is non-existent, resulting in unapproved "shadow AI" and redundant tool sprawl.',
        'Functional silos operate independently with divergent understandings of AI\'s strategic purpose.',
        'Standardized playbooks and a shared enterprise value taxonomy align business units.',
        'Multi-year strategic AI roadmaps are mapped and tracked directly against enterprise OKRs.',
        'Strategy is institutionalized across all levels, from executive capital steering to frontline human-AI workflow execution.',
      ],
    },

    // Pillar 2: Data Context & Workflow Baselines
    {
      id: 'p2q1',
      dimension: 'data',
      text: 'How are workflow "before" states documented before introducing AI?',
      options: [
        'Baselines are non-existent; AI tools are layered onto unmapped, legacy processes.',
        'High-level workflow mapping is conducted on an ad-hoc, project-by-project basis using historical averages.',
        'Baseline documentation of process cycle times, error rates, and cost-per-transaction is mandatory before project intake.',
        'Processes are dynamically instrumented, automatically generating pre-AI benchmarks across multiple dimensions.',
        'Workflow baselines are continuously updated as human-AI collaboration boundaries shift.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'data',
      text: 'How are data products prepared and governed for AI?',
      options: [
        'Data is highly fragmented, manual to retrieve, and siloed by department.',
        'Data issues are recognized, but data cleaning is manual and consumes the majority of AI project budgets.',
        'Standardized, reusable data products with explicit quality, lineage, and metadata tagging SLAs are established.',
        'Real-time automated data ingestion pipelines are deployed with automated schema validation.',
        'Self-healing data pipelines autonomously detect and correct anomalies, offering zero-latency querying.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'data',
      text: 'How are workflows designed to absorb AI outputs?',
      options: [
        'AI is deployed as a voluntary browser plug-in, forcing users to constantly choose when to engage it.',
        'Process steps are slightly altered, but workflows remain dependent on highly variable manual discretion.',
        'To-be processes are explicitly reengineered, making AI the default step at specific decision nodes.',
        'Workflows are dynamically routed using automated confidence scoring to trigger human-in-the-loop checkpoints.',
        'Workflows are highly elastic, dynamically orchestrating human and machine tasks based on cost and throughput.',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'data',
      text: 'How is data context managed for your AI models?',
      options: [
        'Models are fed raw data without metadata or context, generating generic and irrelevant outputs.',
        'Basic static context templates are utilized, requiring central IT intervention to update.',
        '"AI-ready" data architectures ensure models receive consistent, pre-cleansed enterprise context.',
        'Real-time context layers compile active user actions and background database metrics.',
        'Real-time, live semantic data graphs provide infinite and precise contextual tracking across systems.',
      ],
    },
    {
      id: 'p2q5',
      dimension: 'data',
      text: 'How are data preparation and workflow engineering costs managed?',
      options: [
        'Data preparation is highly manual, leading to consistent project delays and cost overruns.',
        'High analytics backlogs exist as business teams remain entirely dependent on central IT for data pipelines.',
        'Self-service visual data preparation tools are standardized, empowering business teams.',
        'MLOps pipelines predict resource and compute bottlenecks, automatically optimizing data caching.',
        'Real-time compute, token, and database licensing costs are dynamically balanced to maximize system-wide margins.',
      ],
    },

    // Pillar 3: Instrumentation, Telemetry, & Control Logic
    {
      id: 'p3q1',
      dimension: 'instrumentation',
      text: 'How does your organization track AI adoption and usage?',
      options: [
        'Trapped in "The Adoption Illusion" — tracking only license activation rates or active seats.',
        'Tracking relies on retrospective, highly subjective employee surveys.',
        'Automated usage analytics track active users, feature usage depth, and task penetration.',
        'Usage analytics are automatically correlated with operational cycle-time reductions and task speed.',
        'Telemetry highlights underutilized tools or proficiency gaps in real time, triggering targeted training.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'instrumentation',
      text: 'What metrics are used to measure the performance of active AI models?',
      options: [
        'Only basic, technical model proxies (e.g., accuracy, precision, latency) are monitored by IT.',
        'Technical metrics are tracked alongside basic utilization metrics, but in separate systems.',
        'A balanced mix of technical, user adoption, and operational process cycle-time metrics is tracked.',
        'A formalized five-layer measurement spine maps technical performance directly to operational and financial P&L outcomes.',
        'Automated Continuous Verification Fabrics continuously monitor the comprehensive value-to-cost equation of all models.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'instrumentation',
      text: 'How are post-implementation financial audits conducted?',
      options: [
        'Financial reviews are non-existent; budgets are rarely reconciled post-deployment.',
        'Basic project reviews are conducted manually, relying on slow, backward-looking exports.',
        'Standardized benefits registers track realized value, cost-to-serve, and TCO across all initiatives.',
        'CFO-validated processes actively measure actual cost savings and deduct them from department operational budgets.',
        'Real-time Live Portfolio ROI Dashboards feed transactional telemetry directly to corporate financial planning.',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'instrumentation',
      text: 'How does your organization manage "value decay" in deployed AI models?',
      options: [
        'Unmonitored; models are launched and left to drift as software integrations or user behaviors break.',
        'Audits are conducted only when end-users explicitly report severe system degradation.',
        'Scheduled quarterly reviews are conducted to evaluate model drift, adoption, and user trust.',
        'Real-time monitoring automatically triggers alerts for model input drift, integration failures, or drops in workflow penetration.',
        'Self-correcting pipelines automatically trigger model retraining or workflow re-routing the moment decay is detected.',
      ],
    },
    {
      id: 'p3q5',
      dimension: 'instrumentation',
      text: 'How is "workslop" — low-quality AI output requiring human rework — tracked?',
      options: [
        'Untracked; AI outputs are accepted at face value, leaving rework costs hidden in payroll overhead.',
        'Tracked through anecdotal user complaints or high-level quality audits.',
        'Monitored using structured user override, edit, or reject rates.',
        'Automated validation checks measure the exact percentage of outputs accepted without editing.',
        'Continuous telemetry measures human edit-time duration, factoring the exact cost of rework into active ROI.',
      ],
    },

    // Pillar 4: Organizational Alignment, Steerage, & Collaboration
    {
      id: 'p4q1',
      dimension: 'organization',
      text: 'What organizational structure governs your AI initiatives?',
      options: [
        'Functional silos operate independently with zero executive coordination, resulting in shadow AI.',
        'Informal cross-functional committees review high-risk use cases reactively.',
        'A federated, Hub-and-Spoke Center of Excellence (CoE) balances central standards with business-unit speed.',
        'A dedicated AI Value Realization Office (VRO) with C-suite accountability manages resource allocation.',
        'The VRO matures into an executive Control Tower with absolute authority over enterprise capital steering.',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'organization',
      text: 'How are risk, compliance, and responsible AI managed?',
      options: [
        'Non-existent, or compliance acts as a late-stage, reactive bottleneck that stalls deployments.',
        'High-level ethical guidelines are published, but lack enforcement mechanisms or automated monitoring.',
        'Model risk tiering, bias monitoring, and regulatory mapping are integrated directly into stage-gate reviews.',
        'Standardized, auditable model risk management pipelines are deployed across all regions.',
        'Compliance-by-design is fully integrated into automated CI/CD deployment pipelines.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'organization',
      text: 'What is the level of AI trust and literacy across the organization?',
      options: [
        'Non-existent; staff are skeptical and training is unavailable.',
        'Generic "AI 101" training is provided, but it fails to connect to daily tasks, leaving a proficiency gap.',
        'Role-based, outcome-driven literacy programs are deployed quarterly, actively closing proficiency gaps.',
        'Leadership actively models AI usage, and workforce roles are redesigned around human-AI collaboration.',
        'Human-AI collaboration is institutionalized; career progression and KPIs are tied to agent management.',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'organization',
      text: 'How are external partners or expert networks integrated into AI delivery?',
      options: [
        'Ad-hoc transactional sourcing of talent based purely on resource shortages.',
        'Fixed-capacity retainers with minimal alignment between external talent and internal strategic outcomes.',
        'Structured integration of elite, execution-ready talent platforms within specific cross-functional delivery pods.',
        'Partners are managed through shared metrics and joint business planning.',
        'Seamless, on-demand orchestration of highly vetted global talent, enabling rapid scaling or pivoting.',
      ],
    },
    {
      id: 'p4q5',
      dimension: 'organization',
      text: 'How is portfolio-level learning captured and reused across the enterprise?',
      options: [
        'Siloed; lessons learned are lost immediately upon project completion.',
        'Project teams share learnings informally, but there is no centralized repository.',
        'A centralized pattern library and reusable data/code assets are managed by the CoE to compress time-to-market.',
        'Unified MLOps frameworks generate compounding ROI by scaling validated solutions across regions.',
        'Program-based continuous learning loops automatically feed operational telemetry back into strategic planning.',
      ],
    },

    // Pillar 5: Technology Lifecycle & Continuous Value Capture
    {
      id: 'p5q1',
      dimension: 'technology',
      text: 'What is your organization\'s technological mindset regarding AI models post-deployment?',
      options: [
        'Rigid "project-completion" mindset; models are treated as static IT software with no post-launch monitoring.',
        'Basic model maintenance is conducted reactively when bugs are flagged.',
        'AI is managed as a continuous program designed for lifecycle durability and ongoing optimization.',
        'Fully automated MLOps pipelines support model drift detection, rollback, and validation.',
        'An AI-First Software Development Lifecycle (SDLC) is operationalized, utilizing continuous verification fabrics.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'technology',
      text: 'How are software development and delivery metrics optimized for AI?',
      options: [
        'Standard IT/DORA metrics are used, ignoring the probabilistic nature of AI development.',
        'Coding assistants are deployed to engineers, but productivity gains remain unmeasured.',
        'Delivery pipelines track specific AI-First metrics (e.g., cycle time, defect escape, rework rate) against a documented baseline.',
        'Automated review gates and policy engines enforce compliance per trust tier.',
        'The engineering pod utilizes autonomous review, testing, and documentation agents, doubling team throughput.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'technology',
      text: 'How is model infrastructure and hosting cost optimized?',
      options: [
        'Unmanaged; compute and token costs are bundled into general IT overhead with zero transparency.',
        'Costs are reviewed retrospectively on monthly cloud statements, frequently leading to budget overruns.',
        'Centralized Model Gateways enforce rate limits, cost controls, and task-specific routing.',
        'Real-time token optimization and caching protocols are deployed, reducing cost per outcome.',
        'Continuous cost-to-serve optimization dynamically shifts workloads to the most cost-efficient infrastructure.',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'technology',
      text: 'How does the organization handle AI model retraining?',
      options: [
        'Models are completely static and are never retrained post-deployment.',
        'Retraining is done manually when models experience severe, visible performance drops.',
        'Scheduled, calendar-based retraining cycles are conducted using manual data preparation.',
        'Continuous monitoring pipelines trigger automated model retraining based on pre-defined performance thresholds.',
        'Online learning and automated feedback loops retrain models dynamically based on transaction telemetry.',
      ],
    },
    {
      id: 'p5q5',
      dimension: 'technology',
      text: 'To what extent is agentic automation integrated into business workflows?',
      options: [
        'Non-existent; the enterprise relies strictly on deterministic legacy software.',
        'Isolated, conversational chatbots are deployed, but they operate outside of core workflows.',
        'Specialized autonomous agents execute highly narrow tasks inside of a deterministic scaffolding.',
        'Orchestrated multi-agent systems collaborate with humans across complex, multi-step workflows.',
        'Pervasive agentic process automation (APA) dynamically executes and optimizes entire business value chains.',
      ],
    },
  ],
};

export default config;

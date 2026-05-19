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
        'Selection is handled on an ad-hoc basis by individual departments to meet immediate, localized needs.',
        'Selection occurs on a project-by-project basis using decentralized, non-standardized cost-benefit estimates.',
        'Selection is governed by a standardized Prioritization Scorecard that evaluates business value and technical feasibility, classifying use cases into Vertical (P&L impact) and Horizontal (enabling capability) domains.',
        'Determined through quantitative financial modeling of risk-adjusted returns, adoption curves, and total cost of ownership (TCO).',
        'Managed dynamically as a balanced corporate investment portfolio with the authority to scale, pivot, or retire initiatives based on live performance telemetry.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'What is the primary focus of your organization\'s AI budget allocation?',
      options: [
        'Allocated primarily to technology software licenses and core infrastructure acquisitions.',
        'Allocated at the department level with basic financial modeling focused on initial implementation costs.',
        'Balanced systematically between core technology acquisition and workflow redesign/human enablement.',
        'AI is funded in tandem with complete technology-estate modernization (cloud, data pipelines, and connectivity).',
        'Budgets focus primarily on business-model monetization and new revenue streams, treating AI as a programmatic growth layer.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'Who owns accountability for AI benefit realization?',
      options: [
        'Accountability is distributed broadly or managed primarily by external technology vendors.',
        'Individual project managers own delivery, focusing primarily on implementation completion.',
        'Specific business-unit leaders and process owners own end-to-end benefit realization.',
        'A dedicated Value Realization Office actively tracks actual outcomes against planned benefits.',
        'A C-suite-led Value Realization Control Tower dynamically manages benefit optimization and capital allocation.',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy',
      text: 'How are pre-implementation business cases formulated?',
      options: [
        'Formulated qualitatively, focusing on broad enablement and general productivity.',
        'Calculated via basic payback periods using localized, task-level time savings.',
        'Modeled using repeatable financial formulas (e.g., labor leverage, error reduction, deflection, customer conversion).',
        'Modeled dynamically to estimate multi-year Net Present Value (NPV) using risk-adjusted discount rates.',
        'Models incorporate continuous total cost of ownership, including real-time token/compute spend, cloud infrastructure, and human-in-the-loop validation overhead.',
      ],
    },
    {
      id: 'p1q5',
      dimension: 'strategy',
      text: 'How is AI strategy aligned across the enterprise?',
      options: [
        'AI strategies are defined and executed independently within individual teams.',
        'Functional business units operate under separate strategies with informal coordination.',
        'Standardized playbooks and a shared enterprise value taxonomy align business units.',
        'Multi-year strategic AI roadmaps are mapped and tracked directly against enterprise OKRs.',
        'Alignment is institutionalized across all levels, from executive capital steering to frontline human-AI workflow execution.',
      ],
    },

    // Pillar 2: Data Context & Workflow Baselines
    {
      id: 'p2q1',
      dimension: 'data',
      text: 'How are workflow "before" states documented before introducing AI?',
      options: [
        'AI is introduced directly into existing workflows without formal baseline documentation.',
        'High-level workflow mapping is conducted on an ad-hoc, project-by-project basis.',
        'Baseline documentation of process cycle times, error rates, and cost-per-transaction is required before project intake.',
        'Processes are dynamically instrumented, automatically generating pre-AI benchmarks across multiple dimensions.',
        'Workflow baselines are continuously updated as human-AI collaboration boundaries shift.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'data',
      text: 'How are data products prepared and governed for AI?',
      options: [
        'Data is stored in department-specific silos, requiring manual extraction for AI use.',
        'Data cleansing and preparation are handled manually on a project-by-project basis.',
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
        'AI is deployed as a voluntary assistant, with users deciding when to engage it.',
        'Processes are updated to include AI, but execution steps remain dependent on manual discretion.',
        'Processes are reengineered to make AI the default step at specific decision nodes.',
        'Workflows are dynamically routed using automated confidence scoring to trigger human-in-the-loop checkpoints.',
        'Workflows are highly elastic, dynamically orchestrating human and machine tasks based on cost and throughput.',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'data',
      text: 'How is data context managed for your AI models?',
      options: [
        'Models are utilized with general prompts and standard system instructions.',
        'Static prompt templates are utilized, requiring manual updates.',
        'AI-ready data architectures ensure models receive consistent, pre-cleansed enterprise context.',
        'Real-time context layers compile active user actions and background database metrics.',
        'Real-time semantic data graphs provide infinite and precise contextual tracking across systems.',
      ],
    },
    {
      id: 'p2q5',
      dimension: 'data',
      text: 'How are data prep and workflow engineering costs managed?',
      options: [
        'Data preparation is manual and handled as a separate cost during project setup.',
        'Teams rely on central IT pipelines, managing data preparation through standard support queues.',
        'Self-service data preparation tools are standardized, empowering business teams.',
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
        'Usage tracking focuses primarily on license activation and active seat rates.',
        'Usage and adoption feedback is gathered via periodic employee surveys.',
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
        'Tracking is limited to technical model metrics (e.g., accuracy, precision, latency) monitored by IT.',
        'Technical metrics are tracked alongside basic utilization metrics in separate reporting dashboards.',
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
        'Post-deployment reviews focus on technical execution and delivery milestones.',
        'Financial outcomes are reviewed manually on a project-by-project basis.',
        'Standardized benefits registers track realized value, cost-to-serve, and TCO across all initiatives.',
        'Actual cost savings are validated and integrated directly into department operational budgets.',
        'Real-time Live Portfolio ROI Dashboards feed transactional telemetry directly to corporate financial planning.',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'instrumentation',
      text: 'How does your organization manage "value decay" in deployed AI models?',
      options: [
        'Post-deployment model performance is monitored primarily on an ad-hoc basis.',
        'Model performance issues are addressed when flagged by end-user feedback.',
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
        'Output quality is managed primarily through manual review by individual users.',
        'Rework and correction rates are assessed via periodic sample audits.',
        'Rework is monitored systematically using structured user override, edit, or reject rates.',
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
        'AI initiatives are managed within individual functional business units.',
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
        'Compliance reviews are conducted at the final stage of project deployment.',
        'High-level ethical guidelines are published to guide development teams.',
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
        'Training is focused on technical teams, with general business users relying on self-guided learning.',
        'Generic AI literacy training is provided broadly across the organization.',
        'Role-based, outcome-driven literacy programs are deployed quarterly to target specific workflows.',
        'Leadership actively models AI usage, and workforce roles are redesigned around human-AI collaboration.',
        'Human-AI collaboration is institutionalized; career progression and KPIs are tied to agent management.',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'organization',
      text: 'How are external partners or expert networks integrated into AI delivery?',
      options: [
        'Sourcing of external talent is handled reactively on an ad-hoc basis.',
        'Sourcing utilizes standard fixed-capacity vendor contracts.',
        'Specialized execution-ready talent platforms are integrated within specific cross-functional delivery pods.',
        'Sourcing partners are managed through shared metrics and joint business planning.',
        'Seamless, on-demand orchestration of vetted global talent enables rapid scaling or pivoting.',
      ],
    },
    {
      id: 'p4q5',
      dimension: 'organization',
      text: 'How is portfolio-level learning captured and reused across the enterprise?',
      options: [
        'Project knowledge is maintained informally within individual delivery teams.',
        'Project teams share learnings informally, with some central archiving of documents.',
        'A centralized pattern library and reusable data/code assets are managed by the CoE to compress time-to-market.',
        'Unified MLOps frameworks scale validated solutions across regions.',
        'Program-based continuous learning loops automatically feed operational telemetry back into strategic planning.',
      ],
    },

    // Pillar 5: Technology Lifecycle & Continuous Value Capture
    {
      id: 'p5q1',
      dimension: 'technology',
      text: 'What is your organization\'s technological mindset regarding AI models post-deployment?',
      options: [
        'AI is managed under standard IT software project cycles with fixed delivery dates.',
        'Basic model maintenance and updates are scheduled reactively.',
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
        'Software delivery is evaluated using standard IT and DORA metrics.',
        'Coding assistants are deployed, with productivity gains estimated via high-level team metrics.',
        'Delivery pipelines track specific AI-First metrics (e.g., cycle time, defect escape, rework rate) against a documented baseline.',
        'Automated review gates and policy engines enforce compliance per trust tier.',
        'Engineering pods utilize autonomous review, testing, and documentation agents to maximize throughput.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'technology',
      text: 'How is model infrastructure and hosting cost optimized?',
      options: [
        'Compute and hosting costs are managed under general IT infrastructure budgets.',
        'Cloud costs are reviewed periodically via standard monthly statements.',
        'Centralized Model Gateways enforce rate limits, cost controls, and task-specific routing.',
        'Real-time token optimization and caching protocols are deployed to reduce cost per outcome.',
        'Continuous cost-to-serve optimization dynamically shifts workloads to the most cost-efficient infrastructure.',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'technology',
      text: 'How does the organization handle AI model retraining?',
      options: [
        'Models remain static post-deployment, with updates handled as new development projects.',
        'Retraining is conducted manually when a significant performance drop is observed.',
        'Retraining occurs on scheduled, calendar-based cycles using manual data preparation.',
        'Continuous monitoring pipelines trigger automated model retraining based on pre-defined performance thresholds.',
        'Online learning and automated feedback loops retrain models dynamically based on transaction telemetry.',
      ],
    },
    {
      id: 'p5q5',
      dimension: 'technology',
      text: 'To what extent is agentic automation integrated into business workflows?',
      options: [
        'Automation is built entirely on deterministic rule-based systems.',
        'Conversational chatbots are deployed to handle basic customer or internal queries.',
        'Specialized autonomous agents execute narrow tasks within a deterministic scaffolding.',
        'Orchestrated multi-agent systems collaborate with humans across complex, multi-step workflows.',
        'Pervasive agentic process automation (APA) dynamically executes and optimizes entire business value chains.',
      ],
    },
  ],
};

export default config;

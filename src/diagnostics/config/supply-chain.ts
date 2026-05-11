import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'supply-chain',
  scoreDisplay: 'normalized' as const,
  title: 'Supply Chain Maturity Checkup',
  description: 'Assess your organization\'s supply chain maturity across five capability pillars and receive a personalized transformation roadmap.',
  dimensions: [
    {
      id: 'strategy',
      label: 'Strategy & Planning',
      shortName: 'Strategy',
      description: 'Enterprise-wide alignment, demand sensing, and integrated planning cycles.',
    },
    {
      id: 'data',
      label: 'Data & Digital Integration',
      shortName: 'Data & Digital',
      description: 'Infrastructure maturity, data harmonization, and AI-powered visibility.',
    },
    {
      id: 'operations',
      label: 'Operations & Execution',
      shortName: 'Operations',
      description: 'Workflow efficiency, logistics optimization, and "smart" execution.',
    },
    {
      id: 'resilience',
      label: 'Resilience & Risk Management',
      shortName: 'Resilience',
      description: 'Risk anticipation, "just-in-case" strategy, and disruption recovery.',
    },
    {
      id: 'collaboration',
      label: 'Collaboration & Ecosystem Alignment',
      shortName: 'Collaboration',
      description: 'Transactional vs. strategic partnerships and "Extended Organization" maturity.',
    },
  ],
  questions: [
    // Pillar 1: Strategy & Planning
    {
      id: 'p1q1',
      dimension: 'strategy',
      text: 'Which best describes your organization\'s formal supply chain planning process?',
      options: [
        'Planning is uncoordinated, ad-hoc, and largely reactive to immediate crises.',
        'Initial efforts are made to conduct formal S&OP meetings, though they remain localized.',
        'A formal, recurring S&OP process is standardized with cross-functional participation.',
        'Integrated Business Planning (IBP) links supply chain plans directly to financial ROI.',
        'Planning is a dynamic, real-time, and self-correcting core business driver.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'How does your organization approach demand forecasting?',
      options: [
        'Based on anecdotal evidence, intuition, or basic historical spreadsheets.',
        'Basic KPIs for accuracy are introduced, but schedules require heavy manual adjustment.',
        'Forecasts are developed proactively from a single, centralized internal data source.',
        'AI-driven demand sensing is used to forecast granular demand across all channels.',
        'Systems use AI to continuously optimize production networks in real-time.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'How is inventory policy determined and managed across the network?',
      options: [
        'Managed reactively at the local level, leading to frequent stockouts or overstock.',
        'Some KPIs for stock levels exist, but they are not consistent across all channels.',
        'A unified view of inventory across all stores and warehouses is established.',
        'Predictive analytics model the impact of promotions or new launches on inventory.',
        'AI-driven systems dynamically balance and move stock across the global network.',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy',
      text: 'How adaptive is your planning cycle to market volatility?',
      options: [
        'Planning is static; the organization operates in a "firefighting" mode.',
        'Planning is project-based; awareness of volatility exists but responses are slow.',
        'Proactive planning shifts focus to end-to-end integration and defined objectives.',
        '"What-if" scenario modeling is used to optimize resource allocation against volatility.',
        'The supply chain can pivot instantly to meet surges or respond to disruptions.',
      ],
    },

    // Pillar 2: Data & Digital Integration
    {
      id: 'p2q1',
      dimension: 'data',
      text: 'What is the current state of your supply chain data architecture?',
      options: [
        'Data is fragmented and manually collected in spreadsheets or legacy systems.',
        'Data silos persist, but basic BI tools are used for static, after-the-fact reporting.',
        'A central repository (ERP/Warehouse) provides a unified "single source of truth".',
        'A "Digital Twin" of the network allows for real-time simulation and optimization.',
        'A central "Control Tower" integrates all internal, external, and partner data.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'data',
      text: 'How is technology utilized to support decision-making?',
      options: [
        'Decisions are based on intuition and limited, after-the-fact reporting.',
        'Dashboards are used, but data is typically batched and not available in real-time.',
        'Self-service analytics tools are available for ad-hoc exploration by managers.',
        'AI is systematically used for automated root-cause analysis of production or quality issues.',
        'Augmented analytics provide automated, prescriptive recommendations to all employees.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'data',
      text: 'To what degree are your internal systems (POS, ERP, WMS, Logistics) integrated?',
      options: [
        'Systems are siloed between procurement, production, and logistics.',
        'Integration is emerging (e.g., POS linked to e-commerce) but remains manual or static.',
        'A unified platform combines data from ERP, WMS, and production for a holistic view.',
        'Advanced technology enables real-time monitoring and forecasting across the network.',
        'The supply chain operates as a "live" enterprise with AI-powered insights from HQ to the floor.',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'data',
      text: 'How does the organization approach emerging digital transformation (AI/ML/IoT)?',
      options: [
        'Limited to no use; primary reliance is on manual entry and spreadsheets.',
        'There is awareness of the need, but technology is often siloed in point solutions.',
        'Unified platforms are used, though they may not yet include external partners.',
        'IoT sensors and predictive analytics are used to monitor equipment and market signals.',
        'AI and machine learning are pervasively integrated for continuous process innovation.',
      ],
    },

    // Pillar 3: Operations & Execution
    {
      id: 'p3q1',
      dimension: 'operations',
      text: 'How would you describe your core operational and manufacturing workflows?',
      options: [
        'Processes are heavily manual, inconsistent, and error-prone.',
        'Basic SOPs are documented and workflow automation is introduced for routine tasks.',
        'Lean and Six Sigma practices are applied to optimize flow and reduce waste.',
        'Predictive analytics and real-time monitoring are used to dynamically adjust operations.',
        'Execution is continuously optimized through pervasive AI and automated robotics.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'operations',
      text: 'What is the maturity of your logistics and fulfillment strategy?',
      options: [
        'Managed in silos with multiple carriers and no integrated view of shipping.',
        'Routes are planned, but they lack real-time data or centralized optimization.',
        'Logistics are integrated with a Transportation Management System (TMS) and robust WMS.',
        'Supply chain is segmented to meet specific needs (e.g., rapid fulfillment vs. consolidated).',
        'An agile fulfillment network dynamically manages orders across all channels in real-time.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'operations',
      text: 'How is warehouse and facility health managed?',
      options: [
        'Inventory and equipment management are purely reactive.',
        'A basic Warehouse Management System (WMS) is implemented.',
        'A robust WMS is integrated with the ERP for a single view of inventory.',
        '"Smart Factories" use IoT sensors to preemptively schedule maintenance and minimize downtime.',
        '"Smart DCs" and automated systems handle execution with minimal human intervention.',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'operations',
      text: 'To what extent is the end-to-end customer experience optimized?',
      options: [
        'No unified view of the customer experience exists across channels.',
        'Initial efforts are made to align inventory across online and offline channels.',
        'A formalized omnichannel strategy is executed across all business functions.',
        'Customer journeys are mapped and personalized using advanced analytics.',
        'Real-time data from all touchpoints is used for continuous customer-centric optimization.',
      ],
    },

    // Pillar 4: Resilience & Risk Management
    {
      id: 'p4q1',
      dimension: 'resilience',
      text: 'What is your organization\'s formal approach to risk assessment?',
      options: [
        'Informal and reactive; no formal risk management plan exists.',
        'Basic assessment is performed, often in response to a recent disruption.',
        'A formal Risk Management Playbook is developed with a focus on "Time-to-Recover".',
        'Cognitive risk sensing and predictive analytics are used to anticipate potential disruptions.',
        'The organization is built to thrive post-disruption and capitalize on new opportunities.',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'resilience',
      text: 'How would you describe your sourcing and supplier vulnerability?',
      options: [
        'Single-sourced for most critical components; highly vulnerable to disruptions.',
        'Awareness of single-source risks exists, but reactive measures still dominate.',
        'Dual-sourcing or multi-sourcing is adopted for all key materials and components.',
        'Scenario modeling and stress-testing are used to evaluate network resilience.',
        'The supply chain features built-in redundancies and a diversified global ecosystem.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'resilience',
      text: 'What strategy does the organization use for inventory and capacity buffers?',
      options: [
        'Minimal safety stock is maintained, focusing purely on lean/just-in-time efficiency.',
        'Some inventory buffers are created for a limited number of high-value items.',
        'Safety stock is strategically implemented to mitigate common supply disruptions.',
        'Proactive adjustments are made to buffers based on anticipated geopolitical or market events.',
        'The fulfillment network is inherently agile, re-routing orders dynamically during disruptions.',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'resilience',
      text: 'How does the organization view disruption in relation to competition?',
      options: [
        'Disruption is a purely negative event to be survived through firefighting.',
        'Focus is on a "Time-to-Survive" metric to ensure basic continuity.',
        'Focus shifts to reducing "Time-to-Recover" to return to standard operations quickly.',
        'Predictive analytics monitor risks to allow for proactive mitigation before impact.',
        'A "Time-to-Thrive" model uses disruption as an opportunity to gain market share.',
      ],
    },

    // Pillar 5: Collaboration & Ecosystem Alignment
    {
      id: 'p5q1',
      dimension: 'collaboration',
      text: 'How would you characterize your relationships with external suppliers?',
      options: [
        'Purely transactional, short-term, and based primarily on price.',
        'Basic scorecards are used; some suppliers are involved in early product development.',
        'Relationships are managed proactively with a focus on long-term value and problem-solving.',
        'The company engages in joint business planning to align goals for mutual benefit.',
        'The organization acts as a strategic partner, driving innovation across the entire ecosystem.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'collaboration',
      text: 'To what extent is data shared with external partners (suppliers/logistics)?',
      options: [
        'Communication is limited to basic order and delivery information.',
        'Collaboration is project-based; no standardized external data-sharing channels exist.',
        'A single source of truth is used internally to inform external interactions.',
        'Shared data platforms provide partners with real-time visibility into inventory and schedules.',
        'The organization actively shares data to optimize the entire multi-firm value chain.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'collaboration',
      text: 'What is the state of internal cross-functional collaboration?',
      options: [
        'Operations are conducted in functional silos with limited communication.',
        'Communication between departments is established but is not yet formalized.',
        'Cross-functional teams and processes (e.g., S&OP) are formalized and recurring.',
        'Teams from procurement, production, and R&D work together on lifecycle management.',
        'Collaboration extends to strategic suppliers for continuous process improvement.',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'collaboration',
      text: 'How does the organization compete within its industry?',
      options: [
        'Competes as a siloed entity focusing on internal cost reduction.',
        'Begins to evaluate performance via some basic supplier/partner metrics.',
        'Competes through standardized, integrated internal processes.',
        'Shifts to an "outside-in" view of the supply chain to meet market needs.',
        'Competition is based on a mastery of the global, connected multi-firm ecosystem.',
      ],
    },
  ],
};

export default config;

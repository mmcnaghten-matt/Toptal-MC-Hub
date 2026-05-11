import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'performance-improvement',
  scoreDisplay: 'normalized' as const,
  title: 'Performance Improvement Maturity Checkup',
  description: 'Assess your organization\'s operational performance maturity across six capability pillars and receive a personalized improvement roadmap.',
  dimensions: [
    {
      id: 'strategy',
      label: 'Strategic Alignment & Goal Setting',
      shortName: 'Strategy',
      description: 'Mission translation, actionable strategy, and organization-wide goal alignment.',
    },
    {
      id: 'process',
      label: 'Process Design & Execution',
      shortName: 'Process',
      description: 'Capability to define, standardize, and execute workflows effectively and efficiently.',
    },
    {
      id: 'organization',
      label: 'Organizational & Functional Alignment',
      shortName: 'Org Alignment',
      description: 'Structure, roles, and communication systems that facilitate shared purpose.',
    },
    {
      id: 'technology',
      label: 'Technology & Data Management',
      shortName: 'Tech & Data',
      description: 'Leveraging data and technology to drive decision-making and scale proven processes.',
    },
    {
      id: 'people',
      label: 'People & Culture',
      shortName: 'People',
      description: 'Talent development, employee engagement, and high-performance culture.',
    },
    {
      id: 'resources',
      label: 'Resource & Asset Optimization',
      shortName: 'Resources',
      description: 'Identifying and utilizing assets (financial, human, physical) to maximize value.',
    },
  ],
  questions: [
    // Pillar 1: Strategic Alignment & Goal Setting
    {
      id: 'p1q1',
      dimension: 'strategy',
      text: 'To what extent are your organization\'s strategic goals formally documented and linked to individual employee performance?',
      options: [
        'Goals are ad-hoc and tactical; decisions are based on immediate demands rather than clear direction.',
        'Strategy is conducted behind closed doors by senior leadership and dictated top-down; goals often lack full alignment.',
        'Formal goals are established and aligned across departments to the corporate mission through a structured planning process.',
        'Strategy is the driving force for all decision-making, and plans are revised as needed based on data and market signals.',
        'Strategic planning is a continuous, dynamic process with real-time feedback loops and scenario planning.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'How are "SMART" (Specific, Measurable, Achievable, Relevant, Time-bound) goals utilized within your teams?',
      options: [
        'Goals are rarely measurable or documented; success depends on individual "heroics".',
        'Some KPIs are tracked within isolated projects or teams, but consistency remains a challenge.',
        'SMART goals are standardized across the organization and used to align departmental efforts.',
        'Goals are quantitatively managed and used to forecast performance outcomes.',
        'AI and machine learning are pervasive, allowing for continuous optimization of goals in response to market changes.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'How effectively is the organization\'s mission and purpose communicated to all levels?',
      options: [
        'Mission is largely unknown; most employees are unaware of the mission statement.',
        'Mission is mentioned in newsletters or handbooks but most employees feel disconnected from it.',
        'Purpose is well-understood and used to coordinate efforts across departments proactively.',
        'Total alignment exists; strategy and mission drive a pervasive culture of accountability.',
        'Employees take full ownership of the mission, using real-time insights to create new opportunities.',
      ],
    },

    // Pillar 2: Process Design & Execution
    {
      id: 'p2q1',
      dimension: 'process',
      text: 'How documented and repeatable are your core business processes?',
      options: [
        'Processes are unwritten and "invisible"; workflows are inconsistent and prone to errors.',
        'Processes are documented locally within silos or by specific individuals but are not standardized organization-wide.',
        'Standard Operating Procedures (SOPs) are formalized and applied consistently across the organization.',
        'Processes are rigorously controlled using quantitative methods (e.g., Lean or Six Sigma).',
        'The organization is a recognized innovator in process design, driven by diagnostic tools and feedback loops.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'process',
      text: 'How does your organization address workflow inefficiencies or errors?',
      options: [
        'Reactively; problems are addressed only after they arise, with no systematic control.',
        'Localized awareness; individual teams manage their own improvements but knowledge remains siloed.',
        'Proactively; cross-functional teams are formed specifically to manage and optimize workflows.',
        'Predictively; analytics are used to identify opportunities for improvement and forecast outcomes.',
        'Self-optimizing; processes adapt dynamically to market shifts through automated feedback systems.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'process',
      text: 'To what extent are manual tasks and handoffs eliminated through automation?',
      options: [
        'Processes are heavily manual, relying on spreadsheets and legacy systems.',
        'Some routine tasks are automated, but efforts are disconnected and lack a systematic approach.',
        'Automation is supported by standardized technology platforms and a "single source of truth".',
        'Advanced analytics and AI are integrated for real-time monitoring and automated root-cause analysis.',
        'Technology (specifically AI) is pervasive, driving continuous optimization across the entire value chain.',
      ],
    },

    // Pillar 3: Organizational & Functional Alignment
    {
      id: 'p3q1',
      dimension: 'organization',
      text: 'Which best describes the communication flow between departments in your organization?',
      options: [
        'Informal, ad-hoc, and reactive; departments operate in silos with limited interaction.',
        'Primarily top-down; information is restricted to specific channels like email or newsletters and not shared consistently.',
        'Proactive and bi-directional; structured processes coordinate efforts across departments.',
        'Strategic and transparent; information is delivered through integrated digital platforms to empower teams.',
        'Community-driven; employees take full ownership of knowledge sharing as the organizational norm.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'organization',
      text: 'How are cross-functional roles and responsibilities defined?',
      options: [
        'Roles are unclear; the organizational structure is characterized by rigid silos.',
        'Initial efforts exist to form cross-functional teams, but standardized channels for them are lacking.',
        'Roles are well-defined; cross-functional working is institutionalized through formalized processes.',
        'Work is managed through metrics; teams are empowered to make decisions and provide data-driven feedback.',
        'The organization operates as a self-optimizing system where dynamic collaboration is inherently stable.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'organization',
      text: 'How effective is your current organizational design in supporting business growth?',
      options: [
        'Outdated design; structural redundancies and silos are actively inhibiting growth.',
        'Awareness of design flaws exists, but changes are sporadic and limited to specific projects.',
        'Properly structured; each department and role is designed to align with and support corporate goals.',
        'Data-driven design; organizational capability and capacity gaps are rigorously identified and addressed via metrics.',
        'Agile Target Operating Model (TOM); provides maximum flexibility and seamless interaction among divisions.',
      ],
    },

    // Pillar 4: Technology & Data Management
    {
      id: 'p4q1',
      dimension: 'technology',
      text: 'What is the current state of your organization\'s data integration?',
      options: [
        'Heavily fragmented; reliance on spreadsheets, manual data entry, and legacy systems.',
        'Basic tools are in place, but dashboards are disconnected and reporting is manual.',
        'Unified platform; integrated data from multiple sources provides a "single source of truth".',
        'Advanced analytics and AI provide predictive insights and automated root-cause analysis.',
        'Technology is a strategic business partner, creating competitive advantages and new revenue streams.',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'technology',
      text: 'How is data utilized to support organizational decision-making?',
      options: [
        'Decisions are based on intuition, anecdotal evidence, or personal opinions.',
        'Basic BI tools are used for backwards-looking reporting only.',
        'Self-service analytics tools are available to business users for proactive management.',
        'Predictive models drive forecasting, demand management, and performance optimization.',
        'AI and machine learning are central to the value offering, driving continuous innovation.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'technology',
      text: 'How does the organization manage its "technical debt" and system reliability?',
      options: [
        'High technical debt; manual workarounds are the norm due to obsolete systems.',
        'Some tasks are automated, but the lack of a systematic approach leads to frequent "manual workarounds".',
        'Standardized technology platforms support all core processes with reliable integration.',
        'Technology is a critical enabler that strengthens and scales already proven, mature processes.',
        'Technology is inherently flexible and resilient, dynamically responding to emerging business opportunities.',
      ],
    },

    // Pillar 5: People & Culture
    {
      id: 'p5q1',
      dimension: 'people',
      text: 'How does your organization approach talent management and employee development?',
      options: [
        'Inconsistent and informal; hiring and onboarding are ad-hoc.',
        'Basic training and employee handbooks exist; awareness of the need for better practices is emerging.',
        'Formalized career paths and training plans are applied consistently and aligned with organizational goals.',
        'Performance is rigorously managed with data; leadership focus shifts from supervision to coaching and mentoring.',
        'A culture of continuous learning, innovation, and empowerment is deeply embedded and agile.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'people',
      text: 'To what degree are employees empowered to make decisions?',
      options: [
        'Punitive or disengaged culture; decisions are restricted to top leadership.',
        'Awareness of the need for empowerment, but performance reviews are sporadic and centralized.',
        'Culture is consciously reinforced; employees feel valued and their roles are aligned with the mission.',
        'Incentives and rewards are strategically aligned with performance metrics to drive engagement.',
        'Highly engaged workforce empowered to contribute directly to the company\'s evolution and innovation.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'people',
      text: 'How is performance accountability handled within the organization?',
      options: [
        'Performance is unpredictable; success depends entirely on the "heroics" of specific individuals.',
        'Reviews are required but not used consistently as a serious tool for accountability.',
        'Performance management is a continuous, systemic process rather than an annual event.',
        'A culture of accountability permeates all levels; decisions are evidence-based.',
        'High-performance mindset is the core operating model, driving long-term success.',
      ],
    },

    // Pillar 6: Resource & Asset Optimization
    {
      id: 'p6q1',
      dimension: 'resources',
      text: 'How are resources (financial and physical) allocated across the organization?',
      options: [
        'Ad-hoc and reactive; resources are frequently underutilized or mis-allocated.',
        'Budgets are set, but variances and analysis are only reviewed after the fact.',
        'Standardized and data-informed; costs are tracked by department and aligned with priorities.',
        'Predictive; analytics forecast demand and treat cost optimization as a strategic lever to strengthen the company.',
        'Resource management is the core operating model, driven by real-time dashboards and automated ROI insights.',
      ],
    },
    {
      id: 'p6q2',
      dimension: 'resources',
      text: 'Which strategy does your organization use for cost reduction?',
      options: [
        'Myopic, across-the-board cuts during economic uncertainty.',
        'Broad-based cutting that is not tied to specific business value drivers.',
        'Allocation is based on an emerging understanding of resource cost versus business value.',
        'Strategic repositioning; freeing resources from low-value activities to enable growth in high-value areas.',
        'Continuous optimization of ROI is the norm, allowing for rapid pivots and resilience.',
      ],
    },
    {
      id: 'p6q3',
      dimension: 'resources',
      text: 'How does the organization evaluate the success and ROI of its projects?',
      options: [
        'No formal process exists for assessing project ROI or effectiveness.',
        'Reactive analysis; costs and benefits are reviewed only after a project fails or succeeds.',
        'Standardized reporting cycles track project ROI and cash flow accuracy.',
        'Predictive modeling and financial benchmarks are used to forecast project performance.',
        'Continuous optimization loops monitor results against forecasts to refine investment strategies dynamically.',
      ],
    },
  ],
};

export default config;

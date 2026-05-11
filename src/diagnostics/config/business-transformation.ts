import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'business-transformation',
  scoreDisplay: 'normalized' as const,
  title: 'Business Transformation Maturity Checkup',
  description: 'Assess your organization\'s business transformation maturity across five capability pillars and receive a personalized transformation roadmap.',
  dimensions: [
    {
      id: 'governance',
      label: 'Strategic Alignment & Governance',
      shortName: 'Strategy & Gov.',
      description: 'Vision definition, corporate strategy alignment, and program governance.',
    },
    {
      id: 'process',
      label: 'Process & Operational Excellence',
      shortName: 'Process',
      description: 'Redesigning and optimizing core workflows for efficiency, automation, and agility.',
    },
    {
      id: 'technology',
      label: 'Data & Technology Integration',
      shortName: 'Data & Tech',
      description: 'Leveraging technology as a core enabler and strategic engine for transformation.',
    },
    {
      id: 'culture',
      label: 'Organizational & Cultural Change',
      shortName: 'Org & Culture',
      description: 'Leadership readiness, employee buy-in, and fostering a culture of continuous improvement.',
    },
    {
      id: 'customer',
      label: 'Customer & Market Centricity',
      shortName: 'Customer',
      description: 'Customer experience, market adaptability, and capturing new value.',
    },
  ],
  questions: [
    // Pillar 1: Strategic Alignment & Governance
    {
      id: 'p1q1',
      dimension: 'governance',
      text: 'How would you describe your organization\'s vision for large-scale change and transformation?',
      options: [
        'The vision for change is absent or remains a vague, unarticulated goal.',
        'A basic vision is drafted, but it is not widely communicated or inspiring to the workforce.',
        'A well-defined, compelling case for change is communicated, ensuring broad stakeholder buy-in.',
        'Governance mechanisms are data-driven, using KPIs to track and adapt the transformation roadmap.',
        'Transformation is a strategic operating model that continuously adjusts to market signals.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'governance',
      text: 'What is the current state of leadership alignment and accountability regarding transformation?',
      options: [
        'Leadership is not aligned and may operate with competing priorities.',
        'A transformation leader may be appointed, but they lack a formal mandate or dedicated resources.',
        'Leadership is aligned on common priorities, supported by a formal Program Management Office (PMO).',
        'Senior leadership actively engages in a transformation council, making group decisions based on data.',
        'The governance structure is agile, with processes to rapidly re-prioritize based on real-time data.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'governance',
      text: 'To what extent are transformation initiatives aligned with the overall corporate strategy?',
      options: [
        'Transformation efforts are chaotic, siloed, and lack a shared purpose.',
        'Efforts remain siloed, with very limited coordination among different business units.',
        'Standardized standards and guidelines provide consistent direction across all initiatives.',
        'Initiatives move beyond definition to active, quantitative refinement for predictable outcomes.',
        'Transformation is treated as the core operating model, deeply embedded in the corporate DNA.',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'governance',
      text: 'How are transformation projects managed and controlled over time?',
      options: [
        'Governance is informal and ad-hoc, with no clear chain of command or accountability.',
        'Projects are planned and measured, but efforts are localized and not standardized across the organization.',
        'A formal PMO is established with a defined roadmap, roles, and responsibilities.',
        'Processes are rigorously measured and controlled using quantitative methods to guide the roadmap.',
        'Governance is agile and resilient, enabling the organization to pivot rapidly to emerging opportunities.',
      ],
    },

    // Pillar 2: Process & Operational Excellence
    {
      id: 'p2q1',
      dimension: 'process',
      text: 'Which best describes the documentation and consistency of your core business processes?',
      options: [
        'Processes are manual, undocumented, and inconsistent across different teams or departments.',
        'Initial efforts are made to document and standardize key business workflows.',
        'Standardized and documented processes are consistently applied across all relevant departments.',
        'Advanced analytics and process mining are used to identify inefficiencies and improve workflows.',
        'The operating model is highly agile and continuously refined based on real-time feedback loops.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'process',
      text: 'How does your organization utilize automation to achieve operational excellence?',
      options: [
        'Operations are characterized by frequent handoffs and no clear accountability for end-to-end workflows.',
        'Some automation is experimented with on a small scale, but without a unified strategy.',
        'Automation is used to optimize core functions (e.g., reporting), resulting in measurable efficiency gains.',
        'Predictive analytics optimize operations, anticipating demand and reducing bottlenecks.',
        'AI and autonomous systems drive optimization across the entire value chain.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'process',
      text: 'To what extent is the customer journey integrated into your process design?',
      options: [
        'Process inefficiencies and bottlenecks lead to significant delays and manual errors.',
        'Initial process documentation efforts exist, but design does not yet center on the customer journey.',
        'The customer journey is at the center of process redesign and standardized across the organization.',
        'Operations are data-driven and proactively managed using advanced analytics and process mining.',
        'Processes are continuously improved via AI-driven automation to ensure end-to-end efficiency.',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'process',
      text: 'How does your organization handle operational bottlenecks or errors?',
      options: [
        'The organization operates in a reactive mode, addressing problems only as they arise.',
        'Some KPIs are introduced to monitor projects, but consistency remains project-specific.',
        'The approach is proactive, with formalized standards providing direction across various initiatives.',
        'Analytics are employed to forecast trends and make proactive decisions to mitigate bottlenecks.',
        'The organization is focused on continuous innovation and resilience, with self-optimizing workflows.',
      ],
    },

    // Pillar 3: Data & Technology Integration
    {
      id: 'p3q1',
      dimension: 'technology',
      text: 'What is the current level of data integration across your primary business systems?',
      options: [
        'Reliance on basic spreadsheets and legacy systems for sales and operations data.',
        'Awareness of the need for better data exists, but integration between disparate systems is limited.',
        'A unified platform is established to integrate data from various sources for a more holistic view.',
        'The organization leverages predictive analytics and AI for demand forecasting and inventory optimization.',
        'AI and machine learning are pervasively integrated into all aspects of the business as a core operating model.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'technology',
      text: 'How is technology utilized to support decision-making within the organization?',
      options: [
        'Decisions are predominantly based on intuition and anecdotal evidence.',
        'Basic BI tools are used to generate predefined reports, driven by a central IT team.',
        'Business users have access to self-service analytics tools, allowing them to explore data and ask ad-hoc questions.',
        'Technology is used for real-time monitoring and proactive decision-making across the enterprise.',
        'The organization uses advanced analytics to continuously innovate and personalize customer experiences.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'technology',
      text: 'Which best describes the strategic role of IT/Technology in your organization?',
      options: [
        'Technology is limited to basic, siloed systems and manual data tracking.',
        'Technology is viewed as a collection of disconnected systems used to support existing, inefficient processes.',
        'Standardized technology platforms support a unified view of data across the organization.',
        'Technology, particularly AI, is systematically integrated to provide predictive strategic insights.',
        'Technology is an integrated strategic engine that creates new value and competitive differentiation.',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'technology',
      text: 'How does your organization handle data quality and automated insights?',
      options: [
        'Data is fragmented and siloed, making it challenging to identify trends or get a holistic view.',
        'Some BI tools are used for predefined dashboards, but integration remains limited.',
        'Unified platforms allow business users to explore data through self-service analytics.',
        'The organization employs automated root cause analysis to optimize performance and refine processes.',
        'Machine learning and advanced information processing are pervasively integrated for sustained advantage.',
      ],
    },

    // Pillar 4: Organizational & Cultural Change
    {
      id: 'p4q1',
      dimension: 'culture',
      text: 'How would you characterize the level of collaboration across different business units?',
      options: [
        'Transformation efforts are performed in silos, with no cross-functional collaboration.',
        'Leadership recognizes the importance of buy-in and begins to involve cross-functional teams in specific projects.',
        'Cross-functional teams are formalized, with defined roles and responsibilities to foster collaboration.',
        'A Center of Excellence (COE) is established to ensure consistent knowledge and support across the organization.',
        'A culture of agility and innovation is deeply embedded, and the workforce is highly engaged and empowered.',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'culture',
      text: 'How effectively is the "case for change" communicated to employees?',
      options: [
        'Employee resistance and change burnout are common due to a lack of clear vision or communication.',
        'Communication is often informal or one-way, with limited opportunities for feedback from the organization.',
        'Stakeholder engagement is proactive and systematic, with regular, structured communication.',
        'Senior leadership actively champions change, participating in strategy councils with genuine commitment.',
        'Innovation is pervasive, and the organization is resilient and adaptive to market shifts.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'culture',
      text: 'To what degree is continuous improvement embedded in the organizational culture?',
      options: [
        'High resistance to change is standard, and efforts are confined to individual departments.',
        'Initial efforts are made to foster collaboration, but culture remains largely change-averse.',
        'A culture of collaboration and agile methodologies is actively fostered across the organization.',
        'Leadership acts as an active champion for change, using data to guide cultural shifts.',
        'Continuous improvement and innovation are "hardwired" into the organization\'s DNA.',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'culture',
      text: 'How does the organization support employee development during transformation?',
      options: [
        'Change is imposed on a resistant workforce with minimal support or training.',
        'Recognition of the need for buy-in exists, but support remains project-specific and reactive.',
        'Formalized teams and defined roles provide clarity and support for transformation efforts.',
        'The organization utilizes a COE and structured knowledge sharing to empower employees.',
        'Workforce is empowered by supportive technology and communication tools to lead innovation.',
      ],
    },

    // Pillar 5: Customer & Market Centricity
    {
      id: 'p5q1',
      dimension: 'customer',
      text: 'How does your organization engage with customers and their feedback?',
      options: [
        'Customer engagement is limited to reactive complaint resolution.',
        'Initial efforts are made to improve customer service and satisfaction based on basic research.',
        'The customer journey is at the center of transformation efforts, ensuring a seamless experience.',
        'The organization leverages AI for personalized shopping experiences and recommendations.',
        'The organization continuously innovates based on real-time consumer feedback to create new opportunities.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'customer',
      text: 'Which best describes your organization\'s focus when developing product offerings?',
      options: [
        'Product offerings and processes are internally focused, with little analysis of customer needs.',
        'The organization begins to use basic surveys or market research to understand preferences and pain points.',
        'A seamless, "omni-first" approach ensures consistent product offerings across all channels.',
        'Predictive analytics are used to anticipate consumer behavior and market shifts proactively.',
        'The organization actively adapts its strategies based on evolving trends to drive competitive advantage.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'customer',
      text: 'How proactive is the organization in responding to market trends?',
      options: [
        'Responses are purely reactive, addressing customer issues only as they escalate.',
        'Basic research is used to identify pain points, though strategic shifts remain slow.',
        'The customer journey is prioritized during redesign efforts to ensure consistent delivery.',
        'AI-driven predictive insights allow for proactive adjustments to offerings and market strategy.',
        'Transformation is fundamentally reimagined to capture customer value and lead market dynamics.',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'customer',
      text: 'To what extent are data and technology used to personalize the customer experience?',
      options: [
        'Limited analysis of customer needs exists; offerings remain static and internally driven.',
        'Surveys and basic data provide a baseline understanding, but personalization is minimal.',
        '"Omni-first" strategies ensure a unified customer experience across all physical and digital channels.',
        'Predictive analytics anticipate behavior, allowing for highly targeted and personalized recommendations.',
        'Continuous innovation based on real-time feedback creates a customer-first operating model.',
      ],
    },
  ],
};

export default config;

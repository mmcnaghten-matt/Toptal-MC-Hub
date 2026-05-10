import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'ai-maturity',
  scoreDisplay: 'normalized' as const,
  title: 'AI Maturity Checkup',
  description: 'Assess your organization\'s AI readiness across six critical pillars and receive a personalized transformation roadmap.',
  dimensions: [
    { id: 'strategy', label: 'AI Strategy & Vision', shortName: 'Strategy', description: 'Establishing a clear, value-driven AI roadmap that is meticulously aligned with overarching business objectives and continuously adapts to market dynamics.' },
    { id: 'data', label: 'Data & Technology Foundation', shortName: 'Data & Tech', description: 'Building robust, scalable data infrastructure and technology platforms that are essential for efficient AI development, reliable deployment, and continuous operation.' },
    { id: 'development', label: 'AI Solution Development & Deployment', shortName: 'Development', description: 'Iterative design, building, testing, and scaling of AI solutions, transitioning effectively from initial proofs of concept (POCs) to robust, enterprise-wide integrations.' },
    { id: 'talent', label: 'Operating Model, Organization & Talent', shortName: 'Talent & Org', description: 'Designing AI-compatible organizational structures, fostering widespread AI literacy, and strategically developing the necessary talent to drive and sustain AI initiatives.' },
    { id: 'governance', label: 'Responsible AI & Governance', shortName: 'Responsible AI', description: 'Ensuring ethical, fair, transparent, and accountable AI development and deployment, thereby mitigating risks and building enduring trust with all stakeholders.' },
    { id: 'change', label: 'Transformation & Change Management', shortName: 'Change Mgmt', description: 'Orchestrating enterprise-wide AI adoption, effectively overcoming resistance to change, and fostering a pervasive culture of continuous innovation and improvement.' },
  ],
  questions: [
    // Pillar 1: AI Strategy & Vision
    {
      id: 'p1q1',
      dimension: 'strategy',
      text: 'How well-defined is your organization\'s AI strategy?',
      options: [
        'No formal AI strategy exists',
        'AI strategy is informal or ad-hoc',
        'AI strategy is documented but not widely adopted',
        'AI strategy is clearly defined, aligned with business goals, and actively driving decisions',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'To what extent is AI integrated into your overall business strategy?',
      options: [
        'AI is not part of the business strategy',
        'AI is mentioned but not integrated',
        'AI is partially integrated into some business units',
        'AI is a core component of the enterprise-wide business strategy',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'How does leadership support and champion AI initiatives?',
      options: [
        'No executive sponsorship for AI',
        'Limited awareness at leadership level',
        'Some leaders actively support AI projects',
        'C-suite champions AI with dedicated budget, KPIs, and governance',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy',
      text: 'How are AI investments prioritized and measured?',
      options: [
        'No formal prioritization or measurement',
        'Investments are ad-hoc with no clear ROI tracking',
        'Some AI projects have defined KPIs and ROI targets',
        'AI investments are systematically prioritized with clear value metrics and portfolio management',
      ],
    },

    // Pillar 2: Data & Technology Foundation
    {
      id: 'p2q1',
      dimension: 'data',
      text: 'How would you describe the quality and accessibility of your organization\'s data?',
      options: [
        'Data is siloed, inconsistent, and difficult to access',
        'Some data is organized but quality issues persist',
        'Data is generally well-managed with established quality standards',
        'Data is high-quality, well-governed, accessible, and treated as a strategic asset',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'data',
      text: 'How mature is your data infrastructure for supporting AI/ML workloads?',
      options: [
        'No dedicated data infrastructure for AI',
        'Basic infrastructure exists but is not optimized for AI',
        'Cloud-based data platform with some ML tooling in place',
        'Fully cloud-native, scalable data platform with integrated MLOps pipelines',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'data',
      text: 'How is data governance handled across your organization?',
      options: [
        'No formal data governance framework',
        'Basic policies exist but are inconsistently applied',
        'Data governance is established with defined roles and processes',
        'Comprehensive data governance with automated compliance, lineage tracking, and ethical AI safeguards',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'data',
      text: 'How integrated are your data sources across the enterprise?',
      options: [
        'Data sources are completely siloed',
        'Some integration exists between a few systems',
        'Most major data sources are integrated with a central repository',
        'Enterprise-wide data integration with real-time pipelines and a single source of truth',
      ],
    },

    // Pillar 3: AI Solution Development & Deployment
    {
      id: 'p3q1',
      dimension: 'development',
      text: 'How does your organization approach AI solution development?',
      options: [
        'No AI solutions are being developed',
        'Experimental or proof-of-concept stage only',
        'Some AI solutions are in production with established development processes',
        'AI development follows mature MLOps practices with continuous deployment and monitoring',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'development',
      text: 'How scalable are your AI deployments?',
      options: [
        'AI deployments are not scalable',
        'Limited scalability — solutions work for small-scale use cases',
        'AI solutions can scale within specific business units',
        'AI solutions are designed for enterprise-wide scale with automated scaling and monitoring',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'development',
      text: 'How do you manage AI model performance and lifecycle?',
      options: [
        'No model monitoring or lifecycle management',
        'Manual model monitoring with infrequent updates',
        'Automated monitoring with periodic model retraining',
        'Continuous model monitoring, automated retraining, and A/B testing in production',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'development',
      text: 'How effectively does your organization leverage GenAI and LLMs?',
      options: [
        'No use of GenAI or LLMs',
        'Exploring GenAI through pilots or individual use',
        'GenAI is being used in specific workflows or products',
        'GenAI is strategically integrated across multiple functions with governance and optimization',
      ],
    },

    // Pillar 4: Operating Model, Organization & Talent
    {
      id: 'p4q1',
      dimension: 'talent',
      text: 'How is AI expertise organized within your enterprise?',
      options: [
        'No dedicated AI roles or teams',
        'A few individuals with AI skills, not formally organized',
        'Dedicated AI team or center of excellence exists',
        'AI talent is embedded across business units with a federated model and strong community of practice',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'talent',
      text: 'How would you rate your organization\'s AI talent and skill development?',
      options: [
        'Significant AI skills gap with no training programs',
        'Some training available but limited in scope',
        'Structured AI training and upskilling programs in place',
        'Comprehensive AI literacy across the organization with continuous learning and career development paths',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'talent',
      text: 'How well does your operating model support cross-functional AI collaboration?',
      options: [
        'Siloed teams with no cross-functional collaboration on AI',
        'Limited collaboration — AI teams work in isolation',
        'Some cross-functional teams with defined collaboration processes',
        'Fully integrated, agile operating model with business and AI teams co-creating solutions',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'talent',
      text: 'How prepared is your workforce for AI-driven ways of working?',
      options: [
        'Workforce is largely unaware of AI capabilities',
        'Some awareness but resistance to AI adoption',
        'Workforce is generally receptive with emerging AI-augmented workflows',
        'Workforce actively embraces AI with widespread adoption of AI-assisted tools and processes',
      ],
    },

    // Pillar 5: Responsible AI & Governance
    {
      id: 'p5q1',
      dimension: 'governance',
      text: 'Does your organization have an AI ethics framework or responsible AI policy?',
      options: [
        'No AI ethics framework exists',
        'Informal ethical guidelines are in place',
        'Formal responsible AI policy exists but is not consistently applied',
        'Comprehensive responsible AI framework with dedicated oversight, regular audits, and enforcement',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'governance',
      text: 'How does your organization address AI bias and fairness?',
      options: [
        'AI bias is not actively addressed',
        'Awareness exists but no formal processes',
        'Bias testing is part of the development lifecycle for some projects',
        'Systematic bias detection, mitigation, and monitoring across all AI systems',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'governance',
      text: 'How transparent are your AI systems to stakeholders?',
      options: [
        'AI decision-making is opaque — no explainability efforts',
        'Some documentation exists but limited transparency',
        'Explainability tools are used for key AI models',
        'Full transparency with model cards, explainability reports, and stakeholder communication',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'governance',
      text: 'How does your organization manage AI-related risks and compliance?',
      options: [
        'No AI risk management or compliance framework',
        'Basic risk awareness with no formal processes',
        'AI risk management is integrated into enterprise risk frameworks',
        'Proactive AI risk management with automated compliance monitoring and regulatory readiness',
      ],
    },

    // Pillar 6: Transformation & Change Management
    {
      id: 'p6q1',
      dimension: 'change',
      text: 'How does your organization manage AI-driven change?',
      options: [
        'No formal change management for AI initiatives',
        'Change management is reactive and ad-hoc',
        'Structured change management programs exist for major AI projects',
        'Enterprise-wide change management framework with dedicated teams, communication plans, and feedback loops',
      ],
    },
    {
      id: 'p6q2',
      dimension: 'change',
      text: 'How would you describe the organizational culture toward AI adoption?',
      options: [
        'Resistant to change — AI is seen as a threat',
        'Cautiously open — some pockets of enthusiasm',
        'Generally positive with growing AI awareness and adoption',
        'Innovation-driven culture that embraces AI as a strategic enabler',
      ],
    },
    {
      id: 'p6q3',
      dimension: 'change',
      text: 'How effectively does your organization communicate about AI initiatives?',
      options: [
        'No communication about AI initiatives',
        'Limited communication — mostly within IT or data teams',
        'Regular updates shared across the organization',
        'Proactive, multi-channel communication strategy with clear narratives on AI vision and impact',
      ],
    },
    {
      id: 'p6q4',
      dimension: 'change',
      text: 'How does your organization measure and sustain AI transformation progress?',
      options: [
        'No measurement of AI transformation progress',
        'Basic tracking of AI project milestones',
        'Defined transformation KPIs with periodic reviews',
        'Comprehensive transformation dashboard with real-time tracking, stakeholder engagement metrics, and continuous improvement loops',
      ],
    },
  ],
};

export default config;

import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'workforce-transformation',
  scoreDisplay: 'normalized' as const,
  title: 'Workforce Transformation Maturity Checkup',
  description: 'Assess your organization\'s workforce transformation maturity across five capability pillars and receive a personalized transformation roadmap.',
  dimensions: [
    {
      id: 'organizational',
      label: 'Organizational Transformation',
      shortName: 'Org Transformation',
      description: 'Evolution of organizational structure, talent strategy, and workforce composition from rigid hierarchies to fluid ecosystems.',
    },
    {
      id: 'digital',
      label: 'Digital Workforce Transformation',
      shortName: 'Digital Workforce',
      description: 'Integration of AI, automation, and digital tools to augment human capabilities and streamline workflows.',
    },
    {
      id: 'leadership',
      label: 'Leadership Transformation',
      shortName: 'Leadership',
      description: 'Evolution of leadership styles to guide dispersed, hybrid, and human-AI-augmented workforces.',
    },
    {
      id: 'cultural',
      label: 'Cultural Transformation',
      shortName: 'Culture',
      description: 'Shift toward adaptability, continuous learning, and innovation empowered by psychological safety.',
    },
    {
      id: 'process',
      label: 'Process Transformation',
      shortName: 'Process',
      description: 'Redesign of workflows and operational processes for efficiency, agility, and scalability.',
    },
  ],
  questions: [
    // Pillar 1: Organizational Transformation
    {
      id: 'p1q1',
      dimension: 'organizational',
      text: 'How would you describe your organization\'s current structural design and communication flow?',
      options: [
        'Rigid and hierarchical with strictly top-down, formal communication.',
        'Initial efforts are being made to create cross-functional teams for specific projects.',
        'Standardized organizational structures are in place that formally allow for cross-functional collaboration.',
        'Structures are highly flexible, using data to make informed decisions about team growth and composition.',
        'The organization operates as a fluid ecosystem where talent is dynamically allocated based on real-time needs.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'organizational',
      text: 'What is the primary driver of your workforce planning process?',
      options: [
        'Planning is driven solely by headcount rather than specific capabilities.',
        'Planning ownership is starting to emerge for specific functions like hiring or onboarding.',
        'Workforce strategies are proactive and explicitly aligned with overall business goals.',
        'Advanced analytics and modeling are used to forecast future talent needs and workforce scenarios.',
        'Talent management is a self-sustaining ecosystem where AI pervasively optimizes the workforce.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'organizational',
      text: 'How are roles and responsibilities defined within your teams?',
      options: [
        'Roles are traditional, fixed, and confined to functional silos.',
        'Roles are beginning to be formalized within specific departments but lack enterprise standardization.',
        'Roles are clearly defined and standardized, providing structure without sacrificing agility.',
        'Traditional roles are actively dissolving into fluid, skill-based capabilities.',
        'Roles are highly adaptive, allowing for continuous innovation in workforce strategy.',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'organizational',
      text: 'What is the current maturity of your talent acquisition and retention framework?',
      options: [
        'Talent decisions are highly informal and lack a repeatable framework.',
        'Basic metrics like turnover rates and headcount are tracked on a project-by-project basis.',
        'Formal processes for hiring and onboarding are established and applied consistently.',
        'Quantitative objectives for talent retention and productivity are set and measured.',
        'AI is pervasively integrated into talent management, from hiring to performance optimization.',
      ],
    },

    // Pillar 2: Digital Workforce Transformation
    {
      id: 'p2q1',
      dimension: 'digital',
      text: 'To what extent does a structured digital strategy guide your workforce technology investments?',
      options: [
        'Minimal strategy; technology investments are ad-hoc and not tied to clear business goals.',
        'Gradual adoption in pockets of the business, mainly for basic tasks like email or storage.',
        'Standardized technology platforms support workforce processes across most departments.',
        'Digital execution is systematically integrated to provide predictive insights and support decision-making.',
        'Technology is pervasively integrated, acting as a core enabler of continuous innovation and agility.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'digital',
      text: 'How is data analytics used to manage and optimize your workforce?',
      options: [
        'Reliance on manual, time-consuming processes with minimal data or strategic intent.',
        'Use of basic Business Intelligence (BI) software for pre-defined, static reports.',
        'Self-service analytics tools are available to help integrate data from multiple sources.',
        'AI-driven analytics are used to anticipate future workforce needs and optimize talent acquisition.',
        'Augmented analytics provides automated insights and recommendations to empower all employees.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'digital',
      text: 'How does your organization utilize AI and automation for repetitive tasks?',
      options: [
        'Limited to no use; core processes remain largely manual and prone to human error.',
        'Basic AI assistant apps or off-the-shelf tools are used in isolated productivity pilots.',
        'Tools are adopted for department-specific functions (e.g., Sales or HR) to automate workflows.',
        'AI is leveraged for high-value business productivity use cases across the enterprise.',
        'AI and human capabilities are integrated into a single, cohesive "Human-AI Symbiotic" operating system.',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'digital',
      text: 'How integrated is your current workforce technology landscape?',
      options: [
        'Entrenched legacy systems and hierarchies create significant lags in technology adoption.',
        'Some cloud computing is used, but data typically remains siloed within departments.',
        'Cloud-native SaaS platforms are utilized to improve integration between core departments.',
        'AI-powered tools analyze workforce data enterprise-wide to identify skill gaps.',
        'Digital execution is supported by a self-optimizing culture where IT and business co-create solutions.',
      ],
    },

    // Pillar 3: Leadership Transformation
    {
      id: 'p3q1',
      dimension: 'leadership',
      text: 'Which style best describes your organization\'s primary leadership approach?',
      options: [
        'Hierarchical, command-and-control, and focused primarily on stability.',
        'Founder-led or project-based style where leaders are beginning to delegate responsibilities.',
        'Deliberate effort to professionalize leadership and embed agile principles into daily practice.',
        'Strategic leadership guided by data, measurable outcomes, and external environmental signals.',
        'Leaders proactively disrupt their own business models to drive disruptive innovation.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'leadership',
      text: 'How effectively do your leaders manage and collaborate in a hybrid work environment?',
      options: [
        'Leaders lack the formal skills and frameworks to manage a hybrid workforce effectively.',
        'Leaders understand hybrid challenges but lack structured frameworks for consistent management.',
        'Leaders are formally trained to communicate transparently and foster inclusion in hybrid settings.',
        'Performance in hybrid environments is tracked with quantitative metrics and feedback loops.',
        'A self-organizing style of leadership is intentionally scaled across the entire organization.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'leadership',
      text: 'What is the focus of your current leadership development programs?',
      options: [
        'Training is ad-hoc or nonexistent; leaders rely on legacy command-and-control practices.',
        'Awareness of new leadership needs exists, but development efforts are inconsistent across departments.',
        'Formal programs focus on emotional intelligence, psychological safety, and coaching.',
        'Development is a continuous journey where leadership effectiveness is measured by business impact.',
        'Leadership nurtures a culture where innovation is everyone\'s job and is incentivized at all levels.',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'leadership',
      text: 'How is decision-making handled within your organization?',
      options: [
        'Decision-making is consensus-driven, formal, and often slow.',
        'Rapid, iterative decision-making occurs in pockets but lacks enterprise-wide structure.',
        'Decision-making is proactive and supported by standardized training for AI-augmented teams.',
        'Leaders use a data-driven approach to anticipate scaling challenges and respond swiftly to market shifts.',
        'Leaders build robust systems that withstand rapid growth while maintaining agility and trust.',
      ],
    },

    // Pillar 4: Cultural Transformation
    {
      id: 'p4q1',
      dimension: 'cultural',
      text: 'How does your workforce generally react to organizational change?',
      options: [
        'The culture is rigid and risk-averse; employees often resist change.',
        'Initial efforts are made to communicate the "why" behind change to address employee fears.',
        'The organization has defined core values that guide change management and onboarding.',
        'Data and feedback loops are used to track cultural shifts and course-correct transformation efforts.',
        'The culture is "hardwired" for continuous improvement, innovation, and resilience.',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'cultural',
      text: 'What is your organization\'s approach to employee learning and development?',
      options: [
        'Learning is ad-hoc; there is no formal strategy or dedicated budget for upskilling.',
        'Basic learning opportunities are introduced, but they are often siloed at a project level.',
        'Continuous learning is formally introduced as a top priority with dedicated time and resources.',
        'Learning effectiveness is tracked via metrics and aligned with enterprise strategic aims.',
        'A culture of continuous learning is normalized as part of the daily flow of work.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'cultural',
      text: 'To what degree are employees empowered to experiment and innovate?',
      options: [
        'There is no formal process for experimentation; the culture is characterized by inertia.',
        'High tolerance for risk-taking exists in pockets, but lacks a repeatable framework.',
        'Creativity and adaptability are valued, with employees given autonomy to experiment.',
        '"Citizen-led innovation" is fostered, encouraging grassroots efforts from all employees.',
        'Innovation is the "golden thread" of the organization, driving agile adaptation at scale.',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'cultural',
      text: 'How well is the organizational mission understood and embraced?',
      options: [
        'The organization lacks a defined central mission or clear business value proposition.',
        'Awareness of the mission exists, but employees often feel disconnected from it.',
        'Core values and behaviors are documented and used to reinforce cultural alignment.',
        'Cultural maturity is viewed as a strategic financial imperative linked to talent retention.',
        'The mission is pervasively understood and enables rapid, dynamic response to market shifts.',
      ],
    },

    // Pillar 5: Process Transformation
    {
      id: 'p5q1',
      dimension: 'process',
      text: 'What is the current state of your core business processes and workflows?',
      options: [
        'Processes are manual, ad-hoc, and unpredictable with no defined standards.',
        'Basic process management practices are established on a project level with some consistency.',
        'Processes are formally documented, standardized, and scalable with clear governance.',
        'Processes are rigorously measured and controlled using quantitative methods and analytics.',
        'Processes are continuously monitored and dynamically adapted to evolving business needs.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'process',
      text: 'How does your organization approach process efficiency and automation?',
      options: [
        'Relies on outdated, manual processes prone to significant human error.',
        'Initial efforts are made to streamline processes to reduce bureaucracy and increase speed.',
        'Business Process Reengineering (BPR) is used to fundamentally reshape how work is done.',
        'Performance and behavior analytics are used to identify and remove bottlenecks instantly.',
        'Execution is continuously optimized through pervasive use of AI and automated insights.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'process',
      text: 'How would you describe your organization\'s use of agile methodologies?',
      options: [
        'Operations are linear and reactive; there is no formal use of agile practices.',
        'Agile practices may emerge localized to specific IT or product teams.',
        'Agile and Lean methodologies are adopted into standard practice to streamline workflows.',
        'The organization is data-driven, setting predictable quantitative performance objectives.',
        'Workflows are redesigned for scalability using agile, tech-enabled methods enterprise-wide.',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'process',
      text: 'What is your organization\'s strategy for managing process scaling?',
      options: [
        'Chaos is often confused with agility, leading to massive inefficiencies and burnout.',
        'The focus is on implementing simple, repeatable processes to scale sustainably.',
        'New components are integrated stepwise to avoid large-scale operational disruptions.',
        'Predictive analytics are used to forecast demand and proactively optimize workflows.',
        'The organization is focused on a continuous journey of innovation and process optimization.',
      ],
    },
  ],
};

export default config;

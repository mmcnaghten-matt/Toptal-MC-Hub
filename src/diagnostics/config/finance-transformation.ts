import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'finance-transformation',
  scoreDisplay: 'normalized' as const,
  title: 'Finance Transformation Maturity Checkup',
  description: 'Assess your organization\'s finance function maturity across five capability pillars and receive a personalized transformation roadmap.',
  dimensions: [
    {
      id: 'strategy',
      label: 'Strategy & Vision',
      shortName: 'Strategy',
      description: 'Creating a finance strategy linked to business strategy while leveraging technology-enabled solutions to create value for key stakeholders.',
    },
    {
      id: 'performance',
      label: 'Performance Management',
      shortName: 'Performance',
      description: 'Effectively managing business strategy execution through dynamic goal measurement, stakeholder alignment, advanced analytics, and information-driven decision-making.',
    },
    {
      id: 'process',
      label: 'Process Optimization',
      shortName: 'Process',
      description: 'Optimizing end-to-end finance processes across corporate and business units to meet expectations, deliver understandable information, and solve problems.',
    },
    {
      id: 'organization',
      label: 'Organization & Governance',
      shortName: 'Org & Governance',
      description: 'Assessing in-house capability, building and retaining talent, and creating a target and service delivery model.',
    },
    {
      id: 'data',
      label: 'Data & Technology',
      shortName: 'Data & Tech',
      description: 'Increasing the digital footprint of the finance function to enable smarter, faster execution through modern data architecture and advanced analytics.',
    },
  ],
  questions: [
    // Pillar 1: Strategy & Vision
    {
      id: 'p1q1',
      dimension: 'strategy',
      text: 'Is your finance strategy formally documented and regularly reviewed to ensure explicit alignment with overall business objectives and market trends?',
      options: [
        'No',
        'Partially',
        'Yes',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'strategy',
      text: 'How often is the finance vision and strategy communicated and understood across all levels of the organization, from executive leadership to operational teams?',
      options: [
        'Rarely',
        'Ad-hoc',
        'Annually',
        'Regularly (e.g., quarterly)',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'strategy',
      text: 'Is finance consistently perceived by other departments as a strategic business partner actively driving profitability and growth, or primarily as a cost center?',
      options: [
        'Cost Center',
        'Mixed',
        'Strategic Partner',
      ],
    },
    {
      id: 'p1q4',
      dimension: 'strategy',
      text: 'Do you have a clear, prioritized finance transformation roadmap that identifies dependencies, sets realistic timelines, and has secured formal leadership buy-in and resource allocation?',
      options: [
        'No, ad-hoc planning',
        'Partially defined',
        'Yes, fully defined',
      ],
    },
    {
      id: 'p1q5',
      dimension: 'strategy',
      text: 'Are there clear linkages established between your strategic finance objectives, information needs, dashboards, and Key Performance Indicators (KPIs)?',
      options: [
        'Limited linkages',
        'Some linkages',
        'Yes, clear linkages',
      ],
    },
    {
      id: 'p1q6',
      dimension: 'strategy',
      text: 'To what extent does your finance strategy proactively incorporate predictive insights and scenario modeling to anticipate future market shifts and business needs?',
      options: [
        'Not at all',
        'Minimally',
        'Moderately',
        'Extensively',
      ],
    },

    // Pillar 2: Performance Management
    {
      id: 'p2q1',
      dimension: 'performance',
      text: 'Are your budgeting and forecasting processes integrated and largely automated, allowing for driver-based planning and rolling forecasts rather than just annual cycles?',
      options: [
        'Manual & disconnected',
        'Partially integrated',
        'Yes, highly integrated & automated',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'performance',
      text: 'Do you utilize predictive modeling and advanced analytics to inform your financial forecasts and scenario planning?',
      options: [
        'No',
        'Rarely',
        'Sometimes',
        'Yes, extensively',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'performance',
      text: 'Can your finance team deliver comprehensive financial reports and insights within 5 business days of month-end, providing real-time data for strategic decision-making?',
      options: [
        'No',
        'Rarely',
        'Often, but with delays',
        'Yes, consistently',
      ],
    },
    {
      id: 'p2q4',
      dimension: 'performance',
      text: 'Are your management reporting dashboards interactive, standardized, and aligned with strategic KPIs, allowing for drill-down capabilities and proactive insights?',
      options: [
        'No',
        'Basic',
        'Partially',
        'Yes, highly',
      ],
    },
    {
      id: 'p2q5',
      dimension: 'performance',
      text: 'Is there a strong, organization-wide performance-oriented culture where all stakeholders understand and act upon performance insights, and resources are aligned to strategic objectives?',
      options: [
        'No',
        'Limited',
        'Partially',
        'Yes, consistently',
      ],
    },

    // Pillar 3: Process Optimization
    {
      id: 'p3q1',
      dimension: 'process',
      text: 'Are your end-to-end finance processes (e.g., Record to Report, Purchase to Pay) formally documented, standardized, and consistently applied across all relevant business units?',
      options: [
        'No, ad-hoc',
        'Partially',
        'Yes, fully',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'process',
      text: 'To what extent are manual tasks and handoffs eliminated or significantly reduced through automation (RPA, AI, system capabilities) in your core finance processes?',
      options: [
        'Largely manual',
        'Minimal automation',
        'Some automation',
        'Extensively automated',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'process',
      text: 'How often do you experience high error rates, frequent re-work, or significant delays in core finance processes due to manual intervention or fragmented systems?',
      options: [
        'Very often',
        'Often',
        'Sometimes',
        'Rarely',
      ],
    },
    {
      id: 'p3q4',
      dimension: 'process',
      text: 'Is your finance team primarily focused on high-value analytical and strategic tasks, or do they spend a significant portion of their time on repetitive, low-value transactional activities?',
      options: [
        'Low-value focus',
        'Mixed',
        'High-value focus',
      ],
    },
    {
      id: 'p3q5',
      dimension: 'process',
      text: 'Has your organization established a clear "Finance Digital Capability" that actively drives the adoption and optimization of finance technologies?',
      options: [
        'No, not established',
        'No, IT-led',
        'Emerging',
        'Yes, fully established',
      ],
    },

    // Pillar 4: Organization & Governance
    {
      id: 'p4q1',
      dimension: 'organization',
      text: 'Are finance roles, responsibilities, and required skillsets clearly defined, documented, and regularly updated to meet evolving digital and strategic demands?',
      options: [
        'No, unclear',
        'Partially',
        'Yes, fully',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'organization',
      text: 'Does your organization have proactive talent development programs in place to upskill and reskill finance professionals for future strategic and technology-driven roles?',
      options: [
        'No',
        'Limited',
        'Some programs',
        'Yes, comprehensive',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'organization',
      text: 'Are robust governance structures, including comprehensive risk and control frameworks, clear segregation of duties, and well-defined policies, consistently applied across all finance processes?',
      options: [
        'No',
        'Inconsistently',
        'Partially',
        'Yes, consistently',
      ],
    },
    {
      id: 'p4q4',
      dimension: 'organization',
      text: 'Is risk intelligence and compliance embedded directly into your strategic financial planning and operations, or is it primarily addressed as a reactive, regulatory requirement?',
      options: [
        'Afterthought',
        'Reactive',
        'Partially embedded',
        'Embedded & Proactive',
      ],
    },
    {
      id: 'p4q5',
      dimension: 'organization',
      text: 'Do you have an optimized service delivery model (e.g., Shared Service Center, Center of Excellence, outsourcing) that enhances efficiency, leverages economies of scale, and supports global operations?',
      options: [
        'No formal model',
        'Basic',
        'Partially optimized',
        'Yes, optimized',
      ],
    },

    // Pillar 5: Data & Technology
    {
      id: 'p5q1',
      dimension: 'data',
      text: 'Do you have a unified financial data ecosystem that seamlessly integrates all critical business systems (e.g., ERP, CRM, HRIS), providing a single source of truth?',
      options: [
        'Fragmented',
        'Partially unified',
        'Yes, fully unified',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'data',
      text: 'Are robust data governance policies and master data management (MDM) processes in place to ensure data quality, consistency, and integrity across all finance systems?',
      options: [
        'No',
        'Limited',
        'Partially',
        'Yes, fully',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'data',
      text: 'To what extent does your finance function leverage advanced technologies like AI, Machine Learning, and Robotic Process Automation (RPA) for complex tasks, predictive insights, and continuous process optimization?',
      options: [
        'Not at all',
        'Minimally',
        'Moderately',
        'Extensively',
      ],
    },
    {
      id: 'p5q4',
      dimension: 'data',
      text: 'Is your finance technology landscape (ERP, planning, consolidation, dashboarding systems) optimized for performance, scalability, and cloud-native capabilities?',
      options: [
        'No',
        'Outdated',
        'Partially optimized',
        'Yes, highly optimized',
      ],
    },
    {
      id: 'p5q5',
      dimension: 'data',
      text: 'Do your finance systems support advanced analytics capabilities, including descriptive, diagnostic, predictive, and prescriptive analytics, to drive forward-looking decision support?',
      options: [
        'No analytics',
        'Basic reporting only',
        'Some types',
        'All four types',
      ],
    },
  ],
};

export default config;

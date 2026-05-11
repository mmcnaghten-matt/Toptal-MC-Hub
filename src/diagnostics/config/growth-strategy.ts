import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'growth-strategy',
  scoreDisplay: 'normalized' as const,
  title: 'Growth Strategy Maturity Checkup',
  description: 'Assess your organization\'s growth strategy maturity across five capability pillars and receive a personalized growth roadmap.',
  dimensions: [
    {
      id: 'formulation',
      label: 'Growth Strategy Formulation & Vision',
      shortName: 'Strategy & Vision',
      description: 'Identifying opportunities and defining strategic objectives.',
    },
    {
      id: 'intelligence',
      label: 'Market & Customer Intelligence',
      shortName: 'Market Intelligence',
      description: 'Collecting and leveraging data sources for actionable insights.',
    },
    {
      id: 'execution',
      label: 'Execution & Go-to-Market',
      shortName: 'Execution & GTM',
      description: 'Translating insights into actionable tactics and channel expansion.',
    },
    {
      id: 'alignment',
      label: 'Organizational Alignment & Collaboration',
      shortName: 'Org Alignment',
      description: 'Cross-functional working, stakeholder engagement, and resource allocation.',
    },
    {
      id: 'technology',
      label: 'Technology & Innovation Adoption',
      shortName: 'Tech & Innovation',
      description: 'Leveraging advanced analytics, AI, and digital tools for growth.',
    },
  ],
  questions: [
    // Pillar 1: Growth Strategy Formulation & Vision
    {
      id: 'p1q1',
      dimension: 'formulation',
      text: 'How would you describe your organization\'s current process for defining growth objectives?',
      options: [
        'Growth efforts are ad-hoc and reactive, often driven by immediate competitive pressures rather than a framework.',
        'Initial attempts are made to define specific growth targets (e.g., revenue in existing segments), but cross-functional integration is limited.',
        'Growth strategies are clearly defined, aligned with business goals, and utilize SMART objectives.',
        'Strategies are data-driven and dynamic; senior leadership actively uses scenario planning to optimize choices for future market conditions.',
        'Growth strategy is the core operating model; dynamic strategies adapt in real-time to hyper-local market behavior.',
      ],
    },
    {
      id: 'p1q2',
      dimension: 'formulation',
      text: 'To what extent is the organization\'s growth vision shared across departments?',
      options: [
        'Strategic planning is siloed within departments (e.g., sales targets without broader market context).',
        'There is some departmental alignment on goals, but they lack organization-wide standardization.',
        'Objectives are documented and understood across all relevant departments, with regular performance assessments used as benchmarks.',
        'Growth strategy councils involving senior leadership frequently update plans based on external environment signals.',
        'Vision is deeply embedded in organizational culture; the firm acts as a "growth captain," leading collaborative initiatives.',
      ],
    },
    {
      id: 'p1q3',
      dimension: 'formulation',
      text: 'How does your organization identify new market expansion opportunities?',
      options: [
        'Expansion is opportunistic or based on immediate sales needs without a clear strategic roadmap.',
        'The focus is on scaling proven offerings and formalizing acquisition strategies for target segments.',
        'Offerings are tailored to meet customer needs based on validated growth models and prioritized strategies.',
        'Advanced analytics predict market shifts and competitive responses, informing preemptive strategy adjustments.',
        'Pervasive use of AI allows the organization to anticipate disruptions and create new market opportunities ahead of competitors.',
      ],
    },

    // Pillar 2: Market & Customer Intelligence
    {
      id: 'p2q1',
      dimension: 'intelligence',
      text: 'What is the current state of your organization\'s growth-related data integration?',
      options: [
        'Data collection is fragmented and inconsistent, relying heavily on manual reporting and silos.',
        'Basic collection processes exist; internal data is beginning to be integrated with some external sources.',
        'Robust platforms provide a "single source of truth," combining internal sales and customer data with syndicated market data.',
        'Predictive modeling and AI-driven insights are used to anticipate customer behavior and identify cross-sell opportunities.',
        'Data architecture is highly flexible; growth teams use augmented analytics for automated, real-time recommendations.',
      ],
    },
    {
      id: 'p2q2',
      dimension: 'intelligence',
      text: 'How is customer information utilized to inform growth decisions?',
      options: [
        'Information is limited, backward-looking, and gathered through ad-hoc, disconnected surveys.',
        'Basic patterns in consumer behavior are analyzed to help tailor specific products or services.',
        'Self-service analytics tools allow growth strategists to query integrated internal and external customer data directly.',
        'Real-time market insights are integrated into dashboards to provide valuable forecasts and proactive product evolution.',
        'Continuous optimization of performance (e.g., dynamic pricing) is driven by machine learning embedded in the value offering.',
      ],
    },
    {
      id: 'p2q3',
      dimension: 'intelligence',
      text: 'How does your organization handle competitor and market trend analysis?',
      options: [
        'Reliance on intuition or legacy practices with minimal formal process for evaluating competitive intelligence.',
        'Awareness of the need for objective data; basic market assessments are performed on a project-by-project basis.',
        'Competitor analysis is conducted systematically and used to inform growth scorecards with precise targets.',
        'AI-powered tools are used to gauge competitive positioning and identify root causes for acquisition/retention trends.',
        'Automated anomaly detection and alerting provide real-time visibility into competitive growth metrics.',
      ],
    },

    // Pillar 3: Execution & Go-to-Market
    {
      id: 'p3q1',
      dimension: 'execution',
      text: 'How are tactical go-to-market (GTM) decisions made?',
      options: [
        'Decisions are ad-hoc and often based on individual preferences or limited, backward-looking historical sales.',
        'Basic GTM plans are developed with attempts to ensure consistent messaging across some channels.',
        'Decisions are data-driven, considering customer preferences and strategic objectives through clear optimization cycles.',
        'Execution is optimized through advanced models that personalize offerings and dynamically adjust tactics for impact.',
        'Execution is an "adaptive engine" powered by real-time data and AI-driven recommendations.',
      ],
    },
    {
      id: 'p3q2',
      dimension: 'execution',
      text: 'Which best describes your organization\'s approach to pricing and promotions?',
      options: [
        'Pricing is set reactively with little analysis of the competitive landscape or customer elasticity.',
        'Pricing strategies begin to consider competitive positioning and initial market feedback.',
        'Dynamic pricing reflects current market demand, and promotional campaigns are integrated with broader activities.',
        'AI-powered analytics analyze millions of data points to recommend strategies for each specific product and channel.',
        'AI optimizes revenue growth management (RGM) by analyzing demand and pricing to maximize total ROI.',
      ],
    },
    {
      id: 'p3q3',
      dimension: 'execution',
      text: 'To what degree is your growth execution omnichannel-ready?',
      options: [
        'Digital channel presence is not systematically monitored or optimized; execution is fragmented.',
        'Initial efforts are made to understand the omnichannel journey, but execution remains siloed between online and offline.',
        'Omnichannel strategy is fully implemented, catering to unified customer behaviors across all channels.',
        'Organization proactively manages digital presence to win top search slots and optimizes spend using AI insights.',
        'Strategies are inherently omnichannel, harmonizing online and offline experiences to drive incremental revenue uplift.',
      ],
    },

    // Pillar 4: Organizational Alignment & Collaboration
    {
      id: 'p4q1',
      dimension: 'alignment',
      text: 'How effectively do different departments collaborate on growth initiatives?',
      options: [
        'Activities are performed in silos with limited cross-functional communication or interaction.',
        'Begins to involve cross-functional teams in specific projects, recognizing the need for broader input.',
        'Defined roles and responsibilities exist; growth strategies are socialized across marketing, sales, product, and finance.',
        'Senior leadership is actively engaged in growth strategy councils to review and drive the strategic engine.',
        'Collaboration is pervasive; all divisions have real-time visibility and a shared "version of the truth".',
      ],
    },
    {
      id: 'p4q2',
      dimension: 'alignment',
      text: 'How are resources (human and capital) allocated for growth?',
      options: [
        'Resource allocation is ad-hoc, often driven by immediate pressures rather than long-term value.',
        'Basic resources are dedicated to growth, and some communication channels are established between key departments.',
        'Resources are strategically allocated; dedicated teams or resources are in place for strategy implementation.',
        'Joint business planning and shared data sources with partners make resource allocation more efficient.',
        'Highly skilled growth resources are developed as a core group to support both customers and internal teams.',
      ],
    },
    {
      id: 'p4q3',
      dimension: 'alignment',
      text: 'To what extent does your organization engage with external partners for growth?',
      options: [
        'Engagement with external partners (e.g., investors, early customers) is informal and reactive.',
        'Recognizes the importance of collaboration with early partners for mutual success.',
        'Fosters strong partnerships with key customers, aligning goals and working toward joint growth initiatives.',
        'Collaboration extends to joint business planning with shared information sources for collaborative decisions.',
        'Acts as a strategic partner to suppliers and customers, driving innovation within the entire ecosystem.',
      ],
    },

    // Pillar 5: Technology & Innovation Adoption
    {
      id: 'p5q1',
      dimension: 'technology',
      text: 'What is the current maturity of technology adoption for growth processes?',
      options: [
        'Technology adoption is minimal, often limited to basic spreadsheets or legacy systems; processes are manual.',
        'Simple BI software for predefined reports is in place, but lacks dynamic optimization capabilities.',
        'Standardized technology platforms are established; growth strategists have access to self-service analytics.',
        'Advanced analytics and AI are systematically integrated for real-time monitoring, forecasting, and optimization.',
        'AI-powered growth management is the core operating model; innovation and resilience are driven by AI heavy-lifting.',
      ],
    },
    {
      id: 'p5q2',
      dimension: 'technology',
      text: 'How are AI and machine learning (ML) used in your growth strategy?',
      options: [
        'Little to no integration of advanced analytics or AI; technology is not a primary focus for growth.',
        'The organization recognizes the need for faster insights and may experiment with basic ML models informally.',
        'Visual data preparation tools and natural language search are used to derive insights independently.',
        'AutoML is employed for forecasting and cluster analysis; ML infrastructure allows for automated root cause diagnosis.',
        'ML infrastructure is in place to disrupt business models in novel ways; pervasive ML optimizes systems continuously.',
      ],
    },
    {
      id: 'p5q3',
      dimension: 'technology',
      text: 'To what extent are data and analytics accessible to growth strategy teams?',
      options: [
        'Data is siloed, making it challenging for teams to identify trends or make informed decisions.',
        'Teams recognize the bottleneck created by central IT-driven analytics and start exploring digital analytics.',
        'Unified platforms integrate data from various channels (sales, marketing, service) for ad-hoc business exploration.',
        'Real-time spend analysis and performance metrics are delivered through AI-driven dashboards for immediate adjustment.',
        'Augmented analytics provide automated insights across all customer touchpoints, from HQ to sales channels.',
      ],
    },
  ],
};

export default config;

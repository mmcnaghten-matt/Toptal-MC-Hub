import type { DiagnosticConfig } from '../types';

const config: DiagnosticConfig = {
  slug: 'me-platform',
  scoreDisplay: 'normalized' as const,
  title: 'M&E Platform Maturity Diagnostic',
  description: 'Assess your organization\'s readiness to transition from a linear media model to an optimized multi-sided platform across six critical pillars.',
  dimensions: [
    { id: 'ecosystem', label: 'Ecosystem Strategy & Orchestration', shortName: 'Ecosystem' },
    { id: 'data',      label: 'Data Mastery',                       shortName: 'Data Mastery' },
    { id: 'content',   label: 'Content Lifecycle & AI Augmentation', shortName: 'Content & AI' },
    { id: 'monetization', label: 'Monetization & Value Capture',    shortName: 'Monetization' },
    { id: 'architecture', label: 'Architecture & Interoperability', shortName: 'Architecture' },
    { id: 'governance',   label: 'Governance, Trust & Community',   shortName: 'Governance' },
  ],
  questions: [
    // Pillar 1: Ecosystem Strategy & Orchestration
    {
      id: 'p1q1', dimension: 'ecosystem',
      text: 'Does your strategy explicitly identify and connect two or more distinct, interdependent user groups (e.g., creators and advertisers)?',
      options: ['No, unclear', 'Partially', 'Yes, fully'],
    },
    {
      id: 'p1q2', dimension: 'ecosystem',
      text: 'To what extent do you utilize strategic subsidies (e.g., free access for one side) to solve the "chicken-and-egg" problem and reach critical mass?',
      options: ['Not at all', 'Minimally', 'Moderately', 'Extensively'],
    },
    {
      id: 'p1q3', dimension: 'ecosystem',
      text: 'How do you monitor and manage network effects (both same-side and cross-side)?',
      options: ['No awareness', 'Ad-hoc', 'Qualitative awareness', 'Quantitative tracking'],
    },
    {
      id: 'p1q4', dimension: 'ecosystem',
      text: 'How would you describe your current growth model?',
      options: ['Low-value focus (Linear)', 'Mixed', 'High-value focus (Ecosystem-Led)'],
    },
    {
      id: 'p1q5', dimension: 'ecosystem',
      text: 'Does leadership act as a "Chief Inspiration Officer" by defining global platform standards and orchestrating a complex partner ecosystem?',
      options: ['No', 'Basic', 'Partially', 'Yes, highly'],
    },

    // Pillar 2: Data Mastery
    {
      id: 'p2q1', dimension: 'data',
      text: 'How would you describe the integration of your data across different business units?',
      options: ['Fragmented', 'Partially unified', 'Yes, fully unified'],
    },
    {
      id: 'p2q2', dimension: 'data',
      text: 'To what degree is your data architecture "cloud-native" with automated ETL pipelines?',
      options: ['No, not established', 'Siloed Technical Delivery (e.g., pipelines may exist but aren\'t unified across the business)', 'Emerging', 'Yes, fully established'],
    },
    {
      id: 'p2q3', dimension: 'data',
      text: 'Does your organization utilize "Digital Twin" modeling or real-time streaming (e.g., Kafka) for operational optimization?',
      options: ['Afterthought', 'Reactive', 'Partially embedded', 'Embedded & Proactive'],
    },
    {
      id: 'p2q4', dimension: 'data',
      text: 'How are AI/ML models utilized in your core operations?',
      options: ['Not at all', 'Experimental', 'Some models (MLOps)', 'Pervasive & Optimized'],
    },
    {
      id: 'p2q5', dimension: 'data',
      text: 'Does your data governance address ethical AI, bias mitigation, and lineage tracking?',
      options: ['No', 'Limited', 'Some programs', 'Yes, comprehensive'],
    },

    // Pillar 3: Content Lifecycle & AI Augmentation
    {
      id: 'p3q1', dimension: 'content',
      text: 'Do you provide "Innovation Toolkits" (e.g., semi-finished dev models) that allow users to create and share content on your platform?',
      options: ['No', 'Partially', 'Yes'],
    },
    {
      id: 'p3q2', dimension: 'content',
      text: 'How frequently is Generative AI used to augment creative strategy or automate routine production tasks?',
      options: ['Rarely', 'Ad-hoc', 'Annually', 'Regularly'],
    },
    {
      id: 'p3q3', dimension: 'content',
      text: 'To what extent has AI-driven content discovery replaced traditional search-based discovery on your platform?',
      options: ['Not at all', 'Minimally', 'Moderately', 'Extensively'],
    },
    {
      id: 'p3q4', dimension: 'content',
      text: 'Are your content assets modular and tagged to enable cross-platform reuse and personalization?',
      options: ['No', 'Rarely', 'Often, but with delays', 'Consistently'],
    },
    {
      id: 'p3q5', dimension: 'content',
      text: 'Do you have automated systems for real-time translation and accessibility to scale content globally?',
      options: ['No formal model', 'Basic', 'Partially optimized', 'Yes, optimized'],
    },

    // Pillar 4: Monetization & Value Capture Systems
    {
      id: 'p4q1', dimension: 'monetization',
      text: 'Do you employ "asymmetric pricing" (charging the "money side" to subsidize the "subsidy side")?',
      options: ['No, unclear', 'Partially', 'Yes, fully'],
    },
    {
      id: 'p4q2', dimension: 'monetization',
      text: 'How would you characterize your marketing and measurement maturity?\n1. Basic Reporting — manually tracking simple, siloed metrics.\n2. KPI-Driven Monitoring — standardized KPIs for departmental performance.\n3. Closed-Loop Measurement — linking advertising exposure to first-party sales data.\n4. Predictive Attribution — using ML to forecast ROI and price elasticity.',
      options: ['No analytics', 'Basic reporting only', 'Some types (2-3)', 'All four types'],
    },
    {
      id: 'p4q3', dimension: 'monetization',
      text: 'Do you provide creators with "Digital Equity" (transparent data they can use for business loans/collateral)?',
      options: ['No', 'Partially', 'Yes'],
    },
    {
      id: 'p4q4', dimension: 'monetization',
      text: 'How frequently do you use predictive modeling to manage churn and dynamic price elasticity?',
      options: ['Rarely', 'Ad-hoc', 'Annually', 'Regularly'],
    },
    {
      id: 'p4q5', dimension: 'monetization',
      text: 'Is your platform capable of real-time price optimization based on VUCA market signals?',
      options: ['Afterthought', 'Reactive', 'Partially embedded', 'Embedded & Proactive'],
    },

    // Pillar 5: Architecture & Technological Interoperability
    {
      id: 'p5q1', dimension: 'architecture',
      text: 'Is your technology stack based on an "Open Digital Architecture" with standardized, external-facing APIs?',
      options: ['No, not established', 'Internal-facing only (e.g., the stack exists but lacks the "Open" nature required for ecosystem partners)', 'Emerging', 'Yes, fully established'],
    },
    {
      id: 'p5q2', dimension: 'architecture',
      text: 'How would you describe your infrastructure\'s ability to recover from threats or scale capacity?',
      options: ['No formal model', 'Basic', 'Partially optimized', 'Yes, optimized (Self-healing)'],
    },
    {
      id: 'p5q3', dimension: 'architecture',
      text: 'Do you have a dedicated "Platform Center of Excellence" (COE) to oversee architecture and standards?',
      options: ['No', 'Partially', 'Yes'],
    },
    {
      id: 'p5q4', dimension: 'architecture',
      text: 'Does your architecture allow for the coexistence of "competing" tools or modular components from different vendors?',
      options: ['No', 'Rarely', 'Often, but with delays', 'Consistently'],
    },
    {
      id: 'p5q5', dimension: 'architecture',
      text: 'To what extent have you implemented "Zero-touch automation" to reduce operational costs?',
      options: ['Not at all', 'Minimally', 'Moderately', 'Extensively'],
    },

    // Pillar 6: Governance, Trust & Community
    {
      id: 'p6q1', dimension: 'governance',
      text: 'Do you utilize "Meta-moderation" to allow the community to participate in content (de)legitimation?',
      options: ['No', 'Partially', 'Yes'],
    },
    {
      id: 'p6q2', dimension: 'governance',
      text: 'Is your platform governance adaptive enough to handle emerging technologies like blockchain for royalty distribution?',
      options: ['Afterthought', 'Reactive', 'Partially embedded', 'Embedded & Proactive'],
    },
    {
      id: 'p6q3', dimension: 'governance',
      text: 'How integrated is your community data with your core CRM and business strategy?',
      options: ['Fragmented', 'Partially unified', 'Yes, fully unified'],
    },
    {
      id: 'p6q4', dimension: 'governance',
      text: 'Does leadership prioritize "Digital Equity" and responsible AI standards as part of the brand\'s trust mandate?',
      options: ['No', 'Basic', 'Partially', 'Yes, highly'],
    },
    {
      id: 'p6q5', dimension: 'governance',
      text: 'How would you describe the moderation of content on your social channels?',
      options: ['Ad-hoc', 'Reactive', 'Proactive', 'Strategic & Automated'],
    },
  ],
};

export default config;

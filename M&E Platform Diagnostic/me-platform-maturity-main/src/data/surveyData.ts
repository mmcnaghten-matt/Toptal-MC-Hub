export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface Pillar {
  id: number;
  name: string;
  shortName: string;
  focus: string;
  description: string;
  questions: Question[];
}

export interface SurveyRecord {
  id?: string;
  name: string;
  enterprise: string;
  department: string;
  role: string;
  email: string;
  responses: Record<string, number>; // questionId -> option index (0-based)
  pillarScores: number[];
  completedAt: string;
  recommendations?: string;
}

export const EXECUTIVE_SUMMARY = `The media and entertainment (M&E) sector is undergoing a profound shift from traditional, linear "reseller" models to complex, multi-sided platform (MSP) architectures. This change is driven by the decline of legacy revenue streams (e.g., physical media, print ads) and the rise of hyper-capitalized digital ecosystems (YouTube, TikTok, Roblox) that leverage network effects.

This Maturity Diagnostic Model helps M&E organizations assess their readiness across six pillars: Ecosystem Strategy, Data Mastery, Content Innovation, Monetization Systems, Architecture Interoperability, and Community Governance. It identifies gaps between the current state and an optimized future.

The model defines five progressive maturity levels, from Level 1 (Foundational/reactive/siloed) to Level 5 (Optimized & Adaptive), where genAI and ML create a "proactive intelligent platform."

Successful platformization requires a fundamental business logic shift: from controlling a proprietary supply chain to orchestrating a decentralized ecosystem of creators, consumers, and advertisers. Organizations failing to advance risk "digital Darwinism" due to lack of scale and data agility. Those that progress can achieve exponential growth, reduce costs through human-AI collaboration, and build "digital equity" via transparent relationships.`;

export const pillars: Pillar[] = [
  {
    id: 1,
    name: "Ecosystem Strategy & Orchestration",
    shortName: "Ecosystem Strategy",
    focus: "Evaluating the shift from a linear \"pipe\" to a modular ecosystem that manages interdependencies between creators, consumers, and advertisers to drive network effects.",
    description: "This pillar evaluates an organization's shift from a linear, one-way communication model to a modular, multi-sided ecosystem strategy. The core mechanism of this transition involves the identification of \"complementary\" user groups and the management of \"interdependencies\" that drive network effects. Historically, media firms were resellers who took on all the financial risk of content production; in the platform model, this risk is mitigated by enabling direct interactions between producers and consumers, allowing the platform to remain \"immune\" when specific products fail.",
    questions: [
      {
        id: "p1q1",
        text: "Does your strategy explicitly identify and connect two or more distinct, interdependent user groups (e.g., creators and advertisers)?",
        options: ["Yes, fully", "Partially", "No, unclear"]
      },
      {
        id: "p1q2",
        text: "To what extent do you utilize strategic subsidies (e.g., free access for one side) to solve the \"chicken-and-egg\" problem and reach critical mass?",
        options: ["Extensively", "Moderately", "Minimally", "Not at all"]
      },
      {
        id: "p1q3",
        text: "How do you monitor and manage network effects (both same-side and cross-side)?",
        options: ["Quantitative tracking", "Qualitative awareness", "Ad-hoc", "No awareness"]
      },
      {
        id: "p1q4",
        text: "How would you describe your current growth model?",
        options: ["High-value focus (Ecosystem-Led)", "Mixed", "Low-value focus (Linear)"]
      },
      {
        id: "p1q5",
        text: "Does leadership act as a \"Chief Inspiration Officer\" by defining global platform standards and orchestrating a complex partner ecosystem?",
        options: ["Yes, highly", "Partially", "Basic", "No"]
      }
    ]
  },
  {
    id: 2,
    name: "Data Mastery",
    shortName: "Data Mastery",
    focus: "Assessing the use of integrated data pipelines and AI to move from reactive reporting to proactive, intelligent decision-making.",
    description: "Data mastery involves the use of analytics and AI to generate micro-insights that drive efficiency and new business opportunities. In the M&E context, the transition from basic reporting to \"data intelligence\" is a defining characteristic of maturity. Organizations often start with \"high data debt\"—low-quality, siloed data with no accurate metadata—which leads to high failure rates in AI projects (estimated between 30% and 80%).",
    questions: [
      {
        id: "p2q1",
        text: "How would you describe the integration of your data across different business units?",
        options: ["Yes, fully unified", "Partially unified", "Fragmented"]
      },
      {
        id: "p2q2",
        text: "To what degree is your data architecture \"cloud-native\" with automated ETL pipelines?",
        options: ["Yes, fully established", "Emerging", "Siloed Technical Delivery (e.g., pipelines may exist but aren't unified across the business)", "No, not established"]
      },
      {
        id: "p2q3",
        text: "Does your organization utilize \"Digital Twin\" modeling or real-time streaming (e.g., Kafka) for operational optimization?",
        options: ["Embedded & Proactive", "Partially embedded", "Reactive", "Afterthought"]
      },
      {
        id: "p2q4",
        text: "How are AI/ML models utilized in your core operations?",
        options: ["Pervasive & Optimized", "Some models (MLOps)", "Experimental", "Not at all"]
      },
      {
        id: "p2q5",
        text: "Does your data governance address ethical AI, bias mitigation, and lineage tracking?",
        options: ["Yes, comprehensive", "Some programs", "Limited", "No"]
      }
    ]
  },
  {
    id: 3,
    name: "Content Lifecycle & AI Augmentation",
    shortName: "Content & AI",
    focus: "Evaluating the evolution of content from centralized production to a collaborative \"Human-AI\" loop that empowers a decentralized ecosystem of creators.",
    description: "This pillar assesses the evolution of content creation, management, and distribution. Maturity is marked by a shift from centralized, proprietary strategy to a collaborative \"Human-AI\" content innovation loop. GenAI acts as a force multiplier, transforming up to 50% of working hours by automating routine tasks and augmenting creative strategy.",
    questions: [
      {
        id: "p3q1",
        text: "Do you provide \"Innovation Toolkits\" (e.g., semi-finished dev models) that allow users to create and share content on your platform?",
        options: ["Yes", "Partially", "No"]
      },
      {
        id: "p3q2",
        text: "How frequently is Generative AI used to augment creative strategy or automate routine production tasks?",
        options: ["Regularly", "Annually", "Ad-hoc", "Rarely"]
      },
      {
        id: "p3q3",
        text: "To what extent has AI-driven content discovery replaced traditional search-based discovery on your platform?",
        options: ["Extensively", "Moderately", "Minimally", "Not at all"]
      },
      {
        id: "p3q4",
        text: "Are your content assets modular and tagged to enable cross-platform reuse and personalization?",
        options: ["Consistently", "Often, but with delays", "Rarely", "No"]
      },
      {
        id: "p3q5",
        text: "Do you have automated systems for real-time translation and accessibility to scale content globally?",
        options: ["Yes, optimized", "Partially optimized", "Basic", "No formal model"]
      }
    ]
  },
  {
    id: 4,
    name: "Monetization & Value Capture Systems",
    shortName: "Monetization",
    focus: "Transitioning from one-sided revenue models (like simple subscriptions) to sophisticated \"asymmetric pricing\" that captures value from all participants.",
    description: "Monetization in MSPs is notoriously difficult because \"one size fits all\" solutions do not exist. Maturity involves transitioning from simple subscription (SVOD) models to \"asymmetric pricing\" strategies that recognize different user groups have different price sensitivities. A common strategy is to charge the \"money side\" (advertisers or professionals) while subsidizing the \"subsidy side\" (students or general consumers) to maintain network effects.",
    questions: [
      {
        id: "p4q1",
        text: "Do you employ \"asymmetric pricing\" (charging the \"money side\" to subsidize the \"subsidy side\")?",
        options: ["Yes, fully", "Partially", "No, unclear"]
      },
      {
        id: "p4q2",
        text: "How would you characterize your marketing and measurement maturity?\n1. Basic Reporting — manually tracking simple, siloed metrics like historical sales, often relying on spreadsheets with low data trust.\n2. KPI-Driven Monitoring — introducing standardized KPIs to monitor localized departmental performance.\n3. Closed-Loop Measurement — linking advertising exposure directly to first-party sales data for a complete view of the customer journey.\n4. Predictive Attribution — using advanced analytics and ML to forecast future audience preferences, ROI, and price elasticity.",
        options: ["All four types", "Some types (2-3)", "Basic reporting only", "No analytics"]
      },
      {
        id: "p4q3",
        text: "Do you provide creators with \"Digital Equity\" (transparent data they can use for business loans/collateral)?",
        options: ["Yes", "Partially", "No"]
      },
      {
        id: "p4q4",
        text: "How frequently do you use predictive modeling to manage churn and dynamic price elasticity?",
        options: ["Regularly", "Annually", "Ad-hoc", "Rarely"]
      },
      {
        id: "p4q5",
        text: "Is your platform capable of real-time price optimization based on VUCA market signals?",
        options: ["Embedded & Proactive", "Partially embedded", "Reactive", "Afterthought"]
      }
    ]
  },
  {
    id: 5,
    name: "Architecture & Technological Interoperability",
    shortName: "Architecture",
    focus: "Measuring the move from rigid, on-premise silos to an \"Open Digital Architecture\" (ODA) that supports zero-touch automation and rapid partner integration.",
    description: "The technology pillar focuses on the transition to a \"Cloud-Edge Continuum\" where systems, devices, and components from different vendors work seamlessly together. Legacy media often suffers from \"centralized command\" and one-size-fits-all IT departments that hinder the speed and scope of innovation required for an accelerating world.",
    questions: [
      {
        id: "p5q1",
        text: "Is your technology stack based on an \"Open Digital Architecture\" with standardized, external-facing APIs?",
        options: ["Yes, fully established", "Emerging", "Internal-facing only (e.g., the stack exists but lacks the \"Open\" nature required for ecosystem partners)", "No, not established"]
      },
      {
        id: "p5q2",
        text: "How would you describe your infrastructure's ability to recover from threats or scale capacity?",
        options: ["Yes, optimized (Self-healing)", "Partially optimized", "Basic", "No formal model"]
      },
      {
        id: "p5q3",
        text: "Do you have a dedicated \"Platform Center of Excellence\" (COE) to oversee architecture and standards?",
        options: ["Yes", "Partially", "No"]
      },
      {
        id: "p5q4",
        text: "Does your architecture allow for the coexistence of \"competing\" tools or modular components from different vendors?",
        options: ["Consistently", "Often, but with delays", "Rarely", "No"]
      },
      {
        id: "p5q5",
        text: "To what extent have you implemented \"Zero-touch automation\" to reduce operational costs?",
        options: ["Extensively", "Moderately", "Minimally", "Not at all"]
      }
    ]
  },
  {
    id: 6,
    name: "Governance, Trust & Community",
    shortName: "Governance",
    focus: "Assessing the platform's role as a \"regulator\" that fosters \"social-first\" communities through transparent rules, trust, and inclusivity.",
    description: "This pillar evaluates the organization's capability for \"meta-moderation\" and the management of \"social-first\" communities. As platforms grow, the institution's role shifts from a \"gatekeeper\" to a \"regulator\" that sets the rules for fair interaction. Trust is a crucial aspect; users must believe that the counterpart's quality standards are up to par.",
    questions: [
      {
        id: "p6q1",
        text: "Do you utilize \"Meta-moderation\" to allow the community to participate in content (de)legitimation?",
        options: ["Yes", "Partially", "No"]
      },
      {
        id: "p6q2",
        text: "Is your platform governance adaptive enough to handle emerging technologies like blockchain for royalty distribution?",
        options: ["Embedded & Proactive", "Partially embedded", "Reactive", "Afterthought"]
      },
      {
        id: "p6q3",
        text: "How integrated is your community data with your core CRM and business strategy?",
        options: ["Yes, fully unified", "Partially unified", "Fragmented"]
      },
      {
        id: "p6q4",
        text: "Does leadership prioritize \"Digital Equity\" and responsible AI standards as part of the brand's trust mandate?",
        options: ["Yes, highly", "Partially", "Basic", "No"]
      },
      {
        id: "p6q5",
        text: "How would you describe the moderation of content on your social channels?",
        options: ["Strategic & Automated", "Proactive", "Reactive", "Ad-hoc"]
      }
    ]
  }
];

export const MATURITY_LEVELS = [
  { level: 1, name: "Foundational", title: "The Linear Pipe", description: "Operates as a one-way reseller. High risk of \"Digital Darwinism\" due to siloed data and manual processes." },
  { level: 2, name: "Developing", title: "The Active Experimenter", description: "Recognizes platform value but lacks a cohesive strategy. High \"data debt\" and localized digital pilots." },
  { level: 3, name: "Integrated", title: "The Defined Player", description: "Processes are documented and aligned with goals. A \"single source of truth\" exists; cloud-native shifts are underway." },
  { level: 4, name: "Predictive", title: "The Precision Engine", description: "Uses advanced analytics and ML to forecast demand and optimize content. Governance is a strategic capability." },
  { level: 5, name: "Optimized & Adaptive", title: "The Ecosystem Orchestrator", description: "Acts as a proactive intelligent engine. Leverages network effects and AI-human collaboration for exponential growth." }
];

/**
 * Score a pillar based on responses.
 * Each question's options are ordered from most mature to least mature.
 * We map option index to a score, then average across the pillar's questions.
 */
export function scorePillar(pillar: Pillar, responses: Record<string, number>): number {
  const scores: number[] = [];
  
  for (const q of pillar.questions) {
    const selectedIndex = responses[q.id];
    if (selectedIndex === undefined) continue;
    
    const optCount = q.options.length;
    // First option = highest maturity (5), last = lowest (1)
    const score = 5 - ((selectedIndex / (optCount - 1)) * 4);
    scores.push(Math.round(score * 10) / 10);
  }
  
  if (scores.length === 0) return 1;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function calculateAllScores(responses: Record<string, number>): number[] {
  return pillars.map(p => scorePillar(p, responses));
}

export const PILLAR_COLORS = [
  "hsl(214, 100%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(352, 83%, 55%)",
  "hsl(187, 85%, 43%)",
];

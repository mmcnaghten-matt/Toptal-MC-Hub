export interface SurveyOption {
  text: string;
  value: number;
}

export interface SurveyQuestion {
  id: string;
  category: string;
  categoryDescription: string;
  question: string;
  options: SurveyOption[];
}

export interface MaturityLevel {
  level: number;
  name: string;
  title: string;
  minScore: number;
  maxScore: number;
  description: string;
  recommendations: string[];
}

export interface BenchmarkCompany {
  name: string;
  score: number;
  color: string;
}

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: "q1",
    category: "Fan Data Foundation",
    categoryDescription: "Building a unified view of your audience across all touchpoints enables personalized engagement and reduces reliance on third-party platforms.",
    question: "How does your organization currently collect and unify fan/audience data?",
    options: [
      { text: "We rely on third-party platforms (social media, broadcasters) with minimal first-party data collection.", value: 1 },
      { text: "We collect some first-party data (email sign-ups, app downloads) but it's siloed across departments.", value: 3 },
      { text: "We have a unified data platform (CDP or equivalent) that integrates first-party data from multiple touchpoints in real time.", value: 5 },
    ],
  },
  {
    id: "q2",
    category: "Content Personalization",
    categoryDescription: "Delivering tailored experiences increases engagement, loyalty, and conversion by making every fan feel the content speaks directly to them.",
    question: "How personalized is the content experience you deliver to fans/audiences?",
    options: [
      { text: "One-size-fits-all — same content pushed to all audiences across channels.", value: 1 },
      { text: "Basic segmentation — we tailor content for broad audience groups (e.g., by geography or age).", value: 3 },
      { text: "Dynamic personalization — content recommendations, messaging, and offers are tailored to individual preferences and behaviors in real time.", value: 5 },
    ],
  },
  {
    id: "q3",
    category: "Direct-to-Consumer (DTC) Channels",
    categoryDescription: "Owned digital platforms reduce dependency on intermediaries, capture valuable first-party data, and enable direct fan relationships.",
    question: "What is the current state of your direct-to-consumer digital channels (apps, websites, OTT)?",
    options: [
      { text: "We primarily distribute through third parties (broadcasters, social platforms) with limited owned digital presence.", value: 1 },
      { text: "We have owned digital channels but they function mainly as information portals, not engagement or transaction platforms.", value: 3 },
      { text: "Our DTC channels are fully integrated engagement ecosystems — supporting content, commerce, community, and data capture.", value: 5 },
    ],
  },
  {
    id: "q4",
    category: "Monetization Sophistication",
    categoryDescription: "Integrated revenue strategies maximize lifetime value by matching the right offers to the right fans at the right time.",
    question: "How sophisticated is your approach to monetizing fan/audience relationships?",
    options: [
      { text: "Revenue comes primarily from traditional sources (broadcast rights, ticket sales, basic sponsorship).", value: 1 },
      { text: "We've added digital revenue streams (subscriptions, basic e-commerce, digital advertising) but they operate independently.", value: 3 },
      { text: "We have an integrated monetization engine that optimizes revenue across multiple streams (subscriptions, microtransactions, data-driven sponsorship, dynamic pricing) based on fan behavior and lifetime value.", value: 5 },
    ],
  },
  {
    id: "q5",
    category: "Real-Time Engagement",
    categoryDescription: "Interactive experiences during live moments create deeper emotional connections and capture attention when fan enthusiasm peaks.",
    question: "How do you engage fans/audiences during live events or content moments?",
    options: [
      { text: "Engagement is passive — fans consume content with no interactive or real-time component.", value: 1 },
      { text: "We offer some real-time features (live social feeds, basic polls, second-screen experiences) but they're not deeply integrated.", value: 3 },
      { text: "We deliver fully interactive, real-time experiences (live predictions, in-event commerce, synchronized multi-platform engagement) powered by live data.", value: 5 },
    ],
  },
  {
    id: "q6",
    category: "Predictive Analytics & AI",
    categoryDescription: "Data-driven insights anticipate fan needs before they arise, enabling proactive strategy and automated optimization at scale.",
    question: "To what extent do you use predictive analytics or AI to inform fan/audience strategy?",
    options: [
      { text: "We rely on historical reporting and basic dashboards — decisions are largely intuition-driven.", value: 1 },
      { text: "We use some predictive models (churn prediction, content recommendations) but they're not fully integrated into decision-making workflows.", value: 3 },
      { text: "AI and predictive analytics are embedded across the organization — driving content strategy, personalized offers, churn prevention, and revenue optimization in real time.", value: 5 },
    ],
  },
  {
    id: "q7",
    category: "Ecosystem & Partnership Integration",
    categoryDescription: "Seamless partner integrations expand reach and capabilities while creating co-branded experiences that benefit all parties.",
    question: "How integrated is your fan/audience platform with external partners and ecosystem players?",
    options: [
      { text: "Partnerships are transactional and siloed (separate sponsor deals, separate distribution agreements).", value: 1 },
      { text: "Some data sharing and integration exists with key partners but it's manual or batch-processed.", value: 3 },
      { text: "We operate as a platform ecosystem — with API-driven integrations, real-time data exchange with partners, and co-created fan experiences.", value: 5 },
    ],
  },
  {
    id: "q8",
    category: "Organizational Readiness",
    categoryDescription: "Cross-functional alignment ensures fan-centric strategies receive the resources, ownership, and executive support needed to succeed.",
    question: "How is your organization structured to support a fan/audience-centric strategy?",
    options: [
      { text: "Fan/audience data and engagement are managed by individual departments with no cross-functional coordination.", value: 1 },
      { text: "We have some cross-functional initiatives but no dedicated team or unified strategy for fan/audience platform development.", value: 3 },
      { text: "We have a dedicated, cross-functional team (or center of excellence) with clear ownership of the fan/audience platform strategy, supported by executive sponsorship and a defined roadmap.", value: 5 },
    ],
  },
];

export const maturityLevels: MaturityLevel[] = [
  {
    level: 1,
    name: "Foundational",
    title: "The Linear Pipe",
    minScore: 8,
    maxScore: 14,
    description: "Your organization distributes content through traditional, one-way channels with minimal fan data capture or direct engagement. Revenue is concentrated in legacy models. The opportunity to build direct fan relationships is largely untapped.",
    recommendations: [
      "Start building first-party data collection through simple digital touchpoints (email capture, basic app, social engagement tracking).",
      "Audit existing fan touchpoints to identify quick wins for data capture.",
      "Establish a cross-functional working group to define an initial fan data strategy.",
    ],
  },
  {
    level: 2,
    name: "Developing",
    title: "The Active Experimenter",
    minScore: 15,
    maxScore: 22,
    description: "You've begun collecting fan data and experimenting with digital channels, but efforts are fragmented. There's recognition of the opportunity but execution is siloed and inconsistent.",
    recommendations: [
      "Prioritize unifying fan data into a single platform or CDP.",
      "Develop a clear DTC channel strategy — define the role of owned apps/platforms vs. third-party distribution.",
      "Pilot one AI/personalization use case (e.g., content recommendation or targeted email) to demonstrate value.",
    ],
  },
  {
    level: 3,
    name: "Integrated",
    title: "The Defined Player",
    minScore: 23,
    maxScore: 30,
    description: "Your organization has connected data, digital channels, and engagement capabilities into a coherent system. Personalization and monetization are active but still maturing. The foundation is strong — the focus should shift to optimization and scale.",
    recommendations: [
      "Scale personalization from segments to individuals — invest in real-time decisioning engines.",
      "Integrate monetization streams so that fan behavior drives cross-sell and upsell dynamically.",
      "Build partner APIs to enable ecosystem-level data sharing and co-created experiences.",
    ],
  },
  {
    level: 4,
    name: "Predictive",
    title: "The Precision Engine",
    minScore: 31,
    maxScore: 36,
    description: "You're leveraging AI and predictive analytics to anticipate fan needs, optimize revenue, and deliver highly personalized experiences. Your platform operates as an integrated system with data flowing across functions and partners.",
    recommendations: [
      "Push toward real-time, event-driven architecture for instant personalization and engagement.",
      "Develop advanced lifetime value models to prioritize high-value fan segments.",
      "Explore emerging engagement formats (AR/VR, interactive storytelling, tokenized rewards).",
    ],
  },
  {
    level: 5,
    name: "Optimized",
    title: "The Ecosystem Orchestrator",
    minScore: 37,
    maxScore: 40,
    description: "Your organization operates a fully integrated fan/audience ecosystem — with real-time data, AI-driven personalization, dynamic monetization, and seamless partner integrations. You are setting the standard for the industry.",
    recommendations: [
      "Focus on continuous innovation — test emerging technologies and engagement models.",
      "Share your platform capabilities as a competitive advantage in partnership negotiations.",
      "Mentor and set industry benchmarks — your maturity level is a strategic asset.",
    ],
  },
];

export const benchmarkCompanies: BenchmarkCompany[] = [
  { name: "YouTube", score: 39, color: "#FF0000" },
  { name: "Roblox", score: 38, color: "#00A2FF" },
  { name: "Spotify", score: 35, color: "#1DB954" },
  { name: "Disney+", score: 24, color: "#113CCF" },
  { name: "Paramount+", score: 16, color: "#0064FF" },
  { name: "Hulu", score: 15, color: "#1CE783" },
];

export function calculateTotalScore(answers: Record<string, number>): number {
  return Object.values(answers).reduce((sum, val) => sum + val, 0);
}

export function getMaturityLevel(score: number): MaturityLevel {
  return (
    maturityLevels.find((level) => score >= level.minScore && score <= level.maxScore) ||
    maturityLevels[0]
  );
}

export function getMaturityLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: "#EF4444",
    2: "#F97316",
    3: "#EAB308",
    4: "#22C55E",
    5: "#06B6D4",
  };
  return colors[level] || "#6B7280";
}

export function getScoreColor(score: number): string {
  const level = getMaturityLevel(score);
  return getMaturityLevelColor(level.level);
}

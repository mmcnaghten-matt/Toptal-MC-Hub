import { useNavigate } from "react-router-dom";
import { ChevronLeft, Presentation, BookOpen, Network } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import ConstellationDiagram from "@/components/ConstellationDiagram";
import ServiceFinder from "@/components/ServiceFinder";

const definition = {
  title: "Management Consulting Services",
  description:
    "Management Consulting provides organizations with expert advice to solve complex business challenges, improve performance, and drive strategic growth. It often involves diagnosing problems, devising actionable solutions, and implementing strategies to enhance operational efficiency and achieve long-term success.",
  extended:
    "Moreover, management consulting services can operate as an external extension of the client's team, providing ongoing support and specialized expertise.",
};

interface ServiceCategory {
  pillar: string;
  groups: { name: string; services: string[] }[];
}

const servicePortfolio: ServiceCategory[] = [
  {
    pillar: "Strategy",
    groups: [
      {
        name: "Business Strategy",
        services: [
          "Strategic Planning Services",
          "Corporate Strategy Consulting",
          "Growth Strategy Consulting",
          "Go-to-Market (GTM) Consulting",
          "Product Strategy Consulting",
          "Value Creation Consulting",
        ],
      },
      {
        name: "Risk, Compliance & Continuity",
        services: ["Risk Management Consulting", "Risk Assessment Services", "Business Continuity Consulting"],
      },
      {
        name: "Customer & Sales Excellence",
        services: ["Customer Experience Consulting", "Customer Service Consulting"],
      },
      {
        name: "Innovation",
        services: [
          "Digital Strategy Consulting",
          "Innovation Management Consulting",
          "AI Consulting",
          "Responsible AI Consulting",
        ],
      },
      {
        name: "Business Transformation",
        services: [
          "Business Restructuring Services",
          "Business Transformation Consulting Services",
          "Sales Transformation Consulting",
        ],
      },
    ],
  },
  {
    pillar: "Finance",
    groups: [
      {
        name: "Finance & Accounting",
        services: [
          "Finance Transformation Consulting",
          "CFO Consulting",
          "Corporate Finance Consulting",
          "Outsourced Accounting Services",
          "Private Equity Services",
        ],
      },
      {
        name: "Mergers & Acquisitions",
        services: ["M&A Consulting", "Pricing Consulting", "M&A Due Diligence", "Post-Merger Integration Consulting"],
      },
    ],
  },
  {
    pillar: "Operations",
    groups: [
      {
        name: "Operations Improvement",
        services: [
          "Performance Improvement Consulting",
          "Manufacturing Consulting",
          "Supply Chain Consulting",
          "Inventory Management Services",
          "Procurement Consulting",
        ],
      },
    ],
  },
  {
    pillar: "People",
    groups: [
      {
        name: "Organization & Culture",
        services: [
          "Organizational Design Consulting",
          "Workforce Transformation Consulting",
          "Change Management Consulting",
          "Corporate Culture Consulting",
        ],
      },
      {
        name: "Human Resources",
        services: [
          "Human Resources Consulting",
          "Talent Management Consulting",
          "Learning & Development Consulting",
          "Employee Experience Consulting",
        ],
      },
      {
        name: "Leadership Development",
        services: ["Executive Leadership Consulting", "Leadership Development Services"],
      },
      {
        name: "Specialty Services",
        services: ["Project Management Services", "Sustainability Consulting"],
      },
    ],
  },
];

type Practice = "Strategy" | "Finance" | "Operations" | "People";

interface SubRow {
  service: string;
  description?: string;
  docUrl?: string;
  firstCallDeckUrl?: string;
  battlecardUrl?: string;
  sellersSheetUrl?: string;
  maturityModelUrl?: string;
  maturityDiagnosticUrl?: string;
  exampleMaterials?: { label: string; url: string }[];
}

interface GTMRow {
  isHub?: boolean;
  seq?: number;
  practice: Practice;
  service: string;
  docUrl?: string;
  firstCallDeckUrl?: string;
  battlecardUrl?: string;
  sellersSheetUrl?: string;
  maturityModelUrl?: string;
  maturityDiagnosticUrl?: string;
  exampleMaterials?: { label: string; url: string }[];
  description?: string;
  keyBuyers?: string;
  subRows?: SubRow[];
}

const PRACTICE_ORDER: Practice[] = ["Strategy", "Finance", "Operations", "People"];

const gtmMaterials: GTMRow[] = [
  // Strategy
  {
    isHub: true,
    seq: 1,
    practice: "Strategy",
    service: "Strategy & Growth Consulting",
    docUrl: "https://docs.google.com/presentation/d/1lN6S_ESoqT3ZLkBr7w5MP6rsnp8_974nxLIJhenJutk/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1Ilu2WNeBBXj-Y_yEDaipkIkV0cpXUbzh/view?usp=sharing",
    battlecardUrl: "https://docs.google.com/presentation/d/1KQ4jH3CHvMQJ4xYRyBbqsMOBMHaUmznl_20J003HyZc/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/15j8g5YQ7bdnigvMeR1eAgU2K5W9_EZMLG8Xs3OQVySc/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1N8J9ejIBZNJWDf8eYl8vwl1QZB2vLCcI2xCuClEkOsQ/edit",
    maturityDiagnosticUrl: "/diagnostics/growth-strategy",
    exampleMaterials: [
      { label: "DFF Gaming Hub Proposal", url: "https://docs.google.com/presentation/d/1ScpPMjT73PCTxFGBaSMLLQxbKYFn5UnJasKZ_ltNbF4/edit" },
    ],
    description: "Helping to identify and exploit opportunities for expansion, through market penetration, market development, product development, or diversification.",
    keyBuyers: "CEO/President, CGO/CSO, CMO, CSO/Head of Sales, COO, CFO · Heads of Product Development/Innovation · Heads of BUs/Divisions",
    subRows: [
      {
        service: "Go-to-Market",
        docUrl: "https://docs.google.com/presentation/d/1D3Ffyb--yMt82ypsaj4J3Yg68TrZYzraWTyzhYY7SRo/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1BZFtld0jo68AGSexX8OyEWMgVh-6YrnHwAnrxwFt7LQ/edit?usp=sharing",
        exampleMaterials: [
          { label: "Oman Airports Loyalty Pgm", url: "https://docs.google.com/presentation/d/1X8w3PGoG7wk2aQwAGNYgAZobaOEvktDSx_WIys0KrfQ/edit" },
        ],
        description: "Designs and executes strategies to bring new offerings to market, encompassing channel strategy, pricing models, sales enablement, and launch sequencing. A direct enabler of Growth Strategy.",
      },
      {
        service: "Product Strategy",
        docUrl: "https://docs.google.com/presentation/d/1IBYMMdmUUoPtPC2JMkSaa5j4k_xDqsP0aUgw2_UBl74/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/120aiWfiBDeNP-u6aK2Kwi_zzURbWOibt-hJwwC7PdWU/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/19AUSpdMRueIZR70q64dCo6U3IKKbkPHVod6D4t_bIbw/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1Eog-BhkRgRion8wH4jtoFq0TY4XB0LzkYpAu-tBU0_k/edit",
        description: "Embeds strategic rigor into the product development life cycle to minimize risk and maximize successful market entry. Helps businesses define (or revise) their product vision and roadmap to ensure successful product development, launch, and maintenance.",
      },
      {
        service: "Customer Experience",
        docUrl: "https://docs.google.com/presentation/d/1DXkurtN5L74wXcpYM5RjcWHGyvM7kfOgzF6ZIboHKUc/edit?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1318piklJqw05nvPrGhIKWF31hZvzGZMS1VPSS9Q_wKE/edit",
        maturityModelUrl: "https://docs.google.com/document/d/1fXDAZA5Wh0iPQksDPdtLe07SXSbz5khvvU32Wk45axI/edit",
        description: "Improving customer interactions and satisfaction across all touchpoints to enhance brand loyalty and drive business growth.",
      },
    ],
  },
  {
    seq: 3,
    practice: "Strategy",
    service: "Digital Strategy",
    docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/19Bj0TbM74IX5jODeHOBb67gt1FJ4huZY/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/10ZxPCfgqQauZasgHDXjLz8GqQJfsQurkWCxBgjOdpN8/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1b0Bk6P1RFbZ-txYmtDy1Fwk2lmbhyYR2wCgd1_WsKEc/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1wnDErTEgJPRuiTpccdHg8SuSMLBs9BZSku2nzACA074/edit",
    description: "Guiding organizations in leveraging digital technologies to enhance business performance, customer engagement, and operational efficiency.",
    keyBuyers: "CEOs, CIOs, CDOs, COOs · VP/Directors of Digital/IT · Operations Leads · Innovation Heads",
  },
  {
    seq: 4,
    practice: "Strategy",
    service: "AI Consulting",
    docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing",
    battlecardUrl: "https://docs.google.com/presentation/d/1OFm2sxFT9nSD4Oq9Z49sqE07HI4GzB55KvfsL11gFiI/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1WTtIycmf_KpsTwG3cekjtwt20093RMgTpH1MqAaubUs/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/presentation/d/13fppFZa_ke4IVDC6ZDnaQVKG5ANGf428Q-59zBecWhM/edit",
    maturityDiagnosticUrl: "/diagnostics/ai-maturity",
    exampleMaterials: [
      { label: "Adidas AI Innovation", url: "https://docs.google.com/presentation/d/1s-UP0wZ1LvItVCKqGaXaYdLSV0MD_l9nknGmRvKq9pQ/edit" },
      { label: "Zoetis GenAI", url: "https://docs.google.com/presentation/d/1JQitZA2VO5dNF8Zej5YQhYV-r7dVnsSTVZp335jbdfE/edit" },
    ],
    description: "Advising businesses as they develop strategies and plans for, and integrate, artificial intelligence technologies to improve decision-making, automate processes, drive productivity, and enhance experiences.",
    keyBuyers: "CEO/LOB Heads · CFO · COO · CMO · CIO · CDO · CTO · Innovation/Digital Transformation Heads",
    subRows: [
      {
        service: "AI Core - Build AI Capability",
        description: "Builds the foundational talent, data, technology, and operating model that AI governance and value realization depend on — so use cases scale instead of stalling in pilot.",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1JmA7PYRXtgutiT-SC8NJjR2GBCTzDkf3pgsxairbCDQ/edit?usp=drive_link",
        exampleMaterials: [
          { label: "Spectrum Brands Tech, Data & AI Assessment", url: "https://docs.google.com/presentation/d/1_PQBvc4gvP6Jp2pMxfQtepcODqJguMBksHkWaM6SCuI/edit?usp=sharing" },
        ],
      },
      {
        service: "Responsible AI",
        description: "Guiding organizations through the ethical, fair, and secure development, deployment, and operation of AI systems across their entire lifecycle.",
        docUrl: "https://docs.google.com/presentation/d/18TY-uoEWX6pukByM1Bm4DWnLT5pwZljJWg7b37jvAm8/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1-umEX0FqpsufBBuKxudgBe741JC4QtO6n4ZC-4WPBiE/edit",
      },
      {
        service: "AI Value Realization",
        description: "Builds the deterministic scaffolding — workflow baselines, control logic, and data context — that turns AI spend from a faith-based bet into provable, board-ready ROI.",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1Lgz2mOezDzNNiuc_ZoxEyustQ_ZfhLh31CpwGzLKmcQ/edit?usp=sharing",
      },
      {
        service: "AI Governance",
        description: "Guides organizations in building the policies, oversight structures, and technical controls needed to govern AI and agentic systems in production — before risk outpaces the ability to manage it.",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1LYwdQyPJWnihRItB-zyjoWZqbtpPyOsT0_2ft_CWsjM/edit?usp=sharing",
      },
    ],
  },
  {
    isHub: true,
    seq: 2,
    practice: "Strategy",
    service: "Business Transformation and Risk Advisory",
    docUrl: "https://docs.google.com/presentation/d/1Dk3zvl6pwuoew2Y2yi8X3k8gR8owBN5SeK-vNh3Vmf4/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1R-ZpyubSfT3l5ipbbhFkv-dWDClE7Ju8/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1lOGfxA4iMazV9Kfn1tPJH2Q0M4GWJgRpUVBv-p7xI1M/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1kKYqaVQqdZNEbw1q5HxsS-dX3Ce0a-4xdai6QpxnAS8/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1syzt0kO66n6vCgOzasujXt0jDdd4by6LGn_pTngLcrU/edit",
    maturityDiagnosticUrl: "/diagnostics/business-transformation",
    exampleMaterials: [
      { label: "Ricoh 3D Healthcare", url: "https://docs.google.com/presentation/d/1IuixJLDm7pATex8t2t0C23DH5I2BRQIiyDzJn0TtFc0/edit" },
    ],
    description: "Guiding organizations through comprehensive change initiatives to improve performance, competitiveness, and adaptability.",
    keyBuyers: "CEO, COO, CFO · Business Unit Leaders · Chief Transformation Officers · CIO, CDO",
    subRows: [
      {
        service: "Risk Management Services",
        docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1caiz6eH2ZaHU5I75fZGAjD4PWr-I115tudm5OthHFhU/edit",
        description: "Helping organizations identify, assess, and mitigate risks to comply with regulations, protect assets, enhance reputation, ensure business continuity, and drive efficiency.",
      },
    ],
  },
  // Finance
  {
    isHub: true,
    seq: 12,
    practice: "Finance",
    service: "Finance Transformation & CFO Advisory",
    docUrl: "https://docs.google.com/presentation/d/1_incQcSAXJG5faq7hOjorbbjG4IoANs7VQTMg6tZdVk/edit?usp=drive_link",
    firstCallDeckUrl: "https://docs.google.com/presentation/d/1J6iCOBdQUkPiZLMdrYvSRym4spqpXAijxrkFsG6Jr5I/edit?usp=sharing",
    battlecardUrl: "https://docs.google.com/presentation/d/1nqdEB423iDUd3JtPWqTtGZHh-cCia6mm8diZa_14XdY/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1fa7xf7L0V7417A8xEOfXLxhEF3sSchhRQMKhDtGpdsk/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1G1GKXB2YBHC18SLUbK8HT8p88Y5VIOhpz3LAOLxJ33s/edit",
    maturityDiagnosticUrl: "/diagnostics/finance-transformation",
    description: "Helping organizations modernize their finance functions through process improvements, technology adoption, and strategic insights.",
    keyBuyers: "CFOs · Finance Directors · COOs · CIOs · CEOs",
  },
  {
    isHub: true,
    seq: 13,
    practice: "Finance",
    service: "M&A Advisory Services",
    docUrl: "https://docs.google.com/presentation/d/1kDU_9sQZ-wupu53099fIEgRrLSpNyco4uYcuuGBRNFc/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1NQ_tVI2lOSyTEWZHrE6VBnTWRo7RVGL_/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1aXcpZ99MVB45enGGOE4MXXYCTbWfBs_AatmGaoc5aRk/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1XiHzrdbxPXGek7C4jzfrS753wSyQkdFvA3wTdK_XKJs/edit",
    exampleMaterials: [
      { label: "Corning M&A Strategy", url: "https://docs.google.com/presentation/d/1HBLq4Mv2yCbFEdCoM4BMgHAQx7YwPK0cxzNZ-ZmidHs/edit" },
    ],
    description: "Providing strategic advice and support throughout the M&A process — acquisition strategy, target identification, due diligence, and post-merger integration.",
    keyBuyers: "Corporate: C-Suite & Investment Committee, Corporate Development Team · PE: General Partners, Limited Partners, Portfolio Company Management",
  },
  // Operations
  {
    isHub: true,
    seq: 14,
    practice: "Operations",
    service: "Operations & Performance Improvement",
    docUrl: "https://docs.google.com/presentation/d/1bKjSw5MgD5mzLbK-lMtIGoKXOwj09QH7fXRfOB9MLvY/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1y4_Tu_MVGhSq1W4hYgOJP2G5NU3sq77J/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1Gm9I5zaX01X1DlTp6J2eB4G3zE4vcGYxvJ8lwbe6-MM/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1lah0V9ttO_KdMhXPDT2k-6-FaGrPRT9TrYATtVteLI0/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1bQIwVkhYrgvTK-S_jDKZbOCtnjUPsltD6Kndvx92h4A/edit",
    maturityDiagnosticUrl: "/diagnostics/performance-improvement",
    exampleMaterials: [
      { label: "Westcon-Comstor Q2C", url: "https://docs.google.com/presentation/d/11s6nm64OhYbCcMA2ACcM5zHbNGynp0heC0Ve3YEczgs/edit" },
    ],
    description: "Enhancing organizational performance through process optimization, cost reduction, and operational efficiency.",
    keyBuyers: "C-Level Executives (CEOs, COOs, CIOs, CFOs) · Senior Managers (HR, IT, Operations, Marketing) · Board Members · Operational Leaders",
  },
  {
    isHub: true,
    seq: 15,
    practice: "Operations",
    service: "Supply Chain and Procurement Consulting",
    docUrl: "https://docs.google.com/presentation/d/1dn-i3M0XlWLs9t0F3PxIJeaNPIHBV5bluSgaasbaBFY/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1lceoWsWXmrhx_yLjDQTUPnCVcK5DNHdf/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1aIPsWUe1o6CHR-YszRpiwyACLLSw9qzZFCg0ZO7L72Q/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1JLsclhpbRlMiyiEEXGDxHK86azS9ittyOi6GCk-zwPQ/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1eKjYH3O-7GL3NGNFGS9NgcaOGtC0Pz6nvuZ8ZOv0ItA/edit",
    maturityDiagnosticUrl: "/diagnostics/supply-chain",
    description: "Helping organizations optimize their supply chain operations, improve logistics, and enhance overall supply chain performance.",
    keyBuyers: "CEOs, COOs, CFOs · VPs/Directors of Supply Chain/Logistics/Operations · CIOs/CTOs · Chief Sustainability Officers",
  },
  {
    seq: 16,
    practice: "Operations",
    service: "Inventory Management",
    docUrl: "https://docs.google.com/presentation/d/1i-FA39jVjQbCvMZJ-w4gT6A3AN1pEkqrsrNAzW92z_w/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1wAz229F37TvfXVXOdl_nhe4qJGKuaTLW/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1M-v3lAGlMFJlW75tHKN-caTJdexpIKxZSy8q_NoR_Jk/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1UKmZO7LoyNZJQv2yMRlrfZ4voWIR-Qb2koDEnsou2l0/edit",
    description: "Providing strategies and solutions to optimize inventory levels, reduce carrying costs, and improve inventory accuracy.",
    keyBuyers: "COO · CFO · VP of Supply Chain/Operations · Head of Procurement · Warehouse/Logistics Manager · IT Director",
  },
  // People
  {
    isHub: true,
    seq: 17,
    practice: "People",
    service: "Adaptive Organization",
    keyBuyers: "CHRO, CPO, COO, VP of Talent Mgmt · Human Resources",
    subRows: [
      {
        service: "Workforce Transformation",
        docUrl: "https://docs.google.com/presentation/d/11xmJIF7nBPrY596wA3wXRqbmvHXv60q5qwRG4hLUuDo/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1Kvou1MHJWg5lj7HE2_Qy75m4b2IPMtBe99EeOwjPhQ0/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1GjjF_7PxsKckocTSL9rRuVXQaHhpONNyzQAeaxHgspk/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1lIi3-yMadUeoyRvz1oLKwdm5UABWkjedOqSyzTgMN7k/edit",
        maturityDiagnosticUrl: "/diagnostics/workforce-transformation",
        exampleMaterials: [
          { label: "Owens Corning Culture", url: "https://docs.google.com/presentation/d/1guXlLNwMI1KfyJiFQBshjb6xF2pqkDMvWI4Osl9nUUU/edit" },
        ],
        description: "Evolves talent strategy, organizational structure, and culture to meet future business needs.",
      },
    ],
  },
  {
    isHub: true,
    seq: 18,
    practice: "People",
    service: "Leadership & Culture",
  },
  {
    seq: 19,
    practice: "People",
    service: "Change Management",
    docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link",
    firstCallDeckUrl: "https://docs.google.com/presentation/d/1FngvHXpfZN8KrdgkssvFvnLt4XjgHKR1kWTRx8WVNwA/edit?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/12gpn5JP9DiR1GVuNPOQiAM9bBWqhHm4bfY9OPo8ZmLQ/edit",
    exampleMaterials: [
      { label: "PGE Contact Ctr", url: "https://docs.google.com/presentation/d/1ZaMGDXy8YbBrhiRgPBGt__RMbG8OgaLIQAUZzdJKdek/edit" },
    ],
    description: "Supporting organizations in managing change initiatives to ensure smooth transitions and successful adoption of new processes.",
    keyBuyers: "CEOs, COOs, CIOs · CHROs/VPs of HR · Program Directors/PMO · CTOs/IT Directors",
  },
];

interface SalesAsset {
  topic: string;
  type: string;
  document: string;
  url: string;
}

const salesAssets: SalesAsset[] = [
  {
    topic: "AI | Strategy",
    type: "Workshop",
    document: "The Pampered Chef — Agentic AI Workshop",
    url: "https://docs.google.com/presentation/d/1tAran3jQOLfTltEEs8bVwOrCMHDKirPXNgQrBV86SHk/edit",
  },
  {
    topic: "AI | Strategy",
    type: "Discussion Deck",
    document: "3M — Innovating with AI for the Future",
    url: "https://docs.google.com/presentation/d/1kqatY_XWijcVH5N5LqtbxHCGX7j30pqu_tKhVeKfG88/edit",
  },
  {
    topic: "AI | Strategy",
    type: "Discussion Deck",
    document: "Terex — Vision to Impact AI Strategy",
    url: "https://docs.google.com/presentation/d/1RDE-kx1Myli_M7kzvkg7sCf4WeKGxqtH79flqAhitWE/edit",
  },
  {
    topic: "AI | Strategy",
    type: "Discussion Deck",
    document: "Varex Imaging — Introduction to Toptal AI Consulting",
    url: "https://docs.google.com/presentation/d/1wVBVAXwnsvqoh2bueSE3uXfcv7_9LZmZM49416yOzys/edit",
  },
  {
    topic: "AI | Capabilities",
    type: "Workshop",
    document: "Comcast — AI Exec and Team Sessions",
    url: "https://docs.google.com/presentation/d/15Wr6mgNcaxtCk9WlchJ8SUuyWjwcjxMl2f1VkmX_ios/edit",
  },
  {
    topic: "AI | Blueprinting",
    type: "Template",
    document: "AI Blueprinting Template",
    url: "https://docs.google.com/presentation/d/1sTDy0nn7gNsCM3LdoOPu7xxNNfgLvRCD5L10ymvl1ZY/edit",
  },
  {
    topic: "AI | Strategy Approach",
    type: "Approach Document",
    document: "Detailed AI Strategy Approach — AI Consulting Journey",
    url: "https://docs.google.com/presentation/d/1ACgxouyUzG-w-051CT524IwwmQmc9wU-9Y-YuyWy-oA/edit",
  },
  {
    topic: "AI | Use Case Prioritization",
    type: "Template",
    document: "AI Use Case Value Prioritization Matrix",
    url: "https://docs.google.com/document/d/1rpNt0PjxIWr-WVRoci8MZrSHxkkZ69AO5V3z1oTttl4/edit",
  },
  {
    topic: "AI | ROI - Value Realization",
    type: "Discussion Deck",
    document: "Proving AI ROI",
    url: "/ai-roi-value-realization.html",
  },
  {
    topic: "AI | Governance",
    type: "POV",
    document: "Toptal POV - AI & Agentic AI Governance",
    url: "https://docs.google.com/presentation/d/13HaKhiqZQAi0EgWxYGkSeGeO0zSxfOQhWnA17MNgF6w/edit?usp=sharing",
  },
  {
    topic: "AI | Governance",
    type: "POV",
    document: "Toptal - AI Governance Execution for Yara",
    url: "https://docs.google.com/presentation/d/1IC5BX7pyVZFa6RO6GRDKsssQXSIHqQn1qGd8eYPO3fI/edit?usp=drive_link",
  },
  {
    topic: "AI | Governance",
    type: "Discussion Deck",
    document: "Werner - Governing the Agentic Enterprise",
    url: "https://docs.google.com/presentation/d/1_Ie-tOHmn-UmJIgSJLHeAwgCdy3I9vqEUCBg1gD3acM/edit?usp=sharing",
  },
  {
    topic: "AI | Governance",
    type: "Research Briefing",
    document: "Governing the Agentic Enterprise - Prepared for Werner Industries",
    url: "/werner-ai-governance-brief.html",
  },
  {
    topic: "Growth",
    type: "Workshop",
    document: "Access Health — Strategic Health Workshop Design",
    url: "https://docs.google.com/presentation/d/1x9P1Trxf36UyAj4O7R9pdExagyDK45mH9AqeCVNM9Sw/edit",
  },
  {
    topic: "Data Center",
    type: "POV",
    document: "Schneider Electric — Future of the Data Center",
    url: "https://docs.google.com/presentation/d/1zw-nCvzZ1VqzVEVPi13WVZCkTXWjqcOmk81TY0U4SOk/edit",
  },
  {
    topic: "Future Vision",
    type: "Workshop",
    document: "Koch — Visioning Workshop",
    url: "https://docs.google.com/presentation/d/1QquavCVhZftqzMbqgfxa25OQr1BPnrSfU9wcGpTH-b4/edit",
  },
  {
    topic: "Market Research",
    type: "Discussion Deck",
    document: "Corning — HCF Market Research Approach",
    url: "https://docs.google.com/presentation/d/1Gdw_ELr9NEpwIDhbnFgTZoUm73mIKiZUhGXNGiCrGwY/edit",
  },
  {
    topic: "Portfolio Investment Mgmt",
    type: "Approach",
    document: "Koch — Early Stage Investment Framework",
    url: "https://docs.google.com/presentation/d/1s2sz4tBfbC0hrmypOkHbyls6B3sfc0GcsNSjSmtbBg8/edit",
  },
  {
    topic: "Inventory Management",
    type: "Discussion Deck",
    document: "Ricoh Service Advantage — Advancing Inventory Management",
    url: "https://docs.google.com/presentation/d/1sQKoOKH2EoMxmYLijbmmJxp6K33emkx1UaKFABqEdVE/edit",
  },
  {
    topic: "Business Transformation",
    type: "Workshop",
    document: "CAT — Service Transformation Workshop",
    url: "https://docs.google.com/presentation/d/1UIL1XGOPxpkeGQN2ukzPjGDv_4wWP0SLSlpxEWwLyD8/edit",
  },
  {
    topic: "Agile / Product Model",
    type: "Workshop",
    document: "W.W. Wood Products — Agile Transformation Workshop",
    url: "https://docs.google.com/presentation/d/1f65LKiEW3Ju80yPuFZsrl1zSFyDT9bnc3xLpP9O32ws/edit",
  },
  {
    topic: "Cloud Migration",
    type: "Discussion Deck",
    document: "W.W. Wood Products — Application Modernization",
    url: "https://docs.google.com/presentation/d/1aQ6l9hs9-6AKYbtMhw7wH7hrETUVOouZxeStnRrHyz0/edit",
  },
  {
    topic: "Innovation",
    type: "Workshop",
    document: "Schneider Electric Canada — Commercial Innovation Workshop",
    url: "https://docs.google.com/presentation/d/1qQXPXQHCGseS2d4eHNWNwoiXglL-P9xBpqLw8v4G1qI/edit",
  },
];

const pillarColors: Record<string, string> = {
  Strategy: "bg-primary/10 text-primary",
  Finance: "bg-accent text-accent-foreground",
  Operations: "bg-destructive/10 text-destructive",
  People: "bg-muted text-muted-foreground",
};

export default function MCServices() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
                Management Consulting Services
              </h1>
              <p className="text-xs text-primary-foreground/80">Q2 2026 · Confidential</p>
            </div>
          </div>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* Section nav */}
        <nav className="flex gap-2 flex-wrap border-b border-border pb-4">
          {[
            { label: "Introduction", href: "#introduction" },
            { label: "MC Service Offering Finder", href: "#hub-finder" },
            { label: "Services Web", href: "#services-web" },
            { label: "Go-to-Market Materials", href: "#gtm-materials" },
            { label: "Sales Motion Documents", href: "#sales-motion" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Introduction */}
        <section id="introduction" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Introduction</p>
          <h2 className="mb-4 text-2xl font-bold text-card-foreground tracking-tight">{definition.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground mb-3">{definition.description}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{definition.extended}</p>
        </section>

        {/* MC Service Offering Finder */}
        <section id="hub-finder" className="fade-in rounded-lg border border-primary/20 bg-primary/5 p-6 scroll-mt-20">
          <ServiceFinder />
        </section>

        {/* MC Services Web */}
        <section id="services-web" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <div className="grid gap-6 lg:grid-cols-5 items-start">
            <div className="lg:col-span-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Services Web
              </p>
              <h2 className="mb-3 text-2xl font-bold text-card-foreground tracking-tight">
                Management Consulting Services Web
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Individual consulting services are rarely delivered in isolation from one another. However, there are core "Hub" offerings that align to different leaders and buying centers within the typical client organization. The web to the right depicts eight of these core hubs and their relationship with "universal connector services" that are often paired with the Hub offering solution, as well as additional, or secondary, services that are often coupled with the Hub offering. Keep in mind that your initial client conversation may not always start at the "Hub" offering but may ultimately lead you there.
              </p>
              <p className="mt-3 text-xs text-primary">
                Hover to highlight the connections · and click for service details
              </p>
            </div>
            <div className="lg:col-span-3">
              <ConstellationDiagram compact />
            </div>
          </div>
        </section>

        {/* GTM Materials (slide 7) */}
        <section id="gtm-materials" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <div className="mb-4 flex items-center gap-2">
            <Presentation className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Go-to-Market Materials</h2>
          </div>
          <p className="mb-1 text-sm text-muted-foreground">
            Overview decks, battlecards, maturity diagnostic models, and example client materials available per service.
            <br />
            [Click on the blue links - Doc, PDF, Diagnostic, or Example Name - to access GTM material]
          </p>
          <p className="mb-4 text-xs text-primary">
            [Note to Talent - Your access to overview decks is restricted to the PDF version. Contact MC leadership for a Google Slide copy as needed]
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left font-semibold text-foreground align-middle">Service</th>
                  <th className="pb-2 px-3 text-center font-semibold text-foreground align-middle">Overview Deck</th>
                  <th className="pb-2 px-3 text-center font-semibold text-foreground align-middle">First Call Deck</th>
                  <th className="pb-2 px-3 text-center font-semibold text-foreground align-middle">Battlecard</th>
                  <th className="pb-2 px-3 text-center font-semibold text-foreground align-middle">Sellers Sheet</th>
                  <th className="pb-2 px-3 text-center font-semibold text-foreground align-middle">Maturity Model</th>
                  <th className="pb-2 pl-4 text-left font-semibold text-foreground align-middle">Example Materials</th>
                </tr>
              </thead>
              <tbody>
                {PRACTICE_ORDER.flatMap((practice) => {
                  const rows = gtmMaterials
                    .filter((r) => r.practice === practice)
                    .sort((a, b) => (a.seq ?? -1) - (b.seq ?? -1));
                  if (rows.length === 0) return [];
                  return [
                    <tr key={`hdr-${practice}`} className="bg-muted">
                      <td colSpan={7} className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-foreground">
                        {practice}
                      </td>
                    </tr>,
                    ...rows.flatMap((row) => [
                      <tr key={row.service} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-sm">
                          {row.isHub ? (
                            <span className="flex items-center gap-1.5 font-bold text-[#2563eb]">
                              <Network className="w-3.5 h-3.5 shrink-0" />
                              {row.service}
                            </span>
                          ) : (
                            <span className="font-bold text-foreground">{row.service}</span>
                          )}
                          {row.description && (
                            <p className={`text-xs mt-1 leading-snug font-normal ${row.isHub ? 'text-[#2563eb]/70' : 'text-muted-foreground'}`}>
                              {row.description}
                            </p>
                          )}
                          {row.keyBuyers && (
                            <p className={`text-xs mt-0.5 leading-snug ${row.isHub ? 'text-[#2563eb]/70' : 'text-muted-foreground'}`}>
                              <span className="font-bold">Key buyers: </span>{row.keyBuyers}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.docUrl ? (
                            <a href={row.docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              Doc
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.firstCallDeckUrl ? (
                            <a href={row.firstCallDeckUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              Doc
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.battlecardUrl ? (
                            <a href={row.battlecardUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              Doc
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.sellersSheetUrl ? (
                            <a href={row.sellersSheetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              Doc
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.maturityModelUrl || row.maturityDiagnosticUrl ? (
                            <span className="inline-flex items-center justify-center gap-2">
                              {row.maturityModelUrl && (
                                <a href={row.maturityModelUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                  Doc
                                </a>
                              )}
                              {row.maturityDiagnosticUrl && (
                                <a href={row.maturityDiagnosticUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                  Diagnostic
                                </a>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 pl-4 text-xs">
                          {row.exampleMaterials
                            ? row.exampleMaterials.map((m, i) => (
                                <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">
                                  {m.label}
                                </a>
                              ))
                            : "—"}
                        </td>
                      </tr>,
                      ...(row.subRows ?? []).map((sub) => (
                        <tr key={`${row.service}-${sub.service}`} className="border-b border-border/30 bg-muted/30">
                          <td className="py-2 pl-8 pr-4 text-sm">
                            <span className="text-muted-foreground mr-1.5 select-none">↳</span>
                            <span className="font-semibold text-foreground text-xs">{sub.service}</span>
                            {sub.description && (
                              <p className="text-xs mt-0.5 leading-snug text-muted-foreground font-normal">
                                {sub.description}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {sub.docUrl ? (
                              <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {sub.firstCallDeckUrl ? (
                              <a href={sub.firstCallDeckUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {sub.battlecardUrl ? (
                              <a href={sub.battlecardUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {sub.sellersSheetUrl ? (
                              <a href={sub.sellersSheetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {sub.maturityModelUrl || sub.maturityDiagnosticUrl ? (
                              <span className="inline-flex items-center justify-center gap-2">
                                {sub.maturityModelUrl && (
                                  <a href={sub.maturityModelUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
                                )}
                                {sub.maturityDiagnosticUrl && (
                                  <a href={sub.maturityDiagnosticUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Diagnostic</a>
                                )}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2 pl-4 text-xs">
                            {sub.exampleMaterials
                              ? sub.exampleMaterials.map((m, i) => (
                                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">{m.label}</a>
                                ))
                              : "—"}
                          </td>
                        </tr>
                      )),
                    ]),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales Motion Documents (slide 8) */}
        <section id="sales-motion" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Sales Motion Documents &amp; Assets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left font-semibold text-foreground">Topic</th>
                  <th className="pb-2 px-3 text-left font-semibold text-foreground">Type</th>
                  <th className="pb-2 pl-4 text-left font-semibold text-foreground">Document</th>
                </tr>
              </thead>
              <tbody>
                {salesAssets.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">{row.topic}</td>
                    <td className="py-2 px-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2 pl-4">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {row.document}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

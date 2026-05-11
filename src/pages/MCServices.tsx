import { useNavigate } from "react-router-dom";
import { ChevronLeft, Presentation, BookOpen } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import ConstellationDiagram from "@/components/ConstellationDiagram";

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

interface GTMRow {
  isHub?: boolean;
  seq?: number;
  practice: Practice;
  service: string;
  docUrl?: string;
  pdfUrl?: string;
  battlecardUrl?: string;
  sellersSheetUrl?: string;
  maturityModelUrl?: string;
  maturityDiagnosticUrl?: string;
  exampleMaterials?: { label: string; url: string }[];
}

const PRACTICE_ORDER: Practice[] = ["Strategy", "Finance", "Operations", "People"];

const gtmMaterials: GTMRow[] = [
  // Strategy
  {
    isHub: true,
    seq: 1,
    practice: "Strategy",
    service: "Growth Strategy",
    docUrl: "https://docs.google.com/presentation/d/1lN6S_ESoqT3ZLkBr7w5MP6rsnp8_974nxLIJhenJutk/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1Ilu2WNeBBXj-Y_yEDaipkIkV0cpXUbzh/view?usp=sharing",
    battlecardUrl: "https://docs.google.com/presentation/d/1KQ4jH3CHvMQJ4xYRyBbqsMOBMHaUmznl_20J003HyZc/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/15j8g5YQ7bdnigvMeR1eAgU2K5W9_EZMLG8Xs3OQVySc/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1N8J9ejIBZNJWDf8eYl8vwl1QZB2vLCcI2xCuClEkOsQ/edit",
    maturityDiagnosticUrl: "/diagnostics/growth-strategy",
    exampleMaterials: [
      { label: "DFF Gaming Hub Proposal", url: "https://docs.google.com/presentation/d/1ScpPMjT73PCTxFGBaSMLLQxbKYFn5UnJasKZ_ltNbF4/edit" },
    ],
  },
  {
    seq: 2,
    practice: "Strategy",
    service: "Go-to-Market",
    docUrl: "https://docs.google.com/presentation/d/1D3Ffyb--yMt82ypsaj4J3Yg68TrZYzraWTyzhYY7SRo/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1_2TcL_63dL2AdllCzQypPJgoctUCpIoW/view?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1BZFtld0jo68AGSexX8OyEWMgVh-6YrnHwAnrxwFt7LQ/edit?usp=sharing",
    exampleMaterials: [
      { label: "Oman Airports Loyalty Pgm", url: "https://docs.google.com/presentation/d/1X8w3PGoG7wk2aQwAGNYgAZobaOEvktDSx_WIys0KrfQ/edit" },
    ],
  },
  {
    seq: 3,
    practice: "Strategy",
    service: "Product Strategy",
    docUrl: "https://docs.google.com/presentation/d/1IBYMMdmUUoPtPC2JMkSaa5j4k_xDqsP0aUgw2_UBl74/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1DnZ419DYA2PvP7CYOPUsKM--SDtLuVmi/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/120aiWfiBDeNP-u6aK2Kwi_zzURbWOibt-hJwwC7PdWU/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/19AUSpdMRueIZR70q64dCo6U3IKKbkPHVod6D4t_bIbw/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1Eog-BhkRgRion8wH4jtoFq0TY4XB0LzkYpAu-tBU0_k/edit",
  },
  {
    seq: 4,
    practice: "Strategy",
    service: "Risk Management Services",
    docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1hE0flmJ_2oyhq45I9AFqNaAPtVP1XdA7/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1caiz6eH2ZaHU5I75fZGAjD4PWr-I115tudm5OthHFhU/edit",
  },
  {
    seq: 5,
    practice: "Strategy",
    service: "Business Continuity Services",
    docUrl: "https://docs.google.com/presentation/d/1ocPmWrfHUatJwFBDWlNqFdGrR4CSlwncYakhsyIGzdY/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1OfEVGSH_wYF0oeo7XYRHLc_qC8BllUhW/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1MmCz8MiOeO4zypm8JbO8qvm7fET9mRq29ucXU6B583U/edit",
  },
  {
    seq: 6,
    practice: "Strategy",
    service: "Customer Experience",
    docUrl: "https://docs.google.com/presentation/d/1DXkurtN5L74wXcpYM5RjcWHGyvM7kfOgzF6ZIboHKUc/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1V_TlWn6ApM1n3Sb8HggNA9X-He4Exflf/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1318piklJqw05nvPrGhIKWF31hZvzGZMS1VPSS9Q_wKE/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1fXDAZA5Wh0iPQksDPdtLe07SXSbz5khvvU32Wk45axI/edit",
  },
  {
    seq: 7,
    practice: "Strategy",
    service: "Digital Strategy",
    docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/19Bj0TbM74IX5jODeHOBb67gt1FJ4huZY/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/10ZxPCfgqQauZasgHDXjLz8GqQJfsQurkWCxBgjOdpN8/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1b0Bk6P1RFbZ-txYmtDy1Fwk2lmbhyYR2wCgd1_WsKEc/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1wnDErTEgJPRuiTpccdHg8SuSMLBs9BZSku2nzACA074/edit",
  },
  {
    seq: 8,
    practice: "Strategy",
    service: "AI Consulting",
    docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1Fg_9v11GJFglH76znXgNyY2Q4vlzbXSI/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1OFm2sxFT9nSD4Oq9Z49sqE07HI4GzB55KvfsL11gFiI/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1WTtIycmf_KpsTwG3cekjtwt20093RMgTpH1MqAaubUs/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/presentation/d/13fppFZa_ke4IVDC6ZDnaQVKG5ANGf428Q-59zBecWhM/edit",
    maturityDiagnosticUrl: "/diagnostics/ai-maturity",
    exampleMaterials: [
      { label: "Adidas AI Innovation", url: "https://docs.google.com/presentation/d/1s-UP0wZ1LvItVCKqGaXaYdLSV0MD_l9nknGmRvKq9pQ/edit" },
      { label: "Zoetis GenAI", url: "https://docs.google.com/presentation/d/1JQitZA2VO5dNF8Zej5YQhYV-r7dVnsSTVZp335jbdfE/edit" },
    ],
  },
  {
    seq: 9,
    practice: "Strategy",
    service: "Responsible AI",
    docUrl: "https://docs.google.com/presentation/d/18TY-uoEWX6pukByM1Bm4DWnLT5pwZljJWg7b37jvAm8/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/13o6IqM1ILpFOmoDl-H1TtuLNTgaHoJSU/view?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1-umEX0FqpsufBBuKxudgBe741JC4QtO6n4ZC-4WPBiE/edit",
  },
  {
    isHub: true,
    seq: 10,
    practice: "Strategy",
    service: "Business Transformation",
    docUrl: "https://docs.google.com/presentation/d/1Dk3zvl6pwuoew2Y2yi8X3k8gR8owBN5SeK-vNh3Vmf4/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1R-ZpyubSfT3l5ipbbhFkv-dWDClE7Ju8/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1lOGfxA4iMazV9Kfn1tPJH2Q0M4GWJgRpUVBv-p7xI1M/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1syzt0kO66n6vCgOzasujXt0jDdd4by6LGn_pTngLcrU/edit",
    maturityDiagnosticUrl: "/diagnostics/business-transformation",
    exampleMaterials: [
      { label: "Ricoh 3D Healthcare", url: "https://docs.google.com/presentation/d/1IuixJLDm7pATex8t2t0C23DH5I2BRQIiyDzJn0TtFc0/edit" },
    ],
  },
  {
    seq: 11,
    practice: "Strategy",
    service: "Sales Transformation",
    docUrl: "https://docs.google.com/presentation/d/1D4n31KDux-KaP-DKYSOMZYOcWBaJe7yfteAZAqNdTSo/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/136XrAIahuuQegqI5N414wBdWHPY-S30P/view?usp=drive_link",
  },
  // Finance
  {
    isHub: true,
    seq: 12,
    practice: "Finance",
    service: "Finance Transformation",
    docUrl: "https://docs.google.com/presentation/d/1_incQcSAXJG5faq7hOjorbbjG4IoANs7VQTMg6tZdVk/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/11DwcGPcy-nI4NvzW3UziU96K8Tj4dvl8/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1nqdEB423iDUd3JtPWqTtGZHh-cCia6mm8diZa_14XdY/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1fa7xf7L0V7417A8xEOfXLxhEF3sSchhRQMKhDtGpdsk/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1G1GKXB2YBHC18SLUbK8HT8p88Y5VIOhpz3LAOLxJ33s/edit",
    maturityDiagnosticUrl: "/diagnostics/finance-transformation",
  },
  {
    seq: 13,
    practice: "Finance",
    service: "M&A Services",
    docUrl: "https://docs.google.com/presentation/d/1kDU_9sQZ-wupu53099fIEgRrLSpNyco4uYcuuGBRNFc/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1NQ_tVI2lOSyTEWZHrE6VBnTWRo7RVGL_/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1aXcpZ99MVB45enGGOE4MXXYCTbWfBs_AatmGaoc5aRk/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1XiHzrdbxPXGek7C4jzfrS753wSyQkdFvA3wTdK_XKJs/edit",
    exampleMaterials: [
      { label: "Corning M&A Strategy", url: "https://docs.google.com/presentation/d/1HBLq4Mv2yCbFEdCoM4BMgHAQx7YwPK0cxzNZ-ZmidHs/edit" },
    ],
  },
  // Operations
  {
    isHub: true,
    seq: 14,
    practice: "Operations",
    service: "Performance Improvement",
    docUrl: "https://docs.google.com/presentation/d/1bKjSw5MgD5mzLbK-lMtIGoKXOwj09QH7fXRfOB9MLvY/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1y4_Tu_MVGhSq1W4hYgOJP2G5NU3sq77J/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1Gm9I5zaX01X1DlTp6J2eB4G3zE4vcGYxvJ8lwbe6-MM/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1bQIwVkhYrgvTK-S_jDKZbOCtnjUPsltD6Kndvx92h4A/edit",
    maturityDiagnosticUrl: "/diagnostics/performance-improvement",
    exampleMaterials: [
      { label: "Westcon-Comstor Q2C", url: "https://docs.google.com/presentation/d/11s6nm64OhYbCcMA2ACcM5zHbNGynp0heC0Ve3YEczgs/edit" },
    ],
  },
  {
    isHub: true,
    seq: 15,
    practice: "Operations",
    service: "Supply Chain",
    docUrl: "https://docs.google.com/presentation/d/1dn-i3M0XlWLs9t0F3PxIJeaNPIHBV5bluSgaasbaBFY/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1lceoWsWXmrhx_yLjDQTUPnCVcK5DNHdf/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1aIPsWUe1o6CHR-YszRpiwyACLLSw9qzZFCg0ZO7L72Q/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1eKjYH3O-7GL3NGNFGS9NgcaOGtC0Pz6nvuZ8ZOv0ItA/edit",
    maturityDiagnosticUrl: "/diagnostics/supply-chain",
  },
  {
    seq: 16,
    practice: "Operations",
    service: "Inventory Management",
    docUrl: "https://docs.google.com/presentation/d/1i-FA39jVjQbCvMZJ-w4gT6A3AN1pEkqrsrNAzW92z_w/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/1wAz229F37TvfXVXOdl_nhe4qJGKuaTLW/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1M-v3lAGlMFJlW75tHKN-caTJdexpIKxZSy8q_NoR_Jk/edit",
    maturityModelUrl: "https://docs.google.com/document/d/1UKmZO7LoyNZJQv2yMRlrfZ4voWIR-Qb2koDEnsou2l0/edit",
  },
  // People
  {
    isHub: true,
    seq: 17,
    practice: "People",
    service: "Workforce Transformation",
    docUrl: "https://docs.google.com/presentation/d/11xmJIF7nBPrY596wA3wXRqbmvHXv60q5qwRG4hLUuDo/edit?usp=sharing",
    pdfUrl: "https://drive.google.com/file/d/17CcdbwlNDOZ04lHooTnjQORkl-iifoJk/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/1Kvou1MHJWg5lj7HE2_Qy75m4b2IPMtBe99EeOwjPhQ0/edit",
    sellersSheetUrl: "https://docs.google.com/document/d/1GjjF_7PxsKckocTSL9rRuVXQaHhpONNyzQAeaxHgspk/edit?usp=sharing",
    maturityModelUrl: "https://docs.google.com/document/d/1lIi3-yMadUeoyRvz1oLKwdm5UABWkjedOqSyzTgMN7k/edit",
    maturityDiagnosticUrl: "/diagnostics/workforce-transformation",
    exampleMaterials: [
      { label: "Owens Corning Culture", url: "https://docs.google.com/presentation/d/1guXlLNwMI1KfyJiFQBshjb6xF2pqkDMvWI4Osl9nUUU/edit" },
    ],
  },
  {
    seq: 18,
    practice: "People",
    service: "Change Management",
    docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link",
    pdfUrl: "https://drive.google.com/file/d/1zp1hfli-auLWnpaX9St-6WZHFhNwV24F/view?usp=drive_link",
    battlecardUrl: "https://docs.google.com/presentation/d/12gpn5JP9DiR1GVuNPOQiAM9bBWqhHm4bfY9OPo8ZmLQ/edit",
    exampleMaterials: [
      { label: "PGE Contact Ctr", url: "https://docs.google.com/presentation/d/1ZaMGDXy8YbBrhiRgPBGt__RMbG8OgaLIQAUZzdJKdek/edit" },
    ],
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
              <p className="text-xs text-primary-foreground/80">Q1 2026 · Confidential</p>
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

        {/* Introduction - Definition + Service Portfolio side by side */}
        <div id="introduction" className="fade-in grid gap-8 lg:grid-cols-5">
          {/* Left: Definition (slide 4) */}
          <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Introduction</p>
            <h2 className="mb-4 text-2xl font-bold text-card-foreground tracking-tight">{definition.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">{definition.description}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{definition.extended}</p>
          </section>

          {/* Right: Service Portfolio (slide 5) */}
          <section className="lg:col-span-3 rounded-lg border border-border bg-card p-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Service Portfolio
            </p>
            <h2 className="mb-4 text-2xl font-bold text-card-foreground tracking-tight">Toptal MC Services</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {servicePortfolio.map((category) => (
                <div key={category.pillar} className="space-y-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${pillarColors[category.pillar] || "bg-secondary text-secondary-foreground"}`}
                  >
                    {category.pillar}
                  </span>
                  {category.groups.map((group) => (
                    <div key={group.name}>
                      <h4 className="text-xs font-semibold text-foreground mb-1">{group.name}</h4>
                      <ul className="space-y-0.5">
                        {group.services.map((s) => (
                          <li key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* MC Services Web */}
        <section id="services-web" className="fade-in rounded-lg border border-border bg-card p-6">
          <div className="grid gap-6 lg:grid-cols-5 items-start">
            <div className="lg:col-span-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Services Web
              </p>
              <h2 className="mb-3 text-2xl font-bold text-card-foreground tracking-tight">
                Management Consulting Services Web
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Individual consulting services are rarely delivered in isolation from one another. However, there are core "Hub" offerings that align to different leaders and buying centers within the typical client organization. The web to the right depicts six of these core hubs and their relationship with "universal connector services" that are often paired with the Hub offering solution, as well as additional, or secondary, services that are often coupled with the Hub offering. Keep in mind that your initial client conversation may not always start at the "Hub" offering but may ultimately lead you there.
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
        <section id="gtm-materials" className="fade-in rounded-lg border border-border bg-card p-6">
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
                  <th colSpan={2} className="pb-2 px-3 text-center font-semibold text-foreground align-middle">Overview Deck</th>
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
                    ...rows.map((row) => (
                      <tr key={row.service} className="border-b border-border/50">
                        <td className={`py-2 pr-4 ${row.isHub ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{row.service}</td>
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
                          {row.pdfUrl ? (
                            <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              PDF
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
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales Motion Documents (slide 8) */}
        <section id="sales-motion" className="fade-in rounded-lg border border-border bg-card p-6">
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Presentation, BookOpen, Network } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import ServiceFinder from "@/components/ServiceFinder";

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

type Practice = "Strategy & Transformation" | "Finance" | "Supply Chain & Operations" | "Customer & Growth" | "People & Organization" | "Risk & Compliance";

interface SubRow {
  service: string;
  description?: string;
  docUrl?: string;
  pdfUrl?: string;
  firstCallDeckUrl?: string;
  battlecardUrl?: string;
  sellersSheetUrl?: string;
  maturityModelUrl?: string;
  maturityDiagnosticUrl?: string;
  exampleMaterials?: { label: string; url: string }[];
  subRows?: SubRow[];
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
  note?: string;
  subRows?: SubRow[];
}

const PRACTICE_ORDER: Practice[] = ["Strategy & Transformation", "Finance", "Supply Chain & Operations", "Customer & Growth", "People & Organization", "Risk & Compliance"];

const gtmMaterials: GTMRow[] = [
  // Strategy & Transformation
  {
    isHub: true,
    seq: 1,
    practice: "Strategy & Transformation",
    service: "Strategy & Transformation",
    keyBuyers: "CEO; Chief Strategy Officer; Chief Transformation Officer; business unit presidents",
    subRows: [
      { service: "Corporate Strategy", description: "Enterprise-level strategy that defines where and how the company competes, including strategic planning, business portfolio choices, market entry, and enterprise growth strategy." },
      { service: "Operating Model", description: "Design of the enterprise target operating model across business units and functions, including decision rights, shared services strategy, and global business services design." },
      {
        service: "M&A & Divestitures",
        docUrl: "https://docs.google.com/presentation/d/1kDU_9sQZ-wupu53099fIEgRrLSpNyco4uYcuuGBRNFc/edit?usp=drive_link",
        pdfUrl: "https://drive.google.com/file/d/1NQ_tVI2lOSyTEWZHrE6VBnTWRo7RVGL_/view?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1aXcpZ99MVB45enGGOE4MXXYCTbWfBs_AatmGaoc5aRk/edit",
        maturityModelUrl: "https://docs.google.com/document/d/1XiHzrdbxPXGek7C4jzfrS753wSyQkdFvA3wTdK_XKJs/edit",
        exampleMaterials: [
          { label: "Corning M&A Strategy", url: "https://docs.google.com/presentation/d/1HBLq4Mv2yCbFEdCoM4BMgHAQx7YwPK0cxzNZ-ZmidHs/edit" },
        ],
        description: "Transaction support across the deal lifecycle, including commercial and operational due diligence, integration strategy, post-merger integration, Day One readiness, and carve-outs and separations.",
      },
      {
        service: "Performance Improvement",
        docUrl: "https://docs.google.com/presentation/d/1yxloBs1fEVFWaf6nhN3MXJR5aMBfI0sp35-ALC-l0gc/edit?usp=sharing",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1fhMvdjVSin6DBE1ZRfhiRSY5XOevKbmv68fN7t_o2Xc/edit?usp=sharing",
        pdfUrl: "https://drive.google.com/file/d/1y4_Tu_MVGhSq1W4hYgOJP2G5NU3sq77J/view?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1Gm9I5zaX01X1DlTp6J2eB4G3zE4vcGYxvJ8lwbe6-MM/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1lah0V9ttO_KdMhXPDT2k-6-FaGrPRT9TrYATtVteLI0/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1bQIwVkhYrgvTK-S_jDKZbOCtnjUPsltD6Kndvx92h4A/edit",
        maturityDiagnosticUrl: "/diagnostics/performance-improvement",
        exampleMaterials: [
          { label: "Westcon-Comstor Q2C", url: "https://docs.google.com/presentation/d/11s6nm64OhYbCcMA2ACcM5zHbNGynp0heC0Ve3YEczgs/edit" },
        ],
        description: "Enterprise-wide cost and productivity improvement, including cost transformation, productivity assessments, operating margin improvement, and value creation roadmaps.",
      },
      {
        service: "Transformation Management",
        docUrl: "https://docs.google.com/presentation/d/1L7DIECcuUXwp76rC2kpDlY9fhrsVLBzT4-4HrA18LvA/edit?usp=sharing",
        pdfUrl: "https://drive.google.com/file/d/1R-ZpyubSfT3l5ipbbhFkv-dWDClE7Ju8/view?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1lOGfxA4iMazV9Kfn1tPJH2Q0M4GWJgRpUVBv-p7xI1M/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1kKYqaVQqdZNEbw1q5HxsS-dX3Ce0a-4xdai6QpxnAS8/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1syzt0kO66n6vCgOzasujXt0jDdd4by6LGn_pTngLcrU/edit",
        maturityDiagnosticUrl: "/diagnostics/business-transformation",
        exampleMaterials: [
          { label: "Ricoh 3D Healthcare", url: "https://docs.google.com/presentation/d/1IuixJLDm7pATex8t2t0C23DH5I2BRQIiyDzJn0TtFc0/edit" },
        ],
        description: "Design of the enterprise transformation architecture, including transformation assessments, roadmaps, transformation office and governance design, and benefits frameworks.",
      },
      {
        service: "Enterprise AI",
        docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1OFm2sxFT9nSD4Oq9Z49sqE07HI4GzB55KvfsL11gFiI/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1WTtIycmf_KpsTwG3cekjtwt20093RMgTpH1MqAaubUs/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/presentation/d/13fppFZa_ke4IVDC6ZDnaQVKG5ANGf428Q-59zBecWhM/edit",
        maturityDiagnosticUrl: "/diagnostics/ai-maturity",
        exampleMaterials: [
          { label: "Adidas AI Innovation", url: "https://docs.google.com/presentation/d/1s-UP0wZ1LvItVCKqGaXaYdLSV0MD_l9nknGmRvKq9pQ/edit" },
          { label: "Zoetis GenAI", url: "https://docs.google.com/presentation/d/1JQitZA2VO5dNF8Zej5YQhYV-r7dVnsSTVZp335jbdfE/edit" },
        ],
        description: "Enterprise-level AI business strategy spanning multiple functions, including AI ambition, enterprise use case prioritization, and AI adoption roadmaps; technical build coordinated with AI Services.",
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
            service: "AI Value Realization",
            description: "Builds the deterministic scaffolding — workflow baselines, control logic, and data context — that turns AI spend from a faith-based bet into provable, board-ready ROI.",
            firstCallDeckUrl: "https://docs.google.com/presentation/d/1Lgz2mOezDzNNiuc_ZoxEyustQ_ZfhLh31CpwGzLKmcQ/edit?usp=sharing",
          },
        ],
      },
      {
        service: "Enterprise Digital & Technology",
        docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/10ZxPCfgqQauZasgHDXjLz8GqQJfsQurkWCxBgjOdpN8/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1b0Bk6P1RFbZ-txYmtDy1Fwk2lmbhyYR2wCgd1_WsKEc/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1wnDErTEgJPRuiTpccdHg8SuSMLBs9BZSku2nzACA074/edit",
        description: "Enterprise-level advisory on how digital and technology investments enable corporate strategy, including enterprise technology strategy, digital roadmaps, and investment prioritization; technical delivery coordinated with Technology Services.",
      },
      { service: "Change Management", description: "Change management for enterprise, cross-functional transformations, including change strategy, change readiness assessments, stakeholder alignment, and communications and adoption." },
      { service: "Program & Portfolio Management", description: "Delivery and governance of enterprise programs, including enterprise PMO, program leadership, portfolio prioritization, Integration Management Offices, and benefits tracking." },
    ],
  },
  // Finance
  {
    isHub: true,
    seq: 2,
    practice: "Finance",
    service: "Finance",
    keyBuyers: "CFO; Chief Accounting Officer; Controller",
    subRows: [
      {
        service: "Finance Strategy",
        docUrl: "https://docs.google.com/presentation/d/1_incQcSAXJG5faq7hOjorbbjG4IoANs7VQTMg6tZdVk/edit?usp=drive_link",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1J6iCOBdQUkPiZLMdrYvSRym4spqpXAijxrkFsG6Jr5I/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1nqdEB423iDUd3JtPWqTtGZHh-cCia6mm8diZa_14XdY/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1fa7xf7L0V7417A8xEOfXLxhEF3sSchhRQMKhDtGpdsk/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1G1GKXB2YBHC18SLUbK8HT8p88Y5VIOhpz3LAOLxJ33s/edit",
        maturityDiagnosticUrl: "/diagnostics/finance-transformation",
        description: "Defines the direction of the finance function, including CFO strategy assessments, finance vision and priorities, finance transformation roadmaps, and value cases.",
      },
      { service: "Finance Operating Model", description: "Design of how the finance function is organized and delivered, including the finance target operating model, organization design, shared services, and global business services." },
      {
        service: "Finance Processes & Operations",
        description: "Improvement and ongoing execution of core finance processes, including record-to-report, procure-to-pay, order-to-cash, and close management and optimization.",
        exampleMaterials: [
          { label: "HaddadBrands Financial Close Automation", url: "https://docs.google.com/presentation/d/1mTpWUqDsXYUugoHvFCzJ2kXyOvoAiNGW2fjsP-8MAFY/edit?usp=sharing" },
        ],
      },
      { service: "Financial Planning & Analysis", description: "Design, improvement, and ongoing operation of financial planning and analysis, including budgeting and forecasting, management reporting, and financial analysis and business partnering." },
      { service: "Finance Technology", description: "Advisory on finance platforms, including ERP strategy, selection, and modernization roadmaps, EPM advisory, finance platform selection, and finance automation design." },
      { service: "Finance AI", description: "AI-specific strategy and solution design for finance, including use case prioritization, intelligent close, AI-enabled FP&A and finance operations, and agentic finance operating models." },
      { service: "Change Management", description: "Change management for finance programs, including finance change strategy, change impact assessment, stakeholder communications, and finance learning and adoption." },
      { service: "Program & Portfolio Management", description: "Project, program, and portfolio management for finance initiatives, including finance project managers, finance PMO, program leadership, portfolio management, and benefits tracking." },
    ],
  },
  // Supply Chain & Operations
  {
    isHub: true,
    seq: 3,
    practice: "Supply Chain & Operations",
    service: "Supply Chain & Operations",
    keyBuyers: "COO; Chief Supply Chain Officer; Chief Procurement Officer",
    subRows: [
      {
        service: "Supply Chain Strategy",
        docUrl: "https://docs.google.com/presentation/d/1dn-i3M0XlWLs9t0F3PxIJeaNPIHBV5bluSgaasbaBFY/edit?usp=sharing",
        pdfUrl: "https://drive.google.com/file/d/1lceoWsWXmrhx_yLjDQTUPnCVcK5DNHdf/view?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1aIPsWUe1o6CHR-YszRpiwyACLLSw9qzZFCg0ZO7L72Q/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1JLsclhpbRlMiyiEEXGDxHK86azS9ittyOi6GCk-zwPQ/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1eKjYH3O-7GL3NGNFGS9NgcaOGtC0Pz6nvuZ8ZOv0ItA/edit",
        maturityDiagnosticUrl: "/diagnostics/supply-chain",
        description: "Defines supply chain direction and structure, including supply chain strategy, network design and optimization, supply chain operating model, and resilience strategy.",
      },
      {
        service: "Supply Chain Planning",
        docUrl: "https://docs.google.com/presentation/d/1i-FA39jVjQbCvMZJ-w4gT6A3AN1pEkqrsrNAzW92z_w/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1M-v3lAGlMFJlW75tHKN-caTJdexpIKxZSy8q_NoR_Jk/edit",
        maturityModelUrl: "https://docs.google.com/document/d/1UKmZO7LoyNZJQv2yMRlrfZ4voWIR-Qb2koDEnsou2l0/edit",
        description: "Design and ongoing operation of supply chain planning, including demand, supply, and inventory planning, integrated business planning, and planning performance monitoring.",
      },
      { service: "Procurement", description: "Strategy and execution of sourcing and supplier management, including procurement strategy, strategic sourcing, category management, supplier relationship management, and procurement operating model." },
      { service: "Manufacturing & Operations", description: "Improvement of plant and service operations performance, including manufacturing excellence, lean and operational excellence, service operations design, and quality and productivity improvement." },
      { service: "Logistics & Fulfillment", description: "Design and optimization of how goods reach customers, including warehouse operations, transportation strategy, distribution design, fulfillment optimization, and last-mile operations." },
      { service: "Supply Chain & Operations Technology", description: "Advisory on supply chain and operations platforms, including planning platform strategy, warehouse and transportation platform selection, operations systems roadmaps, and process automation design." },
      { service: "Supply Chain & Operations AI", description: "AI-specific strategy and solution design for supply chain and operations, including AI use cases, AI-enabled demand planning and procurement, inventory optimization, and predictive operations." },
      { service: "Change Management", description: "Change management for supply chain and operations programs, including site readiness and impact assessment, frontline adoption, and supplier and partner change enablement." },
      { service: "Program & Portfolio Management", description: "Project, program, and portfolio management for supply chain and operations initiatives, including supply chain PMO, network program leadership, operations portfolio management, and benefits tracking." },
    ],
  },
  // Customer & Growth
  {
    isHub: true,
    seq: 4,
    practice: "Customer & Growth",
    service: "Customer & Growth",
    keyBuyers: "Chief Revenue Officer; CMO; Chief Customer Officer",
    subRows: [
      {
        service: "Growth Strategy",
        docUrl: "https://docs.google.com/presentation/d/1lN6S_ESoqT3ZLkBr7w5MP6rsnp8_974nxLIJhenJutk/edit?usp=sharing",
        pdfUrl: "https://drive.google.com/file/d/1Ilu2WNeBBXj-Y_yEDaipkIkV0cpXUbzh/view?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1KQ4jH3CHvMQJ4xYRyBbqsMOBMHaUmznl_20J003HyZc/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/15j8g5YQ7bdnigvMeR1eAgU2K5W9_EZMLG8Xs3OQVySc/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1N8J9ejIBZNJWDf8eYl8vwl1QZB2vLCcI2xCuClEkOsQ/edit",
        maturityDiagnosticUrl: "/diagnostics/growth-strategy",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1SUHNZn93BQNkLlyXAZZUBWOuvaPK5kDy1g-pPJ3mI0Y/edit?usp=sharing",
        exampleMaterials: [
          { label: "DFF Gaming Hub Proposal", url: "https://docs.google.com/presentation/d/1ScpPMjT73PCTxFGBaSMLLQxbKYFn5UnJasKZ_ltNbF4/edit" },
        ],
        description: "Defines commercial direction and go-to-market choices, including commercial strategy, go-to-market and channel strategy, pricing and revenue growth, and commercial market expansion.",
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
        ],
      },
      {
        service: "Customer Experience",
        docUrl: "https://docs.google.com/presentation/d/1DXkurtN5L74wXcpYM5RjcWHGyvM7kfOgzF6ZIboHKUc/edit?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/1318piklJqw05nvPrGhIKWF31hZvzGZMS1VPSS9Q_wKE/edit",
        maturityModelUrl: "https://docs.google.com/document/d/1fXDAZA5Wh0iPQksDPdtLe07SXSbz5khvvU32Wk45axI/edit",
        description: "Design and improvement of the end-to-end customer experience, including CX strategy, customer journey design, voice of customer, experience measurement, and loyalty experience design.",
      },
      { service: "Customer Service & Success", description: "Design and ongoing delivery of customer service and success, including service strategy, contact center operating model, service and success operations, and retention and renewal management." },
      { service: "Customer & Growth Technology", description: "Advisory on commercial platforms, including CRM strategy and selection, marketing platform strategy, customer service platform advisory, and commercial systems roadmaps." },
      { service: "Customer & Growth AI", description: "AI-specific strategy and solution design for commercial functions, including commercial AI strategy, sales and marketing AI use cases, personalization strategy, and AI-enabled customer service." },
      { service: "Change Management", description: "Change management for commercial programs, including commercial change strategy, sales and marketing readiness, stakeholder communications, and commercial adoption and enablement." },
      { service: "Program & Portfolio Management", description: "Project, program, and portfolio management for commercial initiatives, including customer transformation PMO, commercial program leadership, growth portfolio management, and benefits tracking." },
    ],
  },
  // People & Organization
  {
    isHub: true,
    seq: 5,
    practice: "People & Organization",
    service: "People & Organization",
    keyBuyers: "CHRO; Chief People Officer",
    subRows: [
      {
        service: "Organization Strategy",
        docUrl: "https://docs.google.com/presentation/d/11xmJIF7nBPrY596wA3wXRqbmvHXv60q5qwRG4hLUuDo/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1Kvou1MHJWg5lj7HE2_Qy75m4b2IPMtBe99EeOwjPhQ0/edit",
        sellersSheetUrl: "https://docs.google.com/document/d/1GjjF_7PxsKckocTSL9rRuVXQaHhpONNyzQAeaxHgspk/edit?usp=sharing",
        maturityModelUrl: "https://docs.google.com/document/d/1lIi3-yMadUeoyRvz1oLKwdm5UABWkjedOqSyzTgMN7k/edit",
        maturityDiagnosticUrl: "/diagnostics/workforce-transformation",
        exampleMaterials: [
          { label: "Owens Corning Culture", url: "https://docs.google.com/presentation/d/1guXlLNwMI1KfyJiFQBshjb6xF2pqkDMvWI4Osl9nUUU/edit" },
        ],
        description: "Aligns people and the HR function to business priorities, including people strategy, strategic people planning, future of work strategy, HR function strategy, and organization effectiveness assessment.",
      },
      { service: "Organization Design", description: "HR-led design of organization structures, including roles and decision rights, job architecture, HR operating model, and organization effectiveness design." },
      {
        service: "Talent & Leadership",
        description: "Strategies and programs to attract, develop, and retain talent, including talent strategy, leadership and executive development, succession planning, and culture and leadership alignment.",
      },
      { service: "Learning & Capability Development", description: "Design, improvement, and ongoing delivery of learning programs, including learning strategy, capability assessment, reskilling strategy, AI readiness and literacy, and learning operating model." },
      { service: "HR Operations & Services", description: "Design, improvement, and ongoing delivery of HR services, including HR service delivery design, employee lifecycle administration, HR shared services, and HR process improvement." },
      { service: "HR Technology", description: "Advisory on HR platforms, including HRIS strategy and selection, talent platform advisory, HR systems roadmaps, and people analytics design." },
      { service: "HR AI", description: "AI-specific strategy and solution design for HR, including HR AI strategy, use case prioritization, AI-enabled talent and learning processes, and HR AI adoption roadmaps." },
      {
        service: "Change Management",
        docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link",
        firstCallDeckUrl: "https://docs.google.com/presentation/d/1FngvHXpfZN8KrdgkssvFvnLt4XjgHKR1kWTRx8WVNwA/edit?usp=drive_link",
        battlecardUrl: "https://docs.google.com/presentation/d/12gpn5JP9DiR1GVuNPOQiAM9bBWqhHm4bfY9OPo8ZmLQ/edit",
        exampleMaterials: [
          { label: "PGE Contact Ctr", url: "https://docs.google.com/presentation/d/1ZaMGDXy8YbBrhiRgPBGt__RMbG8OgaLIQAUZzdJKdek/edit" },
        ],
        description: "Change management for people and organization programs, including change strategy, organization change readiness, culture and behavior adoption, and stakeholder communications.",
      },
      { service: "Program & Portfolio Management", description: "Project, program, and portfolio management for HR and people initiatives, including people transformation PMO, organization program leadership, HR portfolio management, and benefits tracking." },
    ],
  },
  // Risk & Compliance
  {
    isHub: true,
    seq: 6,
    practice: "Risk & Compliance",
    service: "Risk & Compliance",
    keyBuyers: "Chief Risk Officer; Chief Compliance Officer; Chief Audit Executive",
    subRows: [
      { service: "Enterprise Risk Management", description: "Design and operation of enterprise risk management, including risk strategy and framework, risk appetite, risk operating model, enterprise risk assessments, risk registers, and monitoring and reporting." },
      { service: "Third-Party Risk Management", description: "Management of supplier and third-party risk from design through ongoing operation, including frameworks, due diligence, onboarding and risk tiering, ongoing monitoring, remediation, and reporting." },
      {
        service: "Operational Risk & Resilience",
        docUrl: "https://docs.google.com/presentation/d/1cafzmkz671k9stPLWUZSmuL34SRm1MsKErE0t4tBieg/edit?usp=sharing",
        battlecardUrl: "https://docs.google.com/presentation/d/1caiz6eH2ZaHU5I75fZGAjD4PWr-I115tudm5OthHFhU/edit",
        description: "Assessment and strengthening of operational resilience, including operational risk assessments, business continuity, scenario exercises, incident readiness, and resilience monitoring.",
      },
      { service: "Governance & Controls", description: "Design, testing, and modernization of governance and internal controls, including governance frameworks, SOX controls advisory, controls testing and monitoring, and remediation tracking." },
      { service: "Compliance & Regulatory", description: "Design and operation of compliance programs, including compliance operating model, regulatory change management, policy frameworks, compliance monitoring and testing, financial crime compliance, and remediation." },
      { service: "Internal Audit", description: "Strategy, transformation, and execution of internal audit, including audit operating model, planning and methodology, audit execution, continuous auditing, and issue follow-up." },
      { service: "Risk Technology", description: "Advisory on risk and compliance platforms, including GRC platform strategy and selection, controls technology roadmaps, third-party risk platform advisory, and risk analytics design." },
      {
        service: "Risk AI",
        description: "AI governance and AI-specific solution design for risk, including AI risk and controls frameworks, AI use cases for risk, intelligent controls design, and AI-enabled compliance and audit.",
        subRows: [
          {
            service: "Responsible AI",
            description: "Guiding organizations through the ethical, fair, and secure development, deployment, and operation of AI systems across their entire lifecycle.",
            docUrl: "https://docs.google.com/presentation/d/18TY-uoEWX6pukByM1Bm4DWnLT5pwZljJWg7b37jvAm8/edit?usp=sharing",
            maturityModelUrl: "https://docs.google.com/document/d/1-umEX0FqpsufBBuKxudgBe741JC4QtO6n4ZC-4WPBiE/edit",
          },
          {
            service: "AI Governance",
            description: "Guides organizations in building the policies, oversight structures, and technical controls needed to govern AI and agentic systems in production — before risk outpaces the ability to manage it.",
            firstCallDeckUrl: "https://docs.google.com/presentation/d/1LYwdQyPJWnihRItB-zyjoWZqbtpPyOsT0_2ft_CWsjM/edit?usp=sharing",
          },
        ],
      },
      { service: "Change Management", description: "Change management for risk and compliance programs, including change strategy, risk culture and adoption, policy change enablement, and controls training and adoption." },
      { service: "Program & Portfolio Management", description: "Project, program, and portfolio management for risk and compliance initiatives, including regulatory program PMO, risk program leadership, risk portfolio management, and remediation governance." },
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
  {
    topic: "Change Management",
    type: "POV",
    document: "Toptal POV - Change Management",
    url: "https://docs.google.com/presentation/d/1RfNd4MllIYGGrnJ3RrwYFozQMVOl8UbXb6z9vaNhWOk/edit?slide=id.g2e42f2ed76d_0_5018#slide=id.g2e42f2ed76d_0_5018",
  },
];

const pillarColors: Record<string, string> = {
  Strategy: "bg-primary/10 text-primary",
  Finance: "bg-accent text-accent-foreground",
  Operations: "bg-destructive/10 text-destructive",
  People: "bg-muted text-muted-foreground",
};

// Same brand colors used for these hubs in ConstellationDiagram and MCPlan's Hub
// Offering cards.
const HUB_OFFERING_COLORS: Record<Practice, { text: string; bg: string }> = {
  "Strategy & Transformation": { text: "#2B44D4", bg: "#EEF2FF" },
  Finance: { text: "#0CA678", bg: "#ECFDF5" },
  "Supply Chain & Operations": { text: "#E86B4A", bg: "#FFF7ED" },
  "Customer & Growth": { text: "#D6336C", bg: "#FDF2F8" },
  "People & Organization": { text: "#5C6BC0", bg: "#EDE9FE" },
  "Risk & Compliance": { text: "#9C2B2B", bg: "#FEF2F2" },
};

interface MCDomain {
  name: string;
  buyers: string;
  description: string;
  l3s: string[];
  color: string;
  bg: string;
}

const mcDomains: MCDomain[] = [
  {
    name: "Strategy & Transformation",
    buyers: "CEO; Chief Strategy Officer; Chief Transformation Officer; business unit presidents",
    description: "Help executive leadership define enterprise strategy, prioritize transformation investments, design operating models, and coordinate cross-functional value creation.",
    l3s: ["Corporate Strategy", "Operating Model", "M&A & Divestitures", "Performance Improvement", "Transformation Management", "Enterprise AI", "Enterprise Digital & Technology", "Change Management", "Program & Portfolio Management"],
    color: "#2B44D4",
    bg: "#EEF2FF",
  },
  {
    name: "Finance",
    buyers: "CFO; Chief Accounting Officer; Controller",
    description: "Improve how the finance function plans, operates, controls, and supports business decisions, including the business use of technology and AI.",
    l3s: ["Finance Strategy", "Finance Operating Model", "Finance Processes & Operations", "Financial Planning & Analysis", "Finance Technology", "Finance AI", "Change Management", "Program & Portfolio Management"],
    color: "#0CA678",
    bg: "#ECFDF5",
  },
  {
    name: "Supply Chain & Operations",
    buyers: "COO; Chief Supply Chain Officer; Chief Procurement Officer",
    description: "Improve end-to-end supply chain and operational performance across planning, procurement, manufacturing, service operations, and fulfillment.",
    l3s: ["Supply Chain Strategy", "Supply Chain Planning", "Procurement", "Manufacturing & Operations", "Logistics & Fulfillment", "Supply Chain & Operations Technology", "Supply Chain & Operations AI", "Change Management", "Program & Portfolio Management"],
    color: "#E86B4A",
    bg: "#FFF7ED",
  },
  {
    name: "Customer & Growth",
    buyers: "Chief Revenue Officer; CMO; Chief Customer Officer",
    description: "Improve commercial performance across growth strategy, sales, marketing, customer experience, and the business use of commercial platforms and AI.",
    l3s: ["Growth Strategy", "Customer Experience", "Customer Service & Success", "Customer & Growth Technology", "Customer & Growth AI", "Change Management", "Program & Portfolio Management"],
    color: "#D6336C",
    bg: "#FDF2F8",
  },
  {
    name: "People & Organization",
    buyers: "CHRO; Chief People Officer",
    description: "Help organizations align structure, talent, leadership, learning, and the HR function to business priorities and sustained performance.",
    l3s: ["Organization Strategy", "Organization Design", "Talent & Leadership", "Learning & Capability Development", "HR Operations & Services", "HR Technology", "HR AI", "Change Management", "Program & Portfolio Management"],
    color: "#5C6BC0",
    bg: "#EDE9FE",
  },
  {
    name: "Risk & Compliance",
    buyers: "Chief Risk Officer; Chief Compliance Officer; Chief Audit Executive",
    description: "Improve enterprise risk management, governance, controls, compliance, and internal audit effectiveness, including risk technology and AI governance.",
    l3s: ["Enterprise Risk Management", "Third-Party Risk Management", "Operational Risk & Resilience", "Governance & Controls", "Compliance & Regulatory", "Internal Audit", "Risk Technology", "Risk AI", "Change Management", "Program & Portfolio Management"],
    color: "#9C2B2B",
    bg: "#FEF2F2",
  },
];


// Shared data-column cells (Overview Deck, First Call Deck, Battlecard, Sellers
// Sheet, Maturity Model, Example Materials) — identical markup at every nesting
// level of the GTM Materials table, so top-level rows, sub-rows, and nested
// sub-rows all render through this.
function ServiceDataCells({ row }: { row: SubRow }) {
  return (
    <>
      <td className="py-2 px-3 text-center">
        {row.docUrl ? (
          <a href={row.docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
        ) : "—"}
      </td>
      <td className="py-2 px-3 text-center">
        {row.firstCallDeckUrl ? (
          <a href={row.firstCallDeckUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
        ) : "—"}
      </td>
      <td className="py-2 px-3 text-center">
        {row.battlecardUrl ? (
          <a href={row.battlecardUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
        ) : "—"}
      </td>
      <td className="py-2 px-3 text-center">
        {row.sellersSheetUrl ? (
          <a href={row.sellersSheetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
        ) : "—"}
      </td>
      <td className="py-2 px-3 text-center">
        {row.maturityModelUrl || row.maturityDiagnosticUrl ? (
          <span className="inline-flex items-center justify-center gap-2">
            {row.maturityModelUrl && (
              <a href={row.maturityModelUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Doc</a>
            )}
            {row.maturityDiagnosticUrl && (
              <a href={row.maturityDiagnosticUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Diagnostic</a>
            )}
          </span>
        ) : "—"}
      </td>
      <td className="py-2 pl-4 text-xs">
        {row.exampleMaterials
          ? row.exampleMaterials.map((m, i) => (
              <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">{m.label}</a>
            ))
          : "—"}
      </td>
    </>
  );
}

// Renders a sub-row and (recursively) any of its own nested sub-rows, indenting
// one step further at each depth.
function renderSubRowTree(subRows: SubRow[] | undefined, parentKey: string, depth = 1) {
  if (!subRows) return [];
  const indentClass = depth === 1 ? "pl-8" : depth === 2 ? "pl-14" : "pl-20";
  return subRows.flatMap((sub) => [
    <tr key={`${parentKey}-${sub.service}`} className="border-b border-border/30 bg-muted/30">
      <td className={`py-2 ${indentClass} pr-4 text-sm`}>
        <span className="text-muted-foreground mr-1.5 select-none">↳</span>
        <span className="font-semibold text-foreground text-xs">{sub.service}</span>
        {sub.description && (
          <p className="text-xs mt-0.5 leading-snug text-muted-foreground font-normal">
            {sub.description}
          </p>
        )}
      </td>
      <ServiceDataCells row={sub} />
    </tr>,
    ...renderSubRowTree(sub.subRows, `${parentKey}-${sub.service}`, depth + 1),
  ]);
}

export default function MCServices() {
  const navigate = useNavigate();
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());
  const toggleHub = (service: string) =>
    setExpandedHubs((prev) => {
      const next = new Set(prev);
      next.has(service) ? next.delete(service) : next.add(service);
      return next;
    });

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
              <p className="text-xs text-primary-foreground/80">Q4 2026 · Confidential</p>
            </div>
          </div>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* Section nav */}
        <nav className="flex gap-2 flex-wrap border-b border-border pb-4">
          {[
            { label: "About Management Consulting", href: "#about-mc" },
            { label: "MC Service Offering Finder", href: "#hub-finder" },
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

        {/* About Management Consulting */}
        <section id="about-mc" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-bold text-card-foreground tracking-tight">About Management Consulting</h2>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Management Consulting provides organizations with expert advice to solve complex business challenges, improve performance, and drive strategic growth. It often involves diagnosing problems, devising actionable solutions, and implementing strategies to enhance operational efficiency and achieve long-term success.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold">Practices and Service Offerings: </span>Toptal's core Management Consulting Practice areas and service offerings are designed to align with the interests and needs of the different leaders and buying centers within the typical client organization.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mcDomains.map((domain) => (
              <div key={domain.name} className="flex flex-col rounded-lg border border-border bg-background p-4">
                <h3 className="mb-1 text-xl font-bold" style={{ color: domain.color }}>{domain.name}</h3>
                <p className="mb-2 min-h-8 text-xs text-muted-foreground">
                  <span className="font-semibold">Key buyers: </span>{domain.buyers}
                </p>
                <p className="mb-3 min-h-24 text-sm leading-relaxed text-muted-foreground">{domain.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {domain.l3s.map((t) => (
                    <span
                      key={t}
                      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: domain.bg, color: domain.color }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MC Service Offering Finder */}
        <section id="hub-finder" className="fade-in rounded-lg border border-primary/20 bg-primary/5 p-6 scroll-mt-20">
          <ServiceFinder />
        </section>

        {/* GTM Materials (slide 7) */}
        <section id="gtm-materials" className="fade-in rounded-lg border border-border bg-card p-6 scroll-mt-20">
          <div className="mb-4 flex items-center gap-2">
            <Presentation className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Go-to-Market Materials</h2>
          </div>
          <p className="mb-1 text-sm text-muted-foreground">
            Overview decks, first call decks, battlecards, maturity diagnostic models, and example client materials available per service offering.
            <br />
            - Click on the blue links - Doc, PDF, Diagnostic, or Example Name - to access content
            <br />
            - Click on the "+" sign to access additional related sub-offering content
          </p>
          <p className="mb-4 text-xs text-primary">
            [Note to Talent - Your access to overview decks is restricted to the PDF version. Contact MC leadership for a Google Slide copy as needed]
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left font-semibold text-foreground align-middle">Practices & Service Offerings</th>
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
                    practice !== PRACTICE_ORDER[0] ? (
                      <tr key={`hdr-${practice}`}>
                        <td colSpan={7} className="pt-3 pb-1">
                          <div className="border-t border-border" />
                        </td>
                      </tr>
                    ) : null,
                    ...rows.flatMap((row) => {
                      const hubColor = HUB_OFFERING_COLORS[practice].text;
                      return [
                        <tr key={row.service} className="border-b border-border/50">
                          <td className="py-2 pr-4 text-sm">
                            {row.isHub ? (
                              <span className="flex items-center gap-1.5 text-lg font-bold" style={{ color: hubColor }}>
                                {row.subRows?.length ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleHub(row.service)}
                                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-sm font-bold leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label={expandedHubs.has(row.service) ? `Collapse ${row.service}` : `Expand ${row.service}`}
                                  >
                                    {expandedHubs.has(row.service) ? "−" : "+"}
                                  </button>
                                ) : (
                                  <span className="w-5 shrink-0" />
                                )}
                                <Network className="w-4 h-4 shrink-0" />
                                {row.service}
                                {row.note && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                    {row.note}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="font-bold text-foreground">{row.service}</span>
                            )}
                            {row.description && (
                              <p
                                className={`text-xs mt-1 leading-snug font-normal ${row.isHub ? '' : 'text-muted-foreground'}`}
                                style={row.isHub ? { color: hubColor, opacity: 0.7 } : undefined}
                              >
                                {row.description}
                              </p>
                            )}
                            {row.keyBuyers && (
                              <p
                                className={`text-xs mt-0.5 leading-snug ${row.isHub ? '' : 'text-muted-foreground'}`}
                                style={row.isHub ? { color: hubColor, opacity: 0.7 } : undefined}
                              >
                                <span className="font-bold">Key buyers: </span>{row.keyBuyers}
                              </p>
                            )}
                          </td>
                          <ServiceDataCells row={row} />
                        </tr>,
                        ...(expandedHubs.has(row.service) ? renderSubRowTree(row.subRows, row.service) : []),
                      ];
                    }),
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

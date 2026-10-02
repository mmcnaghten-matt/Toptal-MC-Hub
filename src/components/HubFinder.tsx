import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type PracticeId = "strategy" | "finance" | "supplychain" | "customer" | "people" | "risk";

interface L3Offering {
  id: string;
  name: string;
  signals: string[];
  description: string;
}

interface Practice {
  id: PracticeId;
  name: string;
  color: string;
  bg: string;
  buyers: string[];
  l3s: L3Offering[];
}

// ── Practice definitions — buyers match the Service Offerings cards; L3s and
// their descriptions match the taxonomy catalog; each L3 carries 2-3 natural,
// symptomatic buying signals a seller might actually hear in discovery. ──────

const PRACTICES: Practice[] = [
  {
    id: "strategy",
    name: "Strategy & Transformation",
    color: "#2B44D4",
    bg: "#EEF2FF",
    buyers: ["CEO", "Chief Strategy Officer", "Chief Transformation Officer", "business unit presidents"],
    l3s: [
      {
        id: "st-corp", name: "Corporate Strategy",
        description: "Enterprise-level strategy that defines where and how the company competes, including strategic planning, business portfolio choices, market entry, and enterprise growth strategy.",
        signals: [
          "Our board keeps asking what our differentiation is, and every time we give a different answer.",
          "We're making major M&A and portfolio decisions, but we keep second-guessing ourselves on whether they align with where we're really going.",
          "Business units are pursuing totally different strategic directions with no clear parent strategy to guide them.",
        ],
      },
      {
        id: "st-digital", name: "Enterprise Digital & Technology",
        description: "Enterprise-level advisory on how digital and technology investments enable corporate strategy, including enterprise technology strategy, digital roadmaps, and investment prioritization; technical delivery coordinated with Technology Services.",
        signals: [
          "We're spending millions on digital initiatives, but nobody can articulate how they connect to our business strategy.",
          "Our CTO and COO see totally different visions for where tech should go—and neither has a business case.",
          "We've got AI pilots running in multiple functions, but we have no idea where we're actually making money with it.",
        ],
      },
      {
        id: "st-ai", name: "Enterprise AI",
        description: "Enterprise-level AI business strategy spanning multiple functions, including AI ambition, enterprise use case prioritization, and AI adoption roadmaps; technical build coordinated with AI Services.",
        signals: [
          "Different parts of the business are experimenting with AI independently. We're probably duplicating work and missing bigger opportunities.",
          "Our board just asked if we have an AI strategy. We don't—we have point solutions scattered around.",
          "We're worried we're falling behind on AI, but we don't know where to even start.",
        ],
      },
      {
        id: "st-opmodel", name: "Operating Model",
        description: "Design of the enterprise target operating model across business units and functions, including decision rights, shared services strategy, and global business services design.",
        signals: [
          "Decisions that should take a week take a month because we can't figure out who's actually accountable.",
          "We keep finding duplicated functions across business units. It's wasteful, but we don't know how to consolidate without blowing up the organization.",
          "Our shared services aren't actually shared—each function has built its own infrastructure.",
        ],
      },
      {
        id: "st-ma", name: "M&A & Divestitures",
        description: "Transaction support across the deal lifecycle, including commercial and operational due diligence, integration strategy, post-merger integration, Day One readiness, and carve-outs and separations.",
        signals: [
          "We're closing a deal in 90 days and we have no integration playbook. It's going to be chaos.",
          "The last acquisition we did lost half its people in the first year. We need to do this one differently.",
          "We're considering a spin-off but have no idea how to carve out the finance function, legal, IT, etc.",
        ],
      },
      {
        id: "st-perf", name: "Performance Improvement",
        description: "Enterprise-wide cost and productivity improvement, including cost transformation, productivity assessments, operating margin improvement, and value creation roadmaps.",
        signals: [
          "Our margins have compressed every quarter for two years, but we can't point to a specific cost driver.",
          "We've hired a bunch of people to hit our growth targets, but our cost per output keeps going up.",
          "Leadership says 'fix the cost structure,' but nobody has a systematic view of where the waste actually is.",
        ],
      },
      {
        id: "st-transform", name: "Transformation Management",
        description: "Design of the enterprise transformation architecture, including transformation assessments, roadmaps, transformation office and governance design, and benefits frameworks.",
        signals: [
          "We launched a major transformation but we don't have anyone tracking whether it's actually delivering the promised benefits.",
          "We have three workstreams running in parallel with no one coordinating them or managing dependencies.",
          "We've allocated a ton of budget but have no way to prioritize between competing initiatives.",
        ],
      },
      {
        id: "st-change", name: "Change Management",
        description: "Change management for enterprise, cross-functional transformations, including change strategy, change readiness assessments, stakeholder alignment, and communications and adoption.",
        signals: [
          "We've approved a big organizational change, but we're nervous that people just won't adopt it.",
          "The last transformation we tried stalled because the frontline teams resisted. We can't let that happen again.",
          "Leadership wants to change how we work, but there's no communication plan or adoption strategy to make it stick.",
        ],
      },
      {
        id: "st-pmo", name: "Program & Portfolio Management",
        description: "Delivery and governance of enterprise programs, including enterprise PMO, program leadership, portfolio prioritization, Integration Management Offices, and benefits tracking.",
        signals: [
          "We're running 12 enterprise programs and we have no central view of which ones are actually delivering value.",
          "Our PMO disbanded three years ago. We've been winging it since and it's getting messy.",
          "We're starting five initiatives, but we don't know which ones have dependencies, which ones conflict, or if we have the capacity to do them all.",
        ],
      },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    color: "#0CA678",
    bg: "#ECFDF5",
    buyers: ["CFO", "Chief Accounting Officer", "Controller"],
    l3s: [
      {
        id: "fi-strategy", name: "Finance Strategy",
        description: "Defines the direction of the finance function, including CFO strategy assessments, finance vision and priorities, finance transformation roadmaps, and value cases.",
        signals: [
          "The CFO role just opened up and the board is asking what finance should look like in five years. We have no answer.",
          "Our finance team is spending all their time firefighting close issues and reactive analysis. They're not doing any strategic work.",
          "Finance has had the same structure and processes for five years. The business has changed; finance hasn't.",
        ],
      },
      {
        id: "fi-opmodel", name: "Finance Operating Model",
        description: "Design of how the finance function is organized and delivered, including the finance target operating model, organization design, shared services, and global business services.",
        signals: [
          "We have finance people spread across the company, but it's not clear who reports to whom or what they're supposed to do.",
          "Our GBS is in India, our shared services are in the US, and nobody owns the end-to-end finance operating model.",
          "Finance org costs have gone up 30% in the last three years with no corresponding improvement in service or output.",
        ],
      },
      {
        id: "fi-processes", name: "Finance Processes & Operations",
        description: "Improvement and ongoing execution of core finance processes, including record-to-report, procure-to-pay, order-to-cash, and close management and optimization.",
        signals: [
          "The close takes six weeks and it's still a manual, error-prone nightmare.",
          "Our billing team is swamped; it takes weeks to invoice a customer after the work is done.",
          "Accounts payable is drowning in invoices and POs aren't matching—we're just throwing bodies at it.",
        ],
      },
      {
        id: "fi-fpa", name: "Financial Planning & Analysis",
        description: "Design, improvement, and ongoing operation of financial planning and analysis, including budgeting and forecasting, management reporting, and financial analysis and business partnering.",
        signals: [
          "Budgeting season is chaos. We spend two months on the process and the forecast is outdated two weeks later.",
          "The CFO is asking 'what-if' questions and FP&A has to build a new model every time. They're not getting insights, just tired.",
          "Our forecast accuracy is terrible. Finance can't tell the business what we expect to make.",
        ],
      },
      {
        id: "fi-tech", name: "Finance Technology",
        description: "Advisory on finance platforms, including ERP strategy, selection, and modernization roadmaps, EPM advisory, finance platform selection, and finance automation design.",
        signals: [
          "We're evaluating a new ERP and the vendors are just trying to sell us the biggest system. We don't know what we actually need.",
          "Our spreadsheet-based processes are broken. We know we need new tech, but we don't know what we're replacing or why.",
          "The last finance system implementation took three years and cost double. We're terrified to do another one without help.",
        ],
      },
      {
        id: "fi-ai", name: "Finance AI",
        description: "AI-specific strategy and solution design for finance, including use case prioritization, intelligent close, AI-enabled FP&A and finance operations, and agentic finance operating models.",
        signals: [
          "Our team is curious about AI for things like audit or forecasting, but we don't know what would actually move the needle for us.",
          "We want to automate invoice matching with AI, but we don't know where to start or if it's even possible.",
          "Everyone's talking about AI-powered finance. We're waiting to see what works before we invest.",
        ],
      },
      {
        id: "fi-change", name: "Change Management",
        description: "Change management for finance programs, including finance change strategy, change impact assessment, stakeholder communications, and finance learning and adoption.",
        signals: [
          "We're rolling out a new finance process and we're worried the team will just keep doing things the old way.",
          "Finance transformation failed last time because the team didn't understand why we were changing and resisted the new process.",
          "We need the finance team to work differently, but we have no plan for how to shift people's mindset or build new capabilities.",
        ],
      },
      {
        id: "fi-pmo", name: "Program & Portfolio Management",
        description: "Project, program, and portfolio management for finance initiatives, including finance project managers, finance PMO, program leadership, portfolio management, and benefits tracking.",
        signals: [
          "We have finance transformation, tech implementation, and process improvement all running at the same time. There's overlap and nobody's in charge.",
          "We're not sure which finance initiatives to prioritize. Everyone's pushing their own project and CFO is caught in the middle.",
        ],
      },
    ],
  },
  {
    id: "supplychain",
    name: "Supply Chain & Operations",
    color: "#E86B4A",
    bg: "#FFF7ED",
    buyers: ["COO", "Chief Supply Chain Officer", "Chief Procurement Officer"],
    l3s: [
      {
        id: "sc-strategy", name: "Supply Chain Strategy",
        description: "Defines supply chain direction and structure, including supply chain strategy, network design and optimization, supply chain operating model, and resilience strategy.",
        signals: [
          "COVID exposed how fragile our supply chain is. We know we need a resilience strategy but we don't know what that looks like.",
          "We keep firefighting supply chain crises instead of building a real strategy. We don't even know what our network should look like.",
          "Our supply chain is global but it's been built incrementally over 20 years. There's no rhyme or reason to where we source or manufacture.",
        ],
      },
      {
        id: "sc-planning", name: "Supply Chain Planning",
        description: "Design and ongoing operation of supply chain planning, including demand, supply, and inventory planning, integrated business planning, and planning performance monitoring.",
        signals: [
          "We miss demand signals and end up with either stockouts or inventory bloat. Our S&OP process isn't working.",
          "Sales, supply chain, and finance never agree on the demand forecast. Planning is a political nightmare.",
          "We're bullwhipping inventory across the network because demand planning and supply planning aren't connected.",
        ],
      },
      {
        id: "sc-procurement", name: "Procurement",
        description: "Strategy and execution of sourcing and supplier management, including procurement strategy, strategic sourcing, category management, supplier relationship management, and procurement operating model.",
        signals: [
          "We have hundreds of suppliers but nobody's managing them strategically. Procurement just processes POs.",
          "We're not winning on cost. Competitors are getting better terms because they have real sourcing strategies; we just negotiate at renewal.",
          "We're spending with top suppliers but we have no idea if we're getting competitive pricing or what alternatives exist.",
        ],
      },
      {
        id: "sc-mfg", name: "Manufacturing & Operations",
        description: "Improvement of plant and service operations performance, including manufacturing excellence, lean and operational excellence, service operations design, and quality and productivity improvement.",
        signals: [
          "Our plant productivity has been flat for three years. We've got the equipment and people but something's not working.",
          "Our service centers are inconsistent. Some are running great, others are a mess. We don't know how to replicate the good stuff.",
          "Labor costs are rising but we're not getting output improvements. We need to systematically improve operations, not just throw people at it.",
        ],
      },
      {
        id: "sc-logistics", name: "Logistics & Fulfillment",
        description: "Design and optimization of how goods reach customers, including warehouse operations, transportation strategy, distribution design, fulfillment optimization, and last-mile operations.",
        signals: [
          "Our fulfillment costs are eating into margin. Shipping and warehouse costs are up but we're not delivering any faster.",
          "We're promising two-day delivery but our fulfillment network can't support it without blowing out costs.",
          "We've got regional DCs but the network is inefficient. We're paying for space we don't need and can't serve dense areas well.",
        ],
      },
      {
        id: "sc-tech", name: "Supply Chain & Operations Technology",
        description: "Advisory on supply chain and operations platforms, including planning platform strategy, warehouse and transportation platform selection, operations systems roadmaps, and process automation design.",
        signals: [
          "We're looking at new supply planning or WMS tools, but the vendor selection process is a mess. They all claim to do everything.",
          "Our current systems don't talk to each other. Data flows manually between planning, procurement, and ops.",
          "We're evaluating a supply chain platform but we're worried it'll be like the last ERP implementation—years of implementation, over budget, not what we wanted.",
        ],
      },
      {
        id: "sc-ai", name: "Supply Chain & Operations AI",
        description: "AI-specific strategy and solution design for supply chain and operations, including AI use cases, AI-enabled demand planning and procurement, inventory optimization, and predictive operations.",
        signals: [
          "AI could probably help with demand forecasting or inventory, but we don't know which problem to solve first.",
          "We want to use AI for procurement insights but we don't have clean supplier data to train on.",
          "Everyone's talking about AI in supply chain. We don't want to be late to the game but we also don't want to be guinea pigs.",
        ],
      },
      {
        id: "sc-change", name: "Change Management",
        description: "Change management for supply chain and operations programs, including site readiness and impact assessment, frontline adoption, and supplier and partner change enablement.",
        signals: [
          "We're consolidating suppliers and changing our sourcing approach. We're worried that our procurement team and suppliers will just resist.",
          "We're rolling out a new S&OP process, but the old siloed way of working is deeply embedded.",
          "We're flattening the logistics network and some of our legacy fulfillment folks are going to lose influence. There's going to be pushback.",
        ],
      },
      {
        id: "sc-pmo", name: "Program & Portfolio Management",
        description: "Project, program, and portfolio management for supply chain and operations initiatives, including supply chain PMO, network program leadership, operations portfolio management, and benefits tracking.",
        signals: [
          "We've got supply chain transformation, a tech implementation, and an AI pilot all competing for resources and attention.",
          "Multiple parts of the supply chain are running their own improvement initiatives and we have no visibility or coordination.",
        ],
      },
    ],
  },
  {
    id: "customer",
    name: "Customer & Growth",
    color: "#D6336C",
    bg: "#FDF2F8",
    buyers: ["Chief Revenue Officer", "CMO", "Chief Customer Officer"],
    l3s: [
      {
        id: "cg-growth", name: "Growth Strategy",
        description: "Defines commercial direction and go-to-market choices, including commercial strategy, go-to-market and channel strategy, pricing and revenue growth, and commercial market expansion.",
        signals: [
          "We've got ambitious revenue targets for next year but nobody can explain how we're going to get there.",
          "We keep launching new products/markets but most don't take off. We have no systematic GTM strategy.",
          "Our sales and marketing teams are misaligned on who we're selling to and what message resonates.",
        ],
      },
      {
        id: "cg-cx", name: "Customer Experience",
        description: "Design and improvement of the end-to-end customer experience, including CX strategy, customer journey design, voice of customer, experience measurement, and loyalty experience design.",
        signals: [
          "Our NPS has been sliding for two years. We've done random things to fix it, but nothing sticks.",
          "Customers tell us the same complaints every year. We don't have an end-to-end view of the journey to know where to actually invest.",
          "Our retention numbers are OK, but we're losing our best customers to competitors. Something's off with the experience.",
        ],
      },
      {
        id: "cg-service", name: "Customer Service & Success",
        description: "Design and ongoing delivery of customer service and success, including service strategy, contact center operating model, service and success operations, and retention and renewal management.",
        signals: [
          "Our contact center cost per call keeps going up but handle time and customer satisfaction aren't improving.",
          "Customers are churning and our customer success team is firefighting instead of being proactive.",
          "We're hiring more CS reps every quarter, but we can't seem to handle the volume. Something about how we're organized is broken.",
        ],
      },
      {
        id: "cg-tech", name: "Customer & Growth Technology",
        description: "Advisory on commercial platforms, including CRM strategy and selection, marketing platform strategy, customer service platform advisory, and commercial systems roadmaps.",
        signals: [
          "We've got three different CRM systems and they don't talk to each other. Sales and marketing can't see the same customer view.",
          "We want to replace our CRM but all the vendors say they do everything. We don't know what we actually need.",
          "Our marketing automation is set up, but we're not using it effectively. We need to figure out what the platform can actually do for us.",
        ],
      },
      {
        id: "cg-ai", name: "Customer & Growth AI",
        description: "AI-specific strategy and solution design for commercial functions, including commercial AI strategy, sales and marketing AI use cases, personalization strategy, and AI-enabled customer service.",
        signals: [
          "Our sales team is curious about AI for things like lead scoring or email personalization, but we don't have a prioritized use case.",
          "We have tons of customer data. I know there's value in it with AI, but I don't know where to start.",
          "Our competitors are probably using AI to personalize customer experiences. We're not. We need to figure out how to get ahead.",
        ],
      },
      {
        id: "cg-change", name: "Change Management",
        description: "Change management for commercial programs, including commercial change strategy, sales and marketing readiness, stakeholder communications, and commercial adoption and enablement.",
        signals: [
          "We're rolling out a new sales methodology and we're nervous the team will just keep doing things the old way.",
          "We're moving to customer-centric selling but the org has been product-centric forever. The culture shift is going to be hard.",
          "We restructured the sales org and customer success teams now report differently. There's friction and nobody's talking to each other.",
        ],
      },
      {
        id: "cg-pmo", name: "Program & Portfolio Management",
        description: "Project, program, and portfolio management for commercial initiatives, including customer transformation PMO, commercial program leadership, growth portfolio management, and benefits tracking.",
        signals: [
          "We've got three GTM initiatives, a CRM implementation, and an AI pilot all underway. Nobody's coordinating them.",
          "Customer transformation initiatives are competing for sales team time and we're not prioritizing which ones actually matter.",
        ],
      },
    ],
  },
  {
    id: "people",
    name: "People & Organization",
    color: "#5C6BC0",
    bg: "#EDE9FE",
    buyers: ["CHRO", "Chief People Officer"],
    l3s: [
      {
        id: "po-strategy", name: "Organization Strategy",
        description: "Aligns people and the HR function to business priorities, including people strategy, strategic people planning, future of work strategy, HR function strategy, and organization effectiveness assessment.",
        signals: [
          "The business has changed dramatically but our org structure looks the same as it did five years ago.",
          "We keep talking about the future of work but we don't have any real strategy. Everyone's doing their own thing.",
          "Our people strategy is just HR stuff—recruiting, benefits, learning. It's not connected to what the business actually needs.",
        ],
      },
      {
        id: "po-design", name: "Organization Design",
        description: "HR-led design of organization structures, including roles and decision rights, job architecture, HR operating model, and organization effectiveness design.",
        signals: [
          "We have way too many layers and decisions get stuck in approvals. We need to flatten, but we don't know how without breaking things.",
          "We keep creating new roles and teams, but the organizational chart doesn't reflect how work actually flows.",
          "Some reporting lines make no sense. We've reorganized four times in three years and each time it's a mess for three months.",
        ],
      },
      {
        id: "po-talent", name: "Talent & Leadership",
        description: "Strategies and programs to attract, develop, and retain talent, including talent strategy, leadership and executive development, succession planning, and culture and leadership alignment.",
        signals: [
          "If our three key leaders left tomorrow, we'd be in real trouble. We have no succession plan.",
          "Our high performers are leaving for competitors. Attrition in critical roles is hurting us.",
          "We're promoting talented individual contributors into management roles and they're struggling. We're not building leaders, we're just promoting people.",
        ],
      },
      {
        id: "po-learning", name: "Learning & Capability Development",
        description: "Design, improvement, and ongoing delivery of learning programs, including learning strategy, capability assessment, reskilling strategy, AI readiness and literacy, and learning operating model.",
        signals: [
          "We're investing in learning but we can't point to any business impact. Are people actually getting better?",
          "We need to upskill people on AI, digital, and modern tech. Our current learning approach isn't set up for that.",
          "Our training programs are generic. They're not building the specific capabilities the business needs for the next five years.",
        ],
      },
      {
        id: "po-hrops", name: "HR Operations & Services",
        description: "Design, improvement, and ongoing delivery of HR services, including HR service delivery design, employee lifecycle administration, HR shared services, and HR process improvement.",
        signals: [
          "Our HR team spends all their time on hiring and onboarding. They're not doing anything strategic.",
          "Employees complain that HR is slow and bureaucratic. Simple things like policy questions take forever to resolve.",
          "We've got HR people distributed across the company but it's not clear what they should be doing or how they're contributing.",
        ],
      },
      {
        id: "po-tech", name: "HR Technology",
        description: "Advisory on HR platforms, including HRIS strategy and selection, talent platform advisory, HR systems roadmaps, and people analytics design.",
        signals: [
          "We're evaluating a new HRIS and all the vendors are pitching massive platforms. We don't know what we actually need.",
          "Our current HRIS is ancient and it's killing HR's productivity. We want to replace it but we don't know how to pick the right system.",
          "We want to integrate our learning, talent, and payroll systems but they're all different tools. It's a mess.",
        ],
      },
      {
        id: "po-ai", name: "HR AI",
        description: "AI-specific strategy and solution design for HR, including HR AI strategy, use case prioritization, AI-enabled talent and learning processes, and HR AI adoption roadmaps.",
        signals: [
          "We have tons of employee data. I know there's value there for retention or succession planning, but we don't know where to start.",
          "AI-powered recruiting is probably a thing, but we don't have a strategy for how to use it without creating bias problems.",
          "Everyone's talking about AI for talent. We're curious but we want to be thoughtful about it, not just experiment randomly.",
        ],
      },
      {
        id: "po-change", name: "Change Management",
        description: "Change management for people and organization programs, including change strategy, organization change readiness, culture and behavior adoption, and stakeholder communications.",
        signals: [
          "We're restructuring the organization and we're worried about morale and attrition during the transition.",
          "We're asking people to work differently but there's no change communication or adoption plan. People are confused and frustrated.",
          "We're flattening layers and eliminating some roles. We need a smart change strategy to manage that without losing people we want to keep.",
        ],
      },
      {
        id: "po-pmo", name: "Program & Portfolio Management",
        description: "Project, program, and portfolio management for HR and people initiatives, including people transformation PMO, organization program leadership, HR portfolio management, and benefits tracking.",
        signals: [
          "We've got org restructuring, a talent transformation, and an HRIS implementation all happening at once. There's chaos.",
          "Multiple HR initiatives are underway but we don't know which ones are actually priority or if we have capacity to do them all.",
        ],
      },
    ],
  },
  {
    id: "risk",
    name: "Risk & Compliance",
    color: "#9C2B2B",
    bg: "#FEF2F2",
    buyers: ["Chief Risk Officer", "Chief Compliance Officer", "Chief Audit Executive"],
    l3s: [
      {
        id: "rc-erm", name: "Enterprise Risk Management",
        description: "Design and operation of enterprise risk management, including risk strategy and framework, risk appetite, risk operating model, enterprise risk assessments, risk registers, and monitoring and reporting.",
        signals: [
          "We don't have a common language for risk across the organization. Every function defines and manages risk differently.",
          "The board is asking about our risk appetite and we have no coherent answer. We're just managing point risks.",
          "We have no early warning system for emerging risks. We react to crises, we don't anticipate them.",
        ],
      },
      {
        id: "rc-tprm", name: "Third-Party Risk Management",
        description: "Management of supplier and third-party risk from design through ongoing operation, including frameworks, due diligence, onboarding and risk tiering, ongoing monitoring, remediation, and reporting.",
        signals: [
          "We have hundreds of vendors but we barely vet them, and once they're onboarded we don't monitor them at all.",
          "A key supplier got into financial trouble and we didn't know. We need a real vendor risk program.",
          "We're asking vendors to fill out security questionnaires, but we're not actually using the data to assess or mitigate risk.",
        ],
      },
      {
        id: "rc-resilience", name: "Operational Risk & Resilience",
        description: "Assessment and strengthening of operational resilience, including operational risk assessments, business continuity, scenario exercises, incident readiness, and resilience monitoring.",
        signals: [
          "We have business continuity plans but they're gathering dust. We've never actually tested them.",
          "Our critical systems have no redundancy. If one data center goes down, we're done.",
          "We don't know what would happen if we lost a key facility or our supply chain broke. We're not stress-testing our resilience.",
        ],
      },
      {
        id: "rc-governance", name: "Governance & Controls",
        description: "Design, testing, and modernization of governance and internal controls, including governance frameworks, SOX controls advisory, controls testing and monitoring, and remediation tracking.",
        signals: [
          "Our SOX testing is painful. We're documenting controls that everyone knows aren't actually working, but we're checking the box anyway.",
          "We have so many manual controls. As we scale, we can't add bodies to the process. We need to automate.",
          "We don't know if our controls are actually effective. We're just hoping nothing breaks.",
        ],
      },
      {
        id: "rc-compliance", name: "Compliance & Regulatory",
        description: "Design and operation of compliance programs, including compliance operating model, regulatory change management, policy frameworks, compliance monitoring and testing, financial crime compliance, and remediation.",
        signals: [
          "Regulatory requirements keep changing and our compliance team can't keep up. We're going to miss something.",
          "We don't have continuous visibility into whether we're compliant. We find out in an audit.",
          "Each business unit is interpreting compliance rules differently. We need a consistent compliance framework.",
        ],
      },
      {
        id: "rc-audit", name: "Internal Audit",
        description: "Strategy, transformation, and execution of internal audit, including audit operating model, planning and methodology, audit execution, continuous auditing, and issue follow-up.",
        signals: [
          "Our internal audit team is always behind. They're doing point-in-time audits and by the time they finish, nothing's been fixed.",
          "Internal audit doesn't feel like a partner; they're just finding problems and leaving.",
          "We don't have real-time visibility into audit issues. Findings pile up and nothing gets fixed.",
        ],
      },
      {
        id: "rc-tech", name: "Risk Technology",
        description: "Advisory on risk and compliance platforms, including GRC platform strategy and selection, controls technology roadmaps, third-party risk platform advisory, and risk analytics design.",
        signals: [
          "We're considering a GRC platform but we're not sure what we actually need or what would solve our problems.",
          "Our current risk tools are broken and manual. We want to replace them but we're worried about implementation.",
          "Different functions use different risk tools and none of them talk to each other.",
        ],
      },
      {
        id: "rc-ai", name: "Risk AI",
        description: "AI governance and AI-specific solution design for risk, including AI risk and controls frameworks, AI use cases for risk, intelligent controls design, and AI-enabled compliance and audit.",
        signals: [
          "We're deploying AI and agentic systems but we have no risk framework for it. We don't know what could go wrong.",
          "We want to use AI for monitoring and anomaly detection but we're worried about unintended consequences or bias.",
          "How do we responsibly deploy AI given all the regulatory uncertainty? We don't have a playbook.",
        ],
      },
      {
        id: "rc-change", name: "Change Management",
        description: "Change management for risk and compliance programs, including change strategy, risk culture and adoption, policy change enablement, and controls training and adoption.",
        signals: [
          "We're implementing a new risk management framework and we're worried people will just ignore it because they don't understand the why.",
          "We're changing our compliance processes and there's resistance from business units who think we're slowing them down.",
          "We're rolling out stronger governance and controls, but the culture has been 'move fast and break things.'",
        ],
      },
      {
        id: "rc-pmo", name: "Program & Portfolio Management",
        description: "Project, program, and portfolio management for risk and compliance initiatives, including regulatory program PMO, risk program leadership, risk portfolio management, and remediation governance.",
        signals: [
          "We've got three compliance remediation programs and a tech implementation all competing for resources.",
          "Multiple risk/compliance initiatives are underway but we have no view of which ones are actually critical or how they interact.",
        ],
      },
    ],
  },
];

const PRACTICE_ORDER: PracticeId[] = PRACTICES.map((p) => p.id);
const PRACTICE_BY_ID: Record<PracticeId, Practice> = Object.fromEntries(PRACTICES.map((p) => [p.id, p])) as Record<PracticeId, Practice>;

// Which practice a given buyer title belongs to (for reordering the challenge list)
const BUYER_TO_PRACTICE: Record<string, PracticeId> = Object.fromEntries(
  PRACTICES.flatMap((p) => p.buyers.map((b) => [b, p.id]))
);

const BUYER_GROUPS = PRACTICES.map((p) => ({ group: p.name, options: p.buyers }));

interface SignalEntry {
  id: string;
  practiceId: PracticeId;
  l3: L3Offering;
  quote: string;
}

// Flat list of every individual buying signal (2-3 per L3) — used for both the
// challenge dropdown and the AI free-text matcher.
const ALL_SIGNALS: SignalEntry[] = PRACTICES.flatMap((p) =>
  p.l3s.flatMap((l3) =>
    l3.signals.map((quote, i) => ({ id: `${l3.id}-${i}`, practiceId: p.id, l3, quote }))
  )
);

// Generic shape the match-hub-signal edge function expects (id | tag | shortLabel | quote | hub).
const signals = ALL_SIGNALS.map((s) => ({
  id: s.id,
  tag: s.l3.name,
  shortLabel: s.quote,
  quote: s.quote,
  hub: s.practiceId,
}));

function selectCls(isEmpty: boolean): string {
  return [
    "h-9 rounded-md border border-input bg-background px-3 text-sm",
    "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "cursor-pointer appearance-none pr-8",
    isEmpty ? "text-muted-foreground" : "text-foreground",
  ].join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HubFinder() {
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedSignalId, setSelectedSignalId] = useState<string>("");
  const [freeFormText, setFreeFormText] = useState<string>("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchExplanation, setMatchExplanation] = useState<string | null>(null);
  const [isFreeFormOpen, setIsFreeFormOpen] = useState(false);

  const selectedSignal = ALL_SIGNALS.find((s) => s.id === selectedSignalId) ?? null;
  const selectedPractice = selectedSignal ? PRACTICE_BY_ID[selectedSignal.practiceId] : null;
  const selectedL3 = selectedSignal?.l3 ?? null;

  // Reorder practice groups in the challenge dropdown based on the selected buyer
  const orderedPracticeIds: PracticeId[] =
    selectedBuyer && BUYER_TO_PRACTICE[selectedBuyer]
      ? [BUYER_TO_PRACTICE[selectedBuyer], ...PRACTICE_ORDER.filter((id) => id !== BUYER_TO_PRACTICE[selectedBuyer])]
      : PRACTICE_ORDER;

  const handleBuyerChange = (value: string) => {
    setSelectedBuyer(value);
  };

  const handleSignalChange = (value: string) => {
    setSelectedSignalId(value);
    setMatchExplanation(null);
    setMatchError(null);
  };

  // Free-form AI matcher — sends user text + signal corpus to the edge function
  const handleFreeFormMatch = async () => {
    if (!freeFormText.trim() || isMatching) return;
    setIsMatching(true);
    setMatchError(null);
    setMatchExplanation(null);
    try {
      const { data, error } = await supabase.functions.invoke("match-hub-signal", {
        body: {
          userText: freeFormText.trim(),
          buyerRole: selectedBuyer || undefined,
          signals,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error || "Matching failed");
      setSelectedSignalId(data.signalId);
      setMatchExplanation(data.reason);
      setIsFreeFormOpen(false);
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Management Consulting Service Offering Finder
      </p>
      <h2 className="mb-1 text-xl font-bold text-card-foreground tracking-tight">
        Find Your Starting Point
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Select who you're talking to and what challenge you're hearing — the tool will identify the best-fit service offering to lead your conversation with the client.
      </p>

      {/* Sentence + dropdowns */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium text-foreground">
        <span className="whitespace-nowrap">I am talking with</span>

        <Select value={selectedBuyer} onValueChange={handleBuyerChange}>
          <SelectTrigger className="h-9 w-auto min-w-[220px] text-sm">
            <SelectValue placeholder="select buyer or title..." />
          </SelectTrigger>
          <SelectContent>
            {BUYER_GROUPS.map((g) => (
              <SelectGroup key={g.group}>
                <SelectLabel>{g.group}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <span className="whitespace-nowrap">and am hearing</span>

        <Select value={selectedSignalId} onValueChange={handleSignalChange}>
          <SelectTrigger className="h-9 w-auto min-w-[300px] max-w-[420px] text-sm">
            <SelectValue placeholder="select a challenge or issue..." />
          </SelectTrigger>
          <SelectContent className="max-w-[500px]">
            {orderedPracticeIds.map((practiceId) => {
              const p = PRACTICE_BY_ID[practiceId];
              return (
                <SelectGroup key={practiceId}>
                  <SelectLabel>{p.name}</SelectLabel>
                  {p.l3s.flatMap((l3) =>
                    l3.signals.map((quote, i) => (
                      <SelectItem key={`${l3.id}-${i}`} value={`${l3.id}-${i}`}>
                        {quote}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>

        <span className="whitespace-nowrap font-bold text-sm uppercase tracking-wider text-foreground">
          OR
        </span>
        <button
          onClick={() => { setIsFreeFormOpen(true); setMatchError(null); }}
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Describe the challenge in your own words
        </button>
      </div>

      {/* Result card — shown as soon as a challenge is selected */}
      {selectedL3 && selectedPractice ? (
        <div className="mt-5 rounded-lg border border-border bg-card p-5 space-y-3 fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: selectedPractice.bg, color: selectedPractice.color }}
            >
              {selectedPractice.name}
            </span>
            <h3 className="text-base font-bold" style={{ color: selectedPractice.color }}>{selectedL3.name}</h3>
            {selectedBuyer && (
              <span className="ml-auto text-xs text-muted-foreground">
                Talking with: {selectedBuyer}
              </span>
            )}
          </div>

          <div className="border-l-4 border-primary/40 pl-4">
            <p className="text-sm italic text-muted-foreground">
              "{selectedSignal?.quote}"
            </p>
          </div>

          {matchExplanation && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
              <Wand2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
              {matchExplanation}
            </p>
          )}

          <p className="text-sm text-muted-foreground">{selectedL3.description}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs italic text-muted-foreground/60">
          Select a challenge above to see the recommended service offering.
        </p>
      )}

      {/* Free-form AI matcher modal */}
      <Dialog open={isFreeFormOpen} onOpenChange={setIsFreeFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              Describe the Challenge
            </DialogTitle>
            <DialogDescription>
              Describe what you're hearing from the client in your own words — the AI will match it to the closest offering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Textarea
              value={freeFormText}
              onChange={(e) => { setFreeFormText(e.target.value); setMatchError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFreeFormMatch(); }}
              placeholder="e.g. Our leadership team keeps asking for updated financials but we can't close the books fast enough…"
              className="resize-none text-sm min-h-[100px]"
              autoFocus
            />
            {matchError && (
              <p className="text-xs text-destructive">{matchError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFreeFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFreeFormMatch}
                disabled={!freeFormText.trim() || isMatching}
                size="sm"
                className="gap-1.5"
              >
                {isMatching
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Matching…</>
                  : <><Wand2  className="h-3.5 w-3.5" />Find My Match</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type VerticalId = 'ips' | 'cps' | 'cmet' | 'hls' | 'bfsi' | 'international';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  status: 'pipeline' | 'active' | 'won' | 'closed';
  value?: string;
  practice?: string;
  notes?: string;
  url?: string;
}

export interface Client {
  id: string;
  name: string;
  vertical: VerticalId;
  description?: string;
  opportunities: Opportunity[];
}

export const VERTICALS: Record<VerticalId, { label: string; fullName: string; color: string; description: string }> = {
  ips: {
    label: 'IPS',
    fullName: 'Industrial & Professional Services',
    color: '#2563eb',
    description: 'Industrial manufacturers, engineering firms, and B2B professional services accounts.',
  },
  cps: {
    label: 'CPS',
    fullName: 'Consumer Products & Services',
    color: '#f97316',
    description: 'Consumer goods manufacturers, retail, and direct-to-consumer brands.',
  },
  cmet: {
    label: 'CMET',
    fullName: 'Communications, Media, Energy & Technology',
    color: '#16a34a',
    description: 'Technology platforms, media companies, telecommunications, and energy sector clients.',
  },
  hls: {
    label: 'HLS',
    fullName: 'Health & Life Sciences',
    color: '#7c3aed',
    description: 'Pharmaceutical, medical device, agricultural science, and healthcare system accounts.',
  },
  bfsi: {
    label: 'BFSI',
    fullName: 'Banking, Financial Services & Insurance',
    color: '#dc2626',
    description: 'Banks, asset managers, insurance carriers, and fintech accounts.',
  },
  international: {
    label: "INT'L",
    fullName: 'International',
    color: '#9f1239',
    description: 'EMEA-region and other international accounts outside the primary US verticals.',
  },
};

export const VERTICAL_ORDER: VerticalId[] = ['ips', 'cps', 'cmet', 'hls', 'bfsi', 'international'];

export const CLIENTS: Client[] = [
  {
    id: 'werner-enterprises',
    name: 'Werner Enterprises',
    vertical: 'ips',
    description: 'Large-scale transportation and logistics operator. Active AI governance engagement — June 2026.',
    opportunities: [
      {
        id: 'werner-ai-governance',
        title: 'Governing the Agentic Enterprise',
        description: 'Working session on AI governance operating models as agent development expands beyond IT. Covers shadow AI discovery, operating model design, citizen development enablement, and at-scale governance infrastructure across five capability domains.',
        status: 'pipeline',
        practice: 'AI Governance',
        url: '/werner-governing-agentic-enterprise.html',
      },
    ],
  },
];

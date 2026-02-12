const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.MOCK_BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

const workflowTemplates = {
  audit: [
    {
      name: 'Preplanning',
      steps: [
        'Client Acceptance',
        'Client Planning Discussion',
        'Engagement Letter',
        'PFA',
        'Partner Manager Expectation Discussion',
      ],
    },
    {
      name: 'Planning',
      steps: [
        'Materiality',
        'Job Matrix',
        'Long Planning Form',
        'Understand the Entity',
        'IT Review Scope Request',
        'Tax Return Assistance Request',
        'Audit Strategy Memo',
        'Entity Research',
        'PBC Request',
        'Partner Planning Signoff',
      ],
    },
    {
      name: 'Preliminary Administration',
      steps: [
        'Status Meeting',
        'Job Matrix Update',
        'Issues Matrix Update',
        'Job Status Reporting',
        'Coordination',
        'Senior Workpaper Review',
        'Manager Workpaper Review',
        'Partner Workpaper Review',
      ],
    },
    {
      name: 'Evaluation and Test of Controls',
      steps: [
        'Summary of Controls Testing',
        'Summary of Testing Exceptions',
        'Entity Level Controls',
        'Understand and Walk Through Key Controls',
        'Test Key Controls',
        'IT Controls Review and Documentation',
        'IT Controls Signoff Memo',
        'Revenue Recognition Understanding',
        'Clearance of Review Points',
        'Sign Off on Controls Environment and Reliance',
      ],
    },
    {
      name: 'FTT',
      steps: [
        'Prior Auditor Discussion',
        'Prior Auditor Letter',
        'FTT Program',
        'Organizational Documents',
        'Review of Prior Auditor Workpapers',
        'Review and Documentation of Beginning Balances',
        'Review of Prior Minutes',
        'Review of Prior Reports',
      ],
    },
    {
      name: 'Final Administration',
      steps: [
        'Status Meeting',
        'Job Matrix Update',
        'Issues Matrix Update',
        'Job Status Reporting',
        'Management Recommendations Listing',
        'Coordination',
        'Client Status Meetings',
        'Weekly Partner Status Meetings',
        'Manager Review Preparation',
        'Partner Review Preparation',
        'Senior Workpaper Review',
        'Manager Workpaper Review',
        'Partner Workpaper Review',
      ],
    },
    {
      name: 'FMA FCR',
      steps: [
        'Financial Close Evaluation',
        'FMA - Assets',
        'FMA - Liabilities and Equity',
        'FMA - Revenue',
        'FMA - Expenses',
        'Sign off on FMA FCR',
      ],
    },
    {
      name: 'Substantive Testing',
      steps: [
        'Assets Testing',
        'Liabilities Testing',
        'Equity Testing',
        'Sign off on Balance Sheet',
        'Revenue Testing',
        'Expenses Testing',
        'Signoff on Operating Statement',
        'Taxes Testing',
        'Sign off on Tax Compliance',
        'Footnote Testing',
        'Signoff of Footnote Disclosures',
      ],
    },
    {
      name: 'GAAS Compliance',
      steps: [
        'Representation Letters',
        'Minutes Review and Representation',
        'Legal Letters',
        'Fraud Review/Documentation',
        'Subsequent Events',
        'Review of Journal Entries',
        'Related Party',
        'Review Status of Prior Recommendations',
        'Review All Internal Reports',
        'Non-attest services',
        'Financial Performance Review',
        'Summary of Exceptions',
      ],
    },
    {
      name: 'Financial Reporting',
      steps: [
        'Trial Balance Mapping',
        'Adjustments Signoff and Review',
        'Summary of Proposed Adjustments',
        'Footnote Support',
        'Financial Statements Tie Outs',
        'Cash Flow Test',
        'Draft Financial Statements',
        'Final Audit Strategy Memo',
        'Issues Research and Documentation',
        'Governance Letter/Board Presentation',
        'Management Comment Letter',
      ],
    },
    {
      name: 'Financial Statement Preparation and Quality Review',
      steps: [
        'Senior Review',
        'Manager Review',
        'Partner Review',
        'Preformatting',
        'Proofreading',
        'Referencing',
        'Concurring Partner Review',
        'CPO/CEO Review',
        'Clearance of Comments',
        'Client Draft and Comments Clearance',
      ],
    },
    {
      name: 'Other Reports',
      steps: [
        'Draft Reports',
        'Ensure Report Scope Document Completed',
        'Ensure Engagement Letter Coverage for Each',
        'Ensure Representation Coverage for Each',
        'Engagement Team Reviews',
        'Concurring Partner Review',
        'Proofreading',
        'Referencing',
        'Client Draft and Comments Clearance',
      ],
    },
    {
      name: 'Wrap Up',
      steps: [
        'Signoff on Workpapers',
        'Close Binder',
        'Final Actual/Budget Documentation',
        'Prepare Engagement Evaluations',
      ],
    },
  ],
  tax: [
    {
      name: 'Planning and Cooperation',
      steps: ['Data request sent', 'Client kickoff', 'Calendar confirmation'],
    },
    {
      name: 'Calculation and Workpaper Support',
      steps: ['Prepare workpapers', 'Tax calculation', 'Variance checks'],
    },
    {
      name: 'Manager Return Review',
      steps: ['Manager review', 'Adjustments incorporated'],
    },
    {
      name: 'Quality Review',
      steps: ['QC checklist', 'Compliance checks'],
    },
    {
      name: 'Return Approval for Filing',
      steps: ['Partner approval', 'Client sign off'],
    },
    {
      name: 'Process Return',
      steps: ['File return', 'Archive filing evidence'],
    },
  ],
};

const validRoles = ['Admin Leader', 'Audit Leader', 'Tax Leader', 'Engagement Manager', 'Partner'];
const validDomains = ['audit', 'tax', 'both'];
const validUserStatuses = ['Active', 'Inactive'];

let users = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah.johnson@sbc.com', role: 'Admin Leader', domain: 'both', status: 'Active' },
  { id: 'u2', name: 'Michael Chen', email: 'michael.chen@sbc.com', role: 'Audit Leader', domain: 'audit', status: 'Active' },
  { id: 'u3', name: 'Nadia Patel', email: 'nadia.patel@sbc.com', role: 'Tax Leader', domain: 'tax', status: 'Active' },
  { id: 'u4', name: 'Amelia Davis', email: 'amelia.davis@sbc.com', role: 'Engagement Manager', domain: 'both', status: 'Inactive' },
  { id: 'u5', name: 'Daniel Ruiz', email: 'daniel.ruiz@sbc.com', role: 'Partner', domain: 'audit', status: 'Active' },
];

const clients = [
  { id: 'c1', name: 'Acme Corporation', industry: 'Manufacturing', primaryContact: 'John Miller', email: 'john@acme.com', phone: '+1-555-1001', notes: '' },
  { id: 'c2', name: 'Healthcare Partners', industry: 'Healthcare', primaryContact: 'Lisa Morgan', email: 'lisa@hcp.com', phone: '+1-555-1002', notes: '' },
  { id: 'c3', name: 'Retail Chain Inc', industry: 'Retail', primaryContact: 'Evan Brooks', email: 'evan@retailchain.com', phone: '+1-555-1003', notes: '' },
  { id: 'c4', name: 'TechStart Inc', industry: 'Technology', primaryContact: 'Irene Shaw', email: 'irene@techstart.com', phone: '+1-555-1004', notes: '' },
];

let engagements = [];
const clientHistory = new Map();

function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusColor(status) {
  if (status === 'Overdue') return 'red';
  if (status === 'At Risk') return 'yellow';
  return 'green';
}

function buildStages(type) {
  const templates = workflowTemplates[type];
  const start = new Date();
  return templates.map((stage, idx) => {
    const stageStart = new Date(start);
    stageStart.setDate(stageStart.getDate() + idx * 5);
    const stageEnd = new Date(stageStart);
    stageEnd.setDate(stageEnd.getDate() + 5);

    return {
      id: `${type}-s-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
      name: stage.name,
      targetStart: stageStart.toISOString().slice(0, 10),
      targetEnd: stageEnd.toISOString().slice(0, 10),
      enabled: false,
      status: 'Not Started',
      lastUpdated: nowIso(),
      steps: stage.steps.map((stepName, stepIdx) => ({
        id: `${type}-st-${idx + 1}-${stepIdx + 1}-${Math.random().toString(36).slice(2, 6)}`,
        name: stepName,
        enabled: false,
        status: 'Not Started',
        targetStart: stageStart.toISOString().slice(0, 10),
        targetEnd: stageEnd.toISOString().slice(0, 10),
        actualStart: '',
        actualEnd: '',
        comment: '',
        delayReason: '',
      })),
    };
  });
}

function logHistory(engagement, field, previousValue, newValue, user, comment = '') {
  engagement.history.unshift({
    id: `h-${Math.random().toString(36).slice(2, 8)}`,
    field,
    previousValue,
    newValue,
    user,
    comment,
    changedAt: nowIso(),
  });
}

function logClientHistory(clientId, title, details, performedBy = 'System') {
  const current = clientHistory.get(clientId) || [];
  current.unshift({
    id: `ch-${Math.random().toString(36).slice(2, 8)}`,
    title,
    details,
    performedBy,
    changedAt: nowIso(),
  });
  clientHistory.set(clientId, current.slice(0, 60));
}

function computeStepStatus(step) {
  const today = new Date().toISOString().slice(0, 10);
  if (step.status === 'Completed') return 'Completed';
  if (step.status === 'On Hold') return 'On Hold';
  if (today > step.targetEnd) return 'Overdue';
  return step.status;
}

function recalculate(engagement) {
  const today = new Date().toISOString().slice(0, 10);

  engagement.stages.forEach((stage) => {
    stage.steps.forEach((step) => {
      step.status = computeStepStatus(step);
    });

    const total = stage.steps.length;
    const completed = stage.steps.filter((s) => s.status === 'Completed').length;
    const hasOverdue = stage.steps.some((s) => s.status === 'Overdue');
    const hasInProgress = stage.steps.some((s) => s.status === 'In Progress');
    const hasOnHold = stage.steps.some((s) => s.status === 'On Hold');

    if (completed === total && total > 0) {
      stage.status = 'Completed';
    } else if (hasOverdue) {
      stage.status = 'Overdue';
    } else if (hasOnHold) {
      stage.status = 'At Risk';
    } else if (hasInProgress || completed > 0) {
      stage.status = 'In Progress';
    } else {
      stage.status = 'Not Started';
    }
    stage.lastUpdated = nowIso();
  });

  const hasOverdueStage = engagement.stages.some((s) => s.status === 'Overdue');
  const hasRiskStage = engagement.stages.some((s) => s.status === 'At Risk' || s.status === 'In Progress');
  const allCompleted = engagement.stages.every((s) => s.status === 'Completed');

  if (allCompleted) {
    engagement.status = 'Closed';
    engagement.closed = true;
  } else if (today > engagement.requiredDate || hasOverdueStage) {
    engagement.status = 'Overdue';
  } else {
    const targetDiffDays = Math.ceil((new Date(engagement.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (targetDiffDays <= 7 || hasRiskStage) {
      engagement.status = 'At Risk';
    } else {
      engagement.status = 'On Track';
    }
  }
}

function getCurrentStageName(engagement) {
  const stage = engagement.stages.find((s) => s.status !== 'Completed') || engagement.stages[engagement.stages.length - 1];
  return stage ? stage.name : 'Not Started';
}

function seedEngagements() {
  const seeded = [
    ['e1', 'c1', 'audit', 'FY2025 Audit', 'FY2025', 20, 12, 'u2'],
    ['e2', 'c2', 'audit', 'Interim Audit', 'Q4 2025', 10, 6, 'u4'],
    ['e3', 'c3', 'audit', 'Q3 Audit', 'Q3 2025', -3, -8, 'u4'],
    ['e4', 'c1', 'tax', 'Q4 Tax Review', 'Q4 2025', 15, 8, 'u3'],
    ['e5', 'c4', 'tax', 'FY2025 Tax Filing', 'FY2025', 5, 2, 'u3'],
    ['e6', 'c2', 'tax', 'Annual Tax', 'FY2025', -2, -4, 'u4'],
  ];

  engagements = seeded.map(([id, clientId, type, name, period, reqOffset, tgtOffset, managerId], index) => {
    const item = {
      id,
      clientId,
      type,
      name,
      period,
      requiredDate: daysFromNow(reqOffset),
      targetDate: daysFromNow(tgtOffset),
      managerId,
      notes: '',
      status: 'On Track',
      closed: false,
      stages: buildStages(type),
      history: [],
      createdAt: nowIso(),
    };

    const typeOrder = seeded.filter(([, , t]) => t === type).map(([seedId]) => seedId);
    const typeIndex = typeOrder.indexOf(id);
    const targetStageByType = {
      audit: [0, 1, 2, 3, 4],
      tax: [0, 1, 2, 3, 4, 5],
    };
    const defaultTarget = Math.min(item.stages.length - 1, typeIndex);
    const targetStageIndex =
      targetStageByType[type][typeIndex] !== undefined
        ? Math.min(item.stages.length - 1, targetStageByType[type][typeIndex])
        : defaultTarget;

    item.stages.forEach((stage, stageIdx) => {
      stage.steps.forEach((step, stepIdx) => {
        if (stageIdx < targetStageIndex) {
          stage.enabled = true;
          step.status = 'Completed';
          step.enabled = true;
          step.actualStart = daysFromNow(-16 + stageIdx);
          step.actualEnd = daysFromNow(-14 + stageIdx);
        } else if (stageIdx === targetStageIndex) {
          stage.enabled = true;
          const mode = index % 3;
          if (mode === 0 && stepIdx === 0) {
            step.status = 'In Progress';
            step.enabled = true;
            step.actualStart = daysFromNow(-2);
          } else if (mode === 1 && stepIdx === 0) {
            step.status = 'On Hold';
            step.enabled = true;
            step.actualStart = daysFromNow(-3);
            step.comment = 'Waiting for client documents';
          } else if (mode === 2 && stepIdx === 0) {
            step.status = 'Not Started';
            step.enabled = true;
            step.targetEnd = daysFromNow(-2);
            step.delayReason = 'Dependency overdue';
          }
        }
      });
    });

    recalculate(item);
    return item;
  });
}

seedEngagements();

clients.forEach((client) => {
  clientHistory.set(client.id, [
    {
      id: `ch-seed-${client.id}-1`,
      title: 'Client email updated',
      details: `Email : old@acme.com -> ${client.email}`,
      performedBy: 'Sarah Johnson',
      changedAt: nowIso(),
    },
    {
      id: `ch-seed-${client.id}-2`,
      title: 'Client profile reviewed',
      details: `Industry : ${client.industry}`,
      performedBy: 'System',
      changedAt: nowIso(),
    },
  ]);
});

function enrichEngagement(engagement) {
  const client = clients.find((c) => c.id === engagement.clientId);
  const manager = users.find((u) => u.id === engagement.managerId);
  const currentStage = getCurrentStageName(engagement);
  return {
    ...engagement,
    clientName: client ? client.name : '-',
    primaryContact: client ? client.primaryContact : '',
    clientEmail: client ? client.email : '',
    managerName: manager ? manager.name : '-',
    currentStage,
    stageColor: statusColor(engagement.status),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', now: nowIso() });
});

app.get('/api/dashboard', (req, res) => {
  const moduleRaw = (req.query.module || 'audit').toString().toLowerCase();
  const requestedModule = moduleRaw === 'tax' ? 'tax' : 'audit';
  const effectiveModule = requestedModule;
  const items = engagements.filter((e) => e.type === effectiveModule);

  const stats = {
    total: items.length,
    onTrack: items.filter((e) => e.status === 'On Track').length,
    atRisk: items.filter((e) => e.status === 'At Risk').length,
    overdue: items.filter((e) => e.status === 'Overdue').length,
  };

  const stageMap = new Map();
  items.forEach((engagement) => {
    const stageName = getCurrentStageName(engagement);
    stageMap.set(stageName, (stageMap.get(stageName) || 0) + 1);
  });

  const stageTemplates = workflowTemplates[effectiveModule] || [];
  const maxCount = Math.max(...stageTemplates.map((stage) => stageMap.get(stage.name) || 0), 1);
  const stages = stageTemplates.map((stage) => {
    const count = stageMap.get(stage.name) || 0;
    return {
      name: stage.name,
      count,
      percent: count === 0 ? 8 : Math.round((count / maxCount) * 100),
    };
  });

  const upcoming = items
    .map((e) => enrichEngagement(e))
    .sort((a, b) => a.requiredDate.localeCompare(b.requiredDate))
    .slice(0, 5)
    .map((e) => {
      const diff = Math.ceil((new Date(e.requiredDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: e.id,
        client: e.clientName,
        engagement: e.name,
        dueText: diff < 0 ? `${Math.abs(diff)} days overdue` : `${diff} days remaining`,
        isOverdue: diff < 0,
        progress: Math.max(10, 100 - Math.abs(diff) * 5),
      };
    });

  const summary = items.slice(0, 8).map((e) => {
    const detail = enrichEngagement(e);
    return {
      id: detail.id,
      clientId: detail.clientId,
      client: detail.clientName,
      engagement: detail.name,
      stage: detail.currentStage,
      status: detail.status,
      manager: detail.managerName,
    };
  });

  res.json({ module: requestedModule, stats, stages, upcoming, summary });
});

app.get('/api/clients', (_req, res) => {
  const data = clients.map((client) => {
    const related = engagements.filter((e) => e.clientId === client.id);
    return {
      ...client,
      engagementCount: related.length,
      statusSummary: {
        onTrack: related.filter((e) => e.status === 'On Track').length,
        atRisk: related.filter((e) => e.status === 'At Risk').length,
        overdue: related.filter((e) => e.status === 'Overdue').length,
      },
      engagementManager: related.length > 0 ? (users.find((u) => u.id === related[0].managerId)?.name || '-') : '-',
    };
  });
  res.json(data);
});

app.get('/api/clients/:id', (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const clientEngagements = engagements
    .filter((e) => e.clientId === client.id)
    .map((e) => enrichEngagement(e))
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  const statusSummary = {
    onTrack: clientEngagements.filter((e) => e.status === 'On Track').length,
    atRisk: clientEngagements.filter((e) => e.status === 'At Risk').length,
    overdue: clientEngagements.filter((e) => e.status === 'Overdue').length,
  };

  const managerNames = Array.from(
    new Set(clientEngagements.map((e) => e.managerName).filter((name) => Boolean(name && name !== '-'))),
  );

  return res.json({
    ...client,
    engagementCount: clientEngagements.length,
    statusSummary,
    engagementManager: managerNames[0] || '-',
    engagements: clientEngagements,
  });
});

app.get('/api/clients/:id/history', (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const clientItems = clientHistory.get(client.id) || [];
  const engagementItems = engagements
    .filter((engagement) => engagement.clientId === client.id)
    .flatMap((engagement) =>
      (engagement.history || []).map((item) => ({
        id: `${engagement.id}-${item.id}`,
        title: `${engagement.name}: ${item.field}`,
        details: `${item.previousValue} -> ${item.newValue}`,
        performedBy: item.user || 'System',
        changedAt: item.changedAt || nowIso(),
      })),
    )
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  return res.json({
    client: clientItems,
    engagements: engagementItems,
  });
});

app.post('/api/clients', (req, res) => {
  const { name, industry, primaryContact, email, phone, notes } = req.body;
  if (!name || !industry) {
    return res.status(400).json({ message: 'name and industry are required' });
  }
  const client = {
    id: `c${clients.length + 1}`,
    name,
    industry,
    primaryContact: primaryContact || '',
    email: email || '',
    phone: phone || '',
    notes: notes || '',
  };
  clients.push(client);
  logClientHistory(client.id, 'Client created', `Client : ${client.name}`, 'Current User');
  return res.status(201).json(client);
});

app.patch('/api/clients/:id', (req, res) => {
  const idx = clients.findIndex((c) => c.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const current = clients[idx];
  const next = { ...current };
  const changeLogs = [];

  if (typeof req.body.name === 'string') {
    const value = req.body.name.trim();
    if (!value) {
      return res.status(400).json({ message: 'name cannot be empty' });
    }
    next.name = value;
    if (value !== current.name) {
      changeLogs.push({ title: 'Client name updated', details: `Name : ${current.name} -> ${value}` });
    }
  }

  if (typeof req.body.industry === 'string') {
    const value = req.body.industry.trim();
    if (!value) {
      return res.status(400).json({ message: 'industry cannot be empty' });
    }
    next.industry = value;
    if (value !== current.industry) {
      changeLogs.push({ title: 'Client industry updated', details: `Industry : ${current.industry} -> ${value}` });
    }
  }

  if (typeof req.body.primaryContact === 'string') {
    next.primaryContact = req.body.primaryContact.trim();
  }

  if (typeof req.body.email === 'string') {
    const value = req.body.email.trim();
    next.email = value;
    if (value !== current.email) {
      changeLogs.push({ title: 'Client email updated', details: `Email : ${current.email} -> ${value}` });
    }
  }

  if (typeof req.body.phone === 'string') {
    next.phone = req.body.phone.trim();
  }

  if (typeof req.body.notes === 'string') {
    next.notes = req.body.notes.trim();
  }

  clients[idx] = next;
  changeLogs.forEach((entry) => logClientHistory(next.id, entry.title, entry.details, 'Sarah Johnson'));
  return res.json(next);
});

app.get('/api/engagements', (req, res) => {
  const moduleType = (req.query.module || '').toString();
  const status = (req.query.status || '').toString();
  const stage = (req.query.stage || '').toString();
  const search = (req.query.search || '').toString().toLowerCase();

  let items = engagements.map((e) => enrichEngagement(e));

  if (moduleType) {
    items = items.filter((e) => e.type === moduleType);
  }
  if (status && status !== 'All') {
    items = items.filter((e) => e.status === status);
  }
  if (stage) {
    items = items.filter((e) => e.currentStage === stage);
  }
  if (search.length >= 3) {
    items = items.filter((e) =>
      e.name.toLowerCase().includes(search) ||
      e.clientName.toLowerCase().includes(search),
    );
  }

  items.sort((a, b) => a.targetDate.localeCompare(b.targetDate) || a.name.localeCompare(b.name));

  res.json({
    total: items.length,
    statusCounts: {
      All: items.length,
      Overdue: items.filter((e) => e.status === 'Overdue').length,
      'At Risk': items.filter((e) => e.status === 'At Risk').length,
      'On Track': items.filter((e) => e.status === 'On Track').length,
    },
    items,
  });
});

app.post('/api/engagements', (req, res) => {
  const { clientId, type, name, period, requiredDate, targetDate, managerId } = req.body;
  if (!clientId || !type || !name || !requiredDate || !targetDate || !managerId) {
    return res.status(400).json({ message: 'clientId, type, name, requiredDate, targetDate, managerId are required' });
  }

  const engagement = {
    id: `e${engagements.length + 1}`,
    clientId,
    type,
    name,
    period: period || '',
    requiredDate,
    targetDate,
    managerId,
    notes: '',
    status: 'On Track',
    closed: false,
    stages: buildStages(type),
    history: [],
    createdAt: nowIso(),
  };

  recalculate(engagement);
  logHistory(engagement, 'Engagement Created', '-', `${engagement.name} (${engagement.type})`, 'System');
  logClientHistory(
    engagement.clientId,
    'Engagement added',
    `Engagement : ${engagement.name} (${engagement.type.toUpperCase()})`,
    'System',
  );
  engagements.unshift(engagement);
  res.status(201).json(enrichEngagement(engagement));
});

app.get('/api/engagements/:id', (req, res) => {
  const engagement = engagements.find((e) => e.id === req.params.id);
  if (!engagement) {
    return res.status(404).json({ message: 'Engagement not found' });
  }
  return res.json(enrichEngagement(engagement));
});

app.get('/api/engagements/:id/history', (req, res) => {
  const engagement = engagements.find((e) => e.id === req.params.id);
  if (!engagement) {
    return res.status(404).json({ message: 'Engagement not found' });
  }
  return res.json(engagement.history);
});

app.patch('/api/engagements/:id/steps/:stepId', (req, res) => {
  const engagement = engagements.find((e) => e.id === req.params.id);
  if (!engagement) {
    return res.status(404).json({ message: 'Engagement not found' });
  }

  if (engagement.closed) {
    return res.status(400).json({ message: 'Closed engagements are read-only' });
  }

  const { status, actualStart, actualEnd, comment, delayReason } = req.body;

  let targetStep;
  engagement.stages.forEach((stage) => {
    const found = stage.steps.find((s) => s.id === req.params.stepId);
    if (found) {
      targetStep = found;
    }
  });

  if (!targetStep) {
    return res.status(404).json({ message: 'Step not found' });
  }

  if (status === 'Completed' && !actualEnd) {
    return res.status(400).json({ message: 'actualEnd is required when step is completed' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const isPastTarget = today > targetStep.targetEnd;
  if ((status === 'On Hold' || isPastTarget || status === 'Overdue') && !comment && !delayReason) {
    return res.status(400).json({ message: 'comment or delayReason is required for On Hold/Overdue steps' });
  }

  const prev = { ...targetStep };
  targetStep.status = status || targetStep.status;

  if (targetStep.status === 'In Progress' && !targetStep.actualStart) {
    targetStep.actualStart = today;
  }

  if (actualStart) targetStep.actualStart = actualStart;
  if (actualEnd) targetStep.actualEnd = actualEnd;
  if (comment) targetStep.comment = comment;
  if (delayReason) targetStep.delayReason = delayReason;

  recalculate(engagement);
  logHistory(
    engagement,
    `Step: ${targetStep.name}`,
    prev.status,
    targetStep.status,
    'Current User',
    comment || delayReason || '',
  );

  res.json(enrichEngagement(engagement));
});

app.patch('/api/engagements/:id/stages/:stageId/config', (req, res) => {
  const engagement = engagements.find((e) => e.id === req.params.id);
  if (!engagement) {
    return res.status(404).json({ message: 'Engagement not found' });
  }

  if (engagement.closed) {
    return res.status(400).json({ message: 'Closed engagements are read-only' });
  }

  const stage = engagement.stages.find((s) => s.id === req.params.stageId);
  if (!stage) {
    return res.status(404).json({ message: 'Stage not found' });
  }

  const prev = {
    enabled: stage.enabled !== false,
    targetStart: stage.targetStart,
    targetEnd: stage.targetEnd,
    tasks: stage.steps.map((step) => ({ id: step.id, enabled: step.enabled !== false })),
  };

  if (typeof req.body.enabled === 'boolean') {
    stage.enabled = req.body.enabled;
  }

  if (typeof req.body.targetStart === 'string' && req.body.targetStart) {
    stage.targetStart = req.body.targetStart;
    stage.steps.forEach((step) => {
      step.targetStart = req.body.targetStart;
    });
  }

  if (typeof req.body.targetEnd === 'string' && req.body.targetEnd) {
    stage.targetEnd = req.body.targetEnd;
    stage.steps.forEach((step) => {
      step.targetEnd = req.body.targetEnd;
    });
  }

  if (Array.isArray(req.body.tasks)) {
    req.body.tasks.forEach((taskPatch) => {
      const step = stage.steps.find((s) => s.id === taskPatch.id);
      if (!step) return;
      if (typeof taskPatch.enabled === 'boolean') {
        step.enabled = taskPatch.enabled;
      }
      if (typeof taskPatch.targetStart === 'string' && taskPatch.targetStart) {
        step.targetStart = taskPatch.targetStart;
      }
      if (typeof taskPatch.targetEnd === 'string' && taskPatch.targetEnd) {
        step.targetEnd = taskPatch.targetEnd;
      }
    });
  }

  stage.lastUpdated = nowIso();
  recalculate(engagement);
  logHistory(
    engagement,
    `Stage Config: ${stage.name}`,
    JSON.stringify(prev),
    JSON.stringify({
      enabled: stage.enabled !== false,
      targetStart: stage.targetStart,
      targetEnd: stage.targetEnd,
      tasks: stage.steps.map((step) => ({
        id: step.id,
        enabled: step.enabled !== false,
        targetStart: step.targetStart,
        targetEnd: step.targetEnd,
      })),
    }),
    'Current User',
    req.body.comment || 'Stage configuration updated',
  );

  return res.json(enrichEngagement(engagement));
});

app.get('/api/reports', (_req, res) => {
  res.json([
    { id: 'r1', name: 'Engagement Progress Report', generatedOn: nowIso(), module: 'Audit' },
    { id: 'r2', name: 'Overdue Engagements', generatedOn: nowIso(), module: 'Both' },
    { id: 'r3', name: 'Stage Bottlenecks', generatedOn: nowIso(), module: 'Tax' },
    { id: 'r4', name: 'Client Performance Summary', generatedOn: nowIso(), module: 'Both' },
  ]);
});

app.get('/api/users', (_req, res) => {
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  res.json(sorted);
});

app.post('/api/users', (req, res) => {
  const { name, email, role, domain, status, avatar } = req.body;
  const trimmedName = (name || '').toString().trim();
  const trimmedEmail = (email || '').toString().trim().toLowerCase();
  const normalizedRole = (role || '').toString().trim();
  const normalizedDomain = (domain || '').toString().trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || !normalizedRole || !normalizedDomain) {
    return res.status(400).json({ message: 'name, email, role and domain are required' });
  }

  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({ message: 'invalid role' });
  }

  if (!validDomains.includes(normalizedDomain)) {
    return res.status(400).json({ message: 'invalid domain' });
  }

  const normalizedStatus = typeof status === 'string' ? status.trim() : 'Active';
  if (!validUserStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'invalid status' });
  }

  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    return res.status(409).json({ message: 'email already exists' });
  }

  const numericIds = users
    .map((u) => Number.parseInt(u.id.replace('u', ''), 10))
    .filter((id) => Number.isFinite(id));
  const nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1;

  const user = {
    id: `u${nextId}`,
    name: trimmedName,
    email: trimmedEmail,
    role: normalizedRole,
    domain: normalizedDomain,
    status: normalizedStatus,
    avatar: typeof avatar === 'string' ? avatar : '',
  };

  users.push(user);
  return res.status(201).json(user);
});

app.patch('/api/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existing = users[idx];
  const next = { ...existing };

  if (typeof req.body.name === 'string') {
    const value = req.body.name.trim();
    if (!value) {
      return res.status(400).json({ message: 'name cannot be empty' });
    }
    next.name = value;
  }

  if (typeof req.body.email === 'string') {
    const value = req.body.email.trim().toLowerCase();
    if (!value) {
      return res.status(400).json({ message: 'email cannot be empty' });
    }
    const hasDuplicate = users.some((u) => u.id !== existing.id && u.email.toLowerCase() === value);
    if (hasDuplicate) {
      return res.status(409).json({ message: 'email already exists' });
    }
    next.email = value;
  }

  if (typeof req.body.role === 'string') {
    const value = req.body.role.trim();
    if (!validRoles.includes(value)) {
      return res.status(400).json({ message: 'invalid role' });
    }
    next.role = value;
  }

  if (typeof req.body.domain === 'string') {
    const value = req.body.domain.trim().toLowerCase();
    if (!validDomains.includes(value)) {
      return res.status(400).json({ message: 'invalid domain' });
    }
    next.domain = value;
  }

  if (typeof req.body.status === 'string') {
    const value = req.body.status.trim();
    if (!validUserStatuses.includes(value)) {
      return res.status(400).json({ message: 'invalid status' });
    }
    next.status = value;
  }

  if (typeof req.body.avatar === 'string') {
    next.avatar = req.body.avatar;
  }

  users[idx] = next;
  return res.json(next);
});

app.listen(PORT, () => {
  console.log(`Mock backend running on http://localhost:${PORT}`);
});

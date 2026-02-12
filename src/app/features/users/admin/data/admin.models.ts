export type ModuleType = 'audit' | 'tax';

export type EngagementStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Closed';

export interface DashboardResponse {
  module: ModuleType;
  stats: {
    total: number;
    onTrack: number;
    atRisk: number;
    overdue: number;
  };
  stages: Array<{ name: string; count: number; percent: number }>;
  upcoming: Array<{
    id: string;
    client: string;
    engagement: string;
    dueText: string;
    isOverdue: boolean;
    progress: number;
  }>;
  summary: Array<{
    id: string;
    clientId: string;
    client: string;
    engagement: string;
    stage: string;
    status: EngagementStatus;
    manager: string;
  }>;
}

export interface ClientModel {
  id: string;
  name: string;
  industry: string;
  primaryContact: string;
  email: string;
  phone: string;
  notes: string;
  engagementCount: number;
  statusSummary: {
    onTrack: number;
    atRisk: number;
    overdue: number;
  };
  engagementManager: string;
}

export interface ClientDetailModel extends ClientModel {
  engagements: EngagementModel[];
}

export interface ClientHistoryResponse {
  client: Array<{
    id: string;
    title: string;
    details: string;
    performedBy: string;
    changedAt: string;
  }>;
  engagements: Array<{
    id: string;
    title: string;
    details: string;
    performedBy: string;
    changedAt: string;
  }>;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  role: string;
  domain: string;
  status?: 'Active' | 'Inactive';
  avatar?: string;
}

export interface EngagementStep {
  id: string;
  name: string;
  enabled?: boolean;
  status: string;
  targetStart: string;
  targetEnd: string;
  actualStart: string;
  actualEnd: string;
  comment: string;
  delayReason: string;
}

export interface EngagementStage {
  id: string;
  name: string;
  enabled?: boolean;
  status: string;
  targetStart: string;
  targetEnd: string;
  lastUpdated: string;
  steps: EngagementStep[];
}

export interface EngagementModel {
  id: string;
  clientId: string;
  clientName: string;
  primaryContact?: string;
  clientEmail?: string;
  managerId: string;
  managerName: string;
  type: ModuleType;
  name: string;
  period: string;
  requiredDate: string;
  targetDate: string;
  status: EngagementStatus;
  currentStage: string;
  notes: string;
  closed: boolean;
  stages: EngagementStage[];
}

export interface EngagementListResponse {
  total: number;
  statusCounts: Record<string, number>;
  items: EngagementModel[];
}

export interface HistoryItem {
  id: string;
  field: string;
  previousValue: string;
  newValue: string;
  user: string;
  comment: string;
  changedAt: string;
}

export interface ReportModel {
  id: string;
  name: string;
  generatedOn: string;
  module: string;
}

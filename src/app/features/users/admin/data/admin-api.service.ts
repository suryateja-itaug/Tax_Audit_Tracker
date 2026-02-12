import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ClientDetailModel,
  ClientHistoryResponse,
  ClientModel,
  DashboardResponse,
  EngagementListResponse,
  EngagementModel,
  HistoryItem,
  ModuleType,
  ReportModel,
  UserModel,
} from './admin.models';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  getDashboard(module: ModuleType): Observable<DashboardResponse> {
    const params = new HttpParams().set('module', module);
    return this.http.get<DashboardResponse>(`${this.baseUrl}/dashboard`, { params });
  }

  getClients(): Observable<ClientModel[]> {
    return this.http.get<ClientModel[]>(`${this.baseUrl}/clients`);
  }

  getClientById(clientId: string): Observable<ClientDetailModel> {
    return this.http.get<ClientDetailModel>(`${this.baseUrl}/clients/${clientId}`);
  }

  createClient(payload: {
    name: string;
    industry: string;
    primaryContact: string;
    email: string;
    phone: string;
    notes: string;
  }): Observable<ClientModel> {
    return this.http.post<ClientModel>(`${this.baseUrl}/clients`, payload);
  }

  updateClient(
    clientId: string,
    payload: Partial<{
      name: string;
      industry: string;
      primaryContact: string;
      email: string;
      phone: string;
      notes: string;
    }>,
  ): Observable<ClientModel> {
    return this.http.patch<ClientModel>(`${this.baseUrl}/clients/${clientId}`, payload);
  }

  getClientHistory(clientId: string): Observable<ClientHistoryResponse> {
    return this.http.get<ClientHistoryResponse>(`${this.baseUrl}/clients/${clientId}/history`);
  }

  getEngagements(filters: {
    module?: ModuleType;
    status?: string;
    stage?: string;
    search?: string;
  }): Observable<EngagementListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<EngagementListResponse>(`${this.baseUrl}/engagements`, { params });
  }

  createEngagement(payload: {
    clientId: string;
    type: ModuleType;
    name: string;
    period: string;
    requiredDate: string;
    targetDate: string;
    managerId: string;
  }): Observable<EngagementModel> {
    return this.http.post<EngagementModel>(`${this.baseUrl}/engagements`, payload);
  }

  getEngagementById(id: string): Observable<EngagementModel> {
    return this.http.get<EngagementModel>(`${this.baseUrl}/engagements/${id}`);
  }

  updateStep(
    engagementId: string,
    stepId: string,
    payload: {
      status: string;
      actualStart?: string;
      actualEnd?: string;
      comment?: string;
      delayReason?: string;
    },
  ): Observable<EngagementModel> {
    return this.http.patch<EngagementModel>(
      `${this.baseUrl}/engagements/${engagementId}/steps/${stepId}`,
      payload,
    );
  }

  updateStageConfig(
    engagementId: string,
    stageId: string,
    payload: {
      enabled?: boolean;
      targetStart?: string;
      targetEnd?: string;
      comment?: string;
      tasks?: Array<{
        id: string;
        enabled?: boolean;
        targetStart?: string;
        targetEnd?: string;
      }>;
    },
  ): Observable<EngagementModel> {
    return this.http.patch<EngagementModel>(
      `${this.baseUrl}/engagements/${engagementId}/stages/${stageId}/config`,
      payload,
    );
  }

  getHistory(engagementId: string): Observable<HistoryItem[]> {
    return this.http.get<HistoryItem[]>(`${this.baseUrl}/engagements/${engagementId}/history`);
  }

  getReports(): Observable<ReportModel[]> {
    return this.http.get<ReportModel[]>(`${this.baseUrl}/reports`);
  }

  getUsers(): Observable<UserModel[]> {
    return this.http.get<UserModel[]>(`${this.baseUrl}/users`);
  }

  createUser(payload: {
    name: string;
    email: string;
    role: string;
    domain: string;
    status?: 'Active' | 'Inactive';
    avatar?: string;
  }): Observable<UserModel> {
    return this.http.post<UserModel>(`${this.baseUrl}/users`, payload);
  }

  updateUser(
    userId: string,
    payload: Partial<{
      name: string;
      email: string;
      role: string;
      domain: string;
      status: 'Active' | 'Inactive';
      avatar: string;
    }>,
  ): Observable<UserModel> {
    return this.http.patch<UserModel>(`${this.baseUrl}/users/${userId}`, payload);
  }
}

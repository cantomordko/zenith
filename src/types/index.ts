export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  ticketIds: string[];
}

export interface Board {
  tickets: Record<string, Ticket>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

// Typy dla Supabase
export interface SupabaseTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  column_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseColumn {
  id: string;
  title: string;
  position: number;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupabaseComment {
  id: string;
  ticket_id: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  changedBy: string;
  changeType: 'created' | 'updated' | 'moved' | 'deleted' | 'status_changed';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: Date;
}

export interface SupabaseTicketHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  change_type: 'created' | 'updated' | 'moved' | 'deleted' | 'status_changed';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  created_at: string;
}

export interface SupabaseTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

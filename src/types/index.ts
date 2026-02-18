export interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  created_at: Date;
}

export interface Display {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  city: string;
  region: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  season_id: number;
  status: 'pending' | 'approved' | 'rejected';
  vote_count: number;
  local_vote_count: number;
  created_at: Date;
  photos?: Photo[];
}

export interface Photo {
  id: number;
  display_id: number;
  url: string;
  thumbnail_url: string;
  sort_order: number;
  created_at: Date;
}

export interface Vote {
  id: number;
  voter_id: number;
  display_id: number;
  season_id: number;
  voter_city: string | null;
  ip_address: string;
  created_at: Date;
}

export interface Season {
  id: number;
  name: string;
  holiday_type: 'christmas' | 'halloween' | 'fourth_of_july' | 'valentines' | 'easter' | 'other';
  year: number;
  start_date: Date;
  end_date: Date;
  voting_open: boolean;
  submissions_open: boolean;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  region: string;
  county: string;
  population: number | null;
}

export type Region = 'DFW' | 'Houston' | 'Austin' | 'San Antonio' | 'El Paso' | 'West Texas' | 'East Texas' | 'South Texas' | 'Panhandle' | 'Central Texas';

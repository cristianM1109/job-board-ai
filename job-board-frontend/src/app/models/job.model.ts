export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  url?: string;
}
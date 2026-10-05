export interface User {
  id: string;
  name: string;
  headline: string;
}

export interface Post {
  id: string;
  authorName: string;
  body: string;
  createdAt: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applied: boolean;
}

export interface Event {
  id: string;
  title: string;
  startsAt: number;
  venue: string;
}

export interface Profile extends User {
  bio: string;
  skills: string[];
}

export type ActionResult = { ok: true } | { ok: false; error: string };

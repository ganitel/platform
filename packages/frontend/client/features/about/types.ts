export type TeamRole = "cofounder" | "tour_guide";

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  title_fr: string;
  title_en: string;
  bio_fr: string | null;
  bio_en: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  age: number | null;
}

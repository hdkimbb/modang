export type PersonaRole = "user" | "owner";

export interface Persona {
  id: string;
  name: string;
  region: string;
  role: PersonaRole;
  owned_place_id: string | null;
}

export interface PersonaListApi {
  items: Persona[];
}

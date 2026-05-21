import type { NicheKey } from "@/types";

export interface NicheDefinition {
  key: NicheKey;
  label: string;
  shortLabel: string;
  offer: string;
  ticket: string;
}

export interface ImplementationOffer {
  offer: string;
  ticket: string;
  nicheLabel: string;
}

export const NICHES: NicheDefinition[] = [
  {
    key: "real_estate",
    label: "Inmobiliarias / brokers / agentes",
    shortLabel: "Inmobiliarias",
    offer: "Luma Estate OS Foundation",
    ticket: "RD$75,000 - US$3,000+",
  },
  {
    key: "developers",
    label: "Constructoras / desarrolladores / proyectos",
    shortLabel: "Desarrolladores",
    offer: "Landing de proyecto + filtro + CRM + dashboard",
    ticket: "RD$90,000 - US$3,000+",
  },
  {
    key: "academy",
    label: "Academias / cursos / talleres",
    shortLabel: "Academias",
    offer: "Academia OS",
    ticket: "RD$25,000 - RD$90,000+",
  },
  {
    key: "beauty",
    label: "Estetica / spas / odontologia / belleza",
    shortLabel: "Beauty / Spa",
    offer: "Luma Beauty OS",
    ticket: "RD$35,000 - RD$90,000+",
  },
  {
    key: "route_products",
    label: "Rutas / productos / promotores / catalogo",
    shortLabel: "Rutas / Productos",
    offer: "Luma Route OS",
    ticket: "RD$50,000 - RD$150,000+",
  },
  {
    key: "printing_graphics",
    label: "Imprentas / letreros / servicios graficos B2B",
    shortLabel: "Imprentas B2B",
    offer: "Luma B2B Quote OS",
    ticket: "RD$45,000 - RD$150,000+",
  },
  {
    key: "professional_services",
    label: "Abogados / contables / fotografos / consultores",
    shortLabel: "Servicios Profesionales",
    offer: "Luma Professional OS",
    ticket: "RD$25,000 - RD$90,000+",
  },
  {
    key: "b2b_services",
    label: "Seguridad / limpieza / mantenimiento / industrial / logistica",
    shortLabel: "B2B Industrial",
    offer: "Luma B2B OS",
    ticket: "RD$75,000 - RD$150,000+",
  },
];

export const IMPLEMENTATION_OFFERS: ImplementationOffer[] = [
  {
    offer: "Luma Estate OS Starter",
    ticket: "RD$45,000 - RD$75,000",
    nicheLabel: "Brokers / agentes sin web",
  },
  {
    offer: "Luma Estate OS Foundation",
    ticket: "RD$75,000 - US$3,000+",
    nicheLabel: "Inmobiliarias / brokers / agentes",
  },
  {
    offer: "Academia OS",
    ticket: "RD$25,000 - RD$90,000+",
    nicheLabel: "Academias / cursos / talleres",
  },
  {
    offer: "Luma Beauty OS",
    ticket: "RD$35,000 - RD$90,000+",
    nicheLabel: "Estetica / spas / odontologia / belleza",
  },
  {
    offer: "Luma Route OS",
    ticket: "RD$50,000 - RD$150,000+",
    nicheLabel: "Rutas / productos / promotores / catalogo",
  },
  {
    offer: "Luma B2B Quote OS",
    ticket: "RD$45,000 - RD$150,000+",
    nicheLabel: "Imprentas / letreros / servicios graficos B2B",
  },
  {
    offer: "Luma Professional OS",
    ticket: "RD$25,000 - RD$90,000+",
    nicheLabel: "Servicios profesionales",
  },
  {
    offer: "Luma B2B OS",
    ticket: "RD$75,000 - RD$150,000+",
    nicheLabel: "Servicios B2B / industrial",
  },
];

export const UNKNOWN_NICHE: NicheDefinition = {
  key: "unknown",
  label: "Nicho por clasificar",
  shortLabel: "Nicho pendiente",
  offer: "Oferta Luma por definir",
  ticket: "Pendiente",
};

export function getNicheDefinition(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return NICHES.find((niche) => niche.key === normalized) ?? UNKNOWN_NICHE;
}

import type { NicheKey } from "@/types";
import { getDefaultProductForNiche, type ProductKey } from "@/data/products";

export interface NicheDefinition {
  key: NicheKey;
  label: string;
  shortLabel: string;
  productKey: ProductKey;
  offer: string;
  ticket: string;
  demoLabel: string;
  demoUrl: string;
}

function nicheDefinition(key: NicheKey, label: string, shortLabel: string): NicheDefinition {
  const product = getDefaultProductForNiche(key);
  return {
    key,
    label,
    shortLabel,
    productKey: product.key,
    offer: product.name,
    ticket: product.ticket,
    demoLabel: product.demo.label,
    demoUrl: product.demo.url,
  };
}

export const NICHES: NicheDefinition[] = [
  nicheDefinition("real_estate", "Inmobiliarias / brokers / agentes", "Inmobiliarias"),
  nicheDefinition("developers", "Constructoras / desarrolladores / proyectos", "Desarrolladores"),
  nicheDefinition("academy", "Academias / cursos / talleres", "Academias"),
  nicheDefinition("beauty_spa", "Estetica / spas / odontologia / belleza", "Beauty / Spa"),
  nicheDefinition("commerce", "Tiendas / cosmeticos / productos fisicos", "Commerce"),
  nicheDefinition("route_products", "Distribuidoras / rutas / operaciones de calle", "Route OS"),
  nicheDefinition("printing_graphics", "Imprentas / letreros / servicios graficos B2B", "Imprentas B2B"),
  nicheDefinition("professional_services", "Abogados / contables / fotografos / consultores", "Servicios Profesionales"),
  nicheDefinition("b2b_services", "Seguridad / limpieza / mantenimiento / industrial / logistica", "B2B Industrial"),
  nicheDefinition("content_monetization", "Creadores / contenido / infoproductos", "Contenido"),
];

export const UNKNOWN_NICHE: NicheDefinition = {
  key: "unknown",
  label: "Nicho por clasificar",
  shortLabel: "Nicho pendiente",
  productKey: "professional_os",
  offer: "Oferta Luma por definir",
  ticket: "Pendiente",
  demoLabel: "Portafolio Premium",
  demoUrl: "https://marcos-portfolio-premium.vercel.app/",
};

export function getNicheDefinition(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return NICHES.find((niche) => niche.key === normalized) ?? UNKNOWN_NICHE;
}

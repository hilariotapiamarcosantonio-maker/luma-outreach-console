import type { NicheKey, RecommendedChannel } from "@/types";

export type ProductKey =
  | "estate_starter"
  | "estate_foundation"
  | "academia_os"
  | "beauty_os"
  | "commerce_os"
  | "route_os"
  | "b2b_quote_os"
  | "professional_os"
  | "b2b_industrial_os"
  | "content_monetization_os";

export interface ProductDemo {
  label: string;
  url: string;
  asset: string;
}

export interface ProductDefinition {
  key: ProductKey;
  name: string;
  ticket: string;
  recurring?: string;
  description: string;
  technicalModule: string;
  applicableNiches: NicheKey[];
  demo: ProductDemo;
  nicheLabel: string;
  opportunity: string;
  callAngle: string;
  baseMessages: Partial<Record<RecommendedChannel, string>>;
}

export const PRODUCT_CATALOG: ProductDefinition[] = [
  {
    key: "estate_starter",
    name: "Luma Estate OS Starter",
    ticket: "RD$45,000 - RD$75,000",
    recurring: "RD$2,000/mes",
    nicheLabel: "Agentes / brokers sin web",
    applicableNiches: ["real_estate"],
    demo: {
      label: "Vista del Rio",
      url: "https://vista-del-rio-next.vercel.app/",
      asset: "Demo de infraestructura comercial inmobiliaria",
    },
    description: "Portal comercial de marca personal para brokers o agentes independientes sin presencia web propia.",
    technicalModule: "Landing mobile, formulario/filtro de interesados, WhatsApp organizado, base de prospectos y seguimiento simple.",
    opportunity: "Convertir la atencion de redes y WhatsApp en una ruta propia de captacion, autoridad y seguimiento.",
    callAngle: "Presencia propia, autoridad comercial y seguimiento simple sin depender solo de Instagram o WhatsApp.",
    baseMessages: {
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi tu presencia en Instagram y note una oportunidad visible para convertir mejor la atencion que ya generas en una ruta mas clara de captacion y seguimiento.\n\nNo es una critica ni una auditoria interna; es una observacion breve basada en senales publicas.\n\nTe la puedo compartir?",
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de actividad comercial en [Negocio] y creo que podria haber una oportunidad para ordenar captacion y seguimiento con una presencia propia.\n\nTengo una demo breve de infraestructura comercial para brokers. Te la puedo compartir?",
    },
  },
  {
    key: "estate_foundation",
    name: "Luma Estate OS Foundation",
    ticket: "RD$75,000 - RD$95,000",
    recurring: "RD$3,000/mes",
    nicheLabel: "Inmobiliarias / agencias / constructoras",
    applicableNiches: ["real_estate", "developers"],
    demo: {
      label: "Vista del Rio",
      url: "https://vista-del-rio-next.vercel.app/",
      asset: "Demo de landing, buscador, CRM local y dashboard",
    },
    description: "Ecosistema completo para agencias, desarrolladoras o constructoras con captacion, filtros y seguimiento comercial.",
    technicalModule: "Buscador avanzado, CRM local, pipeline de leads, asignacion comercial y dashboard analitico.",
    opportunity: "Ordenar captacion, filtro y seguimiento para que el equipo comercial atienda oportunidades mejor calificadas.",
    callAngle: "Desempeno mobile, experiencia de busqueda y control de seguimiento local.",
    baseMessages: {
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nRevisando senales publicas de [Negocio], vi una oportunidad de optimizar la ruta digital de captacion, filtro y seguimiento comercial.\n\nNo es una critica ni una auditoria interna; es una observacion breve desde afuera. Te puedo compartir una demo de infraestructura tipo Vista del Rio?",
      email:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de actividad comercial en [Negocio] y queria compartir una observacion breve sobre captacion, filtro y seguimiento digital. Trabajamos infraestructura comercial tipo Estate OS, apoyada en una demo funcional como Vista del Rio.\n\nSi tiene sentido, puedo enviarle el enlace y una lectura corta de oportunidad.",
    },
  },
  {
    key: "academia_os",
    name: "Academia OS",
    ticket: "RD$50,000 - RD$80,000",
    recurring: "RD$2,500/mes",
    nicheLabel: "Academias / cursos / talleres",
    applicableNiches: ["academy"],
    demo: {
      label: "Suvoga OS",
      url: "https://suvoga-os-tjaa.vercel.app/",
      asset: "Caso B2B / academia",
    },
    description: "Sistema para administrar ofertas educativas, inscripciones, pagos y seguimiento de estudiantes.",
    technicalModule: "Catalogo educativo, pagos, control de matriculas y notificaciones operativas.",
    opportunity: "Reducir friccion en inscripcion y seguimiento para convertir interesados en estudiantes registrados.",
    callAngle: "Inscripcion, cupos, pagos y comunicacion clara por cohorte o taller.",
    baseMessages: {
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi la oferta educativa de [Negocio] y note una oportunidad para ordenar inscripciones, cupos y seguimiento en una ruta mas clara para los interesados.\n\nTengo una demo cercana a este tipo de operacion. Te puedo compartir la observacion?",
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de [Negocio] y creo que podria haber una oportunidad para simplificar inscripciones, pagos y seguimiento de interesados.\n\nTe puedo compartir una observacion breve basada en lo visible?",
    },
  },
  {
    key: "beauty_os",
    name: "Luma Beauty OS",
    ticket: "RD$45,000 - RD$75,000",
    recurring: "RD$2,000/mes",
    nicheLabel: "Estetica / spas / odontologia / belleza",
    applicableNiches: ["beauty_spa"],
    demo: {
      label: "Santuario Estetica MVP",
      url: "https://santuario-estetica-mvp.vercel.app/",
      asset: "Demo de reservas",
    },
    description: "Plataforma de reservas y CRM ligero para centros de estetica, spas, odontologia, salones y peluquerias.",
    technicalModule: "Agenda online, servicios, especialistas, clientes, recordatorios preconfigurados y venta opcional.",
    opportunity: "Convertir consultas de Instagram o WhatsApp en citas mejor organizadas y con menos friccion operativa.",
    callAngle: "Agenda mobile, recepcion descongestionada y seguimiento de clientes recurrentes.",
    baseMessages: {
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi la presencia de [Negocio] y note una oportunidad para ordenar mejor las consultas y reservas que llegan por canales digitales.\n\nNo es una critica; es una observacion breve desde senales publicas. Te la puedo compartir?",
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi la presencia de [Negocio] en Instagram y note una oportunidad para convertir mejor consultas en reservas con una ruta mobile mas clara.\n\nTe puedo compartir una observacion breve?",
    },
  },
  {
    key: "commerce_os",
    name: "Luma Commerce OS",
    ticket: "RD$55,000 - RD$85,000",
    recurring: "RD$2,500/mes",
    nicheLabel: "Tiendas / cosmeticos / productos fisicos",
    applicableNiches: ["commerce", "beauty_spa"],
    demo: {
      label: "Luma Capilar",
      url: "https://luma-capilar-saa-s.vercel.app/",
      asset: "Demo de tienda mobile y recompra",
    },
    description: "Tienda digital mobile para marcas de productos fisicos con catalogo, variantes y checkout hacia WhatsApp.",
    technicalModule: "Catalogo autogestionable, variantes, bundles, cupones y WhatsApp Checkout.",
    opportunity: "Reducir consultas repetitivas por tallas, colores o disponibilidad y llevar pedidos mas completos a WhatsApp.",
    callAngle: "Pedidos mas claros por WhatsApp, catalogo mobile y variantes de producto.",
    baseMessages: {
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi los productos de [Negocio] y note una oportunidad para que los clientes elijan variantes y envien pedidos mas completos por WhatsApp.\n\nNo es una critica; es una observacion basada en senales publicas. Te puedo compartir un ejemplo visual?",
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas del catalogo de [Negocio] y creo que podria haber una oportunidad para ordenar productos, variantes y pedidos antes de llegar al chat.\n\nTe puedo compartir una demo breve?",
    },
  },
  {
    key: "route_os",
    name: "Luma Route OS",
    ticket: "RD$95,000 - RD$150,000",
    recurring: "RD$5,000/mes",
    nicheLabel: "Distribuidoras / rutas / operaciones de calle",
    applicableNiches: ["route_products"],
    demo: {
      label: "Panel de Consola",
      url: "https://luma-outreach-console.vercel.app/console/luma-premium",
      asset: "Referencia de consola operativa",
    },
    description: "Plataforma de control logistico para despachos, choferes, cobradores y promotores de campo.",
    technicalModule: "Despachos, interfaz movil para campo, visitas geolocalizadas, entregas, cobros e inventario movil.",
    opportunity: "Dar visibilidad al cumplimiento de rutas, cobros y entregas sin esperar el cierre manual del dia.",
    callAngle: "Control logistico de cobros, rutas, visitas y cuadre de inventario en calle.",
    baseMessages: {
      email:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nPor senales publicas de [Negocio], parece una operacion donde el control de rutas, visitas o cobros podria ser relevante.\n\nDesarrollamos Luma Route OS para ordenar esos flujos en una consola simple. Tiene sentido que le comparta una demo breve?",
      linkedin:
        "Hola [Nombre]. Vi senales publicas de operacion en ruta en [Negocio] y queria compartir una observacion breve sobre control de visitas, cobros y seguimiento de campo. Te puedo enviar una demo de Luma Route OS?",
    },
  },
  {
    key: "b2b_quote_os",
    name: "Luma B2B Quote OS",
    ticket: "RD$45,000 - RD$70,000",
    recurring: "RD$2,000/mes",
    nicheLabel: "Imprentas / graficos / fotografos por cotizacion",
    applicableNiches: ["printing_graphics", "professional_services"],
    demo: {
      label: "Depot Graphics",
      url: "https://depotgraphics.com/",
      asset: "Caso B2B / cotizador",
    },
    description: "Sistema interactivo de captacion y cotizacion para servicios con variables tecnicas o archivos adjuntos.",
    technicalModule: "Formulario tecnico, carga de archivos, variables de cotizacion y CRM local de solicitudes.",
    opportunity: "Recibir solicitudes mejor estructuradas para cotizar mas rapido y dar seguimiento sin perder contexto.",
    callAngle: "Briefs completos, cotizaciones mejor armadas y seguimiento de solicitudes pendientes.",
    baseMessages: {
      whatsapp:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de servicios por cotizacion en [Negocio] y note una oportunidad para estructurar mejor las solicitudes antes de cotizar.\n\nTengo una demo de flujo de cotizacion B2B. Te la puedo compartir?",
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi el trabajo de [Negocio] y note una oportunidad para que los clientes envien solicitudes mas completas antes de pedir cotizacion.\n\nTe puedo compartir una demo breve?",
    },
  },
  {
    key: "professional_os",
    name: "Luma Professional OS",
    ticket: "RD$30,000 - RD$45,000",
    recurring: "RD$1,500/mes",
    nicheLabel: "Abogados / contables / consultores / fotografos de marca",
    applicableNiches: ["professional_services"],
    demo: {
      label: "Portafolio Premium",
      url: "https://marcos-portfolio-premium.vercel.app/",
      asset: "Portafolio de autoridad profesional",
    },
    description: "Plataforma de autoridad profesional para servicios expertos, agenda y captacion por recursos de valor.",
    technicalModule: "Portafolio, especialidades, agenda, articulos y lead magnets.",
    opportunity: "Convertir autoridad visible en una ruta clara de confianza, agenda y captacion B2B.",
    callAngle: "Autoridad, confianza profesional, agenda y captacion consultiva.",
    baseMessages: {
      linkedin:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de autoridad profesional en [Negocio] y creo que podria haber una oportunidad para ordenar mejor captacion, agenda y recursos de valor.\n\nTe puedo compartir una observacion breve?",
      email:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi la presencia profesional de [Negocio] y queria compartir una observacion breve sobre autoridad digital, agenda y captacion consultiva. Te la puedo enviar?",
    },
  },
  {
    key: "b2b_industrial_os",
    name: "Luma B2B Industrial OS",
    ticket: "RD$80,000 - RD$120,000",
    recurring: "RD$4,000/mes",
    nicheLabel: "B2B industrial / mantenimiento / seguridad",
    applicableNiches: ["b2b_services"],
    demo: {
      label: "Inox Minier",
      url: "https://inox-minier.com/",
      asset: "Caso B2B industrial",
    },
    description: "Portal corporativo para empresas industriales con credenciales, capacidades y solicitud B2B.",
    technicalModule: "Capacidades, certificaciones, proyectos, formulario B2B y canal de licitaciones.",
    opportunity: "Presentar credenciales tecnicas y solicitudes B2B de forma mas clara para compradores corporativos.",
    callAngle: "Confianza industrial, capacidades tecnicas, certificaciones y solicitudes de cotizacion.",
    baseMessages: {
      email:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de operacion B2B en [Negocio] y note una oportunidad para presentar capacidades, credenciales y solicitudes tecnicas de forma mas clara.\n\nTe puedo compartir una observacion breve?",
      linkedin:
        "Hola [Nombre]. Vi senales publicas de [Negocio] y queria compartir una idea breve sobre presencia corporativa y solicitudes B2B. Te la puedo enviar?",
    },
  },
  {
    key: "content_monetization_os",
    name: "Luma Content/Monetization OS",
    ticket: "RD$35,000 - RD$55,000",
    recurring: "RD$1,500/mes",
    nicheLabel: "Creadores / contenido / infoproductos",
    applicableNiches: ["content_monetization"],
    demo: {
      label: "Gelatinas y Postres",
      url: "https://gelatinasypostres.info/",
      asset: "Caso B2B / contenido monetizable",
    },
    description: "Plataforma para creadores, recetas, blogs tematicos y venta de infoproductos descargables.",
    technicalModule: "Suscripcion, catalogo de guias, checkout de descargas y analiticas basicas.",
    opportunity: "Convertir audiencia de redes en una ruta propia de captura, venta y recompra de contenido.",
    callAngle: "Monetizacion de audiencia, descargas digitales y captacion propia.",
    baseMessages: {
      instagram:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi el contenido de [Negocio] y note una oportunidad para convertir parte de esa audiencia en descargas, suscripciones o recursos pagados con una ruta propia.\n\nTe puedo compartir una observacion breve?",
      email:
        "Hola [Nombre]. Soy Marcos Hilario, de Luma Premium.\n\nVi senales publicas de contenido con potencial de monetizacion en [Negocio]. Te puedo compartir una observacion breve sobre captacion y venta de recursos digitales?",
    },
  },
];

export const PRODUCTS_BY_KEY = PRODUCT_CATALOG.reduce<Record<ProductKey, ProductDefinition>>((acc, product) => {
  acc[product.key] = product;
  return acc;
}, {} as Record<ProductKey, ProductDefinition>);

export const DEFAULT_PRODUCT_BY_NICHE: Record<NicheKey, ProductKey> = {
  real_estate: "estate_foundation",
  developers: "estate_foundation",
  academy: "academia_os",
  beauty_spa: "beauty_os",
  commerce: "commerce_os",
  route_products: "route_os",
  printing_graphics: "b2b_quote_os",
  professional_services: "professional_os",
  b2b_services: "b2b_industrial_os",
  content_monetization: "content_monetization_os",
  unknown: "professional_os",
};

export function getProductByKey(key: ProductKey) {
  return PRODUCTS_BY_KEY[key];
}

export function getDefaultProductForNiche(niche: NicheKey) {
  return getProductByKey(DEFAULT_PRODUCT_BY_NICHE[niche]);
}


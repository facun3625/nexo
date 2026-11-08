import {
  ClipboardList,
  Compass,
  Handshake,
  HardHat,
  Lightbulb,
  PencilRuler,
  Ruler,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Íconos fijos por posición: el panel edita textos, no íconos. Si se
// agregan más tarjetas que íconos, se repiten en ronda.
const PILLAR_ICONS: LucideIcon[] = [PencilRuler, Handshake, Compass, Building2, Sparkles, Lightbulb];
const SERVICE_ICONS: LucideIcon[] = [Lightbulb, Ruler, ClipboardList, HardHat, PencilRuler, Compass, Handshake, Building2];

export const pillarIcon = (i: number) => PILLAR_ICONS[i % PILLAR_ICONS.length];
export const serviceIcon = (i: number) => SERVICE_ICONS[i % SERVICE_ICONS.length];

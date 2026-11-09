import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Eye,
  Handshake,
  Heart,
  House,
  KeyRound,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { AboutValueIcon as IconKey } from "@/lib/about-values";

const ICONS: Record<IconKey, LucideIcon> = {
  shield: ShieldCheck,
  handshake: Handshake,
  eye: Eye,
  users: Users,
  house: House,
  key: KeyRound,
  building: Building2,
  star: Star,
  heart: Heart,
  award: Award,
  badge: BadgeCheck,
  clock: Clock,
  map: MapPin,
  thumbs: ThumbsUp,
  briefcase: Briefcase,
  chat: MessageCircle,
};

export function AboutValueIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = ICONS[icon] ?? ShieldCheck;
  return <Icon className={className} />;
}

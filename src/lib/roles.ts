import type { RoleId } from "./types";

export interface Power {
  id: string;
  name: string;
  description: string;
  cost?: number;       // in lakhs
  oncePerRound?: boolean;
  oncePerGame?: boolean;
  cooldownTurns?: number;
}

export const ROLE_POWERS: Record<RoleId, Power[]> = {
  TYCOON: [
    {
      id: "topping_out",
      name: "Topping Out Ceremony",
      description: "+2 dev levels on one property, instantly, free. Once per game.",
      oncePerGame: true,
    },
    {
      id: "double_dev",
      name: "Double Development",
      description: "Passive: You can develop 2 properties per turn (base rule).",
    },
    {
      id: "dev_discount",
      name: "Developer's Discount",
      description: "Passive: 10% off all development costs. 20% in zones where you own 3+ properties.",
    },
    {
      id: "land_bank",
      name: "Land Bank",
      description: "Passive: Earn ₹10L per undeveloped property at turn start.",
    },
  ],
  JUDGE: [
    {
      id: "stay_order",
      name: "Stay Order",
      description: "Freeze a property for 3 rounds — no dev, no trade, no rent. Max 2 active.",
    },
    {
      id: "judicial_review",
      name: "Judicial Review",
      description: "Overturn a committee decision. Once per round.",
      oncePerRound: true,
    },
    {
      id: "contempt",
      name: "Contempt of Court",
      description: "Refuser-of-rent loses next turn + pays double.",
    },
    {
      id: "legal_fees",
      name: "Legal Fees",
      description: "Passive: ₹30L per dispute settled.",
    },
  ],
  MINISTER: [
    {
      id: "fsi_change",
      name: "FSI Notification",
      description: "Change any zone's FSI by ±0.5. Once per round.",
      oncePerRound: true,
    },
    {
      id: "affordable_housing",
      name: "Affordable Housing Mandate",
      description: "Zone rents drop 30% for 3 turns. Minister collects ₹50L.",
    },
    {
      id: "sez",
      name: "Special Economic Zone",
      description: "Declare one tile SEZ: 0% tax, +50% rent, immune to stays. Once per game.",
      oncePerGame: true,
    },
    {
      id: "ministerial_salary",
      name: "Ministerial Salary",
      description: "Passive: ₹50L per round start.",
    },
  ],
  BMC: [
    {
      id: "iod_delay",
      name: "IOD Delay",
      description: "Delay a pending development by 1–3 turns. Owner pays ₹20L/turn maintenance, no rent.",
    },
    {
      id: "oc_withhold",
      name: "Withhold OC",
      description: "New dev collects only base rent for 1 turn after construction.",
    },
    {
      id: "demolition",
      name: "Demolition Notice",
      description: "Target illegal-FSI build: −1 level + ₹1Cr fine. Once per game.",
      oncePerGame: true,
    },
    {
      id: "infra_levy",
      name: "Infrastructure Levy",
      description: "Collect ₹50L from each zone property (spend or pocket).",
    },
    {
      id: "prop_tax",
      name: "Property Tax",
      description: "Passive: ₹10L per developed property on board per round.",
    },
  ],
  MHADA: [
    {
      id: "mhada_lottery",
      name: "MHADA Lottery",
      description: "Auction a flat at any tile for 30% price. Locked 5 turns, capped at Apartment. Once per round.",
      oncePerRound: true,
    },
    {
      id: "sra_scheme",
      name: "SRA Scheme",
      description: "Any Chawl-or-below property: double FSI permanently. Owner owes MHADA 1 free rent turn.",
    },
    {
      id: "reservation",
      name: "Land Reservation",
      description: "Reserve unowned tile 2 turns. Then MHADA buys at 50% or releases.",
    },
    {
      id: "rehab_rev",
      name: "Rehabilitation Revenue",
      description: "Passive: ₹20L per redevelopment, ₹30L when SRA property fully developed.",
    },
  ],
};

export function getRolePowers(role: RoleId): Power[] {
  return ROLE_POWERS[role];
}

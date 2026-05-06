export interface Agency {
  id: string;
  name: string;
  logo: string;
  rating: number;
}

export interface Journey {
  id: string;
  agencyId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatsRemaining: number;
  class: "VIP" | "Classique";
}

export interface Booking {
  id: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  journey: Journey;
  customerName: string;
  phone: string;
  paymentMethod: string;
  timestamp: string;
}

export type AppView = "HOME" | "SEARCH_RESULTS" | "BOOKING" | "PAYMENT" | "CONFIRMATION" | "BOT";

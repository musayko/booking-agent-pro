import type { Service, AgentSettings } from "./types";

export const STUDENT_NAME = "Musa Ozdemir";
export const TEAM_SLUG = "bookingpro-musa";
export const ASSIGNMENT = "ai-booking-2026";

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "svc-1", name: "Dental Check-up", name_et: "Hambakon­troll",
    description: "Comprehensive oral examination with X-rays",
    description_et: "Põhjalik suuõõne läbivaatus koos röntgeniga",
    price: 75, duration_minutes: 30, active: true,
  },
  {
    id: "svc-2", name: "Teeth Whitening", name_et: "Hammaste valgendamine",
    description: "Professional whitening session for a brighter smile",
    description_et: "Professionaalne valgendamisseanss heledama naeratuse jaoks",
    price: 250, duration_minutes: 60, active: true,
  },
  {
    id: "svc-3", name: "Dental Cleaning", name_et: "Hammaste puhastus",
    description: "Thorough cleaning and polishing by our hygienist",
    description_et: "Põhjalik puhastus ja poleerimine meie hügienisti poolt",
    price: 120, duration_minutes: 45, active: true,
  },
  {
    id: "svc-4", name: "Root Canal Treatment", name_et: "Juureravi",
    description: "Expert root canal procedure with modern equipment",
    description_et: "Ekspert juureravi kaasaegse varustusega",
    price: 450, duration_minutes: 90, active: true,
  },
  {
    id: "svc-5", name: "Dental Implant Consultation", name_et: "Implantaadi konsultatsioon",
    description: "Personalized implant planning session",
    description_et: "Personaalne implantaadi planeerimise seanss",
    price: 100, duration_minutes: 45, active: true,
  },
  {
    id: "svc-6", name: "Orthodontic Consultation", name_et: "Ortodontia konsultatsioon",
    description: "Assessment for braces or clear aligners",
    description_et: "Hindamine breketite või läbipaistvate joondajate jaoks",
    price: 90, duration_minutes: 30, active: true,
  },
];

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  id: "agent-main",
  system_prompt: `You are a friendly and professional dental receptionist for SmilePro Dental. Your name is Dr. Smile Assistant.

Your responsibilities:
- Answer questions about services, prices, and business hours
- Check appointment availability when customers want to book
- Help customers book appointments by collecting their details
- Be warm, professional, and concise
- If asked about medical advice, politely redirect to booking a consultation

Business hours: Monday-Friday 9:00-18:00, Saturday 10:00-14:00, Sunday closed.
Address: Pärnu mnt 25, Tallinn, Estonia

Always confirm the appointment details with the customer before making the booking.`,
  mode: "full_booking",
  business_name: "SmilePro Dental",
  business_hours: "Mon-Fri 9:00-18:00, Sat 10:00-14:00, Sun Closed",
  business_address: "Pärnu mnt 25, Tallinn, Estonia",
  business_phone: "+372 5555 1234",
  business_email: "info@smileprodental.ee",
  faq: [
    { question: "Do you accept insurance?", answer: "Yes, we accept all major dental insurance plans. Please bring your insurance card to your appointment." },
    { question: "Is parking available?", answer: "Yes, free parking is available in front of the clinic." },
    { question: "What payment methods do you accept?", answer: "We accept cash, credit/debit cards, and bank transfer." },
    { question: "Can I cancel or reschedule?", answer: "Yes, you can cancel or reschedule up to 24 hours before your appointment at no charge." },
  ],
};

export const TRANSLATIONS = {
  en: {
    heroTitle: "Your Smile, Our Priority",
    heroSubtitle: "Experience premium dental care with AI-powered booking. Chat with our assistant to schedule your visit in seconds.",
    servicesTitle: "Our Services",
    servicesSubtitle: "Professional dental care tailored to your needs",
    chatPlaceholder: "Type your message...",
    chatTitle: "SmilePro Assistant",
    chatWelcome: "Hi! 👋 I'm the SmilePro Dental assistant. I can help you book an appointment, check availability, or answer questions about our services. How can I help you today?",
    ctaBook: "Book an Appointment",
    ctaServices: "View Services",
    duration: "min",
    footer: `Built in AI Web Session 2026 | BookingAgent Pro | Student: ${STUDENT_NAME} | Team: ${TEAM_SLUG}`,
    login: "Dashboard Login",
    logout: "Logout",
    dashboard: "Dashboard",
    services: "Services",
    calendar: "Appointments",
    agentSettings: "Agent Settings",
    languages: "Languages",
    addService: "Add Service",
    editService: "Edit Service",
    deleteService: "Delete",
    save: "Save",
    cancel: "Cancel",
    name: "Name",
    price: "Price",
    durationLabel: "Duration (min)",
    description: "Description",
    active: "Active",
    systemPrompt: "System Prompt",
    agentMode: "Agent Mode",
    infoOnly: "Information Only",
    fullBooking: "Full Booking",
    businessName: "Business Name",
    businessHours: "Business Hours",
    noBookings: "No bookings yet",
    customer: "Customer",
    service: "Service",
    date: "Date",
    time: "Time",
    status: "Status",
    email: "Email",
    phone: "Phone",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
    chatWithUs: "Chat with Assistant",
    send: "Send",
  },
  et: {
    heroTitle: "Teie Naeratus, Meie Prioriteet",
    heroSubtitle: "Koge esmaklassilist hambaravi koos tehisintellektipõhise broneerimisega. Vestle meie assistendiga, et planeerida oma visiit mõne sekundiga.",
    servicesTitle: "Meie Teenused",
    servicesSubtitle: "Teie vajadustele kohandatud professionaalne hambaravi",
    chatPlaceholder: "Kirjuta oma sõnum...",
    chatTitle: "SmilePro Assistent",
    chatWelcome: "Tere! 👋 Olen SmilePro Dental assistent. Saan aidata teil broneerida aega, kontrollida saadavust või vastata küsimustele meie teenuste kohta. Kuidas saan teid aidata?",
    ctaBook: "Broneeri Aeg",
    ctaServices: "Vaata Teenuseid",
    duration: "min",
    footer: `Ehitatud AI Web Session 2026 | BookingAgent Pro | Üliõpilane: ${STUDENT_NAME} | Meeskond: ${TEAM_SLUG}`,
    login: "Juhtpaneeli Sisselogimine",
    logout: "Logi välja",
    dashboard: "Juhtpaneel",
    services: "Teenused",
    calendar: "Kohtumised",
    agentSettings: "Agendi Seaded",
    languages: "Keeled",
    addService: "Lisa Teenus",
    editService: "Muuda Teenust",
    deleteService: "Kustuta",
    save: "Salvesta",
    cancel: "Tühista",
    name: "Nimi",
    price: "Hind",
    durationLabel: "Kestus (min)",
    description: "Kirjeldus",
    active: "Aktiivne",
    systemPrompt: "Süsteemi Viip",
    agentMode: "Agendi Režiim",
    infoOnly: "Ainult Info",
    fullBooking: "Täis Broneerimine",
    businessName: "Ettevõtte Nimi",
    businessHours: "Lahtiolekuajad",
    noBookings: "Broneeringuid pole veel",
    customer: "Klient",
    service: "Teenus",
    date: "Kuupäev",
    time: "Aeg",
    status: "Staatus",
    email: "E-post",
    phone: "Telefon",
    confirmed: "Kinnitatud",
    cancelled: "Tühistatud",
    completed: "Lõpetatud",
    chatWithUs: "Vestle Assistendiga",
    send: "Saada",
  },
} as const;

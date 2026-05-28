// Pure HTTP client for api.eagleclubsystems.online.
// IMPORTANT: this file is mirrored at src/lib/eagle.ts. Keep both in sync.
import axios from "axios";

const API_BASE = "https://api.eagleclubsystems.online";
const BCC_DEFAULTS = {
  StrServer: "GSERVER",
  StrURL: "https://api.EagleClubSystems.online",
  StrDatabase: "jaxbeach20260601",
  IntOrganizationID: 1,
  EmailErrors: false,
  SignalRConnectionID: "",
  Information: "",
  PrinterName: "",
  CampaignMonitorMasterListName: "",
  CampaignMonitorApiKey: "",
  CampaignMonitorClientID: "",
  LsteInterfaceID: [] as never[],
  ipAddress: "",
  Version: "1.260518.0",
  FromProgram: "BE",
};
const LOGIN_OPERATOR_ID = 2;
const TURN_TIME_MIN = 126;
export const FRONT_NINE_ID = 108;
export const BACK_NINE_ID = 109;
const DEFAULT_CARRIAGE_ID = 95;
const GUEST_FALLBACK_PRICE_CLASS_ID = 85;

export type EaglePass = {
  masterId: number;
  description: string;
  onlineMaxDays: number;
};

export type EagleSession = {
  customerId: number;
  email: string;
  priceClassId: number;
  searchPriceClassId: number;
  maxBookingDays: number;
  pass: EaglePass | null;
  cookies?: string[];
};

export type EagleSlot = {
  playerSlotIds: number[];
  date: string;
  time: string;
  nineId: number;
  nineName: string;
  priceClassId: number;
  turnNineId: number;
};

export type EagleReservation = {
  appointmentDetailId: number;
  appointmentSlotDetailId: number;
  date: string;
  time: string;
  legHoles: string;
  nineName: string;
  players: number;
  fee: string;
};

export type EagleLoginResult = {
  session: EagleSession;
  reservations: EagleReservation[];
};

type BCC = typeof BCC_DEFAULTS & { IntOperatorID: number };

function bcc(operatorId: number): BCC {
  return { ...BCC_DEFAULTS, IntOperatorID: operatorId };
}

function cookieHeaders(s: EagleSession): Record<string, string> {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (s.cookies?.length) base.Cookie = s.cookies.join("; ");
  return base;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function addMinutesHHMM(hhmm: string, minutes: number): string {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = parseInt(hhmm.slice(2, 4), 10);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}${String(nm).padStart(2, "0")}`;
}

export function pairBackNine(slots: EagleSlot[], front: EagleSlot): EagleSlot | null {
  const targetTime = addMinutesHHMM(front.time, TURN_TIME_MIN);
  return (
    slots.find(
      (s) =>
        s.date === front.date &&
        s.nineId === BACK_NINE_ID &&
        s.time === targetTime
    ) ?? null
  );
}

type RawSlot = {
  LstAppointmentSlotID: number[];
  Date: string;
  Time: string;
  Master_NineID: number;
  NineName: string;
  Eighteen_Master_TeePriceClassID: number;
  Master_TurnNineID: number;
};

function mapSlot(a: RawSlot): EagleSlot {
  return {
    playerSlotIds: a.LstAppointmentSlotID,
    date: a.Date,
    time: a.Time,
    nineId: a.Master_NineID,
    nineName: a.NineName,
    priceClassId: a.Eighteen_Master_TeePriceClassID,
    turnNineId: a.Master_TurnNineID,
  };
}

type RawReservation = {
  AppointmentDetailID: number;
  AppointmentSlotDetailID: number;
  Date: string;
  Time: string;
  Leg: string;
  NineDescription: string;
  Players: number;
  Fee: string;
};

function mapReservation(r: RawReservation): EagleReservation {
  return {
    appointmentDetailId: r.AppointmentDetailID,
    appointmentSlotDetailId: r.AppointmentSlotDetailID,
    date: r.Date,
    time: r.Time,
    legHoles: r.Leg,
    nineName: r.NineDescription,
    players: r.Players,
    fee: r.Fee,
  };
}

type LoginResponse = {
  BG: { BoolSuccess: boolean };
  customer?: {
    CustomerID: number;
    Master_TeePriceClassID: number;
    LstTeePriceClass?: Array<{ MasterID: number; Description: string; OnlineMaxDays: number }>;
    LstCurrentReservations?: RawReservation[];
  };
};

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<EagleLoginResult> {
  const res = await axios.post<LoginResponse>(
    `${API_BASE}/api/online/OnlineAuthenticateLogin`,
    {
      BCC: bcc(LOGIN_OPERATOR_ID),
      EMailAddress: email,
      Password: password,
      OnlineBookingSeeOthers: 0,
      StrDate: ymd(new Date()),
      OnlinePasswordBypass: 0,
      Master_LiabilityLoyaltyPointsID: 83,
      IncludeCardsOnFile: false,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  const { customer, BG } = res.data;
  if (!BG?.BoolSuccess || !customer?.CustomerID) {
    throw new Error("Eagle login failed");
  }

  const rawPass = customer.LstTeePriceClass?.[0];
  const bookingClass = rawPass?.MasterID ?? customer.Master_TeePriceClassID;
  const maxDays = rawPass?.OnlineMaxDays ?? 7;
  const pass: EaglePass | null = rawPass
    ? { masterId: rawPass.MasterID, description: rawPass.Description, onlineMaxDays: rawPass.OnlineMaxDays }
    : null;

  return {
    session: {
      customerId: customer.CustomerID,
      email,
      priceClassId: bookingClass,
      searchPriceClassId: customer.Master_TeePriceClassID,
      maxBookingDays: maxDays,
      pass,
      cookies: res.headers["set-cookie"],
    },
    reservations: (customer.LstCurrentReservations ?? []).map(mapReservation),
  };
}

type SearchResponse = { LstAppointment?: RawSlot[] };

export async function searchSlots(
  session: EagleSession,
  date: string
): Promise<EagleSlot[]> {
  const res = await axios.post<SearchResponse>(
    `${API_BASE}/api/online/OnlineAppointmentRetrieve`,
    {
      BCC: bcc(session.customerId),
      StrDate: date,
      StrTime: "0000",
      TeePriceClassID: session.searchPriceClassId,
      IncludeExisting: false,
      Master_CarriageID: DEFAULT_CARRIAGE_ID,
      Master_TeePriceClassIDs: `,${session.searchPriceClassId},`,
      OnlineBookingFormat: 0,
      OnlineBookingMaxDays: session.maxBookingDays,
    },
    { headers: cookieHeaders(session) }
  );
  return (res.data?.LstAppointment ?? []).map(mapSlot);
}

type BookResult = { success: true } | { success: false; error: string };

type BookResponse = {
  BG?: { BoolSuccess?: boolean; SqlErrors?: unknown[]; StrExceptions?: unknown[] };
};

function buildBookPayload(
  session: EagleSession,
  front: EagleSlot,
  back: EagleSlot,
  players: number,
  guestPriceClassId: number
) {
  const bookerCustomer = {
    CustomerID: session.customerId,
    PersonID: session.customerId,
    Person: {
      PersonID: session.customerId,
      CustomerID: session.customerId,
      EMail: session.email,
      SendEMail: true,
      OnlineBooking: true,
    },
    OnlineBooking: true,
    LstTeePriceClass: session.pass
      ? [
          {
            MasterID: session.pass.masterId,
            CustomerID: 0,
            Description: session.pass.description,
            OnlineMaxDays: session.pass.onlineMaxDays,
          },
        ]
      : [],
  };
  const guestCustomer = {
    CustomerID: 0,
    PersonID: 0,
    Person: { PersonID: 0, CustomerID: 0, EMail: "", SendEMail: false, OnlineBooking: true },
    OnlineBooking: true,
    LstTeePriceClass: [],
  };

  const items = Array.from({ length: players }, (_, i) => ({
    AppointmentSlotID: front.playerSlotIds[i],
    AppointmentSlotDetailID: 0,
    AppointmentDetailID: 0,
    AppointmentGroupID: 0,
    AppointmentGroupID_Parent: 0,
    AppointmentSlotID2: back.playerSlotIds[i],
    AppointmentSlotDetailID2: 0,
    Leg: 18,
    Leg2: 2,
    Date: front.date,
    Time: front.time,
    TimeThru: "",
    PriorityTime: 1,
    PriorityNine: 1,
    Master_NineID: front.nineId,
    NineName: "",
    Time2: back.time,
    PriorityTime2: 1,
    PriorityNine2: 2,
    Master_NineID2: back.nineId,
    Master_TeePriceClassID: i === 0 ? session.priceClassId : guestPriceClassId,
    CartID: 0,
    Cart: "",
    CartRequested: false,
    RackRateID: 1,
    RackRate: "",
    Note: "",
    Comment: "",
    StartingHole: "",
    Holes: "18",
    Delete: false,
    CheckIn: false,
    Person_WhoBookedID: 0,
    Person_GuestOfID: i === 0 ? 0 : session.customerId,
    Customer: i === 0 ? bookerCustomer : guestCustomer,
    Telephone: "",
    Master_CarriageID: DEFAULT_CARRIAGE_ID,
    OnlineBooking: true,
    BookedOnline: true,
    Players: 0,
    SystemDateTime: `/Date(${Date.now()})/`,
  }));

  const returns = items.flatMap(() => [
    { Time: front.time, PriorityTime: 1, Master_NineID: front.nineId, BoolItemsToRight: false },
    { Time: back.time, PriorityTime: 1, Master_NineID: back.nineId, BoolItemsToRight: false },
  ]);

  return {
    BCC: bcc(session.customerId),
    LstAppointmentItem: items,
    LstDeleted: [] as never[],
    LstBackNineDeleted: [] as never[],
    LstEmailInvite: [] as never[],
    AppointmentGroup: {
      AppointmentGroupID: 0,
      AppointmentGroupID_Parent: 0,
      Description: "",
      BackgroundColor: "",
      ForegroundColor: "#000000",
      MaxTeamSize: 4,
      Type: 0,
      Separate: false,
      Master_BlockTimeTypeID: 0,
      Master_MemberGroupID: 0,
      Date: "",
      DateFormatted: "",
      BookOnline: false,
      Players: 0,
      InventoryItemID: 0,
    },
    StrDate: front.date,
    StrDateNow: ymd(new Date()),
    Action: "InsertUpdate",
    SignalRConnectionID: "",
    LstCardConnectTransaction: [] as never[],
    OnlineBooking: true,
    LstAppointmentReturn: returns,
    OnlineBookingChargeAction: 0,
    Master_CourseAreaID: 0,
  };
}

async function postBook(
  session: EagleSession,
  payload: ReturnType<typeof buildBookPayload>
): Promise<BookResult> {
  try {
    const res = await axios.post<BookResponse>(
      `${API_BASE}/api/appointment/AppointmentInsertUpdate`,
      payload,
      { headers: cookieHeaders(session) }
    );
    if (!res.data?.BG?.BoolSuccess) {
      const errs = [...(res.data?.BG?.SqlErrors ?? []), ...(res.data?.BG?.StrExceptions ?? [])];
      return { success: false, error: JSON.stringify(errs) };
    }
    return { success: true };
  } catch (e) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function bookEighteen(
  session: EagleSession,
  front: EagleSlot,
  back: EagleSlot,
  players: number
): Promise<BookResult> {
  if (players < 1 || players > 4) throw new Error("players must be 1-4");
  if (front.playerSlotIds.length < players || back.playerSlotIds.length < players) {
    return { success: false, error: "not enough open spots" };
  }
  const first = await postBook(
    session,
    buildBookPayload(session, front, back, players, session.priceClassId)
  );
  if (first.success || players === 1) return first;
  return postBook(
    session,
    buildBookPayload(session, front, back, players, GUEST_FALLBACK_PRICE_CLASS_ID)
  );
}

type CancelResponse = { BG?: { BoolSuccess?: boolean } };

export async function cancelReservation(
  session: EagleSession,
  r: EagleReservation
): Promise<boolean> {
  const res = await axios.post<CancelResponse>(
    `${API_BASE}/api/appointment/AppointmentCancelNoShowTeeTime`,
    {
      BCC: bcc(session.customerId),
      Date: r.date,
      CancelGroup: false,
      AppointmentGroupID: 0,
      LstAppt: [
        {
          AppointmentSlotDetailID: r.appointmentSlotDetailId,
          AppointmentDetailID: r.appointmentDetailId,
          AppointmentSlotID: 0,
          AppointmentCancelRescheduleDetailID: 0,
          Notes: "",
          PersonID: session.customerId,
          Time: r.time,
          NineName: r.nineName,
          NoShow: false,
          Reschedule: false,
          SendEmail: true,
          Master_CancelReasonID: 0,
          Forgive: false,
          LstInventory: [] as never[],
          LstInventoryCancelled: [] as never[],
          SystemDateTime: `/Date(${Date.now()})/`,
        },
      ],
      LstAppointmentUpdateReturn: [] as never[],
      CancelGroupMemberKeepSlot: false,
    },
    { headers: cookieHeaders(session) }
  );
  return !!res.data?.BG?.BoolSuccess;
}

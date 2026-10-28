import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function todayInChile(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function maxCapacity(value: string | null): number | null {
  const numbers = value?.match(/\d+/g)?.map(Number).filter((n) => n > 0) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}

export async function inspectAvailability(
  supabase: SupabaseClient,
  cabinName: string,
  arrivalDate: string,
  departureDate: string,
  guests?: number,
) {
  const { data: cabin, error: cabinError } = await supabase
    .from("cabin")
    .select("id, name, capacity, high_season_price, low_season_price")
    .eq("name", cabinName)
    .eq("is_active", true)
    .maybeSingle();
  if (cabinError) throw cabinError;
  if (!cabin) return { available: false, reason: "cabin_unavailable" as const };

  const capacity = maxCapacity(cabin.capacity);
  if (guests && capacity && guests > capacity) {
    return { available: false, reason: "capacity" as const, capacity };
  }

  const [{ data: bookings, error: bookingsError }, { data: entries, error: entriesError }, { data: externalBlocks, error: externalBlocksError }] = await Promise.all([
    supabase
      .from("booking_request")
      .select("id")
      .eq("cabin", cabin.name)
      .eq("status", "confirmada")
      .lt("arrival_date", departureDate)
      .gt("departure_date", arrivalDate)
      .limit(1),
    supabase
      .from("visitor_entry")
      .select("id")
      .eq("cabin", cabin.name)
      .not("check_in_time", "is", null)
      .is("check_out_time", null)
      .lt("entry_date", departureDate)
      .limit(1),
    supabase
      .from("external_calendar_block")
      .select("id, external_calendar!inner(cabin_id)")
      .eq("external_calendar.cabin_id", cabin.id)
      .lt("starts_on", departureDate)
      .gt("ends_on", arrivalDate)
      .limit(1),
  ]);
  if (bookingsError) throw bookingsError;
  if (entriesError) throw entriesError;
  if (externalBlocksError) throw externalBlocksError;

  return {
    available: !bookings?.length && !entries?.length && !externalBlocks?.length,
    reason: bookings?.length || entries?.length || externalBlocks?.length ? "occupied" as const : null,
    capacity,
    rates: {
      high: cabin.high_season_price === null ? null : Number(cabin.high_season_price),
      low: cabin.low_season_price === null ? null : Number(cabin.low_season_price),
    },
  };
}

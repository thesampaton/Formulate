import { countries } from "@/declarations/address";
import type { AddressValues } from "@/declarations/address";

export function AddressSummary({ address }: { address: AddressValues }) {
  return <>{address.street}<br />{address.postcode} · {countries.find(({ value }) => value === address.countryCode)?.label ?? address.countryCode}</>;
}

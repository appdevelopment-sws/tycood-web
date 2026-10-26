export enum TruckBodyType {
  OPEN_HALF_BODY = 'Open Half Body',
  OPEN_FULL_BODY = 'Open Full Body',
  CONTAINER = 'Container',
  FLATBED = 'Flatbed Trailer',
  LCV = 'LCV',
  MINI_PICKUP = 'Mini/Pickup',
  TIPPER = 'Tipper',
  TANKER = 'Tanker',
  DUMPER = 'Dumper',
  BULKER = 'Bulker',
}

export enum LoadStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum PaymentTerms {
  TO_PAY = 'To Pay',
  ADVANCE_BALANCE = 'Advance + Balance',
  PAID = 'Paid',
}

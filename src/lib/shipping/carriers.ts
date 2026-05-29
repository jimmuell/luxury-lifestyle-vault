export type CarrierCode = 'ups' | 'fedex' | 'usps' | 'dhl' | 'other'

export interface CarrierMeta {
  code: CarrierCode
  label: string
  trackingUrl: (trackingNumber: string) => string
}

export const CARRIERS: CarrierMeta[] = [
  {
    code: 'ups',
    label: 'UPS',
    trackingUrl: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  },
  {
    code: 'fedex',
    label: 'FedEx',
    trackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  },
  {
    code: 'usps',
    label: 'USPS',
    trackingUrl: (n) => `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${encodeURIComponent(n)}`,
  },
  {
    code: 'dhl',
    label: 'DHL',
    trackingUrl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
  },
  {
    code: 'other',
    label: 'Other',
    trackingUrl: () => '',
  },
]

export function getCarrier(code: CarrierCode | string): CarrierMeta | undefined {
  return CARRIERS.find(c => c.code === code)
}

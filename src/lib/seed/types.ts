export interface SeedResult {
  seeded: number
  skipped: number
  errors: string[]
}

export interface SeedScript {
  id: string
  name: string
  description: string
  script: () => Promise<SeedResult>
}

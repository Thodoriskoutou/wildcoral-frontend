import type { StoreRegion } from '@medusajs/types'

export function regionForCountry(regions: StoreRegion[] | null | undefined, countryCode: string) {
	const code = countryCode.toLowerCase()
	return regions?.find((region) => region.countries?.some((country) => country?.iso_2?.toLowerCase() === code))
}

export function countriesFromRegions(regions: StoreRegion[] | null | undefined) {
	const countries = new Map<string, { code: string; name: string }>()
	for (const region of regions ?? []) {
		for (const country of region.countries ?? []) {
			const code = country?.iso_2?.toLowerCase()
			if (code && !countries.has(code)) countries.set(code, { code, name: country.display_name ?? code.toUpperCase() })
		}
	}
	return [...countries.values()].sort((a, b) => a.name.localeCompare(b.name))
}

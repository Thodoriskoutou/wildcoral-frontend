/**
 * The Greek (and a few English) texts the translation seed puts in Medusa's Translation module for
 * the catalog in catalog.ts. Products, categories, options and tags are looked up by their English
 * name or handle, so edit the English side only if you renamed them in Medusa.
 *
 * Anything missing here simply shows in the default language.
 */

export interface Languages {
	/** Languages the store offers, as Medusa locale codes. The first is the default language. */
	locales: string[];
}

export const languages: Languages = { locales: ['en-US', 'el-GR'] };

export const greek = {
	locale: 'el-GR',

	/** Category name (as created by catalog.ts) → Greek texts. */
	categories: {
		Bikinis: { name: 'Μπικίνι', description: 'Τρίγωνα μπικίνι με δέσιμο, κρίκους και πούλιες.' },
		'One Pieces': { name: 'Ολόσωμα', description: 'Ολόσωμα με βαθύ ντεκολτέ, ανοίγματα και μεταλλικές λεπτομέρειες.' }
	} as Record<string, { name: string; description?: string }>,

	/** Product handle → Greek texts. */
	products: {
		'sequin-ring-bikini': {
			title: 'Μπικίνι με πούλιες και κρίκους',
			description:
				'Λαμπερό τρίγωνο μπικίνι με πούλιες, μεταλλικούς κρίκους στο στήθος και στα πλάγια, δέσιμο στον λαιμό και σλιπ με πλαϊνά δεσίματα.'
		},
		'rose-bikini': {
			title: 'Μπικίνι Τριαντάφυλλο',
			description: 'Τρίγωνο μπικίνι με μεγάλα διακοσμητικά τριαντάφυλλα στο στήθος και σλιπ με πλαϊνά δεσίματα.'
		},
		'holographic-wrap-bikini': {
			title: 'Ολογραφικό μπικίνι με δέσιμο',
			description: 'Ολογραφικό ασημί τρίγωνο μπικίνι με ροζ δέσιμο τύπου wrap και σλιπ με λεπτά πλαϊνά δεσίματα.'
		},
		'holographic-one-piece': {
			title: 'Ολογραφικό ολόσωμο',
			description: 'Ολόσωμο halter με βαθύ ντεκολτέ σε ολογραφικό ασημί, με χρυσό κρίκο στο ντεκολτέ και ανοίγματα στα πλάγια.'
		},
		'black-ring-one-piece': {
			title: 'Μαύρο ολόσωμο με κρίκο',
			description: 'Ολόσωμο halter με χρυσό κρίκο στο ντεκολτέ και διάφανο δίχτυ στη μέση.'
		},
		'leopard-wrap-one-piece': {
			title: 'Ολόσωμο λεοπάρ με σταυρωτό',
			description:
				'Ολόσωμο με σταυρωτό μπροστινό μέρος και βαθύ ντεκολτέ, σε κρεμ και ταμπά λεοπάρ, με άνοιγμα στο πλάι και φούντα από σουέντ.'
		},
		'copper-chain-bikini': {
			title: 'Μπικίνι με χάλκινες αλυσίδες',
			description: 'Μεταλλικό χάλκινο τρίγωνο μπικίνι με κρίκους στο στήθος και στα πλάγια.'
		}
	} as Record<string, { title: string; description?: string }>,

	/** Option title as created by catalog.ts → Greek. */
	options: { Color: 'Χρώμα', Size: 'Μέγεθος' } as Record<string, string>,

	/** Option value (the colors) → Greek. Sizes (XS … XL) are the same in both languages. */
	optionValues: {
		Gold: 'Χρυσό',
		Olive: 'Λαδί',
		Pistachio: 'Φυστικί',
		Pink: 'Ροζ',
		Copper: 'Χάλκινο',
		Silver: 'Ασημί',
		Black: 'Μαύρο',
		'Cream Leopard': 'Κρεμ λεοπάρ'
	} as Record<string, string>,

	/** Product tag → Greek (the "Style" filter of the shop). */
	tags: {
		bikini: 'μπικίνι',
		sequin: 'πούλιες',
		'ring detail': 'λεπτομέρεια με κρίκο',
		'side-tie': 'πλαϊνό δέσιμο',
		'triangle top': 'τρίγωνο top',
		sparkle: 'λάμψη',
		floral: 'φλοράλ',
		'rose appliqué': 'τριαντάφυλλο',
		statement: 'statement',
		holographic: 'ολογραφικό',
		metallic: 'μεταλλικό',
		'wrap ties': 'δέσιμο wrap',
		strappy: 'με λουράκια',
		'one-piece': 'ολόσωμο',
		plunge: 'βαθύ ντεκολτέ',
		'cut-out': 'με ανοίγματα',
		halter: 'halter',
		mesh: 'δίχτυ',
		classic: 'κλασικό',
		leopard: 'λεοπάρ',
		'animal print': 'animal print',
		wrap: 'σταυρωτό',
		tassel: 'φούντα',
		copper: 'χάλκινο',
		chain: 'αλυσίδα',
		string: 'με κορδόνια'
	} as Record<string, string>,

	/** Delivery option name (as created by shipping-catalog.ts or Medusa's demo data) → Greek. */
	shippingOptions: {
		'Standard delivery': 'Τυπική παράδοση',
		'Express delivery': 'Εξπρές παράδοση',
		'Standard delivery (EU)': 'Τυπική παράδοση (ΕΕ)',
		'Standard Shipping': 'Τυπική αποστολή',
		'Express Shipping': 'Εξπρές αποστολή',
		'Standard shipping': 'Τυπική αποστολή'
	} as Record<string, string>
};

/**
 * The return reasons are created in Greek (src/migration-scripts/seed-return-reasons.ts), so these
 * are their English versions, by reason value.
 */
export const english = {
	locale: 'en-US',
	returnReasons: {
		withdrawal: { label: 'Withdrawal (within 14 days)', description: 'Right of withdrawal, within 14 days' },
		wrong_item: { label: 'Wrong item (store error)', description: 'Wrong item sent, store error' },
		defective: { label: 'Defective item (2-year guarantee)', description: 'Defective item, 2-year guarantee' },
		other: { label: 'Other', description: 'Other reason' }
	} as Record<string, { label: string; description: string }>
};

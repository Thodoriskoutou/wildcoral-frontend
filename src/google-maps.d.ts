// SvelteKit 3's `$app/tsconfig` sets an explicit `types` array, which turns off
// TypeScript's automatic @types/* discovery. The address autocomplete component
// references the `google.maps` namespace, so pull those types in by hand.
//
// Only needed if you keep `google-places-autocomplete`; delete this file and the
// `@types/google.maps` devDependency along with it.
/// <reference types="google.maps" />

// Root page — serve the SureLeads homepage
// The actual page is rendered by app/(public)/page.tsx via the (public) layout group.
// This file simply re-exports it so the root route resolves correctly.
export { default } from './(public)/page';

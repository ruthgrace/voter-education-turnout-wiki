// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Deployed to GitHub Pages as a project site (served from a subpath).
	site: 'https://ruthgrace.github.io',
	base: '/voter-education-turnout-wiki',
	integrations: [
		starlight({
			title: 'Voter Education and Voter Turnout',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{
					label: 'Policy Approaches',
					items: [{ autogenerate: { directory: 'policy-approaches' } }],
				},
				{
					label: 'Interventions',
					items: [{ autogenerate: { directory: 'interventions' } }],
				},
				{
					label: 'Key Debates',
					items: [{ autogenerate: { directory: 'key-debates' } }],
				},
				{
					label: 'Research',
					items: [{ autogenerate: { directory: 'research' } }],
				},
			],
		}),
	],
});

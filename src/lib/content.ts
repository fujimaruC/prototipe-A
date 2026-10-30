/**
 * Single source of truth for every string on the site.
 * Edit this file only — no component should contain copy.
 * Anything marked `TODO` needs a decision or data from Jericho.
 */

export interface Identity {
	first: string;
	last: string;
	role: string;
	tagline: string;
	location: string;
	timezone: string;
	aliases: { label: string; value: string; note: string }[];
}

export interface Port {
	id: string;
	label: string;
	value: string;
	detail: string;
}

export interface CaseFile {
	id: string;
	title: string;
	category: 'NET' | 'OSINT' | 'WEB' | 'REV' | 'SYS';
	status: 'documented' | 'in-progress' | 'draft';
	year: string;
	summary: string;
	body: string[];
	link?: { href: string; label: string };
	placeholder?: boolean;
}

export interface RecordRow {
	event: string;
	scope: string;
	year: string;
	result: string;
	detail: string;
}

export interface Cert {
	name: string;
	issuer: string;
	year: string;
}

export interface StackGroup {
	title: string;
	note: string;
	items: string[];
}

export interface Contact {
	email: string | null;
	links: { label: string; href: string; note: string }[];
	availability: string;
}

export const identity: Identity = {
	first: 'Jericho',
	last: 'Mikael',
	role: 'Network engineer · Security · All-round IT',
	tagline:
		'I build and defend the networks other people only see when they break. MikroTik routing, CTF work, bug bounty, and the unglamorous everything-IT that keeps a small team running.',
	location: 'Balikpapan, East Kalimantan',
	timezone: 'Asia/Makassar',
	aliases: [
		{ label: 'handle', value: 'N-EX', note: 'used in CTF teams and on the wire' },
		{ label: 'alias', value: 'Fujimaru', note: 'GitHub and long-running accounts' },
	]
};

export const ports: Port[] = [
	{ id: 'P01', label: 'Profile', value: 'Who is answering', detail: 'bio · skill matrix' },
	{ id: 'P02', label: 'Case files', value: 'Work on the record', detail: 'projects · write-ups' },
	{ id: 'P03', label: 'Record', value: 'Competition results', detail: 'LKS · certifications' },
	{ id: 'P04', label: 'Stack', value: 'What runs the rack', detail: 'tools · systems' },
	{ id: 'P05', label: 'Contact', value: 'Open a line', detail: 'email · links' }
];

export const about = {
	heading: 'Who is answering',
	lede:
		'First-year Information Systems student at Institut Teknologi Kalimantan. Three years of Linux as a daily driver, a MikroTik lab I keep rebuilding, and a habit of taking networks apart to see why they hold.',
	paragraphs: [
		'I came to security through networking rather than the other way round: you cannot defend a path you have not traced by hand. That is why most of what is on this site is a record of the same thing done repeatedly — routing, switching, capture, and then the write-up.',
		'Alongside competition work I run bug bounty research on BNB Chain and Immunefi, and I take freelance work where a small team needs a network that is documented, not just working.'
	],
	matrix: [
		{ area: 'Networking', level: 'Daily', note: 'MikroTik RouterOS, VLANs, routing, firewall' },
		{ area: 'Systems', level: 'Daily', note: 'Arch and Ubuntu as primary OS for ~3 years' },
		{ area: 'Security', level: 'Active', note: 'CTF, web and reverse challenges, bounty triage' },
		{ area: 'Scripting', level: 'Working', note: 'Python and shell for automation and tooling' },
		{ area: 'Everything IT', level: 'On request', note: 'hardware, imaging, small-office setup, support' }
	]
};

export const caseFiles: CaseFile[] = [
	{
		id: 'CF-01',
		title: 'osint-engine',
		category: 'OSINT',
		status: 'documented',
		year: '2025',
		summary:
			'Recon pipeline that collects public footprint data for a domain and resolves it into one graph.',
		body: [
			'Write-up in progress. The pipeline runs, the repository is public, and the notes that explain the non-obvious design decision are not written up yet.',
			'Until then, the code is the honest record.'
		],
		link: { href: 'https://github.com/fujimaruC/osint-engine', label: 'github.com/fujimaruC/osint-engine' }
	},
	{
		id: 'CF-02',
		title: 'Lab topology',
		category: 'NET',
		status: 'draft',
		year: '2025',
		summary: 'A MikroTik lab build: what was tested, and what failed first.',
		body: ['Build notes not published yet. This slot is reserved for a lab that is worth documenting end to end.'],
		placeholder: true
	},
	{
		id: 'CF-03',
		title: 'CTF write-up',
		category: 'REV',
		status: 'draft',
		year: '2025',
		summary: 'One reverse-engineering or web challenge, solved and explained properly.',
		body: ['Not published yet. A write-up lands here once the intended solution path is worth reading.'],
		placeholder: true
	},
	{
		id: 'CF-04',
		title: 'Bounty finding',
		category: 'WEB',
		status: 'in-progress',
		year: '2026',
		summary: 'A disclosed bug bounty report, redacted to what the program allows.',
		body: ['Not published yet. Anything that lands here is limited to what the program permits disclosing.'],
		placeholder: true
	}
];

export const record: RecordRow[] = [
	{
		event: 'LKS Cyber Security',
		scope: 'Provincial · East Kalimantan',
		year: '2025',
		result: '1st',
		detail: 'Provincial winner, qualifying slot'
	},
	{
		event: 'LKS Nasional XXXIV',
		scope: 'National · Cyber Security',
		year: '2026',
		result: 'Qualified',
		detail: 'Qualified to compete; result pending'
	},
	{
		event: 'LKS Cyber Security',
		scope: 'City level',
		year: '2023',
		result: '1st',
		detail: 'First of three consecutive city entries'
	},
	{
		event: 'LKS Cyber Security',
		scope: 'City level',
		year: '2024',
		result: '1st',
		detail: 'Second consecutive first place'
	},
	{
		event: 'LKS Cyber Security',
		scope: 'City level',
		year: '2025',
		result: '2nd',
		detail: 'Third consecutive city entry'
	}
];

export const certs: Cert[] = [
	{ name: 'MTCNA', issuer: 'MikroTik', year: '2024' },
	{ name: 'MTCRE', issuer: 'MikroTik', year: '2025' },
	{ name: 'Junior Technical Support', issuer: 'BNSP', year: '2024' },
	{ name: 'Certificate of Competency', issuer: 'School TKJ programme', year: '2023' }
];

export const stack: StackGroup[] = [
	{
		title: 'Network',
		note: 'the part that has to keep working',
		items: ['MikroTik RouterOS', 'VLAN + trunking', 'OSPF / static routing', 'firewall + NAT', 'Wireshark capture']
	},
	{
		title: 'Systems',
		note: 'daily driver, not a VM',
		items: ['Arch Linux', 'Ubuntu Server', 'systemd', 'Docker', 'shell automation']
	},
	{
		title: 'Security',
		note: 'where the practice goes',
		items: ['CTF (web, rev, misc)', 'bug bounty: BNB Chain, Immunefi', 'Burp Suite', 'nmap / ffuf', 'Python tooling']
	},
	{
		title: 'Field',
		note: 'the everything-IT part',
		items: ['rack + cabling', 'hardware diagnostics', 'imaging + deployment', 'small-office setup']
	}
];

export const contact: Contact = {
	email: null, // TODO: which address goes public
	links: [
		{ label: 'GitHub', href: 'https://github.com/fujimaruC', note: 'fujimaruC' }
		// TODO: add LinkedIn / CTF profile once Jericho confirms which are public.
	],
	availability: 'Open to freelance and remote work. Fastest reply is email.'
};

/**
 * Where each test point physically lives. The marker names the location, never the token:
 * the token itself stays in the file or element it describes.
 */
export const testPointHints: { id: string; where: string; hint: string }[] = [
	{ id: 'TP-01', where: 'sheet markup', hint: 'An attribute on the main sheet, hidden from view.' },
	{ id: 'TP-02', where: 'ports.csv', hint: 'The port schedule in the repository root.' },
	{ id: 'TP-03', where: 'robots.txt', hint: 'The file crawlers read first.' },
	{ id: 'TP-04', where: 'layout', hint: 'A span in the root layout, after the skip link.' },
	{ id: 'TP-05', where: 'cable drawing', hint: 'The description of the cable in the hero.' },
	{ id: 'TP-06', where: '404 sheet', hint: 'The sheet you only see when a route is missing.' }
];

/** One line per section, shown by the character. Facts only, nothing it cannot know. */
export const bubbles: Record<string, string> = {
	home: 'Rack is up. Scroll when ready.',
	profile: 'Three years of Arch, still rebuilding the lab.',
	cases: 'One write-up is real. The rest are still slots.',
	record: 'Provincial first, nationals qualified. Result pending.',
	stack: 'Arch and RouterOS, both in daily use.',
	contact: 'Email is not published yet. GitHub works.'
};

export const secret = {
	heading: 'Every port accounted for',
	lede: 'You traced all six test points. This page is not on the drawing.',
	body: [
		'The short version: I am looking for work where networks have to be documented, not just made to work — freelance, remote, or a team that needs an extra pair of hands on the rack.',
		'Use the contact line on the main sheet. Mention the test points and you will get a faster reply.'
	],
	locked: {
		heading: 'Access restricted',
		lede: 'This route opens when all six test points on the drawing have been traced.',
		found: (n: number) => `${n} of 6 test points traced.`,
		hint: 'Test points are marked TP-01 to TP-06 and live in the page source, the drawing, and one file that is not a page.'
	}
};

export const meta = {
	title: 'Jericho Mikael — network engineer, security, all-round IT',
	description:
		'Jericho Mikael is a network and security engineer in East Kalimantan: MikroTik routing, CTF competition record, bug bounty research, and everything-IT support.',
	siteName: 'Jericho Mikael',
	aliases: 'N-EX / Fujimaru'
};

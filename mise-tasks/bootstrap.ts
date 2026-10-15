import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'

type Command = [string, ...string[]]

function startupCommand(command: Command, capture = false): string {
	const [file, ...args] = command

	const result = spawnSync(file, args, {
		encoding: 'utf8',
		stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
	})

	if (result.error) throw result.error

	if (result.status !== 0) {
		throw new Error(`${file} failed (${result.signal ?? result.status})`)
	}

	return result.stdout?.trimEnd() ?? ''
}

async function bootstrap(): Promise<void> {
	const args = process.argv.slice(2)

	if (
		args.length > 1 ||
		(args[0] && !['--verbose', '--help'].includes(args[0]))
	) {
		console.error('Usage: mise run bootstrap [--verbose]')
		process.exitCode = 2

		return
	}

	if (args[0] === '--help') {
		console.log('Usage: mise run bootstrap [--verbose]')

		return
	}

	const verbose =
		args[0] === '--verbose' || process.env.usage_verbose === 'true'

	process.chdir(resolve(import.meta.dirname, '..'))
	// Headless hosts lack a keyring/TPM; suppress Varlock backend probes.
	process.env._VARLOCK_FORCE_FILE_ENCRYPTION_FALLBACK = '1'

	const gum = spawnSync('gum', ['--version'], { stdio: 'ignore' })

	if (gum.error || gum.status !== 0) {
		throw new Error('gum is required; run mise install before bootstrap')
	}

	const appName = startupCommand(
		['gum', 'style', '--bold', '--foreground', '212', basename(process.cwd())],
		true,
	)

	startupCommand([
		'gum',
		'style',
		'--border',
		'double',
		'--border-foreground',
		'212',
		'--padding',
		'1 3',
		'--margin',
		'1 0',
		'--align',
		'center',
		'--width',
		'44',
		appName,
		'workspace bootstrap',
	])

	// A fresh clone has no Execa yet. Node 24 runs this entry point without tsx.
	for (const [title, command] of [
		['Install tools (mise i)', ['mise', 'install']],
		['Install packages (vp i)', ['vp', 'i']],
	] satisfies [string, Command][]) {
		if (verbose) console.log(`  ${title}`)

		startupCommand(
			verbose
				? command
				: [
						'gum',
						'spin',
						'--show-error',
						'--title',
						`  ${title}...`,
						'--',
						...command,
					],
		)
		startupCommand(['gum', 'style', '--foreground', '82', `  ✓ ${title}`])
	}

	const { $ } = await import('execa')
	const { setupWorkspace } = await import('./internal/workspace.ts')
	const { collectGarbage } = await import('./internal/gc.ts')
	const { verifyApp } = await import('./internal/readiness.ts')
	const inherited = $({ stdio: 'inherit' })

	async function complete(title: string): Promise<void> {
		await inherited`gum style --foreground 82 ${`  ✓ ${title}`}`
	}

	async function step(title: string, command: Command): Promise<void> {
		if (verbose) {
			console.log(`  ${title}`)
			await inherited`${command}`
		} else {
			await inherited`gum spin --show-error --title ${`  ${title}...`} -- ${command}`
		}

		await complete(title)
	}

	const { baseUrl, summary } = setupWorkspace()
	await complete('Configure workspace')
	const removed = await collectGarbage()
	await complete(`Remove orphaned compose stacks (${removed} removed)`)

	// Agent mode redacts secrets and rejects prompts in headless sessions.
	await step('Validate env with varlock', [
		'vp',
		'exec',
		'varlock',
		'load',
		'--agent',
		'--format',
		'pretty',
	])
	await step('Start Docker services', ['vp', 'run', 'compose:up'])
	await step('Apply database migrations', ['vp', 'run', 'db:migrate'])

	const pitchfork = await $({ reject: false })`pitchfork --version`
	const hasDaemon = existsSync('pitchfork.toml') && pitchfork.exitCode === 0

	if (hasDaemon) await step('Start dev daemon', ['pitchfork', 'start', 'dev'])

	await verifyApp(
		baseUrl,
		hasDaemon
			? async () => {
					await inherited`gum style --foreground 220 ${'  App not answering; force-restarting dev daemon'}`
					await inherited`pitchfork restart dev --force`
				}
			: undefined,
	)
	await complete('Verify app responds')

	const heading =
		await $`gum style --bold --foreground 82 ${'✓ Bootstrap complete'}`

	const details = await Promise.all(
		summary.map(async (line) => {
			const result = await $`gum style --foreground 39 ${line}`

			return result.stdout
		}),
	)

	await inherited`gum style --border rounded --border-foreground 82 --padding ${'0 3'} --margin ${'1 0'} ${heading.stdout} ${details}`
}

try {
	await bootstrap()
} catch (error) {
	console.error(
		`✗ Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`,
	)
	process.exitCode = 1
}

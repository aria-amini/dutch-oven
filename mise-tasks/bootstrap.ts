import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'

type Command = [string, ...string[]]

function run(command: Command, capture = false): string {
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

// A fresh clone has no node_modules, so the @aamini/config bin does not exist
// yet. This entry point uses only Node builtins: it installs tools and
// packages, then hands the rest to `aamini bootstrap`.
function bootstrap(): void {
	const args = process.argv.slice(2)

	const verbose =
		args.includes('--verbose') || process.env.usage_verbose === 'true'

	const gum = spawnSync('gum', ['--version'], { stdio: 'ignore' })

	if (gum.error || gum.status !== 0) {
		throw new Error('gum is required; run mise install before bootstrap')
	}

	const appName = run(
		['gum', 'style', '--bold', '--foreground', '212', basename(process.cwd())],
		true,
	)

	run([
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

	// Development reads its secrets from OpenBao with a per-machine token.
	if (!existsSync(resolve(homedir(), '.config/openbao/.env.dev'))) {
		throw new Error(
			'no OpenBao dev token on this machine; run `mise run dev-token` in aria-amini/infra',
		)
	}

	for (const [title, command] of [
		['Install tools (mise i)', ['mise', 'install']],
		['Install packages (vp i)', ['vp', 'i']],
	] satisfies [string, Command][]) {
		if (verbose) console.log(`  ${title}`)

		run(
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
		run(['gum', 'style', '--foreground', '82', `  ✓ ${title}`])
	}

	// The bin reports its own failures.
	const result = spawnSync('vp', ['exec', 'aamini', 'bootstrap', ...args], {
		stdio: 'inherit',
	})

	if (result.error) throw result.error

	process.exitCode = result.status ?? 1
}

try {
	bootstrap()
} catch (error) {
	console.error(
		`✗ Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`,
	)
	process.exitCode = 1
}

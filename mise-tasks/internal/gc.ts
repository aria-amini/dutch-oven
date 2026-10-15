import { statSync } from 'node:fs'

import { $ } from 'execa'

function lines(value: string): string[] {
	return value
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
}

export async function collectGarbage(): Promise<number> {
	// Compose directory labels describe the daemon host, not a remote client.
	const host = process.env.DOCKER_HOST

	if (host && !host.startsWith('unix://')) {
		throw new Error(
			`gc: refusing to run against a remote Docker daemon: ${host}`,
		)
	}

	const { stdout } =
		await $`docker ps -a --format ${'{{.Label "com.docker.compose.project"}}'}`

	const projects = [...new Set(lines(stdout))].sort()
	let removed = 0
	let failed = 0

	for (const project of projects) {
		const result =
			await $`docker ps -a --filter ${`label=com.docker.compose.project=${project}`} --format ${'{{.Label "com.docker.compose.project.working_dir"}}'}`

		const directory = lines(result.stdout)[0]

		if (
			!directory ||
			statSync(directory, { throwIfNoEntry: false })?.isDirectory()
		) {
			continue
		}

		console.log(`Removing orphaned stack: ${project} (${directory})`)

		// Compose interpolates the current config even for down on a lost workspace.
		const down = await $({
			env: { DOCKER_SUBNET: '10.255.255.0/24' },
			stdio: 'inherit',
			reject: false,
		})`docker compose -p ${project} down --remove-orphans`

		if (down.exitCode === 0) {
			removed++
		} else {
			console.error(`Failed to remove: ${project}`)
			failed++
		}
	}

	// Docker 29 exposes network labels as a map and omits working_dir.
	const networks =
		await $`docker network ls --filter label=com.docker.compose.project --format ${'{{.Name}}'}`

	for (const network of lines(networks.stdout)) {
		const label =
			await $`docker network inspect ${network} --format ${'{{index .Labels "com.docker.compose.project"}}'}`

		const project = label.stdout.trim()

		if (!project) continue

		const containers =
			await $`docker ps -a --filter ${`label=com.docker.compose.project=${project}`} --format ${'{{.ID}}'}`

		if (containers.stdout.trim()) continue

		console.log(`Removing orphaned network: ${network} (${project})`)

		const result = await $({
			stdio: 'inherit',
			reject: false,
		})`docker network rm ${network}`

		if (result.exitCode !== 0) {
			console.error(`Failed to remove: ${network}`)
			failed++
		}
	}

	if (failed > 0) throw new Error(`gc: ${failed} removal(s) failed`)

	return removed
}

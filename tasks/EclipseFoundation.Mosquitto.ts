import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://mosquitto.org/download/',
		/href=.*?mosquitto[._-](\d+(?:\.\d+)+)[._-]install[._-]windows/i,
	);
	const urls = [
		`https://mosquitto.org/files/binary/win64/mosquitto-${version}-install-windows-x64.exe`,
		`https://mosquitto.org/files/binary/win32/mosquitto-${version}-install-windows-x86.exe`,
	];

	return {
		version,
		urls,
	};
}

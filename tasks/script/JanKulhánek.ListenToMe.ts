import { analyzeInstaller } from '@unownplain/anthelion-komac';
import ky from 'ky';

export default async function () {
	const { productVersion: version } = await analyzeInstaller(
		'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe_Setup.exe',
	);
	const response = await ky(
		'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe.exe',
		{
			redirect: 'manual',
			throwHttpErrors: false,
		},
	);

	const urls = () => [response.headers.get('location')];

	return {
		version,
		urls,
	};
}

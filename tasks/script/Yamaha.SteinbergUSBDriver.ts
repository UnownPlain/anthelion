import { pageMatch } from '@/strategies.ts';

export default async function () {
	const version = await pageMatch(
		'https://o.steinberg.net/en/support/downloads_hardware/yamaha_steinberg_usb_driver.html',
		/yamaha[._-]steinberg[._-]usb[._-]driver[/\\]win[/\\](\d+(?:\.\d+)+)[/\\]/i,
	);
	const urls = [
		`https://download.steinberg.net/downloads_hardware/Yamaha_Steinberg_USB_Driver/Win/${version}/YSUSB_V${version.replace('.', '')}_Win.zip`,
	];

	return {
		version,
		urls,
	};
}

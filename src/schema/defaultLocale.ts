// deno-lint-ignore-file
import { z } from 'zod';

export default z
	.object({
		PackageIdentifier: z
			.string()
			.regex(
				new RegExp(
					'^[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}(\\.[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}){1,7}$',
				),
			)
			.max(128)
			.describe('The package unique identifier'),
		PackageVersion: z
			.string()
			.regex(new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'))
			.max(128)
			.describe('The package version'),
		PackageLocale: z
			.string()
			.regex(
				new RegExp(
					'^([a-zA-Z]{2,3}|[iI]-[a-zA-Z]+|[xX]-[a-zA-Z]{1,8})(-[a-zA-Z]{1,8})*$',
				),
			)
			.max(20)
			.describe('The package meta-data locale')
			.default('en-US'),
		Publisher: z.string().min(2).max(256).describe('The publisher name'),
		PublisherUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		PublisherSupportUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		PrivacyUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		Author: z
			.union([
				z.string().min(2).max(256).describe('The package author'),
				z.null().describe('The package author'),
			])
			.describe('The package author')
			.optional(),
		PackageName: z.string().min(2).max(256).describe('The package name'),
		PackageUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		License: z.string().min(3).max(512).describe('The package license'),
		LicenseUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		Copyright: z
			.union([
				z.string().min(3).max(512).describe('The package copyright'),
				z.null().describe('The package copyright'),
			])
			.describe('The package copyright')
			.optional(),
		CopyrightUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		ShortDescription: z
			.string()
			.min(3)
			.max(256)
			.describe('The short package description'),
		Description: z
			.union([
				z.string().min(3).max(10000).describe('The full package description'),
				z.null().describe('The full package description'),
			])
			.describe('The full package description')
			.optional(),
		Moniker: z
			.union([
				z.string().min(1).max(40).describe('Package moniker or tag'),
				z.null().describe('Package moniker or tag'),
			])
			.describe('Package moniker or tag')
			.optional(),
		Tags: z
			.union([
				z
					.array(
						z
							.union([
								z.string().min(1).max(40).describe('Package moniker or tag'),
								z.null().describe('Package moniker or tag'),
							])
							.describe('Package moniker or tag'),
					)
					.max(16)
					.describe('List of additional package search terms'),
				z.null().describe('List of additional package search terms'),
			])
			.describe('List of additional package search terms')
			.optional(),
		Agreements: z
			.union([
				z
					.array(
						z.object({
							AgreementLabel: z
								.union([
									z
										.string()
										.min(1)
										.max(100)
										.describe(
											'The label of the Agreement. i.e. EULA, AgeRating, etc. This field should be localized. Either Agreement or AgreementUrl is required. When we show the agreements, we would Bold the AgreementLabel',
										),
									z
										.null()
										.describe(
											'The label of the Agreement. i.e. EULA, AgeRating, etc. This field should be localized. Either Agreement or AgreementUrl is required. When we show the agreements, we would Bold the AgreementLabel',
										),
								])
								.describe(
									'The label of the Agreement. i.e. EULA, AgeRating, etc. This field should be localized. Either Agreement or AgreementUrl is required. When we show the agreements, we would Bold the AgreementLabel',
								)
								.optional(),
							Agreement: z
								.union([
									z
										.string()
										.min(1)
										.max(10000)
										.describe('The agreement text content.'),
									z.null().describe('The agreement text content.'),
								])
								.describe('The agreement text content.')
								.optional(),
							AgreementUrl: z
								.union([
									z
										.string()
										.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
										.max(2048)
										.describe('Optional Url type'),
									z.null().describe('Optional Url type'),
								])
								.describe('Optional Url type')
								.optional(),
						}),
					)
					.max(128),
				z.null(),
			])
			.optional(),
		ReleaseNotes: z
			.union([
				z.string().min(1).max(10000).describe('The package release notes'),
				z.null().describe('The package release notes'),
			])
			.describe('The package release notes')
			.optional(),
		ReleaseNotesUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		PurchaseUrl: z
			.union([
				z
					.string()
					.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
					.max(2048)
					.describe('Optional Url type'),
				z.null().describe('Optional Url type'),
			])
			.describe('Optional Url type')
			.optional(),
		InstallationNotes: z
			.union([
				z
					.string()
					.min(1)
					.max(10000)
					.describe(
						'The notes displayed to the user upon completion of a package installation.',
					),
				z
					.null()
					.describe(
						'The notes displayed to the user upon completion of a package installation.',
					),
			])
			.describe(
				'The notes displayed to the user upon completion of a package installation.',
			)
			.optional(),
		Documentations: z
			.union([
				z
					.array(
						z.object({
							DocumentLabel: z
								.union([
									z
										.string()
										.min(1)
										.max(100)
										.describe(
											'The label of the documentation for providing software guides such as manuals and troubleshooting URLs.',
										),
									z
										.null()
										.describe(
											'The label of the documentation for providing software guides such as manuals and troubleshooting URLs.',
										),
								])
								.describe(
									'The label of the documentation for providing software guides such as manuals and troubleshooting URLs.',
								)
								.optional(),
							DocumentUrl: z
								.union([
									z
										.string()
										.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
										.max(2048)
										.describe('Optional Url type'),
									z.null().describe('Optional Url type'),
								])
								.describe('Optional Url type')
								.optional(),
						}),
					)
					.max(256),
				z.null(),
			])
			.optional(),
		Icons: z
			.union([
				z
					.array(
						z.object({
							IconUrl: z
								.string()
								.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
								.max(2048)
								.describe('The url of the hosted icon file'),
							IconFileType: z
								.enum(['png', 'jpeg', 'ico'])
								.describe('The icon file type'),
							IconResolution: z
								.enum([
									'custom',
									'16x16',
									'20x20',
									'24x24',
									'30x30',
									'32x32',
									'36x36',
									'40x40',
									'48x48',
									'60x60',
									'64x64',
									'72x72',
									'80x80',
									'96x96',
									'256x256',
								])
								.describe('Optional icon resolution')
								.optional(),
							IconTheme: z
								.enum(['default', 'light', 'dark', 'highContrast'])
								.describe('Optional icon theme')
								.optional(),
							IconSha256: z
								.union([
									z
										.string()
										.regex(new RegExp('^[A-Fa-f0-9]{64}$'))
										.describe('Optional Sha256 of the icon file'),
									z.null().describe('Optional Sha256 of the icon file'),
								])
								.describe('Optional Sha256 of the icon file')
								.optional(),
						}),
					)
					.max(1024),
				z.null(),
			])
			.optional(),
		ManifestType: z
			.literal('defaultLocale')
			.describe('The manifest type')
			.default('defaultLocale'),
		ManifestVersion: z
			.string()
			.regex(
				new RegExp(
					'^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])(\\.(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])){2}$',
				),
			)
			.describe('The manifest syntax version')
			.default('1.10.0'),
	})
	.describe(
		'A representation of a multiple-file manifest representing a default app metadata in the OWC. v1.10.0',
	);

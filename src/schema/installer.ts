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
			.describe('The package unique identifier')
			.optional(),
		PackageVersion: z
			.string()
			.regex(new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'))
			.max(128)
			.describe('The package version')
			.optional(),
		Channel: z
			.union([
				z.string().min(1).max(16).describe('The distribution channel'),
				z.null().describe('The distribution channel'),
			])
			.describe('The distribution channel')
			.optional(),
		InstallerLocale: z
			.union([
				z
					.string()
					.regex(
						new RegExp(
							'^([a-zA-Z]{2,3}|[iI]-[a-zA-Z]+|[xX]-[a-zA-Z]{1,8})(-[a-zA-Z]{1,8})*$',
						),
					)
					.max(20)
					.describe('The installer meta-data locale'),
				z.null().describe('The installer meta-data locale'),
			])
			.describe('The installer meta-data locale')
			.optional(),
		Platform: z
			.union([
				z
					.array(z.enum(['Windows.Desktop', 'Windows.Universal']))
					.max(2)
					.describe('The installer supported operating system'),
				z.null().describe('The installer supported operating system'),
			])
			.describe('The installer supported operating system')
			.optional(),
		MinimumOSVersion: z
			.union([
				z
					.string()
					.regex(
						new RegExp(
							'^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])(\\.(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])){0,3}$',
						),
					)
					.describe('The installer minimum operating system version'),
				z.null().describe('The installer minimum operating system version'),
			])
			.describe('The installer minimum operating system version')
			.optional(),
		InstallerType: z
			.enum([
				'msix',
				'msi',
				'appx',
				'exe',
				'zip',
				'inno',
				'nullsoft',
				'wix',
				'burn',
				'pwa',
				'portable',
			])
			.describe(
				'Enumeration of supported installer types. InstallerType is required in either root level or individual Installer level',
			)
			.optional(),
		NestedInstallerType: z
			.enum([
				'msix',
				'msi',
				'appx',
				'exe',
				'inno',
				'nullsoft',
				'wix',
				'burn',
				'portable',
			])
			.describe(
				'Enumeration of supported nested installer types contained inside an archive file',
			)
			.optional(),
		NestedInstallerFiles: z
			.union([
				z
					.array(
						z
							.object({
								RelativeFilePath: z
									.string()
									.min(1)
									.max(512)
									.describe('The relative path to the nested installer file'),
								PortableCommandAlias: z
									.union([
										z
											.string()
											.min(1)
											.max(40)
											.describe(
												'The command alias to be used for calling the package. Only applies to the nested portable package',
											),
										z
											.null()
											.describe(
												'The command alias to be used for calling the package. Only applies to the nested portable package',
											),
									])
									.describe(
										'The command alias to be used for calling the package. Only applies to the nested portable package',
									)
									.optional(),
							})
							.describe('A nested installer file contained inside an archive'),
					)
					.max(1024)
					.describe(
						'List of nested installer files contained inside an archive',
					),
				z
					.null()
					.describe(
						'List of nested installer files contained inside an archive',
					),
			])
			.describe('List of nested installer files contained inside an archive')
			.optional(),
		Scope: z
			.enum(['user', 'machine'])
			.describe('Scope indicates if the installer is per user or per machine')
			.optional(),
		InstallModes: z
			.union([
				z
					.array(z.enum(['interactive', 'silent', 'silentWithProgress']))
					.max(3)
					.describe('List of supported installer modes'),
				z.null().describe('List of supported installer modes'),
			])
			.describe('List of supported installer modes')
			.optional(),
		InstallerSwitches: z
			.object({
				Silent: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
							),
						z
							.null()
							.describe(
								'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
							),
					])
					.describe(
						'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
					)
					.optional(),
				SilentWithProgress: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
							),
						z
							.null()
							.describe(
								'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
							),
					])
					.describe(
						'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
					)
					.optional(),
				Interactive: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'Interactive is the value that should be passed to the installer when user chooses an interactive install',
							),
						z
							.null()
							.describe(
								'Interactive is the value that should be passed to the installer when user chooses an interactive install',
							),
					])
					.describe(
						'Interactive is the value that should be passed to the installer when user chooses an interactive install',
					)
					.optional(),
				InstallLocation: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
							),
						z
							.null()
							.describe(
								'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
							),
					])
					.describe(
						'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
					)
					.optional(),
				Log: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
							),
						z
							.null()
							.describe(
								'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
							),
					])
					.describe(
						'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
					)
					.optional(),
				Upgrade: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
							),
						z
							.null()
							.describe(
								'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
							),
					])
					.describe(
						'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
					)
					.optional(),
				Custom: z
					.union([
						z
							.string()
							.min(1)
							.max(2048)
							.describe(
								'Custom switches will be passed directly to the installer by winget',
							),
						z
							.null()
							.describe(
								'Custom switches will be passed directly to the installer by winget',
							),
					])
					.describe(
						'Custom switches will be passed directly to the installer by winget',
					)
					.optional(),
				Repair: z
					.union([
						z
							.string()
							.min(1)
							.max(512)
							.describe(
								"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
							),
						z
							.null()
							.describe(
								"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
							),
					])
					.describe(
						"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
					)
					.optional(),
			})
			.optional(),
		InstallerSuccessCodes: z
			.union([
				z
					.array(
						z
							.any()
							.refine(
								(value) => !z.literal(0).safeParse(value).success,
								'Invalid input: Should NOT be valid against schema',
							)
							.describe(
								'An exit code that can be returned by the installer after execution',
							),
					)
					.max(16)
					.describe(
						'List of additional non-zero installer success exit codes other than known default values by winget',
					),
				z
					.null()
					.describe(
						'List of additional non-zero installer success exit codes other than known default values by winget',
					),
			])
			.describe(
				'List of additional non-zero installer success exit codes other than known default values by winget',
			)
			.optional(),
		ExpectedReturnCodes: z
			.union([
				z
					.array(
						z.object({
							InstallerReturnCode: z
								.any()
								.refine(
									(value) => !z.literal(0).safeParse(value).success,
									'Invalid input: Should NOT be valid against schema',
								)
								.describe(
									'An exit code that can be returned by the installer after execution',
								),
							ReturnResponse: z.enum([
								'packageInUse',
								'packageInUseByApplication',
								'installInProgress',
								'fileInUse',
								'missingDependency',
								'diskFull',
								'insufficientMemory',
								'invalidParameter',
								'noNetwork',
								'contactSupport',
								'rebootRequiredToFinish',
								'rebootRequiredForInstall',
								'rebootInitiated',
								'cancelledByUser',
								'alreadyInstalled',
								'downgrade',
								'blockedByPolicy',
								'systemNotSupported',
								'custom',
							]),
							ReturnResponseUrl: z
								.union([
									z
										.string()
										.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
										.max(2048)
										.describe('Url type'),
									z.null().describe('Url type'),
								])
								.describe('Url type')
								.optional(),
						}),
					)
					.max(128)
					.describe('Installer exit codes for common errors'),
				z.null().describe('Installer exit codes for common errors'),
			])
			.describe('Installer exit codes for common errors')
			.optional(),
		UpgradeBehavior: z
			.enum(['install', 'uninstallPrevious', 'deny'])
			.describe('The upgrade method')
			.optional(),
		Commands: z
			.union([
				z
					.array(z.string().min(1).max(40))
					.max(16)
					.describe('List of commands or aliases to run the package'),
				z.null().describe('List of commands or aliases to run the package'),
			])
			.describe('List of commands or aliases to run the package')
			.optional(),
		Protocols: z
			.union([
				z
					.array(z.string().max(2048))
					.max(64)
					.describe('List of protocols the package provides a handler for'),
				z
					.null()
					.describe('List of protocols the package provides a handler for'),
			])
			.describe('List of protocols the package provides a handler for')
			.optional(),
		FileExtensions: z
			.union([
				z
					.array(
						z
							.string()
							.regex(new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'))
							.max(64),
					)
					.max(512)
					.describe('List of file extensions the package could support'),
				z.null().describe('List of file extensions the package could support'),
			])
			.describe('List of file extensions the package could support')
			.optional(),
		Dependencies: z
			.union([
				z.object({
					WindowsFeatures: z
						.union([
							z
								.array(z.string().min(1).max(128))
								.max(16)
								.describe('List of Windows feature dependencies'),
							z.null().describe('List of Windows feature dependencies'),
						])
						.describe('List of Windows feature dependencies')
						.optional(),
					WindowsLibraries: z
						.union([
							z
								.array(z.string().min(1).max(128))
								.max(16)
								.describe('List of Windows library dependencies'),
							z.null().describe('List of Windows library dependencies'),
						])
						.describe('List of Windows library dependencies')
						.optional(),
					PackageDependencies: z
						.union([
							z
								.array(
									z.object({
										PackageIdentifier: z
											.string()
											.regex(
												new RegExp(
													'^[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}(\\.[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}){1,7}$',
												),
											)
											.max(128)
											.describe('The package unique identifier'),
										MinimumVersion: z
											.string()
											.regex(new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'))
											.max(128)
											.describe('The package version')
											.optional(),
									}),
								)
								.max(16)
								.describe('List of package dependencies from current source'),
							z
								.null()
								.describe('List of package dependencies from current source'),
						])
						.describe('List of package dependencies from current source')
						.optional(),
					ExternalDependencies: z
						.union([
							z
								.array(z.string().min(1).max(128))
								.max(16)
								.describe('List of external package dependencies'),
							z.null().describe('List of external package dependencies'),
						])
						.describe('List of external package dependencies')
						.optional(),
				}),
				z.null(),
			])
			.optional(),
		PackageFamilyName: z
			.union([
				z
					.string()
					.regex(new RegExp('^[A-Za-z0-9][-\\.A-Za-z0-9]+_[A-Za-z0-9]{13}$'))
					.max(255)
					.describe(
						'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
					),
				z
					.null()
					.describe(
						'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
					),
			])
			.describe(
				'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
			)
			.optional(),
		ProductCode: z
			.union([
				z
					.string()
					.min(1)
					.max(255)
					.describe(
						'ProductCode could be used for correlation of packages across sources',
					),
				z
					.null()
					.describe(
						'ProductCode could be used for correlation of packages across sources',
					),
			])
			.describe(
				'ProductCode could be used for correlation of packages across sources',
			)
			.optional(),
		Capabilities: z
			.union([
				z
					.array(z.string().min(1).max(40))
					.max(1000)
					.describe('List of appx or msix installer capabilities'),
				z.null().describe('List of appx or msix installer capabilities'),
			])
			.describe('List of appx or msix installer capabilities')
			.optional(),
		RestrictedCapabilities: z
			.union([
				z
					.array(z.string().min(1).max(40))
					.max(1000)
					.describe('List of appx or msix installer restricted capabilities'),
				z
					.null()
					.describe('List of appx or msix installer restricted capabilities'),
			])
			.describe('List of appx or msix installer restricted capabilities')
			.optional(),
		Markets: z.any().describe('The installer markets').optional(),
		InstallerAbortsTerminal: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether the installer will abort terminal. Default is false',
					),
				z
					.null()
					.describe(
						'Indicates whether the installer will abort terminal. Default is false',
					),
			])
			.describe(
				'Indicates whether the installer will abort terminal. Default is false',
			)
			.optional(),
		ReleaseDate: z
			.union([
				z.string().describe('The installer release date'),
				z.null().describe('The installer release date'),
			])
			.describe('The installer release date')
			.optional(),
		InstallLocationRequired: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether the installer requires an install location provided',
					),
				z
					.null()
					.describe(
						'Indicates whether the installer requires an install location provided',
					),
			])
			.describe(
				'Indicates whether the installer requires an install location provided',
			)
			.optional(),
		RequireExplicitUpgrade: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether the installer should be pinned by default from upgrade',
					),
				z
					.null()
					.describe(
						'Indicates whether the installer should be pinned by default from upgrade',
					),
			])
			.describe(
				'Indicates whether the installer should be pinned by default from upgrade',
			)
			.optional(),
		DisplayInstallWarnings: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
					),
				z
					.null()
					.describe(
						'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
					),
			])
			.describe(
				'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
			)
			.optional(),
		UnsupportedOSArchitectures: z
			.union([
				z
					.array(z.enum(['x86', 'x64', 'arm', 'arm64']))
					.describe('List of OS architectures the installer does not support'),
				z
					.null()
					.describe('List of OS architectures the installer does not support'),
			])
			.describe('List of OS architectures the installer does not support')
			.optional(),
		UnsupportedArguments: z
			.union([
				z
					.array(z.enum(['log', 'location']))
					.describe('List of winget arguments the installer does not support'),
				z
					.null()
					.describe('List of winget arguments the installer does not support'),
			])
			.describe('List of winget arguments the installer does not support')
			.optional(),
		AppsAndFeaturesEntries: z
			.union([
				z
					.array(
						z
							.object({
								DisplayName: z
									.union([
										z
											.string()
											.min(1)
											.max(256)
											.describe('The DisplayName registry value'),
										z.null().describe('The DisplayName registry value'),
									])
									.describe('The DisplayName registry value')
									.optional(),
								Publisher: z
									.union([
										z
											.string()
											.min(1)
											.max(256)
											.describe('The Publisher registry value'),
										z.null().describe('The Publisher registry value'),
									])
									.describe('The Publisher registry value')
									.optional(),
								DisplayVersion: z
									.union([
										z
											.string()
											.min(1)
											.max(128)
											.describe('The DisplayVersion registry value'),
										z.null().describe('The DisplayVersion registry value'),
									])
									.describe('The DisplayVersion registry value')
									.optional(),
								ProductCode: z
									.union([
										z
											.string()
											.min(1)
											.max(255)
											.describe(
												'ProductCode could be used for correlation of packages across sources',
											),
										z
											.null()
											.describe(
												'ProductCode could be used for correlation of packages across sources',
											),
									])
									.describe(
										'ProductCode could be used for correlation of packages across sources',
									)
									.optional(),
								UpgradeCode: z
									.union([
										z
											.string()
											.min(1)
											.max(255)
											.describe(
												'ProductCode could be used for correlation of packages across sources',
											),
										z
											.null()
											.describe(
												'ProductCode could be used for correlation of packages across sources',
											),
									])
									.describe(
										'ProductCode could be used for correlation of packages across sources',
									)
									.optional(),
								InstallerType: z
									.enum([
										'msix',
										'msi',
										'appx',
										'exe',
										'zip',
										'inno',
										'nullsoft',
										'wix',
										'burn',
										'pwa',
										'portable',
									])
									.describe(
										'Enumeration of supported installer types. InstallerType is required in either root level or individual Installer level',
									)
									.optional(),
							})
							.describe("Various key values under installer's ARP entry"),
					)
					.max(128)
					.describe('List of ARP entries.'),
				z.null().describe('List of ARP entries.'),
			])
			.describe('List of ARP entries.')
			.optional(),
		ElevationRequirement: z
			.enum(['elevationRequired', 'elevationProhibited', 'elevatesSelf'])
			.describe("The installer's elevation requirement")
			.optional(),
		InstallationMetadata: z
			.object({
				DefaultInstallLocation: z
					.union([
						z
							.string()
							.min(1)
							.max(2048)
							.describe(
								'Represents the default installed package location. Used for deeper installation detection.',
							),
						z
							.null()
							.describe(
								'Represents the default installed package location. Used for deeper installation detection.',
							),
					])
					.describe(
						'Represents the default installed package location. Used for deeper installation detection.',
					)
					.optional(),
				Files: z
					.union([
						z
							.array(
								z
									.object({
										RelativeFilePath: z
											.string()
											.min(1)
											.max(2048)
											.describe('The relative path to the installed file.'),
										FileSha256: z
											.union([
												z
													.string()
													.regex(new RegExp('^[A-Fa-f0-9]{64}$'))
													.describe('Optional Sha256 of the installed file.'),
												z
													.null()
													.describe('Optional Sha256 of the installed file.'),
											])
											.describe('Optional Sha256 of the installed file.')
											.optional(),
										FileType: z
											.enum(['launch', 'uninstall', 'other'])
											.describe(
												'The optional installed file type. If not specified, the file is treated as other.',
											)
											.optional(),
										InvocationParameter: z
											.union([
												z
													.string()
													.min(1)
													.max(2048)
													.describe('Optional parameter for invocable files.'),
												z
													.null()
													.describe('Optional parameter for invocable files.'),
											])
											.describe('Optional parameter for invocable files.')
											.optional(),
										DisplayName: z
											.union([
												z
													.string()
													.min(1)
													.max(256)
													.describe(
														'Optional display name for invocable files.',
													),
												z
													.null()
													.describe(
														'Optional display name for invocable files.',
													),
											])
											.describe('Optional display name for invocable files.')
											.optional(),
									})
									.describe('Represents an installed file.'),
							)
							.max(2048)
							.describe('List of installed files.'),
						z.null().describe('List of installed files.'),
					])
					.describe('List of installed files.')
					.optional(),
			})
			.describe(
				'Details about the installation. Used for deeper installation detection.',
			)
			.optional(),
		DownloadCommandProhibited: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether the installer is prohibited from being downloaded for offline installation.',
					),
				z
					.null()
					.describe(
						'Indicates whether the installer is prohibited from being downloaded for offline installation.',
					),
			])
			.describe(
				'Indicates whether the installer is prohibited from being downloaded for offline installation.',
			)
			.optional(),
		RepairBehavior: z
			.enum(['modify', 'uninstaller', 'installer'])
			.describe('The repair method')
			.optional(),
		ArchiveBinariesDependOnPath: z
			.union([
				z
					.boolean()
					.describe(
						'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
					),
				z
					.null()
					.describe(
						'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
					),
			])
			.describe(
				'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
			)
			.optional(),
		Authentication: z
			.union([
				z
					.object({
						AuthenticationType: z
							.enum([
								'none',
								'microsoftEntraId',
								'microsoftEntraIdForAzureBlobStorage',
							])
							.describe('The authentication type'),
						MicrosoftEntraIdAuthenticationInfo: z
							.union([
								z
									.object({
										Resource: z
											.union([
												z
													.string()
													.min(1)
													.max(512)
													.describe(
														'The resource value for Microsoft Entra Id authentication.',
													),
												z
													.null()
													.describe(
														'The resource value for Microsoft Entra Id authentication.',
													),
											])
											.describe(
												'The resource value for Microsoft Entra Id authentication.',
											)
											.optional(),
										Scope: z
											.union([
												z
													.string()
													.min(1)
													.max(512)
													.describe(
														'The scope value for Microsoft Entra Id authentication.',
													),
												z
													.null()
													.describe(
														'The scope value for Microsoft Entra Id authentication.',
													),
											])
											.describe(
												'The scope value for Microsoft Entra Id authentication.',
											)
											.optional(),
									})
									.describe('The Microsoft Entra Id authentication info'),
								z.null().describe('The Microsoft Entra Id authentication info'),
							])
							.describe('The Microsoft Entra Id authentication info')
							.optional(),
					})
					.describe(
						'The authentication requirement for downloading the installer.',
					),
				z
					.null()
					.describe(
						'The authentication requirement for downloading the installer.',
					),
			])
			.describe('The authentication requirement for downloading the installer.')
			.optional(),
		Installers: z
			.array(
				z.object({
					InstallerLocale: z
						.union([
							z
								.string()
								.regex(
									new RegExp(
										'^([a-zA-Z]{2,3}|[iI]-[a-zA-Z]+|[xX]-[a-zA-Z]{1,8})(-[a-zA-Z]{1,8})*$',
									),
								)
								.max(20)
								.describe('The installer meta-data locale'),
							z.null().describe('The installer meta-data locale'),
						])
						.describe('The installer meta-data locale')
						.optional(),
					Platform: z
						.union([
							z
								.array(z.enum(['Windows.Desktop', 'Windows.Universal']))
								.max(2)
								.describe('The installer supported operating system'),
							z.null().describe('The installer supported operating system'),
						])
						.describe('The installer supported operating system')
						.optional(),
					MinimumOSVersion: z
						.union([
							z
								.string()
								.regex(
									new RegExp(
										'^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])(\\.(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])){0,3}$',
									),
								)
								.describe('The installer minimum operating system version'),
							z
								.null()
								.describe('The installer minimum operating system version'),
						])
						.describe('The installer minimum operating system version')
						.optional(),
					Architecture: z
						.enum(['x86', 'x64', 'arm', 'arm64', 'neutral'])
						.describe('The installer target architecture'),
					InstallerType: z
						.enum([
							'msix',
							'msi',
							'appx',
							'exe',
							'zip',
							'inno',
							'nullsoft',
							'wix',
							'burn',
							'pwa',
							'portable',
						])
						.describe(
							'Enumeration of supported installer types. InstallerType is required in either root level or individual Installer level',
						)
						.optional(),
					NestedInstallerType: z
						.enum([
							'msix',
							'msi',
							'appx',
							'exe',
							'inno',
							'nullsoft',
							'wix',
							'burn',
							'portable',
						])
						.describe(
							'Enumeration of supported nested installer types contained inside an archive file',
						)
						.optional(),
					NestedInstallerFiles: z
						.union([
							z
								.array(
									z
										.object({
											RelativeFilePath: z
												.string()
												.min(1)
												.max(512)
												.describe(
													'The relative path to the nested installer file',
												),
											PortableCommandAlias: z
												.union([
													z
														.string()
														.min(1)
														.max(40)
														.describe(
															'The command alias to be used for calling the package. Only applies to the nested portable package',
														),
													z
														.null()
														.describe(
															'The command alias to be used for calling the package. Only applies to the nested portable package',
														),
												])
												.describe(
													'The command alias to be used for calling the package. Only applies to the nested portable package',
												)
												.optional(),
										})
										.describe(
											'A nested installer file contained inside an archive',
										),
								)
								.max(1024)
								.describe(
									'List of nested installer files contained inside an archive',
								),
							z
								.null()
								.describe(
									'List of nested installer files contained inside an archive',
								),
						])
						.describe(
							'List of nested installer files contained inside an archive',
						)
						.optional(),
					Scope: z
						.enum(['user', 'machine'])
						.describe(
							'Scope indicates if the installer is per user or per machine',
						)
						.optional(),
					InstallerUrl: z
						.string()
						.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
						.max(2048)
						.describe('The installer Url'),
					InstallerSha256: z
						.string()
						.regex(new RegExp('^[A-Fa-f0-9]{64}$'))
						.describe('Sha256 is required. Sha256 of the installer'),
					SignatureSha256: z
						.union([
							z
								.string()
								.regex(new RegExp('^[A-Fa-f0-9]{64}$'))
								.describe(
									'SignatureSha256 is recommended for appx or msix. It is the sha256 of signature file inside appx or msix. Could be used during streaming install if applicable',
								),
							z
								.null()
								.describe(
									'SignatureSha256 is recommended for appx or msix. It is the sha256 of signature file inside appx or msix. Could be used during streaming install if applicable',
								),
						])
						.describe(
							'SignatureSha256 is recommended for appx or msix. It is the sha256 of signature file inside appx or msix. Could be used during streaming install if applicable',
						)
						.optional(),
					InstallModes: z
						.union([
							z
								.array(z.enum(['interactive', 'silent', 'silentWithProgress']))
								.max(3)
								.describe('List of supported installer modes'),
							z.null().describe('List of supported installer modes'),
						])
						.describe('List of supported installer modes')
						.optional(),
					InstallerSwitches: z
						.object({
							Silent: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
										),
									z
										.null()
										.describe(
											'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
										),
								])
								.describe(
									'Silent is the value that should be passed to the installer when user chooses a silent or quiet install',
								)
								.optional(),
							SilentWithProgress: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
										),
									z
										.null()
										.describe(
											'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
										),
								])
								.describe(
									'SilentWithProgress is the value that should be passed to the installer when user chooses a non-interactive install',
								)
								.optional(),
							Interactive: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'Interactive is the value that should be passed to the installer when user chooses an interactive install',
										),
									z
										.null()
										.describe(
											'Interactive is the value that should be passed to the installer when user chooses an interactive install',
										),
								])
								.describe(
									'Interactive is the value that should be passed to the installer when user chooses an interactive install',
								)
								.optional(),
							InstallLocation: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
										),
									z
										.null()
										.describe(
											'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
										),
								])
								.describe(
									'InstallLocation is the value passed to the installer for custom install location. <INSTALLPATH> token can be included in the switch value so that winget will replace the token with user provided path',
								)
								.optional(),
							Log: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
										),
									z
										.null()
										.describe(
											'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
										),
								])
								.describe(
									'Log is the value passed to the installer for custom log file path. <LOGPATH> token can be included in the switch value so that winget will replace the token with user provided path',
								)
								.optional(),
							Upgrade: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
										),
									z
										.null()
										.describe(
											'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
										),
								])
								.describe(
									'Upgrade is the value that should be passed to the installer when user chooses an upgrade',
								)
								.optional(),
							Custom: z
								.union([
									z
										.string()
										.min(1)
										.max(2048)
										.describe(
											'Custom switches will be passed directly to the installer by winget',
										),
									z
										.null()
										.describe(
											'Custom switches will be passed directly to the installer by winget',
										),
								])
								.describe(
									'Custom switches will be passed directly to the installer by winget',
								)
								.optional(),
							Repair: z
								.union([
									z
										.string()
										.min(1)
										.max(512)
										.describe(
											"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
										),
									z
										.null()
										.describe(
											"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
										),
								])
								.describe(
									"The 'Repair' value must be passed to the installer, ModifyPath ARP command, or uninstaller ARP command when the user opts for a repair.",
								)
								.optional(),
						})
						.optional(),
					InstallerSuccessCodes: z
						.union([
							z
								.array(
									z
										.any()
										.refine(
											(value) => !z.literal(0).safeParse(value).success,
											'Invalid input: Should NOT be valid against schema',
										)
										.describe(
											'An exit code that can be returned by the installer after execution',
										),
								)
								.max(16)
								.describe(
									'List of additional non-zero installer success exit codes other than known default values by winget',
								),
							z
								.null()
								.describe(
									'List of additional non-zero installer success exit codes other than known default values by winget',
								),
						])
						.describe(
							'List of additional non-zero installer success exit codes other than known default values by winget',
						)
						.optional(),
					ExpectedReturnCodes: z
						.union([
							z
								.array(
									z.object({
										InstallerReturnCode: z
											.any()
											.refine(
												(value) => !z.literal(0).safeParse(value).success,
												'Invalid input: Should NOT be valid against schema',
											)
											.describe(
												'An exit code that can be returned by the installer after execution',
											),
										ReturnResponse: z.enum([
											'packageInUse',
											'packageInUseByApplication',
											'installInProgress',
											'fileInUse',
											'missingDependency',
											'diskFull',
											'insufficientMemory',
											'invalidParameter',
											'noNetwork',
											'contactSupport',
											'rebootRequiredToFinish',
											'rebootRequiredForInstall',
											'rebootInitiated',
											'cancelledByUser',
											'alreadyInstalled',
											'downgrade',
											'blockedByPolicy',
											'systemNotSupported',
											'custom',
										]),
										ReturnResponseUrl: z
											.union([
												z
													.string()
													.regex(new RegExp('^([Hh][Tt][Tt][Pp][Ss]?)://.+$'))
													.max(2048)
													.describe('Url type'),
												z.null().describe('Url type'),
											])
											.describe('Url type')
											.optional(),
									}),
								)
								.max(128)
								.describe('Installer exit codes for common errors'),
							z.null().describe('Installer exit codes for common errors'),
						])
						.describe('Installer exit codes for common errors')
						.optional(),
					UpgradeBehavior: z
						.enum(['install', 'uninstallPrevious', 'deny'])
						.describe('The upgrade method')
						.optional(),
					Commands: z
						.union([
							z
								.array(z.string().min(1).max(40))
								.max(16)
								.describe('List of commands or aliases to run the package'),
							z
								.null()
								.describe('List of commands or aliases to run the package'),
						])
						.describe('List of commands or aliases to run the package')
						.optional(),
					Protocols: z
						.union([
							z
								.array(z.string().max(2048))
								.max(64)
								.describe(
									'List of protocols the package provides a handler for',
								),
							z
								.null()
								.describe(
									'List of protocols the package provides a handler for',
								),
						])
						.describe('List of protocols the package provides a handler for')
						.optional(),
					FileExtensions: z
						.union([
							z
								.array(
									z
										.string()
										.regex(new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'))
										.max(64),
								)
								.max(512)
								.describe('List of file extensions the package could support'),
							z
								.null()
								.describe('List of file extensions the package could support'),
						])
						.describe('List of file extensions the package could support')
						.optional(),
					Dependencies: z
						.union([
							z.object({
								WindowsFeatures: z
									.union([
										z
											.array(z.string().min(1).max(128))
											.max(16)
											.describe('List of Windows feature dependencies'),
										z.null().describe('List of Windows feature dependencies'),
									])
									.describe('List of Windows feature dependencies')
									.optional(),
								WindowsLibraries: z
									.union([
										z
											.array(z.string().min(1).max(128))
											.max(16)
											.describe('List of Windows library dependencies'),
										z.null().describe('List of Windows library dependencies'),
									])
									.describe('List of Windows library dependencies')
									.optional(),
								PackageDependencies: z
									.union([
										z
											.array(
												z.object({
													PackageIdentifier: z
														.string()
														.regex(
															new RegExp(
																'^[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}(\\.[^\\.\\s\\\\/:\\*\\?"<>\\|\\x01-\\x1f]{1,32}){1,7}$',
															),
														)
														.max(128)
														.describe('The package unique identifier'),
													MinimumVersion: z
														.string()
														.regex(
															new RegExp('^[^\\\\/:\\*\\?"<>\\|\\x01-\\x1f]+$'),
														)
														.max(128)
														.describe('The package version')
														.optional(),
												}),
											)
											.max(16)
											.describe(
												'List of package dependencies from current source',
											),
										z
											.null()
											.describe(
												'List of package dependencies from current source',
											),
									])
									.describe('List of package dependencies from current source')
									.optional(),
								ExternalDependencies: z
									.union([
										z
											.array(z.string().min(1).max(128))
											.max(16)
											.describe('List of external package dependencies'),
										z.null().describe('List of external package dependencies'),
									])
									.describe('List of external package dependencies')
									.optional(),
							}),
							z.null(),
						])
						.optional(),
					PackageFamilyName: z
						.union([
							z
								.string()
								.regex(
									new RegExp('^[A-Za-z0-9][-\\.A-Za-z0-9]+_[A-Za-z0-9]{13}$'),
								)
								.max(255)
								.describe(
									'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
								),
							z
								.null()
								.describe(
									'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
								),
						])
						.describe(
							'PackageFamilyName for appx or msix installer. Could be used for correlation of packages across sources',
						)
						.optional(),
					ProductCode: z
						.union([
							z
								.string()
								.min(1)
								.max(255)
								.describe(
									'ProductCode could be used for correlation of packages across sources',
								),
							z
								.null()
								.describe(
									'ProductCode could be used for correlation of packages across sources',
								),
						])
						.describe(
							'ProductCode could be used for correlation of packages across sources',
						)
						.optional(),
					Capabilities: z
						.union([
							z
								.array(z.string().min(1).max(40))
								.max(1000)
								.describe('List of appx or msix installer capabilities'),
							z.null().describe('List of appx or msix installer capabilities'),
						])
						.describe('List of appx or msix installer capabilities')
						.optional(),
					RestrictedCapabilities: z
						.union([
							z
								.array(z.string().min(1).max(40))
								.max(1000)
								.describe(
									'List of appx or msix installer restricted capabilities',
								),
							z
								.null()
								.describe(
									'List of appx or msix installer restricted capabilities',
								),
						])
						.describe('List of appx or msix installer restricted capabilities')
						.optional(),
					Markets: z.any().describe('The installer markets').optional(),
					InstallerAbortsTerminal: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether the installer will abort terminal. Default is false',
								),
							z
								.null()
								.describe(
									'Indicates whether the installer will abort terminal. Default is false',
								),
						])
						.describe(
							'Indicates whether the installer will abort terminal. Default is false',
						)
						.optional(),
					ReleaseDate: z
						.union([
							z.string().describe('The installer release date'),
							z.null().describe('The installer release date'),
						])
						.describe('The installer release date')
						.optional(),
					InstallLocationRequired: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether the installer requires an install location provided',
								),
							z
								.null()
								.describe(
									'Indicates whether the installer requires an install location provided',
								),
						])
						.describe(
							'Indicates whether the installer requires an install location provided',
						)
						.optional(),
					RequireExplicitUpgrade: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether the installer should be pinned by default from upgrade',
								),
							z
								.null()
								.describe(
									'Indicates whether the installer should be pinned by default from upgrade',
								),
						])
						.describe(
							'Indicates whether the installer should be pinned by default from upgrade',
						)
						.optional(),
					DisplayInstallWarnings: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
								),
							z
								.null()
								.describe(
									'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
								),
						])
						.describe(
							'Indicates whether winget should display a warning message if the install or upgrade is known to interfere with running applications.',
						)
						.optional(),
					UnsupportedOSArchitectures: z
						.union([
							z
								.array(z.enum(['x86', 'x64', 'arm', 'arm64']))
								.describe(
									'List of OS architectures the installer does not support',
								),
							z
								.null()
								.describe(
									'List of OS architectures the installer does not support',
								),
						])
						.describe('List of OS architectures the installer does not support')
						.optional(),
					UnsupportedArguments: z
						.union([
							z
								.array(z.enum(['log', 'location']))
								.describe(
									'List of winget arguments the installer does not support',
								),
							z
								.null()
								.describe(
									'List of winget arguments the installer does not support',
								),
						])
						.describe('List of winget arguments the installer does not support')
						.optional(),
					AppsAndFeaturesEntries: z
						.union([
							z
								.array(
									z
										.object({
											DisplayName: z
												.union([
													z
														.string()
														.min(1)
														.max(256)
														.describe('The DisplayName registry value'),
													z.null().describe('The DisplayName registry value'),
												])
												.describe('The DisplayName registry value')
												.optional(),
											Publisher: z
												.union([
													z
														.string()
														.min(1)
														.max(256)
														.describe('The Publisher registry value'),
													z.null().describe('The Publisher registry value'),
												])
												.describe('The Publisher registry value')
												.optional(),
											DisplayVersion: z
												.union([
													z
														.string()
														.min(1)
														.max(128)
														.describe('The DisplayVersion registry value'),
													z
														.null()
														.describe('The DisplayVersion registry value'),
												])
												.describe('The DisplayVersion registry value')
												.optional(),
											ProductCode: z
												.union([
													z
														.string()
														.min(1)
														.max(255)
														.describe(
															'ProductCode could be used for correlation of packages across sources',
														),
													z
														.null()
														.describe(
															'ProductCode could be used for correlation of packages across sources',
														),
												])
												.describe(
													'ProductCode could be used for correlation of packages across sources',
												)
												.optional(),
											UpgradeCode: z
												.union([
													z
														.string()
														.min(1)
														.max(255)
														.describe(
															'ProductCode could be used for correlation of packages across sources',
														),
													z
														.null()
														.describe(
															'ProductCode could be used for correlation of packages across sources',
														),
												])
												.describe(
													'ProductCode could be used for correlation of packages across sources',
												)
												.optional(),
											InstallerType: z
												.enum([
													'msix',
													'msi',
													'appx',
													'exe',
													'zip',
													'inno',
													'nullsoft',
													'wix',
													'burn',
													'pwa',
													'portable',
												])
												.describe(
													'Enumeration of supported installer types. InstallerType is required in either root level or individual Installer level',
												)
												.optional(),
										})
										.describe("Various key values under installer's ARP entry"),
								)
								.max(128)
								.describe('List of ARP entries.'),
							z.null().describe('List of ARP entries.'),
						])
						.describe('List of ARP entries.')
						.optional(),
					ElevationRequirement: z
						.enum(['elevationRequired', 'elevationProhibited', 'elevatesSelf'])
						.describe("The installer's elevation requirement")
						.optional(),
					InstallationMetadata: z
						.object({
							DefaultInstallLocation: z
								.union([
									z
										.string()
										.min(1)
										.max(2048)
										.describe(
											'Represents the default installed package location. Used for deeper installation detection.',
										),
									z
										.null()
										.describe(
											'Represents the default installed package location. Used for deeper installation detection.',
										),
								])
								.describe(
									'Represents the default installed package location. Used for deeper installation detection.',
								)
								.optional(),
							Files: z
								.union([
									z
										.array(
											z
												.object({
													RelativeFilePath: z
														.string()
														.min(1)
														.max(2048)
														.describe(
															'The relative path to the installed file.',
														),
													FileSha256: z
														.union([
															z
																.string()
																.regex(new RegExp('^[A-Fa-f0-9]{64}$'))
																.describe(
																	'Optional Sha256 of the installed file.',
																),
															z
																.null()
																.describe(
																	'Optional Sha256 of the installed file.',
																),
														])
														.describe('Optional Sha256 of the installed file.')
														.optional(),
													FileType: z
														.enum(['launch', 'uninstall', 'other'])
														.describe(
															'The optional installed file type. If not specified, the file is treated as other.',
														)
														.optional(),
													InvocationParameter: z
														.union([
															z
																.string()
																.min(1)
																.max(2048)
																.describe(
																	'Optional parameter for invocable files.',
																),
															z
																.null()
																.describe(
																	'Optional parameter for invocable files.',
																),
														])
														.describe('Optional parameter for invocable files.')
														.optional(),
													DisplayName: z
														.union([
															z
																.string()
																.min(1)
																.max(256)
																.describe(
																	'Optional display name for invocable files.',
																),
															z
																.null()
																.describe(
																	'Optional display name for invocable files.',
																),
														])
														.describe(
															'Optional display name for invocable files.',
														)
														.optional(),
												})
												.describe('Represents an installed file.'),
										)
										.max(2048)
										.describe('List of installed files.'),
									z.null().describe('List of installed files.'),
								])
								.describe('List of installed files.')
								.optional(),
						})
						.describe(
							'Details about the installation. Used for deeper installation detection.',
						)
						.optional(),
					DownloadCommandProhibited: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether the installer is prohibited from being downloaded for offline installation.',
								),
							z
								.null()
								.describe(
									'Indicates whether the installer is prohibited from being downloaded for offline installation.',
								),
						])
						.describe(
							'Indicates whether the installer is prohibited from being downloaded for offline installation.',
						)
						.optional(),
					RepairBehavior: z
						.enum(['modify', 'uninstaller', 'installer'])
						.describe('The repair method')
						.optional(),
					ArchiveBinariesDependOnPath: z
						.union([
							z
								.boolean()
								.describe(
									'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
								),
							z
								.null()
								.describe(
									'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
								),
						])
						.describe(
							'Indicates whether the install location should be added directly to the PATH environment variable. Only applies to an archive containing portable packages.',
						)
						.optional(),
					Authentication: z
						.union([
							z
								.object({
									AuthenticationType: z
										.enum([
											'none',
											'microsoftEntraId',
											'microsoftEntraIdForAzureBlobStorage',
										])
										.describe('The authentication type'),
									MicrosoftEntraIdAuthenticationInfo: z
										.union([
											z
												.object({
													Resource: z
														.union([
															z
																.string()
																.min(1)
																.max(512)
																.describe(
																	'The resource value for Microsoft Entra Id authentication.',
																),
															z
																.null()
																.describe(
																	'The resource value for Microsoft Entra Id authentication.',
																),
														])
														.describe(
															'The resource value for Microsoft Entra Id authentication.',
														)
														.optional(),
													Scope: z
														.union([
															z
																.string()
																.min(1)
																.max(512)
																.describe(
																	'The scope value for Microsoft Entra Id authentication.',
																),
															z
																.null()
																.describe(
																	'The scope value for Microsoft Entra Id authentication.',
																),
														])
														.describe(
															'The scope value for Microsoft Entra Id authentication.',
														)
														.optional(),
												})
												.describe('The Microsoft Entra Id authentication info'),
											z
												.null()
												.describe('The Microsoft Entra Id authentication info'),
										])
										.describe('The Microsoft Entra Id authentication info')
										.optional(),
								})
								.describe(
									'The authentication requirement for downloading the installer.',
								),
							z
								.null()
								.describe(
									'The authentication requirement for downloading the installer.',
								),
						])
						.describe(
							'The authentication requirement for downloading the installer.',
						)
						.optional(),
				}),
			)
			.min(1)
			.max(1024),
		ManifestType: z
			.literal('installer')
			.describe('The manifest type')
			.default('installer')
			.optional(),
		ManifestVersion: z
			.string()
			.regex(
				new RegExp(
					'^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])(\\.(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])){2}$',
				),
			)
			.describe('The manifest syntax version')
			.default('1.10.0')
			.optional(),
	})
	.describe(
		'A representation of a single-file manifest representing an app installers in the OWC. v1.10.0',
	);

Library "setupCommon.brs"
Library "setupNetworkDiagnostics.brs"

Sub Main()

	' Script to read the relevant information from a sync spec and write it to the registry
	version="3.8.0.1"
	print "setup.brs version ";version;" started"

	SetupCore()

End Sub


Sub SetupCore()

	modelSupportsWifi = GetModelSupportsWifi()

	CheckFirmwareVersion()

'	CheckStorageDeviceIsWritable()

	registrySection = CreateObject("roRegistrySection", "networking")
	if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop

	ClearRegistryKeys(registrySection)

	' Load up the current sync specification
	localToBSNSyncSpec = false
	current_sync = CreateObject("roSyncSpec")
	if not current_sync.ReadFromFile("current-sync.xml") then
		print "### No current sync state available"
		if not current_sync.ReadFromFile("localToBSN-sync.xml") stop
		localToBSNSyncSpec = true
	endif

	' indicate to recovery_runsetup_ba.brs that this is a setup operation
	registrySection.Write("su","yes")

	' indicate version number
	registrySection.Write("v", "1")

	' write identifying data to registry
	registrySection.Write("a", current_sync.LookupMetadata("server", "account"))
	registrySection.Write("u", current_sync.LookupMetadata("server", "user"))
	registrySection.Write("p", current_sync.LookupMetadata("server", "password"))
	registrySection.Write("g", current_sync.LookupMetadata("server", "group"))
	registrySection.Write("tz", current_sync.LookupMetadata("client", "timezone"))
	registrySection.Write("un", current_sync.LookupMetadata("client", "unitName"))
	registrySection.Write("unm", current_sync.LookupMetadata("client", "unitNamingMethod"))
	registrySection.Write("ud", current_sync.LookupMetadata("client", "unitDescription"))

	registrySection.Write("tbnc", current_sync.LookupMetadata("client", "timeBetweenNetConnects"))
	contentDownloadsRestricted = current_sync.LookupMetadata("client", "contentDownloadsRestricted")
	registrySection.Write("cdr", contentDownloadsRestricted)
	if contentDownloadsRestricted = "yes" then
		registrySection.Write("cdrs", current_sync.LookupMetadata("client", "contentDownloadRangeStart"))
		registrySection.Write("cdrl", current_sync.LookupMetadata("client", "contentDownloadRangeLength"))
	endif

	registrySection.Write("tbh", current_sync.LookupMetadata("client", "timeBetweenHeartbeats"))
	heartbeatsRestricted = current_sync.LookupMetadata("client", "heartbeatsRestricted")
	registrySection.Write("hr", heartbeatsRestricted)
	if heartbeatsRestricted = "yes" then
		registrySection.Write("hrs", current_sync.LookupMetadata("client", "heartbeatsRangeStart"))
		registrySection.Write("hrl", current_sync.LookupMetadata("client", "heartbeatsRangeLength"))
	endif

	' network host parameters
	proxySpec$ = GetProxy(current_sync, registrySection)

	timeServer$ = current_sync.LookupMetadata("client", "timeServer")
	registrySection.Write("ts", timeServer$)
	print "time server in setup.brs = ";timeServer$

' Hostname
	SetHostname(current_sync)

' Wireless parameters
	useWireless = SetWirelessParameters(current_sync, registrySection, modelSupportsWifi)

' Wired parameters
	SetWiredParameters(current_sync, registrySection, useWireless)

' Network configurations
	if current_sync.LookupMetadata("client", "useWireless") = "yes"
		if modelSupportsWifi then
			wifiNetworkingParameters = SetNetworkConfiguration(current_sync, registrySection, "", "")
			ethernetNetworkingParameters = SetNetworkConfiguration(current_sync, registrySection, "_2", "2")
		else
			' if the user specified wireless but the system doesn't support it, use the parameters specified for wired (the secondary parameters)
			ethernetNetworkingParameters = SetNetworkConfiguration(current_sync, registrySection, "_2", "")
		endif
	else
		ethernetNetworkingParameters = SetNetworkConfiguration(current_sync, registrySection, "", "")
	endif

' Network connection priorities
	networkConnectionPriorityWired$ = GetEntry(current_sync, "networkConnectionPriorityWired")
	networkConnectionPriorityWireless$ = GetEntry(current_sync, "networkConnectionPriorityWireless")

' configure ethernet
	ConfigureEthernet(ethernetNetworkingParameters, networkConnectionPriorityWired$, timeServer$, proxySpec$)

' configure wifi if specified and device supports wifi
	if useWireless = "yes" then
		ssid$ = GetEntry(current_sync, "ssid")
		passphrase$ = GetEntry(current_sync, "passphrase")
		ConfigureWifi(wifiNetworkingParameters, ssid$, passphrase$, networkConnectionPriorityWireless$, timeServer$, proxySpec$)
	endif

' if a device is setup to not use wireless, ensure that wireless is not used (for wireless model only)
	if useWireless = "no" and modelSupportsWifi then
		DisableWireless()
	endif

' diagnostic web server
	SetDWS(current_sync, registrySection)

' channel scanning data
	SetupTunerData()

' local web server
	SetLWS(current_sync, registrySection)

' logging
	SetLogging(current_sync, registrySection)

' remote snapshot
	SetRemoteSnapshot(current_sync, registrySection)

' idle screen color
	SetIdleColor(current_sync, registrySection)

' retrieve and parse featureMinRevs.xml
	featureMinRevs = ParseFeatureMinRevs()

' custom splash screen
	SetCustomSplashScreen(current_sync, registrySection, featureMinRevs)

' BrightWall
	registrySection.Write("brightWallName", current_sync.LookupMetadata("client", "BrightWallName"))
	registrySection.Write("brightWallScreenNumber", current_sync.LookupMetadata("client", "BrightWallScreenNumber"))

' handlers    
	base$ = current_sync.LookupMetadata("client", "base")
	registrySection.Write("ub", base$)
	registrySection.Write("ru", current_sync.LookupMetadata("client", "recovery_handler"))
	registrySection.Write("rs", current_sync.LookupMetadata("client", "recovery_setup"))
	registrySection.Write("nu", current_sync.LookupMetadata("client", "next"))
	registrySection.Write("vu", current_sync.LookupMetadata("client", "event"))
	registrySection.Write("eu", current_sync.LookupMetadata("client", "error"))
	registrySection.Write("de", current_sync.LookupMetadata("client", "deviceerror"))
	registrySection.Write("dd", current_sync.LookupMetadata("client", "devicedownload"))
	registrySection.Write("dp", current_sync.LookupMetadata("client", "devicedownloadprogress"))
	registrySection.Write("td", current_sync.LookupMetadata("client", "trafficdownload"))
	registrySection.Write("ul", current_sync.LookupMetadata("client", "uploadlogs"))
	registrySection.Write("bs", current_sync.LookupMetadata("client", "batteryCharger"))
	registrySection.Write("hh", current_sync.LookupMetadata("client", "heartbeat"))
	registrySection.Flush()

	contentDataTypeEnabledWired$ = current_sync.LookupMetadata("client", "contentDataTypeEnabledWired")
	wiredDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWired$)

	contentDataTypeEnabledWireless$ = current_sync.LookupMetadata("client", "contentDataTypeEnabledWireless")
	wirelessDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWireless$)

	binding% = GetBinding(wiredDataTransferEnabled, wirelessDataTransferEnabled)

' perform network diagnostics if enabled
	networkDiagnosticsEnabled = GetBooleanSyncSpecEntry(current_sync, "networkDiagnosticsEnabled")
	testEthernetEnabled = GetBooleanSyncSpecEntry(current_sync, "testEthernetEnabled")
	testWirelessEnabled = GetBooleanSyncSpecEntry(current_sync, "testWirelessEnabled")
	testInternetEnabled = GetBooleanSyncSpecEntry(current_sync, "testInternetEnabled")

	if networkDiagnosticsEnabled then
		PerformNetworkDiagnostics(testEthernetEnabled, testWirelessEnabled, testInternetEnabled)
	endif

' setup complete - get script from server

	numRetries% = 0
	while numRetries% < 10

		' get bootup script from server
		xfer = CreateObject("roUrlTransfer")
		recoverySetup$ = current_sync.LookupMetadata("client", "recovery_setup")
		recurl = base$ + recoverySetup$
		print "### Looking for file from "; recurl
		xfer.BindToInterface(binding%)
		xfer.SetUrl(recurl)

		response_code = xfer.GetToFile("autorun.tmp")
		print "### xfer to card response code = "; response_code
		if response_code=200 then
			MoveFile("autorun.tmp", "autorun.brs")
			' reboot
			a=RebootSystem()
			stop
		else
			sw = CreateObject("roGpioControlPort")

			for flash_index=0 to 9
				sw.SetWholeState(2^1 + 2^2 + 2^3 + 2^4 + 2^5 + 2^6 + 2^7 + 2^8 + 2^9 + 2^10)
				sleep(500)
				sw.SetWholeState(0)
				sleep(500)
			next
		endif
		numRetries% = numRetries% + 1
		    
	end while

	' if appropriate, play standalone content
	if localToBSNSyncSpec then
		MoveFile("pending-autorun.brs", "autorun.brs")
	endif

	' reboot
	a=RebootSystem()
	stop

End Sub

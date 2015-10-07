
Sub ExecuteSetup(setupParams As Object)

    setupType$ = setupParams.setupType

	modelSupportsWifi = GetModelSupportsWifi()

	CheckFirmwareVersion()

    if setupType$ = "bnm" or setupType$ = "lfn" or setupType$ = "sfn" then
    	CheckStorageDeviceIsWritable()
    endif

	registrySection = CreateObject("roRegistrySection", "networking")
	if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop

	ClearRegistryKeys(registrySection)

    if setupType$ = "bnm" then
        ' indicate to recovery_runsetup_ba.brs that this is a setup operation
        registrySection.Write("su","yes")

        ' indicate version number
        registrySection.Write("v", "1")

        ' write identifying data to registry
        registrySection.Write("a", setupParams.account)
        registrySection.Write("u", setupParams.user)
        registrySection.Write("p", setupParams.password)
        registrySection.Write("g", setupParams.group)

        registrySection.Write("tbnc", setupParams.timeBetweenNetConnects)
        contentDownloadsRestricted = setupParams.contentDownloadsRestricted
        registrySection.Write("cdr", contentDownloadsRestricted)
        if contentDownloadsRestricted = "yes" then
            registrySection.Write("cdrs", setupParams.contentDownloadRangeStart)
            registrySection.Write("cdrl", setupParams.contentDownloadRangeLength)
        endif

        registrySection.Write("tbh", setupParams.timeBetweenHeartbeats)
        heartbeatsRestricted = setupParams.heartbeatsRestricted
        registrySection.Write("hr", heartbeatsRestricted)
        if heartbeatsRestricted = "yes" then
            registrySection.Write("hrs", setupParams.heartbeatsRangeStart)
            registrySection.Write("hrl", setupParams.heartbeatsRangeLength)
        endif
    endif

    ' name specification, etc.
    registrySection.Write("un", setupParams.unitName)
    registrySection.Write("unm", setupParams.unitNamingMethod)
    registrySection.Write("ud", setupParams.unitDescription)
    registrySection.Write("tz", setupParams.timezone)

	' network host parameters
	proxySpec$ = GetProxy(setupParams, registrySection)

	timeServer$ = setupParams.timeServer
	registrySection.Write("ts", timeServer$)
	print "time server in setup.brs = ";timeServer$

' Hostname
	SetHostname(setupParams)

' Wireless parameters
	useWireless = SetWirelessParameters(setupParams, registrySection, modelSupportsWifi)

' Wired parameters
	SetWiredParameters(setupParams, registrySection, useWireless)

' Network configurations
	if setupParams.useWireless = "yes"
		if modelSupportsWifi then
			wifiNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "", "")
			ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "_2", "2")
		else
			' if the user specified wireless but the system doesn't support it, use the parameters specified for wired (the secondary parameters)
			ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "_2", "")
		endif
	else
		ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "", "")
	endif

' Network connection priorities
	networkConnectionPriorityWired$ = GetEntry(setupParams, "networkConnectionPriorityWired")
	networkConnectionPriorityWireless$ = GetEntry(setupParams, "networkConnectionPriorityWireless")

' configure ethernet
	ConfigureEthernet(ethernetNetworkingParameters, networkConnectionPriorityWired$, timeServer$, proxySpec$)

' configure wifi if specified and device supports wifi
	if useWireless = "yes" then
		ssid$ = GetEntry(setupParams, "ssid")
		passphrase$ = GetEntry(setupParams, "passphrase")
		ConfigureWifi(wifiNetworkingParameters, ssid$, passphrase$, networkConnectionPriorityWireless$, timeServer$, proxySpec$)
	endif

' if a device is setup to not use wireless, ensure that wireless is not used (for wireless model only)
	if useWireless = "no" and modelSupportsWifi then
		DisableWireless()
	endif

' set the time zone
    if setupParams.timezone <> "" then
        systemTime = CreateObject("roSystemTime")
        systemTime.SetTimeZone(setupParams.timezone)
        systemTime = invalid
    endif

' diagnostic web server
	SetDWS(setupParams, registrySection)

' channel scanning data
	SetupTunerData()

' usb content update password
' TBD

' local web server
	SetLWS(setupParams, registrySection)

' logging
	SetLogging(setupParams, registrySection)

' remote snapshot
	SetRemoteSnapshot(setupParams, registrySection)

' idle screen color
	SetIdleColor(setupParams, registrySection)

' retrieve and parse featureMinRevs.xml
	featureMinRevs = ParseFeatureMinRevs()

' custom splash screen
	SetCustomSplashScreen(setupParams, registrySection, featureMinRevs)

' BrightWall
	registrySection.Write("brightWallName", setupParams.BrightWallName)
	registrySection.Write("brightWallScreenNumber", setupParams.BrightWallScreenNumber)

    if setupType$ = "bnm" then
        ' handlers
        base$ = setupParams.base
        registrySection.Write("ub", setupParams.base)
        registrySection.Write("ru", setupParams.recovery_handler)
        registrySection.Write("rs", setupParams.recovery_setup)
        registrySection.Write("nu", setupParams.next)
        registrySection.Write("vu", setupParams.event)
        registrySection.Write("eu", setupParams.error)
        registrySection.Write("de", setupParams.deviceerror)
        registrySection.Write("dd", setupParams.devicedownload)
        registrySection.Write("dp", setupParams.devicedownloadprogress)
        registrySection.Write("td", setupParams.trafficdownload)
        registrySection.Write("ul", setupParams.uploadlogs)
        registrySection.Write("bs", setupParams.batteryCharger)
        registrySection.Write("hh", setupParams.heartbeat)
    else
        ' clear uploadlogs handler
        registrySection.Write("ul", "")
    endif

    registrySection.Flush()

    if setupType$ = "bnm" then
        contentDataTypeEnabledWired$ = setupParams.contentDataTypeEnabledWired
        wiredDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWired$)

        contentDataTypeEnabledWireless$ = setupParams.contentDataTypeEnabledWireless
        wirelessDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWireless$)

        binding% = GetBinding(wiredDataTransferEnabled, wirelessDataTransferEnabled)
    endif

' perform network diagnostics if enabled
	networkDiagnosticsEnabled = GetBooleanEntry(setupParams, "networkDiagnosticsEnabled")
	testEthernetEnabled = GetBooleanEntry(setupParams, "testEthernetEnabled")
	testWirelessEnabled = GetBooleanEntry(setupParams, "testWirelessEnabled")
	testInternetEnabled = GetBooleanEntry(setupParams, "testInternetEnabled")

	if networkDiagnosticsEnabled then
		PerformNetworkDiagnostics(testEthernetEnabled, testWirelessEnabled, testInternetEnabled)
	endif

    if setupType$ = "bnm" then
        ' get script from server

        numRetries% = 0
        while numRetries% < 10

            ' get bootup script from server
            xfer = CreateObject("roUrlTransfer")
            recoverySetup$ = setupParams.recovery_setup
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
        '	if localToBSNSyncSpec then
        '		MoveFile("pending-autorun.brs", "autorun.brs")
        '	endif

        ' reboot
        a=RebootSystem()
        stop

    else

        videoMode = CreateObject("roVideoMode")
        resX = videoMode.GetResX()
        resY = videoMode.GetResY()
        videoMode = invalid

        if setupType$ = "lfn" then

            MoveFile("pending-autorun.brs", "autorun.brs")

            r=CreateObject("roRectangle",0,resY/2-resY/32,resX,resY/32)
            twParams = CreateObject("roAssociativeArray")
            twParams.LineCount = 1
            twParams.TextMode = 2
            twParams.Rotation = 0
            twParams.Alignment = 1
            tw=CreateObject("roTextWidget",r,1,2,twParams)
            tw.PushString("Local File Networking Setup is complete")
            tw.Show()

            r2=CreateObject("roRectangle",0,resY/2,resX,resY/32)
            tw2=CreateObject("roTextWidget",r2,1,2,twParams)
            tw2.PushString("The device will be ready for content downloads after it completes rebooting")
            tw2.Show()

            Sleep(30000)

            ' reboot
            a=RebootSystem()
            stop

'        else if localToStandaloneSyncSpec then

'            MoveFile("pending-autorun.brs", "autorun.brs")
'            RestartScript()

        else

            r=CreateObject("roRectangle",0,resY/2-resY/64,resX,resY/32)
            twParams = CreateObject("roAssociativeArray")
            twParams.LineCount = 1
            twParams.TextMode = 2
            twParams.Rotation = 0
            twParams.Alignment = 1
            tw=CreateObject("roTextWidget",r,1,2,twParams)
            tw.PushString("Standalone Setup is complete")
            tw.Show()

            msgPort = CreateObject("roMessagePort")

            while true
                wait(0, msgPort)
            end while

        endif

    endif

End Sub

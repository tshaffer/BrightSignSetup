
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
    else if setupType$ = "sfn" then
    	ClearRegistryKeys(registrySection)
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
    m.systemTime = CreateObject("roSystemTime")
    if setupParams.timezone <> "" then
        m.systemTime.SetTimeZone(setupParams.timezone)
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

' Handlers for bnm, sfn
    if setupType$ = "bnm" then
        m.baseUrl$ = setupParams.baseUrl
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
    else if setupType$ = "sfn" then
        m.baseUrl$ = setupParams.baseUrl
        m.nextUrl$ = setupParams.nextUrl
        m.user$ = setupParams.user
        m.password$ = setupParams.password
        if m.user$ <> "" or m.password$ <> "" then
            m.setUserAndPassword = true
        else
            m.setUserAndPassword = false
        endif

        if lcase(setupParams.enableBasicAuthentication) = "true" then
            m.enableUnsafeAuthentication = true
        else
            m.enableUnsafeAuthentication = false
        endif
    else
        ' clear uploadlogs handler
        registrySection.Write("ul", "")
    endif

    registrySection.Flush()

    if setupType$ = "bnm" or setupType$ = "sfn" then
        contentDataTypeEnabledWired$ = setupParams.contentDataTypeEnabledWired
        wiredDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWired$)

        contentDataTypeEnabledWireless$ = setupParams.contentDataTypeEnabledWireless
        wirelessDataTransferEnabled = GetDataTransferEnabled(contentDataTypeEnabledWireless$)

        m.binding% = GetBinding(wiredDataTransferEnabled, wirelessDataTransferEnabled)

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
            recurl = m.baseUrl$ + recoverySetup$
            print "### Looking for file from "; recurl
            xfer.BindToInterface(m.binding%)
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

    else if setupType$= "sfn" then
        ' Check for updates every minute
        m.checkForContentTimer = CreateObject("roTimer")
        m.checkForContentTimer.SetPort(m.msgPort)
        m.checkForContentTimer.SetDate(-1, -1, -1)
        m.checkForContentTimer.SetTime(-1, -1, 0, 0)
        if not m.checkForContentTimer.Start() then stop
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


Sub StartSetupSync()

    print "### start_sync"

	if type(m.syncPool) = "roSyncPool" then
' This should be improved in the future to work out
' whether the sync spec we're currently satisfying
' matches the one that we're currently downloading or
' not.
'        m.diagnostics.PrintDebug("### sync already active so we'll let it continue")
'        m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNC_ALREADY_ACTIVE, "")
        print "### sync already active so we'll let it continue"
		return
	endif

	m.xfer = CreateObject("roUrlTransfer")
	m.xfer.SetPort(m.msgPort)

    ' get the next sync spec
	' m.diagnostics.PrintDebug("### Looking for new sync list from " + m.nextURL$)
	print "### Looking for new sync list from " + m.nextURL$
	nextUrl$ = m.baseUrl$ + m.nextUrl$
	m.xfer.SetUrl(nextUrl$)

    if m.user$<>"" and m.password$<>"" then
        m.xfer.SetUserAndPassword(m.user$, m.password$)
	    m.xfer.EnableUnsafeAuthentication(m.enableUnsafeAuthentication)
    endif

	' m.xfer.SetHeaders(m.currentSync.GetMetadata("server"))

	du = CreateObject("roStorageInfo", "./")
    cardSizeInMB = du.GetSizeInMegabytes()
    du = invalid

    systemTime = CreateObject("roSystemTime")
    timezone = systemTime.GetTimeZone()
    systemTime = invalid

' Add device unique identifier, timezone
    m.xfer.AddHeader("DeviceID", m.deviceUniqueID$)
    m.xfer.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    m.xfer.AddHeader("DeviceSWVersion", "autorun-setup.brs " + m.autorunVersion$)
    m.xfer.AddHeader("timezone", timeZone)

' Add card size
	m.xfer.AddHeader("storage-size", str(cardSizeInMB))

'    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_CHECK_CONTENT, m.nextURL$)

	print "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& binding for StartSetupSync is ";m.binding%
	ok = m.xfer.BindToInterface(m.binding%)
	if not ok then stop

	if not m.xfer.AsyncGetToFile("tmp:new-sync.xml") then stop

End Sub


Sub SetupURLEvent(msg)

'    m.diagnostics.PrintTimestamp()
'    m.diagnostics.PrintDebug("### url_event")
    print "### url_event"

	if type (m.xfer) <> "roUrlTransfer" then return
	if msg.GetSourceIdentity() = m.xfer.GetIdentity() then
	    if msg.GetInt() = m.URL_EVENT_COMPLETE then
		    xferInUse = false
		    if msg.GetResponseCode() = 200 then
			    m.newSync = CreateObject("roSyncSpec")
			    if m.newSync.ReadFromFile("tmp:new-sync.xml") then
'                    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_RECEIVED, "YES")
'                    m.diagnostics.PrintDebug("### Server gave us spec: " + m.newSync.GetName())
                    print "### Server gave us spec: " + m.newSync.GetName()
'				    readySync = CreateObject("roSyncSpec")
'				    if readySync.ReadFromFile("ready-sync.xml") then
'					    if m.newSync.EqualTo(readySync) then
'                            m.diagnostics.PrintDebug("### Server has given us a spec that matches ready-sync. Nothing more to do.")
'						    DeleteFile("tmp:new-sync.xml")
'						    readySync = 0
'						    m.newSync = 0
'						    return
'					    endif
'				    endif
' Anything the server has given us supersedes ready-sync.xml so we'd better delete it and cancel its alarm
'				    DeleteFile("ready-sync.xml")

' Log the start of sync list download
'                    m.logging.WriteDiagnosticLogEntry( m.diagnosticCodes.EVENT_DOWNLOAD_START, "")
'                    m.SendEvent("StartSyncListDownload", m.newSync.GetName(), "")

'					m.SetPoolSizes( m.newSync )

				    m.syncPool = CreateObject("roSyncPool", "pool")
				    m.syncPool.SetPort(m.msgPort)
                    m.syncPool.SetMinimumTransferRate(1000,900)
                    m.syncPool.SetFileProgressIntervalSeconds(15)
                    if m.setUserAndPassword then m.syncPool.SetUserAndPassword(m.user$, m.password$)
					m.syncPool.EnableUnsafeAuthentication(m.enableUnsafeAuthentication)
                    m.syncPool.SetHeaders(m.newSync.GetMetadata("server"))
                    m.syncPool.AddHeader("DeviceID", m.deviceUniqueID$)

' fix me
                    m.contentXfersBinding% = m.binding%

					print "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& binding for syncPool is ";m.contentXfersBinding%
					ok = m.syncPool.BindToInterface(m.contentXfersBinding%)
					if not ok then stop

' implies dodgy XML, or something is already running. could happen if server sends down bad xml.
				    if not m.syncPool.AsyncDownload(m.newSync) then
'                       m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_IMMEDIATE_FAILURE, m.syncPool.GetFailureReason())
'				        m.diagnostics.PrintTimestamp()
'                       m.diagnostics.PrintDebug("### AsyncDownload failed: " + m.syncPool.GetFailureReason())
stop
					    m.newSync = invalid
'					    m.SendError("AsyncDownloadFailure", m.syncPool.GetFailureReason(), "", m.newSync.GetName())
				    endif
' implies dodgy XML, or something is already running. could happen if server sends down bad xml.
			    else
'			        m.diagnostics.PrintDebug("### Failed to read new-sync.xml")
'			        m.SendError("Failed to read new-sync.xml", "", "", m.newSync.GetName())
stop
				    m.newSync = invalid
			    endif
		    else if msg.GetResponseCode() = 404 then
'                m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_NO_SYNCSPEC_AVAILABLE, "404")
print "### Server has no sync list for us: " + str(msg.GetResponseCode())
'                m.diagnostics.PrintDebug("### Server has no sync list for us: " + str(msg.GetResponseCode()))
' The server has no new sync for us. That means if we have one lined up then we should destroy it.
'			    DeleteFile("ready-sync.xml")
		    else
    ' retry - server returned something other than a 200 or 404
'                m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_RETRIEVE_SYNCSPEC_FAILURE, str(msg.GetResponseCode()))
'                m.diagnostics.PrintDebug("### Failed to download sync list.")
'                m.SendError("Failed to download sync list", "", str(msg.GetResponseCode()), "")
print "### Failed to download sync list."
		    endif
        endif
    endif
End Sub


Sub SetupPoolEvent(msg)

'    m.diagnostics.PrintTimestamp()
'    m.diagnostics.PrintDebug("### pool_event")
print "### pool_event"
	if type(m.syncPool) <> "roSyncPool" then
'        m.diagnostics.PrintDebug("### pool_event but we have no object")
print "### pool_event but we have no object"
'		return
	endif
	if msg.GetSourceIdentity() = m.syncPool.GetIdentity() then
		if (msg.GetEvent() = m.POOL_EVENT_FILE_DOWNLOADED) then
'            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_COMPLETE, msg.GetName())
'            m.diagnostics.PrintDebug("### File downloaded " + msg.GetName())
print "### File downloaded " + msg.GetName()
		elseif (msg.GetEvent() = m.POOL_EVENT_FILE_FAILED) then
'            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_FAILURE, msg.GetName() + chr(9) + msg.GetFailureReason())
'            m.diagnostics.PrintDebug("### File failed " + msg.GetName() + ": " + msg.GetFailureReason())
print "### File failed " + msg.GetName() + ": " + msg.GetFailureReason()
'            m.SendError("FileDownloadFailure", msg.GetFailureReason(), str(msg.GetResponseCode()), msg.GetName())
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_DOWNLOADED) then
'            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_DOWNLOAD_COMPLETE, "")
'            m.diagnostics.PrintDebug("### All downloaded for " + m.newSync.GetName())
print "### All downloaded for " + m.newSync.GetName()

' Log the end of sync list download
'            m.SendEvent("EndSyncListDownload", m.newSync.GetName(), str(msg.GetResponseCode()))

' Save to current-sync.xml then do cleanup
		    if not m.newSync.WriteToFile("current-sync.xml") then stop
            timezone = m.newSync.LookupMetadata("client", "timezone")
            if timezone <> "" then
                m.systemTime.SetTimeZone(timezone)
            endif

'            m.diagnostics.PrintDebug("### DOWNLOAD COMPLETE")
print "### DOWNLOAD COMPLETE"

            m.spf = CreateObject("roSyncPoolFiles", "pool", m.newSync)

			newSyncSpecScriptsOnly  = m.newSync.FilterFiles("download", { group: "script" } )
			event = m.syncPool.Realize(newSyncSpecScriptsOnly, "/")
			if event.GetEvent() <> m.POOL_EVENT_REALIZE_SUCCESS then
'		        m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_REALIZE_FAILURE, stri(event.GetEvent()) + chr(9) + event.GetName() + chr(9) + event.GetFailureReason())
'				m.diagnostics.PrintDebug("### Realize failed " + stri(event.GetEvent()) + chr(9) + event.GetName() + chr(9) + event.GetFailureReason() )
print "### Realize failed " + stri(event.GetEvent()) + chr(9) + event.GetName() + chr(9) + event.GetFailureReason()
'				m.SendError("RealizeFailure", event.GetName(), event.GetFailureReason(), str(event.GetEvent()))
			else
'	            m.SendEventThenReboot("DownloadComplete", m.newSync.GetName(), "")
                a=RebootSystem()
                stop
			endif

			DeleteFile("tmp:new-sync.xml")
			m.newSync = invalid
			m.syncPool = invalid
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_FAILED) then
'            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_FAILURE, msg.GetFailureReason())
'            m.diagnostics.PrintDebug("### Sync failed: " + msg.GetFailureReason())
print "### Sync failed: " + msg.GetFailureReason()
'            m.SendError("SyncFailure", msg.GetFailureReason(), str(msg.GetResponseCode()), "")
			m.newSync = invalid
			m.syncPool = invalid
		endif
	else
'        m.diagnostics.PrintDebug("### pool_event from beyond this world: " + str(msg.GetSourceIdentity()))
        print "### pool_event from beyond this world: " + str(msg.GetSourceIdentity())
	endif
End Sub


Sub SetupSyncPoolProgressEvent(msg)
'    m.diagnostics.PrintDebug("### File download progress " + msg.GetFileName() + str(msg.GetCurrentFilePercentage()))
print "### File download progress " + msg.GetFileName() + str(msg.GetCurrentFilePercentage())
'    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_PROGRESS, msg.GetFileName() + chr(9) + str(msg.GetCurrentFilePercentage()))
End Sub


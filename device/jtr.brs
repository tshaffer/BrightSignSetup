Library "db.brs"

Sub Main()

	RunJtr()

End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

    JTR.localServer = CreateObject("roHttpServer", { port: 8080 })
    JTR.localServer.SetPort(msgPort)

	JTR.RecordingsAA =              { HandleEvent: Recordings, mVar: JTR }
	JTR.RecordAA =					{ HandleEvent: Record, mVar: JTR }

	JTR.localServer.AddGetFromEvent({ url_path: "/Recordings", user_data: JTR.RecordingsAA })
	JTR.localServer.AddPostToFile({ url_path: "/Record", destination_directory: GetDefaultDrive(), user_data: JTR.RecordAA })

'    service = { name: "JTR Web Service", type: "_http._tcp", port: 8080, _functionality: BSP.lwsConfig$, _serialNumber: sysInfo.deviceUniqueID$, _unitName: unitName$, _unitNamingMethod: unitNamingMethod$,  }
'    JTR.advert = CreateObject("roNetworkAdvertisement", service)
stop
	JTR.AddFileHandlers("pool")
stop

	JTR.OpenDatabase()

	JTR.mediaStreamer = CreateObject("roMediaStreamer")
	' .SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
	' .Start()

	JTR.videoPlayer = CreateObject("roVideoPlayer")
	JTR.videoPlayer.SetPort(msgPort)

stop

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.AddFileHandlers			= AddFileHandlers
	
	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback

	return JTR

End Function


Sub AddFileHandlers(dir$ As String)

' example file path for AWS
'		pool/1/b/sha1-ccddd599d538b6c7078f408a2cf239af17a03a1b
' example url
'		/index/bg_main_background.png

' call with www
' call successively with "", "pool/", "pool/1/"
' perform ListDir on dir$
' if results.count() > 0
'	for each item in result
'		childDir$ = result + "/"
'		call ListDir to get childResults
'		if childResults.Count() == 0 then
'			add childDir to list of files
'		else
'			AddFileHandlers(childDir$)
'		call 
' else
'	add dir$ to file list
'	return
' endif
'
' alternatively
'
'	listOfFileEntries = ListDir("/" + dir$)
	listOfFileEntries = ListDir(dir$)
	for each fileEntry in listOfFileEntries
'		childDir$ = "/" + dir$ + "/" + fileEntry
		childDir$ = dir$ + "/" + fileEntry
		listOfChildEntries = ListDir(childDir$)
		if listOfChildEntries.Count() = 0 then
			print "found file " + childDir$
		else
			AddFileHandlers(childDir$)
		endif
	next

End Sub

Sub Recordings(userData as Object, e as Object)
End Sub


Sub Record(userData as Object, e as Object)
End Sub



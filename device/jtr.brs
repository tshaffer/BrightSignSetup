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

	serverDirectory$ = "www"
	listOfServerFiles = []
	JTR.ListFiles(serverDirectory$, listOfServerFiles)
	JTR.AddHandlers(serverDirectory$, listOfServerFiles)
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

	JTR.ListFiles				= ListFiles

	JTR.AddHandlers				= AddHandlers
	
	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback

	return JTR

End Function


Sub AddHandlers(serverDirectory$ As String, listOfHandlers As Object)

	' first filePath = www/remote-snapshot/angular.min.js
	' parts = www/remote-snapshot/angular.min.js
	' serverDirectory$ = www
'	regex = CreateObject("roRegEx","/","i")
'	regex = CreateObject("roRegEx",serverDirectory$,"i")

	for each filePath in listOfHandlers

		ext = GetFileExtension(filePath)
		if ext <> invalid then

			contentType$ = GetMimeTypeByExtension(ext)
	
	'		parts = regex.Split(filePath)

			url$ = Right(filePath, len(filePath) - len(serverDirectory$))

			m.localServer.AddGetFromFile({ url_path: url$, filename: filePath, content_type: contentType$ })

			if url$ = "/index.html" then
				m.localServer.AddGetFromFile({ url_path: "/", filename: filePath, content_type: contentType$ })
			endif

		endif

	next

End Sub


Function GetFileExtension(file as String) as Object
  s=file.tokenize(".")
  if s.Count()>1
    ext=s.pop()
    return ext
  end if
  return invalid
end Function


Function GetMimeTypeByExtension(ext as String) as String

  ' start with audio types '
  if ext="mp3"
    return "audio/mpeg"
  else if ext="ogg"
	return "audio/ogg"

  ' now image types '
  else if ext="gif"
    return "image/gif"
  else if ext="jpeg"
    return "image/jpeg"
  else if ext="jpg"
    return "image/jpeg"
  else if ext="png"
    return "image/png"
  else if ext="svg"
    return "image/svg+xml"

  ' now text types'
  else if ext="css"
    return "text/css"
  else if ext="js"
    return "application/JavaScript"
  else if ext="csv"
    return "text/csv"
  else if ext="html"
    return "text/html"
  else if ext="htm"
    return "text/html"
  else if ext="txt"
    return "text/plain"
  else if ext="xml"
    return "text/xml"

  ' now some video types'
  else if ext="mpeg"
    return "video/mpeg"
  else if ext="mp4"
    return "video/mp4"
  else if ext="ts"
    return "video/mpeg"
  else if ext="mov"
	return "video/quicktime"
  else if ext="mkv"
	return "video/x-matroska"
  end if
  return ""
end Function


Sub ListFiles(path$ As String, listOfFiles As Object)

' example file path for AWS
'		pool/1/b/sha1-ccddd599d538b6c7078f408a2cf239af17a03a1b
' example url
'		/index/bg_main_background.png

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries
		childPath$ = path$ + "/" + fileEntry

		' this section of code is meant to determine if childPath$ is a directory or a file.
		' if there's a direct way to determine if this, it would eliminate this call to ListDir
		listOfChildEntries = ListDir(childPath$)
		if listOfChildEntries.Count() = 0 then
'			print "found file " + childPath$
			listOfFiles.push(childPath$)
		else
			ListFiles(childPath$, listOfFiles)
		endif

	next

End Sub


Sub Recordings(userData as Object, e as Object)
End Sub


Sub Record(userData as Object, e as Object)
End Sub



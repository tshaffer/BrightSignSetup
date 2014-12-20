Sub InitializeServer()

    m.localServer = CreateObject("roHttpServer", { port: 8080 })
    m.localServer.SetPort(m.msgPort)

	m.TestRecordAA =					{ HandleEvent: TestRecord, mVar: m }
	m.RecordAA =						{ HandleEvent: Record, mVar: m }
	m.RecordingsAA =					{ HandleEvent: Recordings, mVar: m }

'	m.localServer.AddGetFromEvent({ url_path: "/", user_data: m.TestRecordAA })
	m.localServer.AddGetFromEvent({ url_path: "/TestRecord", user_data: m.TestRecordAA })

	m.localServer.AddGetFromEvent({ url_path: "/Record", user_data: m.RecordAA })
	m.localServer.AddGetFromEvent({ url_path: "/Recordings", user_data: m.RecordingsAA })

'    service = { name: "JTR Web Service", type: "_http._tcp", port: 8080, _functionality: BSP.lwsConfig$, _serialNumber: sysInfo.deviceUniqueID$, _unitName: unitName$, _unitNamingMethod: unitNamingMethod$,  }
'    JTR.advert = CreateObject("roNetworkAdvertisement", service)

	serverDirectory$ = "www"
	listOfServerFiles = []
	ListFiles(serverDirectory$, listOfServerFiles)
	m.AddHandlers(serverDirectory$, listOfServerFiles)

End Sub


Sub AddHandlers(serverDirectory$ As String, listOfHandlers As Object)

	' first filePath = www/remote-snapshot/angular.min.js
	' parts = www/remote-snapshot/angular.min.js
	' serverDirectory$ = www

	for each filePath in listOfHandlers

		ext = GetFileExtension(filePath)
		if ext <> invalid then

			contentType$ = GetMimeTypeByExtension(ext)
	
			url$ = Right(filePath, len(filePath) - len(serverDirectory$))

			m.localServer.AddGetFromFile({ url_path: url$, filename: filePath, content_type: contentType$ })

			if url$ = "/index.html" then
				m.localServer.AddGetFromFile({ url_path: "/", filename: filePath, content_type: contentType$ })
			endif

		endif

	next

End Sub


Sub Recordings(userData as Object, e as Object)
End Sub


Sub Record(userData as Object, e as Object)
End Sub


Sub TestRecord(userData as Object, e as Object)

	' fileName = <file name>
	' duration = <duration in seconds>
    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	fileName$ = requestParams["fileName"]
	duration$ = requestParams["duration"]

	mVar.StartRecord(fileName$, int(val(duration$)))

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("recording to file " + fileName$)
    e.SendResponse(200)

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



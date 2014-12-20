Library "db.brs"
Library "server.brs"

Sub Main()

	RunJtr()

End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

	JTR.InitializeServer()
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

	JTR.InitializeServer		= InitializeServer
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


Sub ListFiles(path$ As String, listOfFiles As Object)

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries
		childPath$ = path$ + "/" + fileEntry

		' this section of code is meant to determine if childPath$ is a directory or a file.
		' if there's a direct way to determine if this, it would eliminate this call to ListDir
		listOfChildEntries = ListDir(childPath$)
		if listOfChildEntries.Count() = 0 then
			listOfFiles.push(childPath$)
		else
			ListFiles(childPath$, listOfFiles)
		endif

	next

End Sub



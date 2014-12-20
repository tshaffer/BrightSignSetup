Library "tunerServer.brs"

Sub Main()

	RunTuner()

End Sub


Sub RunTuner()

    msgPort = CreateObject("roMessagePort")

    Tuner = newTuner(msgPort)

	Tuner.videoPlayer = CreateObject("roVideoPlayer")
	Tuner.videoPlayer.SetPort(msgPort)

	Tuner.InitializeServer()

' Get tuner data
' Note:	an alternative is to import the data from ScannedChannels.xml. See the code in newSign that ends up calling GetScannedChannels() after
'		reading the file referenced in the bpf
	Tuner.channelDescriptors = GetScannedChannels()

    Tuner.EventLoop()

End Sub


Function newTuner(msgPort As Object) As Object

    Tuner = {}
    Tuner.msgPort = msgPort

	Tuner.EventLoop = EventLoop

	Tuner.InitializeServer		= InitializeServer

	Tuner.Tune					= Tune
	Tuner.TuneToChannel			= TuneToChannel
	Tuner.GetChannel			= GetChannel

	return Tuner

End Function


Function GetScannedChannels() As Object

	channelDescriptors = CreateObject("roArray", 1, true)

	channelManager = CreateObject("roChannelManager")
	if type(channelManager) = "roChannelManager" then

		' Get channel descriptors for all the channels on the device
		channelCount% = channelManager.GetChannelCount()

		if channelCount% > 0 then

			channelInfo  = CreateObject("roAssociativeArray")

			for channelIndex% = 0 to channelCount% - 1
				channelInfo["ChannelIndex"] = channelIndex%
				channelDescriptor = channelManager.CreateChannelDescriptor(channelInfo)
				channelDescriptors.push(channelDescriptor)
			next
		endif
		
	endif

	return channelDescriptors

End Function


Function Tune(channelName$ As String)

	' m.channelManager = CreateObject("roChannelManager")
	' m.channelManager.SetPort(m.bsp.msgPort)
	
	channelDescriptor = m.GetChannel(channelName$)
	if channelDescriptor = invalid then stop
	m.TuneToChannel(channelDescriptor)

End Function


Function GetChannel(channelName$ As String) As Object

	for each channelDescriptor in m.channelDescriptors
		if channelDescriptor.ChannelName = channelName$ then
			return channelDescriptor
		endif
	next

	return invalid

End Function


Sub TuneToChannel(channelDescriptor As Object)

	print "Tune to the following channel descriptor:"
    print "VirtualChannel " + channelDescriptor.VirtualChannel
    print "ChannelName " + channelDescriptor.ChannelName

	ok = m.videoPlayer.PlayFile(channelDescriptor)

	if not ok then
		print "Error tuning in TuneToChannel"
	endif

End Sub


Sub EventLoop()

	SQLITE_COMPLETE = 100

print "entering event loop"

    while true
        
        msg = wait(2000, m.msgPort)

		print "msg received - type=" + type(msg)

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		endif

    end while

End Sub



Function IsRemoteCommand(event As Object) As Boolean

	if type(event) = "roIRRemotePress" or type(event) = "roIRDownEvent" return true
	return false

End Function


Function GetRemoteCommand(event As Object) As String

	remoteEvent% = event
	remoteEvent$ = SonyCommand(remoteEvent%)
	if remoteEvent$ = "" then
		remoteEvent$ = SoundBridgeCommand(remoteEvent%)
		if remoteEvent$ = "" then
			remoteEvent$ = SeikiCommand(remoteEvent%)
		endif
	endif

	print "remoteEvent=";remoteEvent$
	return remoteEvent$

End Function


Function SonyCommand(remoteCommand% As Integer) As String

	if remoteCommand% = 163150 then
		remoteCommand$ = "LEFT"					' LEFT
	else if remoteCommand% = 163145 then
		remoteCommand$ = "RIGHT"				' RIGHT
	else if remoteCommand% = 163144 then
		remoteCommand$ = "UP"					' UP
	else if remoteCommand% = 163149 then 
		remoteCommand$ = "DOWN"					' DOWN
	else if remoteCommand% = 163146 then 
		remoteCommand$ = "SELECT"				' SELECT
	else if remoteCommand% = 163141 then 
		remoteCommand$ = "MENU"					' MENU
	else if remoteCommand% = 163085 then 
		remoteCommand$ = "EXIT"					' EXIT = List
	else if remoteCommand% = 163098 then 
		remoteCommand$ = "PLAY"					' PLAY
	else if remoteCommand% = 163163 then 
		remoteCommand$ = "PAUSE"				' PAUSE
	else if remoteCommand% = 163094 then 
		remoteCommand$ = "FF"					' FF
	else if remoteCommand% = 163159 then 
		remoteCommand$ = "RW"					' RW
	else if remoteCommand% = 163139 then 
		remoteCommand$ = "STOP"					' STOP
	else if remoteCommand% = 163160 then 
		remoteCommand$ = "QUICK_SKIP"			' QUICK_SKIP = OPTIONS
	else if remoteCommand% = 163154 then 
		remoteCommand$ = "INSTANT_REPLAY"		' INSTANT_REPLAY = RETURN
	else if remoteCommand% = 163143 then 
		remoteCommand$ = "JUMP"					' JUMP = RECALL
	else if remoteCommand% = 163136 then 
		remoteCommand$ = "PROGRESS_BAR"			' PROGRESS_BAR = INFO
	else if remoteCommand% = 163089 then
		remoteCommand$ = "RECORDED_SHOWS"		' RECORDED_SHOWS = FAVORITES
	else if remoteCommand% = 163140 then
		remoteCommand$ = "HIGHEST_SPEED_FW"		' ->->|
	else if remoteCommand% = 163096 then
		remoteCommand$ = "HIGHEST_SPEED_RW"		' |<-<-
	else
		remoteCommand$ = ""
	endif

	return remoteCommand$

End Function

Function SoundBridgeCommand(remoteCommand% As Integer) As String

    if remoteCommand% < 0 or remoteCommand% > 18 return ""

	Dim remoteCommands[19]
	remoteCommands[0]="LEFT"				'WEST
	remoteCommands[1]="RIGHT"				'EAST
	remoteCommands[2]="UP"					'NORTH
	remoteCommands[3]="DOWN"				'SOUTH
	remoteCommands[4]="SELECT"				'SEL
	remoteCommands[5]="EXIT"				'EXIT
	remoteCommands[6]="PWR"					'PWR
	remoteCommands[7]="MENU"				'MENU
	remoteCommands[8]="JUMP"				'SEARCH
	remoteCommands[9]="PLAY"				'PLAY
	remoteCommands[10]="FF"					'FF
	remoteCommands[11]="RW"					'RW
	remoteCommands[12]="PAUSE"				'PAUSE
	remoteCommands[13]="INSTANT_REPLAY"		'ADD
	remoteCommands[14]="SHUFFLE"			'SHUFFLE
	remoteCommands[15]="QUICK_SKIP"			'REPEAT
	remoteCommands[16]="PLAY_ICON"			'VOLUP
	remoteCommands[17]="PROGRESS_BAR"		'VOLDWN
	remoteCommands[18]="BRIGHT"				'BRIGHT

    return remoteCommands[remoteCommand%]
    
End Function


' Also applies to Sony RM-VLZ620 as it was programmed from the Seiki
Function SeikiCommand(remoteCommand% As Integer) As String

	if remoteCommand% = 163150 then
		remoteCommand$ = "LEFT"					' LEFT
	else if remoteCommand% = 163145 then
		remoteCommand$ = "RIGHT"				' RIGHT
	else if remoteCommand% = 163144 then
		remoteCommand$ = "UP"					' UP
	else if remoteCommand% = 163149 then 
		remoteCommand$ = "DOWN"					' DOWN
	else if remoteCommand% = 163146 then 
		remoteCommand$ = "SELECT"				' SELECT = OK
	else if remoteCommand% = 163141 then 
		remoteCommand$ = "MENU"					' MENU
	else if remoteCommand% = 163085 then 
		remoteCommand$ = "EXIT"					' EXIT
	else if remoteCommand% = 163098 then 
		remoteCommand$ = "PLAY"					' PLAY = V-CHIP
	else if remoteCommand% = 163163 then 
		remoteCommand$ = "PAUSE"				' PAUSE = CC
	else if remoteCommand% = 163094 then 
		remoteCommand$ = "FF"					' FF = D
	else if remoteCommand% = 163159 then 
		remoteCommand$ = "RW"					' RW = A
	else if remoteCommand% = 163160 then 
		remoteCommand$ = "QUICK_SKIP"			' QUICK_SKIP = ASPECT
	else if remoteCommand% = 163154 then 
		remoteCommand$ = "INSTANT_REPLAY"		' INSTANT_REPLAY = AUTO
	else if remoteCommand% = 163143 then 
		remoteCommand$ = "JUMP"					' JUMP = P.Mode
	else if remoteCommand% = 163157 then 
		remoteCommand$ = "PLAY_ICON"			' PLAY_ICON = C
	else if remoteCommand% = 163136 then 
		remoteCommand$ = "PROGRESS_BAR"			' PROGRESS_BAR = B
	else if remoteCommand% = 163089 then
		remoteCommand$ = "RECORDED_SHOWS"		' RECORDED_SHOWS = SLEEP
	else if remoteCommand% = 163140 then
		remoteCommand$ = "HIGHEST_SPEED_FW"		
	else if remoteCommand% = 163096 then
		remoteCommand$ = "HIGHEST_SPEED_RW"
	else if remoteCommand% = 163139 then 
		remoteCommand$ = "STOP"					' STOP = S.Mode
	else
		remoteCommand$ = ""
	endif

	return remoteCommand$

End Function

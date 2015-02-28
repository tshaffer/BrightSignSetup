function GetRemoteCommand(remoteCode) {

    var remoteEvent = SonyCommand(remoteCode);
    if (remoteEvent == "")
        remoteEvent = SoundBridgeCommand(remoteCode);
    if (remoteEvent == "" )
        remoteEvent = SeikiCommand(remoteCode);

    console.log("remoteEvent=" + remoteEvent);
    return remoteEvent;
}

function SonyCommand(remoteCode) {

    var remoteCommand = "";

    if (remoteCode == 163150)
        remoteCommand = "LEFT"					// LEFT
    else if (remoteCode == 163145)
        remoteCommand = "RIGHT"				    // RIGHT
    else if (remoteCode == 163144)
        remoteCommand = "UP"					// UP
    else if (remoteCode == 163149)
        remoteCommand = "DOWN"					// DOWN
    else if (remoteCode == 163146)
        remoteCommand = "SELECT"				// SELECT
    else if (remoteCode == 163141)
        remoteCommand = "MENU"					// MENU
    else if (remoteCode == 163085)
        remoteCommand = "EXIT"					// EXIT = List
    else if (remoteCode == 163098)
        remoteCommand = "PLAY"					// PLAY
    else if (remoteCode == 163163)
        remoteCommand = "PAUSE"				    // PAUSE
    else if (remoteCode == 163094)
        remoteCommand = "FF"					// FF
    else if (remoteCode == 163159)
        remoteCommand = "RW"					// RW
    else if (remoteCode == 163139)
        remoteCommand = "STOP"					// STOP
    else if (remoteCode == 163160)
        remoteCommand = "QUICK_SKIP"			// QUICK_SKIP = OPTIONS
    else if (remoteCode == 163154)
        remoteCommand = "INSTANT_REPLAY"		// INSTANT_REPLAY = RETURN
    else if (remoteCode == 163143)
        remoteCommand = "JUMP"					// JUMP = RECALL
    else if (remoteCode == 163136)
        remoteCommand = "PROGRESS_BAR"			// PROGRESS_BAR = INFO
    else if (remoteCode == 163089)
        remoteCommand = "RECORDED_SHOWS"		// RECORDED_SHOWS = FAVORITES
    else if (remoteCode == 163140)
        remoteCommand = "HIGHEST_SPEED_FW"		// ->->|
    else if (remoteCode == 163096)
        remoteCommand = "HIGHEST_SPEED_RW"		// |<-<-
    else
        remoteCommand = ""

    return remoteCommand
}


function SeikiCommand(remoteCode)
{
    if (remoteCode = 163150)
        remoteCommand = "LEFT"					// LEFT
    else if (remoteCode = 163145)
        remoteCommand = "RIGHT"				    // RIGHT
    else if (remoteCode = 163144)
        remoteCommand = "UP"					// UP
    else if (remoteCode = 163149) 
        remoteCommand = "DOWN"					// DOWN
    else if (remoteCode = 163146) 
        remoteCommand = "SELECT"				// SELECT = OK
    else if (remoteCode = 163141) 
        remoteCommand = "MENU"					// MENU
    else if (remoteCode = 163085) 
        remoteCommand = "EXIT"					// EXIT
    else if (remoteCode = 163098) 
        remoteCommand = "PLAY"					// PLAY = V-CHIP
    else if (remoteCode = 163163) 
        remoteCommand = "PAUSE"				    // PAUSE = CC
    else if (remoteCode = 163094) 
        remoteCommand = "FF"					// FF = D
    else if (remoteCode = 163159) 
        remoteCommand = "RW"					// RW = A
    else if (remoteCode = 163160) 
        remoteCommand = "QUICK_SKIP"			// QUICK_SKIP = ASPECT
    else if (remoteCode = 163154) 
        remoteCommand = "INSTANT_REPLAY"		// INSTANT_REPLAY = AUTO
    else if (remoteCode = 163143) 
        remoteCommand = "JUMP"					// JUMP = P.Mode
    else if (remoteCode = 163157) 
        remoteCommand = "PLAY_ICON"			    // PLAY_ICON = C
    else if (remoteCode = 163136) 
        remoteCommand = "PROGRESS_BAR"			// PROGRESS_BAR = B
    else if (remoteCode = 163089)
        remoteCommand = "RECORDED_SHOWS"		// RECORDED_SHOWS = SLEEP
    else if (remoteCode = 163140)
        remoteCommand = "HIGHEST_SPEED_FW"		
    else if (remoteCode = 163096)
        remoteCommand = "HIGHEST_SPEED_RW"
    else if (remoteCode = 163139) 
        remoteCommand = "STOP"					// STOP = S.Mode
    else
		remoteCommand = ""
    endif

    return remoteCommand
}

tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "310-500-8926" of targetService
    send "Test 1" to targetBuddy
end tell 
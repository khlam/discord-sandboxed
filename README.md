# Discord-Sandbox <a href="https://github.com/khlam/discord-sandboxed/releases/latest"><img src="https://img.shields.io/badge/download-latest-green.svg"></a>

> Open-sourced Sandboxed Discord client for the privacy-minded. Say NO to intrusive data collection.


Are you worried Discord is watching what programs you have open or listening to your mic even while you're not pressing your push-to-talk key?
Discord-Sandbox isolates the Discord from reading background processes by running the [Discord web client](https://discordapp.com/) inside of a [\<webview>](https://developer.chrome.com/apps/tags/webview), which is finally contained inside the Electron process.

## Enabling Push-to-Talk
To enable push-to-talk, open Discord-Sandbox and set your push-to-talk key to `Backspace`. 

### How does Push-to-Talk Work?

The [Discord web client](https://discordapp.com/) lacks push-to-talk detection while the browser session does not have window focus.
If you prefer push-to-talk, this gimping makes the web client almost unusable.

Discord-Sandbox works around this issue and enables system-wide push-to-talk while respecting your privacy. 
This is accomplished using a separate key-press detection library, [iohook](https://www.npmjs.com/package/iohook), and mediating its interaction with Discord.
This separates your activity from Discord without compromising any usability.

When your push-to-talk key is held down, the renderer process will send a `backspace` key-down keycode,

`
webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
`

to the [\<webview>](https://developer.chrome.com/apps/tags/webview), so you can use Discord without worrying about the client listening in on whatever else you're running.

## What this Client Tries to Do
Discord-Sandbox tries to isolate the Discord client within the Electron process, preventing it from watching keystrokes or processes it has no business in.
While users may consent to data collection in Discord's TOS, information such as keystrokes to set your idle status or background applications that have nothing to do with Discord are still being monitored by the [Discord Client](https://discordapp.com/download).

## What this Client Cannot Do
Discord still has the ability to collect a lot of user-behavior information.
Discord-Sandbox only tries to protect you from the Discord application reading your keystrokes and background processes.
Discord can still collect the following information. Since these are inherent to the service, we can't do much about it.

- Messages, client data, emails, and voice data
- Links you have clicked/opened from within the client (Passing links to a browser has been disabled to somewhat mitigate this)

> This Discord-Sandbox open source project is not affiliated with Discord or Discord Inc.
I do not claim to have created Discord.
Discord-Sandbox is not the official Discord client.
Discord is a freeware VoIP application made by Discord Inc.
You can download the official Discord client [Here](https://discordapp.com/download).
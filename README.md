# Discord-Sandbox
> Open-sourced sandboxed Discord client for the privacy-minded. Say NO to intrusive data collection.


Paranoid that Discord is watching what programs you have open or listening on your mic when you're not pressing your push-to-talk key? Discord-Sandbox isolates the Discord process from reading background processes by running the [Discord web client](https://discordapp.com/) inside of a [\<webview>](https://developer.chrome.com/apps/tags/webview), which is finally contained inside the Electron process.

## Enabling Push-to-Talk
To enable push-to-talk, open Discord-Sandbox and set your push-to-talk key to `Backspace.` 

### How does Push-to-Talk Work while Respecting my Privacy?

The [Discord web client](https://discordapp.com/) lacks push-to-talk detection while the browser session does not have window focus. If you prefer push-to-talk, this gimping makes the web client almost unusable.

Discord-Sandbox works around this issue and enables system-wide push-to-talk while respecting your privacy. This is accomplished using a separate keypress detection library, [iohook](https://www.npmjs.com/package/iohook), and mediating its interaction with Discord.

When your push-to-talk key is held down, the renderer process will send a `backspace` keydown keycode,

`
webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
`

to the [\<webview>](https://developer.chrome.com/apps/tags/webview), so you can use Discord without worrying about the client listening in on whatever else you're running.


## What this Client Cannot Do
Discord still has the ability to collect a lot of user-behavior information. This client only tries to protect you from the Discord application reading your keypresses and background processes.
Discord can still collect the following information, since these are inherent to the service, we can't do much about it.

- Messages, client data, emails, voice data
- Links you have clicked/openend from within the client (Passing links to a browser has been disabled to somewhat migitate this)

> This Discord-Sandbox open source project is not affiliated with Discord or Discord Inc. I do not claim to have created Discord. Discord is a freeware VoIP application made by Discord Inc.
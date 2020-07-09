let windowName = 1

function appendRow(data) {
    let dateNow = new Date()
    let table = document.getElementById("logDisplayTable")
    let newRow = document.createElement('tr')
    newRow.innerHTML = `
    <td style="font-size: 12px;">${dateNow.getHours()}:${dateNow.getMinutes()} | ${data.url} [${data.count}] BLOCKED</td>
    `
    table.appendChild(newRow)
    document.getElementById('logContainer').scrollTo(0, document.getElementById('logContainer').scrollHeight)
}

onload = () => {
    // Display logs sent from logLoad.js
    window.addEventListener(
        "message",
        event => {
        if (event.origin === "file://" && event.source === window) {
            if (event.data.type === 'blockUpdate') {
                console.log(event.data.payload)
                appendRow(event.data.payload)
            }
        }
        },
        false
    )
}
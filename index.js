function closeTerm(term) {
    if (term) {
      term.clear()
    }
    logseq.hideMainUI({ restoreEditingCursor: true })
}

function main () {
  const shellEl = document.createElement('div')
  shellEl.innerText = '❤️ Not A Terminal. Ctrl+I to insert from keyboard, escape or ctrl+d to close.'
  shellEl.classList.add('shell-command-trigger')

  const root = document.querySelector('#app')
  root.appendChild(shellEl)

  const term = new Terminal({convertEol: true})
  term.open(document.getElementById("terminal"))

  document.querySelector('#insertAtCursor').addEventListener('click', function() {
    logseq.Editor.insertAtEditingCursor("```\n" + terminalHistory + "```\n")
  })

  terminalBuffer = ""
  terminalHistory = ""
  // Cursor keys, delete
  terminalIgnoreKeys = [65, 66, 67, 68, 126]
  terminalPrompt = "\n\rfetch> "
  term.write(terminalPrompt)

  term.onData((data) => {
    console.log(data)
    console.log(data.charCodeAt(data.length-1))
  
    if (data.charCodeAt(data.length-1) === 13) {
      //Enter
      term.write('\n\r')

      if (terminalBuffer.length === 0) {
        term.write(terminalPrompt)
        return
      }
      // 'https://cowsay.morecode.org/say?message=logseq%20moo&format=text'
      fetch(terminalBuffer, {method: 'GET', timeout: 10})
      .then(response => response.text())
      .then(res => {
        console.log(res)
        term.write(res)
        terminalBuffer = ""
        terminalHistory += res
        term.write(terminalPrompt)  
      })
      .catch(error => {
        console.error(error)
        term.write("\n\rError in request\n\r", error, "\n\r" + terminalPrompt)
      })

      term.write('Fetching ' + terminalBuffer + '\n\r')
    } else if (data.charCodeAt(data.length-1) === 4) {
      //This should be ctrl+d
      terminalBuffer = ""
      terminalHistory = ""
      closeTerm(term)
    } else if (data.charCodeAt(data.length-1) === 27) {
      //Escape
      terminalBuffer = ""
      terminalHistory = ""
      closeTerm(term)
    } else if (data.charCodeAt(data.length-1) === 9) {
      //Ctrl+i
      logseq.Editor.insertAtEditingCursor("```\n" + terminalHistory + "```\n")
      document.getElementById("terminal").focus()

    } else if (data.charCodeAt(data.length-1) === 127) {
      //This should be backspace
      if (terminalBuffer.length > 0) {
        terminalBuffer = terminalBuffer.slice(0, -1)
        term.write('\b')
      }
    } else if (terminalIgnoreKeys.includes(data.charCodeAt(data.length-1))) {
      //Ignored
    } else {
      term.write(data)
      terminalBuffer += data
    }
  })

  document.addEventListener('keydown', function (e) {
    if (e.code === "Escape") {
      closeTerm()
    }
    e.stopPropagation()
  }, false)

  logseq.Editor.registerSlashCommand(
    'Fetch url', async () => {
      // All this does is open Ctrl+Shift+1
      // await logseq.App.invokeExternalCommand('logseq.command/run', 'ls')
      logseq.showMainUI()
      // It just doesn't want to focus...
      document.getElementById("terminal").focus()
      term.focus()
    },
  )
}

// bootstrap
logseq.ready(main).catch(console.error)

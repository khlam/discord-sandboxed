let fadeTimer // Global fade banner timer

//https://www.w3schools.com/howto/howto_js_draggable.asp
//Make the DIV element draggagle:
dragElement(document.getElementById("blockedDisplay"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    elmnt.style.opacity = "1"

    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
    elmnt.style.opacity = "0.2"
  }
}

// Fade Copy banner in and out
function fadeBanner(ele) {
  let _element = document.getElementById(ele)
  clearInterval(fadeTimer)
  _element.style.display = 'Block'
  let op = 1; 
  fadeTimer = setInterval(function () {
      if (op <= 0.1){
          clearInterval(fadeTimer)
          _element.style.display = 'none'
      }
      _element.style.opacity = op
      op -= op * 0.1
  }, 60)

}
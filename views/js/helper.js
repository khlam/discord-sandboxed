let fadeTimer // Global fade banner timer

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
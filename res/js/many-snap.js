/**
 * @license
 * VERSION 0.0.3
 * Use: Just put this js file in like CDN.
 * Released under MIT license
 * using Pure Javascript.
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Copyright Changho Lee and Many Stallings.
 */
(function() {

  
  if(!document)
    throw new Error("document variable not supported.")
  if(!window)
    throw new Error("window variable not supported.")

  let snap = {}

  /**
   * The version number.
   *
   * @static
   * @memberOf ManySnap
   * @type {string}
   */
  snap.VERSION = '0.0.3';

  /**
   * The toString literal.
   *
   * @static
   * @memberOf ManySnap
   * @type {string}
   */
  snap.TOSTRING = '[object ManySnap]'
  
  snap.elList = ['#card-item-2', '#card-item-3']
  snap.onscroll = undefined
  snap.scrollActionCount = 0 

  /**    
  * @static
  * @returns {None} Snap Object's start trigger.
  */
   snap.init = function (elList, isMobile) {
    if(Array.isArray(elList))
      snap.elList = elList
    for(let i = 0; i < snap.elList.length; i++)
    {
      try {
        if(typeof snap.elList[i] === 'string')
          snap.elList[i] = document.querySelector(snap.elList[i])

      } catch(e) {
        throw new Error('elList\'s querySelector not matched.')
      }
    }
  }

  function near(b, t)
  {
    if(b < t && t < b + 35) return true 
    if(b - 35 < t && t <= b) return true 
    return false
  }
  window.addEventListener('scroll', () => {
    if(snap.scrollActionCount++ % 5 !== 0) return
    if(typeof snap.onscroll === 'function')
      snap.onscroll()
    for(let el of snap.elList)        
      if(near(el.offsetTop, window.scrollY))
      {
        setTimeout(() => {
          window.scrollTo(0, el.offsetTop)
        }, 10)
        break
      }
  })

  snap.toString = function() {
    return snap.TOSTRING
  }
  window.snapped = snap
  window.manysnap = snap
}.call(this))
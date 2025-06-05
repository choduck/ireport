const _ = require("lodash")
const blackList = {
  command: ['sudo ', 'mv ', 'cp ', './'],
  xss: ['setTimeout', 'setInterval'],
  sql: ['1=1', 'drop '],
}
const blackListTypes = ['command', 'xss', 'sql']

const method = {
  detectInjection: function (type, str) {
    if(typeof str === 'string')
      for(let blackWord of blackList[type])
        if(str.includes(blackWord))
          return true
    return false
  },
  sanitizeInjection: function (type, str) {
    if(typeof str === 'string')
      for(let blackWord of blackList[type])
        str = str.replace(new RegExp(`${blackWord}`, "gi"), '')
    return str
  }
}
method.detectInjectionAll = function (str) {
  for(let type of blackListTypes)
    if(method.detectInjection(type, str)) return true
  return false
}
method.sanitizeInjectionAll = function (str) {
  for(let type of blackListTypes)
    str = method.sanitizeInjection(type, str)
  return str
}
function checkObject(cmd, obj) {
  if(cmd !== 'detect' && cmd !== 'sanitize') return true
  if(!_.isObject(obj)) return false
  for(let param in obj)
    if(typeof obj[param] === 'string')
      for(let type of blackListTypes)
      {
        if(cmd === 'sanitize')
          obj[param] = method.sanitizeInjection(type, obj[param])
        else if(cmd === 'detect')
          if(method.detectInjection(type, obj[param]))
            return true
      }
  if(cmd === 'sanitize') return obj
  else if(cmd === 'detect') return false
}
function checkArray(cmd, arr) {
  if(cmd !== 'detect' && cmd !== 'sanitize') return true
  if(Array.isArray(arr)) return false
  for(let element of arr)
    if(typeof element === 'string')
      for(let type of blackListTypes)
      {
        if(cmd === 'sanitize')
          obj[param] = method.sanitizeInjection(type, obj[param])
        else if(cmd === 'detect')
          if(method.detectInjection(type, obj[param]))
            return true
      }
  if(cmd === 'sanitize') return obj
  else if(cmd === 'detect') return false
}

const wholeObject = {
  DETECT: 'detect',
  SANITIZE: 'sanitize',
  ...method,
  check: {
    object: checkObject,
    array: checkArray
  }
}

module.exports = wholeObject
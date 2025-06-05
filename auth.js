const crypto = require('crypto')
const _ = require('lodash')

function getEnKey(salt) {
	let ENCRYPTION_KEY
	if(salt.length > 32 + 2)
		ENCRYPTION_KEY = salt.substring(0 + 2, 32 + 2)
	else
		ENCRYPTION_KEY = ENCRYPTION_KEY.padStart(32 - ENCRYPTION_KEY.length, "sajdiofc vawnoiec jaosidjh ciedisal")
	return ENCRYPTION_KEY
}
// Swap String. 문자열을 반으로 쪼개 순서 교환
const ss = function (str) {
  if(str.length > 0)
  {
    if(str.length % 2 == 1)
    {
      let m = Math.floor(str.length / 2)
      let s1 = 0, e1 = m, s2 = m + 1, e2 = str.length
      return str.substring(s2, e2) + str[m] + str.substring(s1, e1)  
    }
    else
    {
      let m = str.length / 2
      let s1 = 0, e1 = m, s2 = m, e2 = str.length
      return str.substring(s2, e2) + str.substring(s1, e1)  
    }
  }
  return ''
}
function encrypt(ENCRYPTION_KEY, plainText) {
	//const ENCRYPTION_KEY = '11110000111100001111000011110000'
	const iv             = '000011110000'
	const cipher = crypto.createCipheriv(
		'chacha20-poly1305',
		Buffer.from(ENCRYPTION_KEY),
		iv,
	)
	let encrypted = [
		cipher.update(plainText).toString('hex'),
		cipher.final().toString('hex')]
	const tag = cipher.getAuthTag().toString('hex')
	return tag + encrypted.join('')
}
function decrypt(ENCRYPTION_KEY, encryptedText) {
	const iv             = '000011110000'
	const decipher = crypto.createDecipheriv('chacha20-poly1305', ENCRYPTION_KEY, iv)
	const tag = encryptedText.substring(0, 32)
	
	decipher.setAuthTag(Buffer.from(tag, 'hex'))
	let decrypted = [
					decipher.update(encryptedText.substring(32), 'hex'),
					decipher.final()]

	return Buffer.concat(decrypted).toString('utf8')
}
const getDataToken = function (SALT, jsonObject) {
	const [startDatetime, id, company] = [jsonObject['생성시각'], jsonObject['아이디'], jsonObject['회사명']]

	const SALT_REVERSE = SALT[1].split('').reverse().join('')
	console.log('암호화 전', `${ss(startDatetime)}${SALT[2]}${ss(id)}${SALT_REVERSE}${ss(company)}${SALT[0]}`)
	return encrypt(getEnKey(SALT[0]), `${ss(startDatetime)}${SALT[2]}${ss(id)}${SALT_REVERSE}${ss(company)}${SALT[0]}`)
}
const splitDataToken = function (SALT, iv, encryptedText) {
	SALT = SALT.salt
	const SALT_REVERSE = SALT[1].split('').reverse().join('')

	const enKey = getEnKey(SALT[0])
	const baseStr = decrypt(enKey, encryptedText)
	const baseArr = baseStr.split(SALT_REVERSE)
	let [startDatetimeAndId, companyName] = baseArr
	const [startDatetime, id] = startDatetimeAndId.split(SALT[2])
	companyName = companyName.replace(SALT[0], '')
	return [ss(startDatetime), ss(id), ss(companyName)]
}
const decodeBase64Array = function (arr) {
	return arr.map(e => Buffer.from(e, 'base64url').toString())
}
const encodeBase64 = function (str) {
	return Buffer.from(str, 'utf8').toString('base64url')
}
const getSaltList = function (salt) {
  let initalIndices = [...Array(salt.length).keys()]
  let indices = []
  initalIndices = _.shuffle(initalIndices)
  indices.push(initalIndices)
  initalIndices = _.shuffle(initalIndices)
  indices.push(initalIndices)
  initalIndices = _.shuffle(initalIndices)
  indices.push(initalIndices)
	return [_.at(salt, indices[0]).join(''),
	_.at(salt, indices[1]).join(''),
	_.at(salt, indices[2]).join('')]
}

const exportObject = {
	getSaltList: getSaltList,
  getDataToken: getDataToken,
  splitDataToken: splitDataToken,
  decodeBase64Array: decodeBase64Array,
  encodeBase64: encodeBase64,
  encrypt: encrypt,
  decrypt: decrypt
}
module.exports = exportObject
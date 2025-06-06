/**
 * @version 0.1
 * @copyright Many Stallings Company 2023
 * @license MIT
 */

//process.env.NODE_ENV = 'production'

const express = require('express')
const app = express()
//const compression = require('compression')
const sec = require("./security")

const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const querystring = require('querystring')
const _ = require('lodash')
const randomString = require("randomstring")
const MobileDetect = require('mobile-detect')
const schedule = require('node-schedule')
const helmet = require("helmet")
const jsonwebtoken = require('jsonwebtoken')
const crypto = require('crypto')

const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const { generate } = require('randomstring')


const { closeDB, onInit, savePageViewAndSEOData, findSome, findSomeWrapper, querySome, saveSome, pushSome, replaceSome, removeSome } = require("./db-core2")

// Pug 템플릿 엔진 설정
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'pug'))

dayjs.extend(customParseFormat) // use plugin
dayjs.extend(isSameOrAfter) // use plugin

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage, limits: { fieldSize: 1024 * 1024 * 29, fields: 70, fileSize: 1 } })
const uploadMultiple = upload.fields([
  { name: 'image', maxCount: 20 },
  { name: 'text', maxCount: 20 }
])

let baseURL = '127.0.0.1'
const port = 8888

//const maxId = {'테이블1': 100} // 임시 Temporary
let seo = {}, email = { reception: 0 }
const maxId = {}
const ENV_GLOBAL = {
	'유저': {
		'누적': 0,
		'일방문자수': 0,
		'로그아웃누적': 0
	}
}
const va = {
	'JWT': {
		'비밀키': 'mySecretKey',
		'JWT페이로드암호키': '7171000011120000'
	},
	COOKIE_SECRETKEY: '7121000012720000',
	COOKIE_SECURE: false,
	COOKIE_HTTPONLY: true
}
const locals = {
	'공통': { count: 0 },
	'아이디1': {}
}
const TENANCY = "매니스탈링스"
const SEP = '--SEP662D5F'

function getHash(value) {
	let makeHash = crypto.createHash('sha256')
	return makeHash.update(value).digest().toString('hex')
}

function log(msg) {
	console.log(msg)
}

/**
 * @function
 * @param {int} id -  (1,) demension index value. (1,) 차원의 인덱스 값.
 * @returns {int} (2,) demension index value. first element is 10,000 unit value and second element is remainder. (2,) 차원의 인덱스 값. 첫 엘리먼트는 10,000 단위 값이고 두 번째 엘리먼트는 10,000으로 나눈 나머지.
 */
function getIndex(id) {
	id = _.toInteger(id)
	if(id < 0) return [null, null]
	const tableIndex = _.toInteger(id / 10000)
	console.log([tableIndex, id - tableIndex * 10000])
	return [tableIndex, id - tableIndex * 10000]
}

/**
 * @function
 * @param {int} len - RandomString length. When it's value is undefined, it sets default value 32. 랜덤 문자열 길이. 그 값이 undefined일 경우 기본값 32로 설정.
 * @returns {string}
 */
function uniqueGenerate(len) {
	try {
		if(len === undefined) len = 32
		while(true)
		{
			const token = randomString.generate({length: len, charset: 'alphabetic'})
			if(tokenMap[token] === undefined) return token
		}
	} catch(e){
	}
	return undefined
}

/**
 * @function
 * @param {string} cmd - Command string alias for message select. 메시지 선택을 위한 명령 문자열.
 * @returns {object} {code:int, msg:string} object return. {code:int, msg:string} 오브젝트 리턴.
 */
function getMessage(cmd) {
	switch(cmd)
	{
		case '일반오류':
			return {code:1001, msg: '일반 오류가 발생하였습니다.'}
		case '없음':
			return {code:1002, msg: '데이터가 없습니다.'}
		case '읽기오류':
			return {code:1003, msg: '데이터베이스 읽기 오류가 발생하였습니다.'}
		case '쓰기오류':
			return {code:1004, msg: '데이터베이스 쓰기 오류가 발생하였습니다.'}
		case '이미존재하는로우':
			return {code:1005, msg: '쓰기 요청한 로우가 이미 존재하여 쓰지 못했습니다.'}
		case '파라미터부족':
			return {code:1006, msg: '요청한 연산에 필요한 파라미터가 부족합니다.'}
	

		case '로그인성공':
			return {code:2001, msg: '로그인에 성공하였습니다.'}
		case '로그인실패':
			return {code:2002, msg: '로그인에 실패하였습니다.'}
		case '권한없음':
			return {code:2003, msg: '접근 권한이 없습니다.'}
		case '권한있음':
			return {code:2004, msg: '접근 권한이 있습니다.'}
		
	}
	//기타
	return {code:9999, msg: '기타 에러가 발생하였습니다.'}
}

const secretList = ['ad6e89cc744a5fa5a23e3d9a4f07e999', '60393f2bcf92a4f87f1ddf6289b331cb', '12982ef42691544736f28d204aa0644d', 'd61752f13a4dc72c45e5c6f45fc0788d', 'dd1568dcb3ee3217ab0ca6664eff09bc', '6be01056887af61b8c8f00ae5a72f01a']
app.use(helmet.hidePoweredBy())
app.use((err, req, res, next) => {
	console.log("에러메시지", err)
	res.sendStatus(500)
	next()
})
//app.use(compression()) // Removed when using nginx because it can be controlled by reverse proxy. 역방향 프록시에서 제어가능하므로 nginx 사용시 제거.
app.use((req, res, next) => {
	//console.log("URL", req.url)
	next()
})
app.use(express.static(path.join(__dirname, 'res')))
app.use((req, res, next) => {
	let newPath = req.path.split('/')
	newPath = newPath[newPath.length - 1]
	let uriList1 = ['bag2', 'google42020a6b379e14f0', 'HNAP1', 'pools', 'Portal0000', 'main', 'lec', 'nmaplowercheck1640592326', 'phpmyadmin', 'default', 'server-status', 'xmlrpc', 'nmaplowercheck1640455815', '__Additional', 'info', 'app-ads', 'ㅡ', 'wp-content', 'start', 'nmaplowercheck1640421360', 'hCiH', 'text4041640491067', 'phpinfo', 'readme', 'hudson', 'home', 'ads', 'text4041640614198', 'xu69', 'setup', 'config', 'status']
	let uriList2 = ['HNAP1', 'phpversion', 'digg', 'echo', 'docs', 'web-console', 'asdf', 'doku', 'text4041638704623', 'stylesheet', 'wcm', 'changelog', 'Login', 'hudson', 'issmall', 'Telerik.Web.UI.WebResource', 'bbs', 'install', 'php-info', '404', 'reset', 'status', 'archiver', 'Help', 'pinfo', 'rss', 'sensorlist', 'sidekiq', 'ReportServer', 'system_api', 'cc', 'c', 'i', 'plugin', 'README', 'owa', 'php', 'deptWebsiteAction', 'config', 'infos', 'kindeditor', 'errr', 'php_info', 'fuN3', 'text4041638713898', 'extern', 'blog', 'docker-compose', 'xmlrpc', 'Search', 'app-ads', 'info', 'licence', 'CHANGELOG', 'text4041639046216', 'fckeditor', 'test',, 'phpinfo', 'list', 'Wq_StranJF', 'ads', 'feed', 'test_404_page', 'shell', 'weblog', 'kindeditor-min', 'admin', 'wp-cron', 'phpmyadmin', 'currentsetting', 'solr', 'main.dart', 'text4041638717472', 'console', 'temp', 'admin-console', 'bencandy', 'wp-content', 'Error', 'readme', 'forum', 'old_phpinfo', 'test_for_404', 'linusadmin-phpinfo', 'setup', 'time', 'Editor', 'infophp', 'webfig']
	let uriList3 = ["php", "asp", "actuator", "boaform", "api", "xss", "?q=", "webmail", "cgi", "microsoft", "Autodiscover", "ignition", "plugins", "jsonws", "wp", "jspxcms", "solr", "console", "GponForm" , "app", "public", "owa", "ecp", "exchange", "trace", "ckeditor", "FCK", "tpl", "mail", "xslt", "README", "Wq_StranJF", "cron", "log"]
	let ctype = "text/html"
	if(!!!newPath)
	{
		next()
		return
	}
	if(uriList1.join().includes(newPath))
	{
		console.log("URL 키워드 차단 1.")
		res.writeHead(404, {"Content-Type": ctype})
		res.end()
		return
	}
	else if(uriList2.join().includes(newPath))
	{
		console.log("URL 키워드 차단 2.")
		res.writeHead(404, {"Content-Type": ctype})
		res.end()
		return
	}
	else if(uriList3.join().includes(newPath))
	{
		console.log("URL 키워드 차단 3.")
		res.writeHead(404, {"Content-Type": ctype})
		res.end()
		return
	}
	res.on("finish", function() {
	})
	// 직렬화/역직렬화, 캐싱확인용 컴포넌트 들어갈 자리.
	next()
})

app.use(helmet.frameguard())
app.use(helmet.xXssProtection())
//app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }))
//app.use(helmet.crossOriginOpenerPolicy())
//app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }))
app.use(helmet.xDnsPrefetchControl())
app.use(helmet.hsts({ })) // 프로덕션에서 maxAge 제거 예정. { maxAge: 0 }
app.use(helmet.xDownloadOptions())
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.originAgentCluster())
app.use(helmet.referrerPolicy({ policy: 'no-referrer-when-downgrade' }))

app.use(cookieParser(va.COOKIE_SECRETKEY)) // Required when using passport-remember-me and corresponds to "Cannot read properties of undefined (reading 'remember_me') error. "Cannot read properties of undefined (reading 'remember_me')" 에러에 대응하며 passport-remember-me 사용시 필수.
app.use(bodyParser.urlencoded({ extended: true })) // Important when sending form! form 양식 전송시 중요!
app.use(bodyParser.json())
app.use((req, res, next) => {
	//res.locals.flash = []
	
	if(
		sec.check.object(sec.DETECT, req.headers) ||
		sec.check.object(sec.DETECT, req.body)
		)
		return res.sendStatus(401)
	else
	{
		if(_.has(req.body, 'row'))
			if(sec.check.object(sec.DETECT, req.body.row))
				return res.sendStatus(401)
		if(_.has(req.body, 'tableName'))
			if(sec.detectInjectionAll(req.body.tableName))
				return res.sendStatus(401)
		if(_.has(req.body, 'document'))
			if(sec.check.object(sec.DETECT, req.body.document))
				return res.sendStatus(401)
	}
	console.log('Security Checked.')

	res.on("finish", function() {
	})

	// Where to typing Serialization/Deserialization, components for caching verification. 직렬화/역직렬화, 캐싱확인용 컴포넌트 들어갈 자리.
	// res.append('Cache-Control', 'max-age=5') No effect. 효과 없음.
	next()
})

// 대량 페이지뷰 로직 - 초기 DDOS 공격 차단용
async function cleanIpBlockMapHourly() {

	// 로그인 실패 횟수 초기화
	locals['공통'] = { count: 0 }

  	// 아이피차단맵(ipBlockMap 변수) 에서 만료된 키-값 쌍 제거 로직
	const table = await findSome({tenancy: TENANCY, some: 'table-대량페이지뷰', defaultValue: {}})
	ipBlockMap['종료시각'] = dayjs()
	let startTime, endTime
	for(let k of Object.keys(ipBlockMap))
	{
		let value = ipBlockMap[k]
		if(k === '시작시각')
			startTime = value
		if(k === '종료시각') 
			endTime = value
	}
	for(let k of Object.keys(ipBlockMap))
	{
		let value = ipBlockMap[k]
		if(k === '시작시각' || k === '종료시각')
			continue
		if(typeof value === 'object')
		{
			if(value.hasOwnProperty('조회수'))
				if(value['조회수'] > 1000)
				{
					let row = {
						['시작시각']: !!startTime ? startTime.format('YYYY-MM-DD HH:mm:ss') : '',
						['종료시각']: !!endTime ? endTime.format('YYYY-MM-DD HH:mm:ss') : '',
						['IP']: 'PM2 로그에서 IP 확인',
						['조회수']: value['조회수'],
						['차단여부']: '차단 약 1시간 후 허용'
					}
					await addOneRowSimple({tenancy: TENANCY, tableName: '대량페이지뷰', table: table, row: row})
				}
		}
		delete ipBlockMap[k]
	}
}
schedule.scheduleJob('0 * * * *', cleanIpBlockMapHourly)
const DDOS_COUNT_LIMIT = 1222
const ipBlockMap = {
	['시작시각']: ''
}
app.use((req, res, next) => {
	let ipObject = ipBlockMap[req.ip]
	if(typeof ipObject === 'object')
		ipBlockMap[req.ip]['조회수']++
	else
		ipBlockMap[req.ip] = { ['조회수']: 1, ['매분의0초에서10초사이조회수']: 0 }
	ipObject = ipBlockMap[req.ip]

	const now = dayjs()
	if(0 < now.second() && now.second() <= 10)
		ipBlockMap[req.ip]['매분의0초에서10초사이조회수'] = ipObject['조회수']

	// 디도스 공격 차단 지점. 즉시 401 응답코드 리턴.
	if(ipObject['조회수'] - ipObject['매분의0초에서10초사이조회수'] > DDOS_COUNT_LIMIT)
	{
		ipBlockMap['시작시각'] = now
		console.log("DDOS", ipObject['조회수'], ipObject['매분의0초에서10초사이조회수'])
		res.sendStatus(401)
		return
	}

	return next()
})
// 대량 페이지뷰 로직 - 초기 DDOS 공격 차단용 끝.

// Routing the Many Stallings Company's official website. 회사 공식 홈페이지 라우팅.

// 페이지뷰 카운팅 매니저
const BULK_SIZE = 700
let pageViewBulky = {}, pageViewMap = {}
let pageViewManager = {}
pageViewManager = {
	count: function (key) {
		if(_.has(pageViewMap, key))
		{
			let value = pageViewMap[key]
			if(!Number(value))
				value = 0
			else
				value = Number(value) + 1
			pageViewMap[key] = value
		}
		else
			pageViewMap[key] = 1
	},
	countPageView: function (req, res, next) {
		if(!!urlToName[req.url])
		{
			const key = `${urlToName[req.url]} ${req.url} ${dayjs().format('YYYY.MM.DD')}`
			pageViewManager.count(key)
		}
		next()
	},
	countItemPageView: async function (req, itemNo) {
		const table = await dbManager.query.findSome({tenancy: TENANCY, some: '어드민테스트-1', defaultValue: []})
		const dbResult = dbManager.query.t(table, {id: itemNo})
		if(!!dbResult)
			itemNo = dbResult['제목'].split(' ').join('')

		const key = `포트폴리오(${itemNo}) ${req.url} ${dayjs().format('YYYY.MM.DD')}`
		pageViewManager.count(key)
	},
	setBulkyFrom: async function() {
		if(typeof pageViewMap === 'object')
		{
			let arr = []
			Object.keys(pageViewMap).forEach(key => {
				let count = pageViewMap[key]
				arr.push(`${key}|${count}`)
			})
			let bulkyList = _.chunk(arr, BULK_SIZE)
			if(!pageViewBulky) pageViewBulky = {}

			// 매일 벌크 맵을 업데이트하고 초기화 하므로 벌크 맵의 엘리먼트 수는 벌크 1개 크기 (BULK_SIZE)를 넘지 않는다는 가정
			// 맵 데이터를 벌크 배열로 환산한 결과 벌크 개수가 1개 초과이면 맵 타입을 '맵과 배열' 타입으로 전환하여 데이터베이스에 덮어쓰기 함
			if(bulkyList.length > 1)
			{
				pageViewBulky = {}
				bulkyList.forEach((bulk, index) => {				
					pageViewBulky['벌크' + index] = bulk
				})
				//await dbManager.query.saveSome({tenancy: '매니스탈링스', some: '페이지뷰', value: pageViewBulky})
				pageViewMap = {}
				return { saved: false, error: false }
			}
			else if(bulkyList.length == 1)
			{
				// 맵 데이터를 벌크 배열로 환산한 결과 벌크 개수가 1개이면 마지막 벌크에 엘리먼트 추가
				Object.keys(pageViewMap).forEach(key => {
					let count = pageViewMap[key]
					keySplit = key.split(' ')
					let flag = false
					
					// 기존 벌크 전체 범위 안에 key가 존재하면 count를 가산
					for(let bulkname of Object.keys(pageViewBulky).reverse())
					{
						pageViewBulky[bulkname].forEach((pageview, index)=> {
							pageviewSplit = pageview.split('|')
							if(flag == true || flag == '중지') return
							if(pageviewSplit[0] != pageviewSplit[0]) 
							{
								flag = '중지'
								return
							}
							if(pageview.startsWith(key))
							{
								flag = true
								pageviewSplit[2] = (Number(pageviewSplit[2]) + count) + ''
								pageViewBulky[bulkname][index] = pageviewSplit.join('|')
							}
						})
						if(flag == true || flag == '중지') break
					}
					if(flag == true) return
					
					// 기존 벌크 안에 key가 없으면 신규 추가

					// 벌크가 전부 비어있으면 '벌크0' 생성
					if(Object.keys(pageViewBulky).length == 0)
					{
						pageViewBulky = {
							['벌크0']: []
						}
					}

					// 마지막 벌크의 엘리먼트 용량이 한계를 넘으면 새 벌크 생성
					let bulkname = Object.keys(pageViewBulky).reverse()[0]
					if(pageViewBulky[bulkname].length > BULK_SIZE)
					{
						let no = Number(bulkname.replace('벌크', '')) + 1
						bulkname = '벌크' + no
						pageViewBulky[bulkname] = []
					}

					// 벌크에 엘리먼트 추가
					pageViewBulky[bulkname].push(`${key}|${count}`)
				})
				pageViewMap = {}
				return { saved: false, error: false }
			}
		}
		return { saved: false, error: true }
	}
}
async function savePageViewMapDaily() {
	let result = await pageViewManager.setBulkyFrom()
	if(!result.saved && !result.error)
		await savePageViewAndSEOData({pageViewBulky :pageViewBulky, seo: null})
}
schedule.scheduleJob('0 0 * * *', savePageViewMapDaily)

schedule.scheduleJob('0 0 * * *', function () {
	email.reception = 0
	ENV_GLOBAL['유저']['일방문자수'] = 0
})

function pageViewAspect(req, res, next) {
	const key = `${dayjs().format('YYYY.MM.DD')}|${req.url}` // '날짜|주소': 1
	console.log('KEY ', key)
	if(!pageViewMap.hasOwnProperty(key))
		pageViewMap[key] = 1
	else
		pageViewMap[key]++
	next()
}

// HTTP 라우팅
app.get(['/'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	res.render('corp', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
app.get(['/introduction'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	res.render('introduction', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
app.get(['/business'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	res.render('business', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
app.get(['/solution'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	res.render('solution', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
app.get(['/recruit'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	console.log(md.mobile())
	res.render('recruit', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
app.get(['/construction-cases'], pageViewAspect, async (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	console.log(md.mobile())
	
	try {
		// 페이지 파라미터 가져오기 (기본값: 1)
		const currentPage = parseInt(req.query.page) || 1
		const itemsPerPage = 10 // 페이지당 항목 수
		
		// 구축사례 데이터 가져오기
		let allNotices = []
		
		// 하드코딩된 기본 구축사례 데이터 (백업용)
		const defaultCases = [
			{
				고객사: '통계청',
				사업명: '가구주택기초조사 지도 구축',
				사업기간: '2025.01 ~ 2025.04',
				작성일: '2025-01-01'
			},
			{
				고객사: '창원특례시',
				사업명: '도시계획 지도 구축',
				사업기간: '2025.01 ~ 2025.04',
				작성일: '2025-01-02'
			},
			{
				고객사: '국립환경과학원',
				사업명: '환경지도 구축',
				사업기간: '2025.01 ~ 2025.04',
				작성일: '2025-01-03'
			},
			{
				고객사: 'KEITI',
				사업명: '환경기술 평가 시스템',
				사업기간: '2025.01 ~ 2025.04',
				작성일: '2025-01-04'
			},
			{
				고객사: 'EPIS',
				사업명: '환경정보 통합시스템',
				사업기간: '2025.01 ~ 2025.04',
				작성일: '2025-01-05'
			}
		]
		
		try {
			// API와 동일한 방식으로 데이터베이스에서 구축사례 데이터 조회
			console.log('구축사례 데이터 조회 시작 (API 방식)...')
			
			// findSomeWrapper를 API와 동일하게 사용
			const allData = await findSomeWrapper({
				tenancy: TENANCY,
				some: `table-TB_NOTICE1`,
				rowId: '목록전체'
			})
			
			console.log('findSomeWrapper 조회 결과:', allData)
			console.log('데이터 타입:', typeof allData, '배열 여부:', Array.isArray(allData))
			
			if (allData && Array.isArray(allData) && allData.length > 0) {
				// 구축사례만 필터링
				const constructionCases = allData.filter(item => 
					item && item['카테고리'] === '구축사례'
				)
				
				console.log('필터링된 구축사례:', constructionCases)
				
				if (constructionCases.length > 0) {
					allNotices = constructionCases.map(notice => {
						return {
							고객사: notice['고객사'] || notice['제목'] || '-',
							사업명: notice['사업명'] || notice['국문제목'] || notice['내용'] || notice['국문내용'] || '-',
							사업기간: notice['사업기간'] || notice['작성일'] || '-',
							작성일: notice['작성일'] || notice['일자']
						}
					}).sort((a, b) => {
						// 작성일 기준 내림차순 정렬 (최신순)
						if (a.작성일 && b.작성일) {
							return new Date(b.작성일) - new Date(a.작성일)
						}
						return 0
					})
				}
			}
			
			// 데이터베이스에서 조회된 데이터가 없으면 기본 데이터 사용
			if (allNotices.length === 0) {
				console.log('DB에서 조회된 구축사례가 없어 기본 데이터 사용')
				allNotices = defaultCases
			}
			
		} catch (error) {
			console.log('데이터베이스 조회 실패, 기본 데이터 사용:', error.message)
			allNotices = defaultCases
		}
		
		// 페이징 계산
		const totalItems = allNotices.length
		const totalPages = Math.ceil(totalItems / itemsPerPage)
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		const notices = allNotices.slice(startIndex, endIndex)
		
		// 페이징 네비게이션 정보
		const pagination = {
			currentPage: currentPage,
			totalPages: totalPages,
			totalItems: totalItems,
			itemsPerPage: itemsPerPage,
			hasNext: currentPage < totalPages,
			hasPrev: currentPage > 1,
			nextPage: currentPage + 1,
			prevPage: currentPage - 1,
			pages: []
		}
		
		// 페이지 번호 배열 생성 (최대 5개 페이지 번호 표시)
		const startPage = Math.max(1, currentPage - 2)
		const endPage = Math.min(totalPages, startPage + 4)
		
		for (let i = startPage; i <= endPage; i++) {
			pagination.pages.push({
				number: i,
				isCurrent: i === currentPage
			})
		}
		
		console.log('페이징 정보:', pagination)
		console.log('현재 페이지 구축사례 데이터:', notices)
		
		res.render('construction-cases', {
			mobile: !!md.mobile(), 
			axiosAddr: baseURL, 
			title: seo[req.url] ? seo[req.url].title : '구축사례 | 아이리포트', 
			description: seo[req.url] ? seo[req.url].description : 'AI 비전 솔루션 구축사례를 소개합니다.', 
			notices: notices,
			pagination: pagination
		})
	} catch (error) {
		console.error('구축사례 페이지 렌더링 오류:', error)
		// 에러 발생시 기본 데이터로 처리
		res.render('construction-cases', {
			mobile: !!md.mobile(), 
			axiosAddr: baseURL, 
			title: seo[req.url] ? seo[req.url].title : '구축사례 | 아이리포트', 
			description: seo[req.url] ? seo[req.url].description : 'AI 비전 솔루션 구축사례를 소개합니다.', 
			notices: [
				{
					고객사: '통계청',
					사업명: '가구주택기초조사 지도 구축',
					사업기간: '2025.01 ~ 2025.04',
					작성일: '2025-01-01'
				},
				{
					고객사: '창원특례시',
					사업명: '도시계획 지도 구축',
					사업기간: '2025.01 ~ 2025.04',
					작성일: '2025-01-02'
				}
			],
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 2,
				itemsPerPage: 10,
				hasNext: false,
				hasPrev: false,
				pages: [{number: 1, isCurrent: true}]
			}
		})
	}
})
app.get(['/archievements'], pageViewAspect, (req, res, next) => {
	let md = new MobileDetect(req.headers['user-agent'])
	res.setHeader('Page-Type', 'text/html')
	console.log(md.mobile())
	res.render('notice1', {mobile: !!md.mobile(), axiosAddr: baseURL, title: seo[req.url] ? seo[req.url].title : '', description: seo[req.url] ? seo[req.url].description : '' })
})
// Home page routing ends 홈페이지 라우팅 끝
// Routing the Admin. 어드민 라우팅.
const urlMap = {
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/%EB%A9%94%EC%9D%B8': 'admin/main',
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/SEO%EC%84%A4%EC%A0%95': 'admin/seo',
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/%EB%B3%B4%EC%95%88%EC%84%A4%EC%A0%95': 'admin/security',
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/%EC%82%AC%EC%9D%B4%ED%8A%B8%EB%A7%B5': 'admin/sitemap',
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B2%8C%EC%8B%9C%ED%8C%90': 'admin/notice-main',
	'/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B2%8C%EC%8B%9C%ED%8C%90%EC%A1%B0%ED%9A%8C%EC%9A%94%EC%B2%AD': 'admin/notice'
}
app.get(['/%EC%96%B4%EB%93%9C%EB%AF%BC', '/어드민'], pageViewAspect, (req, res, next) => {
	res.render('admin/login')
})
// /admin/notice 게시판 조회
app.get(['/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B2%8C%EC%8B%9C%ED%8C%90%EC%A1%B0%ED%9A%8C'], hasJWT, pageViewAspect, (req, res, next) => {
	const localsValue = locals[getHash(req.signedCookies.myCookie)]
	if(!!localsValue)
		res.render('admin/notice', {tableName: localsValue.tableName, noticeName: localsValue.noticeName})
	else
		res.sendStatus(401)
})
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%ED%8A%B8%EB%9E%98%ED%94%BD', hasJWT, pageViewAspect, async (req, res, next) => {
	await pageViewManager.setBulkyFrom()
	res.render('admin/traffic', {pageViewBulky: JSON.stringify(pageViewBulky)})
})
app.get(Object.keys(urlMap), hasJWT, pageViewAspect, (req, res, next) => {
	const pugFile = urlMap[req.url.split('?')[0]]
	if(!!pugFile)
	{
		if(pugFile == 'admin/main')
		{
			let count = '---'
			res.render(pugFile, { count: count, email: email.reception })
			return
		}
		else if(pugFile == 'admin/notice')
		{
			let tableNameMap = {
				'n1': 'TB_NOTICE1'
			}
			let hash = getHash(req.signedCookies.myCookie)
			locals[hash] = {tableName: tableNameMap[req.query.n] }
			res.redirect('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B2%8C%EC%8B%9C%ED%8C%90%EC%A1%B0%ED%9A%8C')
		}
		else
			res.render(pugFile)
	}
	else 
	{
		res.sendStatus(404)
	}
	res.locals.canRendered = 1
})
// /admin/notice-add
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B2%8C%EC%8B%9C%ED%8C%90%EC%93%B0%EA%B8%B0', hasJWT, (req, res, next) => {
	if(!req.query.category)
		res.sendStatus(404)
	else
		res.render('admin/notice-add', {category: req.query.category})
})

// /admin/construction-cases-add 구축사례 전용 글쓰기
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EA%B5%AC%EC%B6%95%EC%82%AC%EB%A1%80%EC%93%B0%EA%B8%B0', hasJWT, (req, res, next) => {
	res.render('admin/notice-add', {category: '구축사례'})
})

// /admin/image-notice-add /어드민/이미지게시판쓰기
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EC%9D%B4%EB%AF%B8%EC%A7%80%EA%B2%8C%EC%8B%9C%ED%8C%90%EC%93%B0%EA%B8%B0', hasJWT, (req, res, next) => {
	res.render('admin/image-notice-add', {category: req.query.category})
	return
	if(!req.query.category)
		res.sendStatus(404)
	else
		res.render('admin/notice-add', {category: req.query.category})
})
// /admin/ddos-monitor /어드민/디도스모니터링
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EB%94%94%EB%8F%84%EC%8A%A4%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81', hasJWT, (req, res, next) => {
	res.render('admin/ddos-monitor', {})
	return
})

app.get('/admin/notice/:noticeName/:NO', hasJWT, async (req, res, next) => {
	const noticeNameMap = {
		'n1': 'TB_NOTICE1'
	}
	const tableName = noticeNameMap[req.params.noticeName]
	if(!tableName)
	{
		res.sendStatus(404)
		return
	}
	const noticeNo = Number(req.params.NO)
	res.render('admin/notice-get', {tableName: tableName, noticeNo: noticeNo})
})


// Routing the Admin ends. 어드민 라우팅 끝.

// For monitoring ram usage 램 사용량 모니터링용 
app.post('/stat53', (req, res, next) => {
	res.locals.canRendered = 1
	if(true)
	{
		res.sendStatus(400)
		return next()
	}
	const resultList = []
	const used = process.memoryUsage()
	const time = dayjs().format('HH:mm:ss')
	resultList.push(`
		<tr>
			<td>${time}</td>
			<td>heapTotal</td>
			<td>${Math.round(used['heapTotal'] / 1024 / 1024 * 100) / 100} MB</td>
		</tr>
		<tr>
			<td>${time}</td>
			<td>session</td>
			<td>${ENV_GLOBAL['유저']['누적']}</td>
		</tr>
	`)
	res.status(200)
	res.send({ram:resultList.join('')})
	next()
})
/**
 * Edit Table
 * req.body = {tableName, datetime, row}
 * 국문, 영문 데이터를 브라우저로 전송하는 엔드포인트
 * @event
 * @param {METHOD} method - PUT
 * @param {URL} url - /api/v2
 */
app.patch('/api/v2/strings', async (req, res, next) => {
	if(!req.body.hasOwnProperty('tanancy')) return next()
	if(!req.body.hasOwnProperty('pageName')) return next()
	
	// 허용된 테이블명 체크
	if(req.body.tanancy != "비전솔루션매니스탈링스")
	{
		res.send({code: 1})
		return
	}
	if(!"메인,".includes(req.body.pageName + ','))
	{
		res.send({code: 1})
		return
	}

	try {
		const result = fs.readFileSync(`strings/${req.body.pageName}.json`).toString('utf8')
		res.send({code: 0, ...JSON.parse(result)})
	} catch(e) {
		res.send(getMessage('읽기오류'))
	}
})
/**
 * Add one Row to Table
 * 
 * 테이블 로우 1개 추가
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.post('/api/v2/simple', hasJWT, async (req, res, next) => {
	if(!req.body.hasOwnProperty('tableName')) return next()
	if(!req.body.hasOwnProperty('row')) return next()

	// 허용된 테이블명 체크
	if(req.body.tableName != "TB_ADMIN_USER")
		if(req.body.tableName != "TB_SEO")
		{
			res.send({code: 1})
			return
		}


	try {
		await saveSome({tenancy: TENANCY, some: `table-${req.body.tableName}`, value: req.body.row})
		if(req.body.tableName == "TB_SEO")
			seo = req.body.row
		res.send({code: 0})
	} catch(e) {
		res.send(getMessage('쓰기오류'))
	}
})
/**
 * Read one Row to Table
 * 
 * 테이블 로우 1개 읽기
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.patch('/api/v2/simple', async (req, res, next) => {
	if(!req.body.hasOwnProperty('tableName')) return next()
	if(!req.body.hasOwnProperty('row')) return next()
	
	// 허용된 테이블명 체크
	if(req.body.tableName != "TB_ADMIN_USER")
		if(req.body.tableName != "TB_SEO")
			if(req.body.tableName != "대량페이지뷰")
			{
				res.send({code: 1})
				return
			}

	let value = {}

	try {
		value = await findSome({tenancy: TENANCY, some: `table-${req.body.tableName}`})
		res.send({code: 0, row: value})
	} catch(e) {
		res.send(getMessage('읽기오류'))
	}
})
/**
 * Read Table
 * req.body = {tableName, row, option: {rowId, range}}
 * 테이블 읽기
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.patch('/api/v2/table', async (req, res, next) => {
	if(!req.body.hasOwnProperty('tableName')) return next()
	if(!req.body.hasOwnProperty('row')) return next()
	if(!req.body.hasOwnProperty('option')) req.body.option = {}
	
	// 허용된 테이블명 체크
	if(
		req.body.tableName != "TB_NOTICE1"
	)
	{
		res.send({code: 1})
		return
	}
	
	try {
		let value
		if(req.body.option.rowId == '목록전체')
			value = await findSomeWrapper({tenancy: TENANCY, some: `table-${req.body.tableName}`, rowId: '목록전체'})			
		else if(req.body.option.rowId == '전체')
			value = await findSomeWrapper({tenancy: TENANCY, some: `table-${req.body.tableName}`, rowId: '전체'})			
		else if(Array.isArray(req.body.option.range))
			value = await findSomeByRange({tenancy: TENANCY, some: `table-${req.body.tableName}`, range: req.body.option.range})
		if(!isNaN(Number(req.body.option.rowId)))
		{
			value = value.map(row => {
				return row.id == Number(req.body.option.rowId)
			})
		}
		else if(Array.isArray(req.body.option.rowId))
		{
			value = value.map(row => {
				return _.includes(req.body.option.rowId, row.id)
			})
		}
		res.send({code: 0, data: value})
	} catch(e) {
		console.log(e)
		res.send(getMessage('읽기오류'))
	}
})

/**
 * Append Table
 * req.body = {tableName, row}
 * 테이블 쓰기
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.post('/api/v2/table', hasJWT, async (req, res, next) => {
	if(!req.body.hasOwnProperty('tableName')) return next()
	if(!req.body.hasOwnProperty('row')) return next()
	
	// 허용된 테이블명 체크
	if(req.body.tableName != "TB_NOTICE1")
	{
		res.send({code: 1})
		return
	}

	try {
		await pushSome({tenancy: TENANCY, some: `table-${req.body.tableName}`, value: req.body.row, onAfter: (err) => {

		}})
		res.send({code: 0})
	} catch(e) {
		console.log(e)
		res.send(getMessage('쓰기오류'))
	}
})

let AI = 0 // DB 재시작시 값이 저장되어야 함.
function issueJWT (username) {
	AI++
	if(Number.MAX_SAFE_INTEGER <= AI)
		AI = 1

	// 제거 여부 판단
	if(!username)
	{
		username = "api.v2.jwt.AI." + AI
	}

	const jwtPayload = {
		id: AI,
		username: username
	}
	console.log(jwtPayload)
	return jsonwebtoken.sign(jwtPayload, va['JWT']['비밀키'], { expiresIn: '2h' })
}
function hasJWT(req, res, next) {
	if(!req.signedCookies)
	{
		res.sendStatus(401)
		return
	}
	jsonwebtoken.verify(req.signedCookies.myCookie, va['JWT']['비밀키'], async (err, user) => {
		if (err) {
			res.sendStatus(401)
			return
		}
		if(user.username.startsWith('api.v2.jwt.AI.'))
		{
			res.sendStatus(401)
			return
		}
		next()
	})
}
function hasLoginJWT(req, res, next) {
	if(!req.signedCookies)
	{
		return next()
	}
	jsonwebtoken.verify(req.signedCookies.myCookie, va['JWT']['비밀키'], async (err, user) => {
		next()
	})
}

/**
 * Admin Login
 * 
 * 어드민 로그인
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.patch('/api/v2/login', hasLoginJWT, async (req, res, next) => {
	if(!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('pw'))
	{
		res.sendStatus(401)
		return
	}
	if(typeof locals['공통'] != 'object')
		locals['공통'] = { count: 1 }
	else if(isNaN(Number(locals['공통'].count)))
		locals['공통'].count = 1
	else
		locals['공통'].count++

	if(locals['공통'].count > 20)
	{
		res.sendStatus(401)
		return
	}

	try {
		let value = await findSome({tenancy: TENANCY, some: `table-TB_ADMIN_USER`})
		if(!value) {
			value = {'아이디': '아이디', '비밀번호': '이것은 비밀번호입니다.'}
		}
		if(value["아이디"] == req.body.id)
			if(value["비밀번호"] == req.body.pw)
			{
				const token = issueJWT(req.body.id)
				if(!!token)
				{
					res.cookie('myCookie', token, { httpOnly: va.COOKIE_HTTPONLY, secure: va.COOKIE_SECURE, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 1, signed: true })
					res.send({ code: 0 })
					return
				}
			}
		res.send({ code: 1, remain: locals['공통'].count })
	} catch(e) {
		console.log(e)
		res.send(getMessage('읽기오류'))
	}
})

/**
 * Admin Logout
 * 
 * 어드민 로그아웃
 * @event
 * @param {METHOD} method - POST
 * @param {URL} url - /api/v2
 */
app.get('/%EC%96%B4%EB%93%9C%EB%AF%BC/%EB%A1%9C%EA%B7%B8%EC%95%84%EC%9B%83', async (req, res, next) => {
	const token = "ddd"
	res.cookie('myCookie', token, { httpOnly: va.COOKIE_HTTPONLY, secure: va.COOKIE_SECURE, sameSite: 'strict', maxAge: 1000 * 2, signed: true })
	res.redirect('/%EC%96%B4%EB%93%9C%EB%AF%BC')
})

// END 끝

app.listen(port, async () => {
	console.log("HTTP 네트워크 소켓 리스닝 중...")
	console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`)
})
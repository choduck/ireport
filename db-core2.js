const { Level } = require('level')
const _ = require('lodash')
const db = new Level('many', { valueEncoding: 'json' })
const schedule = require('node-schedule')
const dayjs = require('dayjs')
require('dayjs/locale/ko')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const arraySupport = require("dayjs/plugin/arraySupport")
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { timespan } = require('./common')
dayjs.locale('ko')

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(arraySupport)
dayjs.extend(customParseFormat)

let NEXT_DAY_000
let DBClosed = false
/*
const scheduleJobMap = {
  '스케줄링/다음날시작일시': schedule.scheduleJob('0 0 0 * * *', function() { // 초 분 시 일 월 요일
    setNextDay()
  })
}*/
function toDatetimeString(datetime) {
	return datetime.format("HH:mm:ss:sss")
}
function setNextDay() {
	if(!NEXT_DAY_000)
		NEXT_DAY_000 = dayjs()
	NEXT_DAY_000 = NEXT_DAY_000.add(1, 'm').second(0).millisecond(0)
	console.log("NEXT_DAY_000 schedule", toDatetimeString(NEXT_DAY_000))
	//NEXT_DAY_000 = NEXT_DAY_000.add(1, 'd').hour(0).minute(0).second(0).millisecond(0)
}

/*
TB_AAA를 'TB_AAA/2025-01-01T10:00:00' 으로 바꿔주는 함수
TB_AAA/2025-01-01T11:23:56를 'TB_AAA/2025-01-01T10:00:00' 으로 바꿔주는 함수
*/
function adjustSomeName(some) {
	let time, tableName
	if(some.endsWith('메타'))	return some
	if(some.split('/').length == 1)
	{
		time = dayjs().set('minute', 0).set('second', 0).set('millisecond', 0)
		time = time.format('YYYY-MM-DDTHH:mm:ss')
		return some + '/' + time
	}
	[tableName, time] = some.split('/')
	time = dayjs(time).set('minute', 0).set('second', 0).set('millisecond', 0)
	time = time.format('YYYY-MM-DDTHH:mm:ss')
	return tableName + '/' + time
}

async function findSome({tenancy, some}) {
	console.log(`Find Some | Tenancy(${tenancy}), Some(${some})`)
	if(await hasKey(JSON.stringify({tenancy, some})))
		return await db.get(JSON.stringify({tenancy, some}))
	return null
}

function onBeginTransaction() {
	timespan.set()
}
function onEndTransaction(name) {
	timespan.set()
	console.log("End " + name + ". Spent Time(s) " +	timespan.getSecondBetween())
}

/**
 * replaceSome({tenancy: ?, some: TB_XXX, datetime: ?, row: ? })
 */
async function replaceSome({tenancy, some, datetime, row})
{
	try {
		some = adjustSomeName(some + '/' + dayjs(datetime).toISOString())
		const table = await findSome({tenancy: tenancy, some: some})
		if(!Array.isArray(table)) return {code: 1} // 테이블은 생성되었지만 테이블 값이 [] 일 때. 보통 인위적으로 빈 테이블을 코드로 생성할 때 TypeError: Cannot read property '0' of undefined 에러가 발생함. 이에 따른 필터링.
		table.forEach((row0, index) => {
			cnt = 0
			if(row0['id'] == row['id'] &&
					row0['NO'] == row['NO'])
			{
				_.forOwn(row, function(value, key) {
					table[index][key] = value
				})
				return
			}
		})
		await saveSome({tenancy: tenancy, some: some, value: table})
	} catch(e) {
		console.log(e)
		return {code: 'error'}
	}
	return {code: 0}
}
/**
 * removeSome({tenancy: ?, some: TB_XXX, datetime: ?, NO: ? })
 */
async function removeSome({tenancy, some, datetime, NO})
{
	try {
		some = adjustSomeName(some + '/' + dayjs(datetime).toISOString())
		let table = await findSome({tenancy: tenancy, some: some})
		if(!Array.isArray(table)) return {code: 2} // 테이블은 생성되었지만 테이블 값이 [] 일 때. 보통 인위적으로 빈 테이블을 코드로 생성할 때 TypeError: Cannot read property '0' of undefined 에러가 발생함. 이에 따른 필터링.
		let targetIndex = 'nan'
		for(let [index, row0] of table.entries())
		{
			if(row0['NO'] == NO)
			{
				targetIndex = index
				break
			}
		}
		if(isNaN(targetIndex))
			return {code: 3}
		table.splice(targetIndex, 1)
		await saveSome({tenancy: tenancy, some: some, value: table})
	} catch(e) {
		console.log(e)
		return {code: 'error'}
	}
	return {code: 0}
}
/**
 * querySome({tenancy: ?, some: TB_XXX, query: {row: ?, range: ['2020-01-01T00:00:00.123Z', '~'],...}, condition: '또는 포함'})
 */
async function querySome({tenancy, some, query, condition})
{
	async function gathering(now)
	{
		let subset = []
		if(dayjs.isDayjs(now))
		{
			now = now.format('YYYY-MM-DDTHH:mm:ss')
			some = some + '/' + now
		}
		else
		{
			some = now
		}

		let table = await findSome({tenancy: tenancy, some: some})
		if(!Array.isArray(table)) return null // 테이블은 생성되었지만 테이블 값이 [] 일 때. 보통 인위적으로 빈 테이블을 코드로 생성할 때 TypeError: Cannot read property '0' of undefined 에러가 발생함. 이에 따른 필터링.
		table.forEach(row => {
			let len = 0, cnt = 0
			_.forOwn(query.row, function(value, key) {
				len++
				if(_.isNil(row[key])) return
				if(condition == '그리고 포함' || condition == '또는 포함')
				{
					if(row[key].toString().includes(value))
						cnt++
				}
				else if(condition == '같음')
				{
					if(row[key] == value)
					{
						cnt++
					}
				}
			})
			delete row['null']
			if(condition == '같음' && cnt === len)
			{
				subset.push(row)
			}
			else if(condition == '그리고 포함' && cnt === len)
				subset.push(row)
			else if(condition == '또는 포함' && cnt > 0)
				subset.push(row)
			else if(condition == '또는 포함' && len === 0)
				subset.push(row)
		})
		return subset
	}
	onBeginTransaction()

	let cnt, result = [], rangeType = '범위'
	let len = Object.keys(query).length

	// Object Cleaning. 오브젝트 클리닝.
	_.forOwn(query, (value, key) => {
		if(value === '' || _.isNil(value)) delete query[key]
	})

	if(_.isNil(condition)) condition = '또는 포함'

	if(!Array.isArray(query.range))
	{
		rangeType = '개별'
		if(!some.startsWith('table-'))
			some = 'table-' + some
		let meta = await findSome({tenancy: tenancy, some: some + '/메타'})
		if(!meta) meta = { someMap: {} }
		query.range = Object.keys(meta.someMap)
	}
	switch(condition)
	{
		case '그리고 포함':
		case '또는 포함':
		case '같음':
		{
			if(rangeType == '범위')
			{
				let start = dayjs(query.range[0])
				let end = dayjs(query.range[1])
				delete query.range
			
				if(start.isAfter(end)) return []
				let i = 0
				for(let now = start.add(i, 'h'); now.isSameOrBefore(end); now = start.add(i, 'h'))
				{
					let subset = await gathering(now)
					if(Array.isArray(subset))
						result.push(...subset)
				}
			}
			else if(rangeType == '개별')
			{
				for(let now of query.range)
				{
					console.log(now)
					let subset = await gathering(now)
					if(Array.isArray(subset))
						result.push(...subset)
				}
			}
			break
		}
	}
	onEndTransaction("querySome")
	return result
}

async function saveSome({tenancy, some, value}) {
	if(Array.isArray(value) && value.length > 0)
	{
		if(typeof value[value.length - 1] == 'object')
			if(!value[value.length - 1]['일시'])
			{
				let dayjsObject = dayjs()
				value[value.length - 1]['일시'] = dayjsObject.format("YYYY-MM-DD HH:mm:ss")
				value[value.length - 1]['일자'] = dayjsObject.format("YYYY-MM-DD")
				value[value.length - 1]['시간'] = dayjsObject.format("HH:mm:ss")
			}
	}
	const result = await db.put(JSON.stringify({tenancy, some}), value)
	return result
}

function getURL(category, NO) 
{
	const categoryMap = {
		'table-TB_NOTICE1': '/notice/n1/'
	}
	return categoryMap[category] + String(NO).padStart(3, '0')
}
/**
 * pushSome({tenancy: ?, some: TB_XXX/2020-01-01T00:00:00.123Z, value: ?, onAfter: ?})
 */
async function pushSome({tenancy, some, value, onAfter}) {
	some = adjustSomeName(some)
	const tableName = some.split('/')[0]
	onBeginTransaction()
	//console.log(`pushSome | ${JSON.stringify({tenancy, some})}`)
	let result = await findSome({tenancy: tenancy, some: some})
	console.log(tableName + '/메타')
	let meta = await findSome({tenancy: tenancy, some: tableName + '/메타'})

	if(Array.isArray(value))
	{
		onAfter({name: '배열 값은 추가할 수 없습니다.', code: 0})
		return
	}
	if(!Array.isArray(result))
		result = []

	if(!meta) meta = {someMap: {}, NO: 0}
	if(!meta.NO) meta.NO = 0
	meta.someMap[some] = true

	if(Array.isArray(result) && result.length > 0)
	{
		value.id = _.last(result).id + 1
		value.NO = meta.NO + 1
	}
	else
	{
		value.id = 1
		value.NO = meta.NO + 1
	}
	const datetime = dayjs()
	value['일자'] = datetime.format("YYYY-MM-DD")
	value['시간'] = datetime.format("HH:mm:ss")
	value['일시'] = value['일자'] + ' ' + value['시간']
	if(tableName.includes('NOTICE'))
		value['URL'] = getURL(tableName, value.NO)
	result.push(value)
	
	meta.NO++
	await saveSome({tenancy: tenancy, some: tableName + '/메타', value: meta})
	console.log(tableName + '/메타')

	saveSome({tenancy: tenancy, some: some, value: result})
		.then((res) => {
			onEndTransaction('pushSome')
			if(typeof onAfter === 'function')
				onAfter(null)
		})
		.catch(err => {
			onEndTransaction('pushSome')
			if(typeof onAfter === 'function')
				onAfter(err)
		})
}

const MAX_BUCKET_INDEX = Number.MAX_VALUE

async function hasKey(keyInput) {
	let flag = false
	for await (const key of db.keys())
		if(key == keyInput)
		{
			flag = true
			break
		}
	return flag
}

async function createList({tenancy, tableNameList}) {
	if(!await hasKey(JSON.stringify({tenancy, some: 'LIST'})))
	{
		let list  = []
		for(let tableName of tableNameList)
		{
			let maxBid = await getMaxBucketId(tableName)
			if(maxBid >= 0) list.push({some: tableName, maxBid: maxBid})
		}
		return await db.put(JSON.stringify({tenancy, some: 'LIST'}), list)
	}
	else
		return await db.get(JSON.stringify({tenancy, some: 'LIST'}))
}

/**
 * findSomeByRange({tenancy: ?, some: TB_XXX, range: ['2020-01-01T00:00:00.123Z', '2020-01-02T00:00:00.123Z']})
 */
async function findSomeByRange({tenancy, some, range})
{
	some = adjustSomeName(some)
	onBeginTransaction()

	if(!(Array.isArray(range) && range.length == 2)) return []
	let start = dayjs(range[0])
	let end = dayjs(range[1])

	if(start.isAfter(end)) return []
	let i = 0, result = []
	for(let now = start.add(i, 'h'); now.isSameOrBefore(end); now = start.add(i, 'h'))
		result.push(...await this.findSome({tenancy: tenancy, some: some}))

	onEndTransaction('findSomeByRange')
	return result
}

/**
 * findSomeWrapper({tenancy: ?, some: 'TB_XXX/2020-01-01T00:00:00.000Z', rowId: 0})
 * findSomeWrapper({tenancy: ?, some: 'TB_XXX/2020-01-01T00:00:00.000Z', rowId: [0, 1, 2]})
 * findSomeWrapper({tenancy: ?, some: 'TB_XXX/2020-01-01T00:00:00.000Z', rowId: '마지막 2개'})
 */
async function findSomeWrapper({tenancy, some, rowId}) {
	some = adjustSomeName(some)
	let rows = await findSome({tenancy: tenancy, some: some})
	if(typeof rowId === 'string' && (rowId == '목록전체' || rowId == '전체'))
	{
		some = some.split('/')[0] + '/메타'
		let meta = await findSome({tenancy: tenancy, some: some})
		const result = []
		if(!meta) {
			meta = {someMap: {}, NO: 0}
		}
		if(!!meta.someMap)
		{
			for(let some of Object.keys(meta.someMap))
			{
				let rows = await findSome({tenancy: tenancy, some: some})
				if(rowId == '목록전체')
					rows.map(row => {
						return { id: row.id, ['일시']: row['일시'], ['날짜']: row['날짜'], ['시간']: row['시간'], ['국문제목']: row['국문제목'] }
					})
				result.push(...rows)
			}
		}
		return result
	}
	else if(!rows)
		return null
	if(!Array.isArray(rows))
		return null
	if(!isNaN(rowId))
	{
		if(!rows[rowId]) return null
		return rows[rowId]
	}
	else if(Array.isArray(rowId) && rowId.length >= 1)
	{
		const result = []
		rowId.forEach(index => {
			if(isNaN(index)) return
			result.push(rows[index])
		})
		return result
	}
	else if(typeof rowId === 'string' && rowId.startsWith('마지막 '))
	{
		let lastCount = Number(rowId.substring(4, rowId.length - 1))
		return rows.slice(rows.length - lastCount, rows.length)
	}
	return null
}
/**
 * appendSomeWrapper({tenancy: ?, some: 'TB_XXX/2020-01-01T00:00:00.000Z', row: {...}, onAfter: ?})
 */
async function appendSomeWrapper({tenancy, some, row, onAfter}) {
	some = adjustSomeName(some)
	onBeginTransaction()
	let rows = await findSome({tenancy: tenancy, some: some})
	if(!Array.isArray(rows))
		rows = []
	if(typeof row !== "object")
		row = {value: row}
	
	rows.push(row)
	//console.log("Save:", row)

	const result = await saveSome({tenancy: tenancy, some: some, value: rows})
	if(typeof onAfter === 'function') onAfter()
	onEndTransaction('appendSomeWrapper')
	return result
}
/**
 * replaceLastSomeWrapper({tenancy: ?, some: 'TB_XXX/2020-01-01T00:00:00.000Z', row: {...}, testOption: undefined, option: {}})
 */
async function replaceLastSomeWrapper({tenancy, some, row, testOption, option}) {
	some = adjustSomeName(some)
	onBeginTransaction()
	let rows = await findSome({tenancy: tenancy, some: some})
	if(!Array.isArray(rows))
		rows = []
	if(rows.length <= 0) 
		rows = []
	let lastOne
	if(rows.length === 0)
	{
		lastOne = {}
		rows = [lastOne]
	}
	else
		lastOne = rows[rows.length - 1]
	let pushFlag = false
	if(some === 'TB_DailyResult')
	{
		function push(lastOne, row) {
			row.id = !lastOne.id ? 0 : lastOne.id

			pushFlag = true

			if(pushFlag)
			{
				row.id++
				rows.push(row)
			}
			else
				rows[row.id] = row
		}

		if(!option)
			return false
		if(!lastOne['양품수']) lastOne['양품수'] = 0
		if(!lastOne['불량수']) lastOne['불량수'] = 0
		if(!lastOne['불량율']) lastOne['불량율'] = 0
		if(!lastOne['검사수']) lastOne['검사수'] = 0
		if(!lastOne['전체검사수']) lastOne['전체검사수'] = 0
		row['전체검사수'] += lastOne['전체검사수']
		let dayjsObject = dayjs()
		row['일시'] = dayjsObject
		row.datetime = dayjsObject.format("YYYY-MM-DD HH:mm:ss")
		if(!lastOne['일시'])
			lastOne['일시'] = dayjsObject
		else
			lastOne['일시'] = dayjs(lastOne['일시'], "YYYY-MM-DD HH:mm:ss")
		if(!testOption)
			row['일자'] = dayjsObject.format("YYYY-MM-DD")
		row['시간'] = dayjsObject.format("HH:mm:ss")

		if(
			(row['일시'].day() != lastOne['일시'].day()) ||
			(row['일시'].day() === lastOne['일시'].day() && row['일시'].month() != lastOne['일시'].month()) ||
			(row['일시'].year() != lastOne['일시'].year())
		) // 날짜가 다른 경우 일 갱신 처리
		{
			row['검사수'] = 1
		}
		else
		{
			row['검사수'] += lastOne['검사수']
			row['양품수'] += lastOne['양품수']
			row['불량수'] += lastOne['불량수']
		}

		row['불량율'] = (row['불량수'] / row['검사수'] * 100).toFixed(2)
		row['일시'] = row['일시'].format("YYYY-MM-DD HH:mm:ss")
		push(lastOne, row)
		const result = await saveSome({tenancy: tenancy, some: `${some}-${bid}`, value: rows})
		onEndTransaction('replaceLastSomeWrapper')
		return result
		if(typeof option.DAY_1 === 'string' && option.DAY_1.length === 5)
		{
			let [hh, mm] = option.NIGHT.split(':')
			option.NIGHT = dayjs(dayjsObject)
			option.NIGHT.hour(Number(hh)).minute(Number(mm)).second(0).millisecond(0)
		}
		if(typeof option.DAY_2 === 'string' && option.DAY_2.length === 5)
		{
			let [hh, mm] = option.NIGHT.split(':')
			option.NIGHT = dayjs(dayjsObject)
			option.NIGHT.hour(Number(hh)).minute(Number(mm)).second(0).millisecond(0)
		}
		if(typeof option.NIGHT === 'string' && option.NIGHT.length === 5)
		{
			let [hh, mm] = option.NIGHT.split(':')
			option.NIGHT = dayjs(dayjsObject)
			option.NIGHT.hour(Number(hh)).minute(Number(mm)).second(0).millisecond(0)
		}

		if(!dayjs.isDayjs(option.NIGHT))
			return false
		if(!dayjs.isDayjs(option.DAY_1))
			return false
	
		if(option.COUNT == '없음' && !!lastOne['일자'] && row['일자'] != lastOne['일자'])
		{
			pushFlag = true
			row['불량율'] = (row['불량수'] / row['검사수'] * 100).toFixed(2)
		}
		else if(
				(option.COUNT >= 2 && row['일시'].isAfter(option.DAY_1) && lastOne['일시'].isBefore(option.DAY_1)) ||
				(option.COUNT >= 2 && row['일시'].isAfter(option.NIGHT) && lastOne['일시'].isBefore(option.NIGHT)) ||
				(option.COUNT == 3 && row['일시'].isAfter(option.DAY_2) && lastOne['일시'].isBefore(option.DAY_2))
			) // 모두 오늘 날짜 기준
		{
			pushFlag = true
			row['불량율'] = (row['불량수'] / row['검사수'] * 100).toFixed(2)
		}
		else if(
				(option.COUNT >= 2 && row['일시'].day() != lastOne['일시'].day()) ||
				(option.COUNT >= 2 && row['일시'].day() === lastOne['일시'].day() && row['일시'].month() != lastOne['일시'].month()) ||
				(option.COUNT >= 2 && row['일시'].year() != lastOne['일시'].year())
			) // 날짜가 다른 경우
		{
			pushFlag = true
			row['불량율'] = (row['불량수'] / row['검사수'] * 100).toFixed(2)
		}
		else if(
			option.DAY_1.format("HH:mm") === '00:00' ||
			option.DAY_2.format("HH:mm") === '00:00' ||
			option.NIGHT.format("HH:mm") === '00:00'
			) // 00:00 자정일 경우
		{
			
		}
		else
		{
			row['검사수'] += lastOne['검사수']
			row['양품수'] += lastOne['양품수']
			row['불량수'] += lastOne['불량수']
			row['불량율'] = (row['불량수'] / row['검사수'] * 100).toFixed(2)
		}
		row['일시'] = row['일시'].toDate().toISOString().split('.')[0].split('T').join(' ') //2024-01-03 13:38:55 포멧

		// 조 결정
		row['조'] = ''
		if(option.COUNT === 2)
		{
			if(dayjsObject.isSameOrAfter(option.DAY_1) && dayjsObject.isSameOrBefore(option.NIGHT))
				row['조'] = '주간'
			else
				row['조'] = '야간'
		}
		else if(option.COUNT === 3)
		{
			if(dayjsObject.isSameOrAfter(option.DAY_1) && dayjsObject.isSameOrBefore(option.DAY_2))
				row['조'] = '전근'
			else if(
				option.DAY_2.hour() <= option.NIGHT.hour() && option.NIGHT.hour() <= 23 &&
				dayjsObject.isSameOrAfter(option.DAY_2) && dayjsObject.isSameOrBefore(option.NIGHT))
				row['조'] = '후근'
			else if(
				0 <= option.NIGHT.hour() && option.NIGHT.hour() <= option.DAY_1.hour() &&
				dayjsObject.isSameOrAfter(option.DAY_2) && dayjsObject.isSameOrBefore(option.NIGHT.add(1, 'd')))
			{
				row['조'] = '후근'
			}
			else 
				row['조'] = '야간'
		}
	}
	else
	{
	}


	push()
	return await saveSome({tenancy: tenancy, some: some, value: rows})
}
async function querySomeWrapper({tenancy, some, query}) {
	// id 범위 또는 단일값으로 검색하는 경우
	if(typeof query === 'object' && query.hasOwnProperty('startId') && query.hasOwnProperty('endId'))
		return [getBucketIdAndIndex(query.startId), getBucketIdAndIndex(query.endId)]
	else if(typeof query === 'object' && query.hasOwnProperty('id'))
		return [getBucketIdAndIndex(query.id), getBucketIdAndIndex(query.id)]


	async function binarySearch(cmd) {
		const que = []

		// 애초에 쿼리 범위가 기존 데이터 범위 밖이면 데이터 임계값으로 지정
		let s = 0
		let e = await getMaxBucketId(some)
		let rowsS = await findSome({tenancy: tenancy, some: `${some}-${s}`})
		let rowsE = await findSome({tenancy: tenancy, some: `${some}-${e}`})
		let startDatetime = rowsS[0].datetime
		let endDatetime = rowsE[rowsE.length - 1].datetime
		if(cmd === 's')
			if(dayjs(startDatetime).isSameOrAfter(dayjs(query.startDatetime)))
			{
				return [s, 0]
			}
		if(cmd === 'e')
			if(dayjs(endDatetime).isSameOrBefore(dayjs(query.endDatetime)))
				return [e, rowsE.length - 1]

		// 쿼리 범위가 데이터 범위 내이면
		que.push([s, e])
		while(que.length > 0)
		{
			let [s, e] = que.shift()
			let rowsS = await findSome({tenancy: tenancy, some: `${some}-${s}`})
			let rowsE = await findSome({tenancy: tenancy, some: `${some}-${e}`})
			if(!rowsS || !rowsE) continue
			let startDatetime = rowsS[0].datetime
			let endDatetime = rowsE[rowsE.length - 1].datetime
			if(
				(
					dayjs(query.endDatetime).isBefore(dayjs(startDatetime)) ||
					dayjs(endDatetime).isBefore(dayjs(query.startDatetime))
				)
			)
				continue
			if(e - s > 1)
			{
				let m = Math.floor((s + e) / 2)
				que.push([s, m])
				que.push([m, e])
			}
			else
			{
				if(cmd == 's')
				{
					if(
						(
							dayjs(startDatetime).isSameOrBefore(dayjs(query.startDatetime)) &&
							dayjs(query.startDatetime).isSameOrBefore(dayjs(endDatetime))
						)
					)
						return [s, 0]
				}
				if(cmd == 'e')
				{
					if(
						(
							dayjs(startDatetime).isSameOrBefore(dayjs(query.endDatetime)) &&
							dayjs(query.endDatetime).isSameOrBefore(dayjs(endDatetime))
						)
					)
						return [e, rowsE.length - 1]
				}
			}
		}
		return [null, null]
	}
	let bidStart = await binarySearch('s')
	let bidEnd = await binarySearch('e')
	return [bidStart, bidEnd]
}
function toCSV(tableName, rows) {
	const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
	let header = Object.keys(rows[0])

	if(tableName === 'TB_DailyResult')
		header = [
			'id',
			'일시',
			'일자',
			'시간',
			'검사수',
			'양품수',
			'불량수',
			'불량율',
		]


	const csv = [
		header.join(','), // header row first
		...rows.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
	].join('\r\n') // Windows 호환 CRLF	
	return csv
}
async function createIfNot({tenancy, some, value}) {
	if(some === 'LIST') return false
	if(!some.endsWith('메타'))
		some = adjustSomeName(some)
	if(!await hasKey(JSON.stringify({tenancy, some})))
	{
		await saveSome({tenancy: tenancy, some: some, value: value})
		console.log(`Created | Tenancy(${tenancy}), Some(${some})`)
	}
}
async function createDefaultSchema() {
	function createValue(cmd, values) {
		const structure = []
		if(cmd === '메타')
		{
			for(let value of values)
			{
				let [label, type] = value.split('/')
				if(type === 'DT') type = 'DATETIME'
				if(type === 'D') type = 'DATE'
				if(type === 'T') type = 'TIME'
				if(type === 'S') type = 'STRING'
				if(type === 'SI') type = 'SMALLINT'
				if(type === 'MI') type = 'MEDIUMINT'
				if(type === 'T') type = 'TIME'
				if(type === 'B') type = 'BOOLEAN'
				
				structure.push({label: label, type: type, visible: true})
			}
		}
		return structure
	}
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_Job/메타', value:
		createValue('메타', ['id/MI', 'NO/MI', 'Date/D', 'Time/T', 'Class/S', 'Positive Patch/SI', 'Negative Patch/SI', 'Status/S'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_JobDetails/메타', value:
		createValue('메타', ['id/MI', 'NO/MI', 'Date/D', 'Time/T', 'Status/S', 'Class/S', 'Filename/S', 'Positive Patch/SI', 'Negative Patch/SI'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_CAM/메타', value:
		createValue('메타', ['id/MI', 'NO/MI', 'CAM NO/MI', 'Type/S', 'Status/S', 'Date/D', 'Time/T'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_STAT/메타', value:
		createValue('메타', ['id/MI', 'CPU%/F', 'RAM/F', 'Disk Total/F', 'Disk Usage/F', 'Disk%/F', 'Process Count/SI', 'Port Enable/B', 'Port Number/S'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_User/메타', value: 
		createValue('메타', ['id/MI', 'NO/MI', 'Location/S', 'Username/S', 'Job Group NO/SI', 'Job Group Name/S', 'Connecting Date/D', 'Connecting Time/T', 'Equipment NO/S', 'Equipment Details/S'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_Train/메타', value:
		createValue('메타', ['id/MI', 'NO/MI', 'Train Date/D', 'Train Time/T', 'Model/S', 'Iteration/MI', 'Loss/F', 'Loss Rate/F'])
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_DailyResult/메타', value:
		createValue('메타', ['id/MI', '일시/DT', '일자/D', '시간/T', '검사수/MI', '양품수/MI', '불량수/MI', '불량율/MI', '전체검사수/MI'])
	})
	/* 컬럼명 확인하여 수정 필요.
	createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_TrainedResult/메타', value:
		createValue('메타', ['id/MI', 'NO/MI', 'Train Date/D', 'Train Time/T', 'Model/S', 'Iteration/MI', 'Loss/F', 'Loss Rate/F'])
	})*/
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_TrainedResult', value:
		[]
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_Common', value:
		[{id: 1, LoadDictName: 'DNN-Weights-000-1'}]
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_LoadDictName', value:
		[]
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_Parameter', value:
		[]
	})
	await createIfNot({tenancy: '비전솔루션매니스탈링스', some: 'TB_Temp', value:
		createValue('메타', ['Date/D', 'Time/T', '조/S', '일검사수/MI', '양품수/MI', '불량수/MI', '불량율/F'])
	})
	console.log("Create default schema.")
}
async function createDefaultSchemaAfterClearAll() {
	db.clear()
		.then(async () => {
			await createDefaultSchema()
		})
}
async function closeDB() {
	if(!DBClosed)
		await db.close()
	DBClosed = true
}

async function onInit()
{
	//db.clear()
	let pageViewMap = await findSome({tenancy: '매니스탈링스', some: 'table-페이지뷰', defaultValue: {}})
	let seo = await findSome({tenancy: '매니스탈링스', some: 'table-TB_SEO', defaultValue: {}})
	if(!pageViewMap) pageViewMap = {}
	if(!seo) seo = {}
	return {pageViewMap: pageViewMap, seo: seo}
}

async function savePageViewAndSEOData({pageViewBulky, seo})
{
	if(!DBClosed)
	{
		if(!!pageViewBulky)
			await saveSome({tenancy: '매니스탈링스', some: 'table-페이지뷰', value: pageViewBulky})
		if(!!seo)
			await saveSome({tenancy: '매니스탈링스', some: 'table-TB_SEO', value: seo})
	}
}

module.exports = {
  findSome: findSome,
  querySome: querySome,
  saveSome: saveSome,
	pushSome: pushSome,
	replaceSome: replaceSome,
  createIfNot: createIfNot,
	findSomeWrapper: findSomeWrapper,
	findSomeByRange: findSomeByRange,
	appendSomeWrapper: appendSomeWrapper,
	replaceLastSomeWrapper: replaceLastSomeWrapper,
	removeSome: removeSome,
	createDefaultSchema: createDefaultSchema,
	createDefaultSchemaAfterClearAll: createDefaultSchemaAfterClearAll,
	toCSV: toCSV,
	onInit: onInit,
	savePageViewAndSEOData: savePageViewAndSEOData,
	closeDB: closeDB
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


const req = {
	body: {
		tenancy: '비전솔루션매니스탈링스',
		tableName: 'TB_DailyResult',
	}
}
async function test() {
	let next = () => {}
	
	let currentRow = {datetime: dayjs().toDate()}
	let current = dayjs(currentRow.datetime)
	
	if(current.hour() === 0 && current.minute() === 0)
		if(NEXT_DAY_000.day() === current.day())
		{
			await appendSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, row: currentRow})
			return next()
		}
	
	const result = await findSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, rowId: '마지막 1개'})
	if(!result || result.length === 0)
	{
		// 최초 로우 추가
		console.log('최초 로우 추가')
		await appendSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, row: currentRow})
		return next()
	}
	
	let prev = dayjs(result[0].datetime)
	console.log('prev 000 current', toDatetimeString(prev), toDatetimeString(NEXT_DAY_000), toDatetimeString(current))
	if(prev.isBefore(NEXT_DAY_000) && NEXT_DAY_000.isBefore(current))
	{
		console.log("if 1")
		await appendSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, row: currentRow})
	}
	else if(prev.isBefore(NEXT_DAY_000) && NEXT_DAY_000.isSameOrBefore(current))
	{
		console.log("if 2")
		await appendSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, row: currentRow})
	}
	else if(prev.isSameOrBefore(NEXT_DAY_000) && NEXT_DAY_000.isBefore(current))
	{
		console.log("if 3")
		await replaceLastSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, value: currentRow})
	}
	else if(prev.isSame(NEXT_DAY_000) && NEXT_DAY_000.isSame(current))
	{
		console.log("if 4")
		await replaceLastSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, value: currentRow})
	}
	else if(current.isBefore(NEXT_DAY_000))
	{
		console.log('일반')
		// 일반
		await replaceLastSomeWrapper({tenancy: req.body.tenancy, some: req.body.tableName, value: currentRow})
	}
}
// test()
async function test2() {
	async function refresh(datetime) {
		let value = {}
		value['검사수'] = 1
		value['판정'] = 'Positive'
		if(value['판정'] === 'Positive')
		{
			value['양품수'] = 1
			value['불량수'] = 0
		}
		else
		{
			value['양품수'] = 0
			value['불량수'] = 1
		}
		value['일자'] = dayjs(datetime).format('MM/DD')
		await replaceLastSomeWrapper({tenancy: "매니스탈링스", some: "TB_DailyResult", row: value, testOption: true})
	}
	await refresh([2023, 10, 29, 22, 7, 23, 0])
	await refresh([2023, 10, 29, 22, 8, 23, 0])
	await refresh([2023, 10, 29, 23, 59, 50, 0])
	await refresh([2023, 10, 29, 23, 59, 52, 0])
	await refresh([2023, 10, 29, 23, 59, 59, 0])
	await refresh([2023, 10, 29, 23, 59, 59, 999])
	await refresh([2023, 10, 30, 0, 0, 0, 0])
	await refresh([2023, 10, 30, 0, 0, 1, 0])
	await refresh([2023, 10, 30, 0, 0, 2, 0])
}
// db.clear()
// 	.then(async () => {
// 		await test2()
// 	})


async function main() {
	for(let i = 0; i < 20; i++)
	{
		await test()
		await sleep(2000)
	}
	// await createDefaultSchema()
	// for(let i = 0; i < 20; i++)
	// {
	// 	await appendSomeWrapper({tenancy: '비전솔루션매니스탈링스', some: 'TB_Train', row: `안녕하세요${i}`})
	// 	await sleep(1000)
	// }

	// console.log(await findSomeWrapper({tenancy: '비전솔루션매니스탈링스', some: 'TB_Train', rowId: '마지막 100개'}))
	// console.log(await findSomeByRange({tenancy: '비전솔루션매니스탈링스', some: 'TB_Train', range: [
	// 	{id:0}, {id:0}
	// ]}))
	// console.log(await findSomeByRange({tenancy: '비전솔루션매니스탈링스', some: 'TB_Train', range: [
	// 	dayjs([2023, 10, 29, 22, 7, 23, 0]).toDate(),
	// 	dayjs([2023, 10, 29, 22, 7, 33, 999]).toDate()
	// ]}))
}

// main()
// db.clear()
// 	.then(async () => {
// 		await main()
// 	})


// const startDate = dayjs().hour(0).minute(0).second(0).millisecond(0).toDate()
// const endDate = dayjs().hour(23).minute(59).second(59).millisecond(999).toDate()


//console.log(await findSomeByRange({tenancy: "매니스탈링스", some: 'TB_DailyResult', range: [{datetime: startDate}, {datetime: endDate}]}))
//const arr = await findSomeWrapper({tenancy: "매니스탈링스", some: 'TB_DailyResult', rowId: '마지막 1000개'})
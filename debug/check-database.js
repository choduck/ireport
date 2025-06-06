const { findSome, findSomeWrapper } = require('../db-core2.js')

async function checkDatabase() {
    console.log('=== 데이터베이스 확인 시작 ===\n')
    
    try {
        // 1. findSome으로 직접 확인
        console.log('1. findSome으로 table-TB_NOTICE1 확인:')
        const directData = await findSome({
            tenancy: '매니스탈링스', 
            some: 'table-TB_NOTICE1'
        })
        console.log('findSome 결과:', directData)
        console.log('데이터 타입:', typeof directData)
        console.log('배열인가?:', Array.isArray(directData))
        console.log('데이터 개수:', directData ? (Array.isArray(directData) ? directData.length : 1) : 0)
        
        // 2. findSomeWrapper로 확인
        console.log('\n2. findSomeWrapper로 전체 데이터 확인:')
        const wrapperData = await findSomeWrapper({
            tenancy: '매니스탈링스', 
            some: 'table-TB_NOTICE1', 
            rowId: '전체'
        })
        console.log('findSomeWrapper 결과:', wrapperData)
        console.log('데이터 개수:', wrapperData ? wrapperData.length : 0)
        
        // 3. 구축사례만 필터링
        if (Array.isArray(wrapperData)) {
            console.log('\n3. 구축사례 필터링:')
            const constructionCases = wrapperData.filter(notice => {
                if (!notice) return false
                return notice['카테고리'] === '구축사례'
            })
            console.log('구축사례 개수:', constructionCases.length)
            console.log('구축사례 목록:')
            constructionCases.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item['제목']} (${item['고객사']})`)
            })
        }
        
        // 4. 메타 데이터 확인
        console.log('\n4. 메타 데이터 확인:')
        const metaData = await findSome({
            tenancy: '매니스탈링스', 
            some: 'table-TB_NOTICE1/메타'
        })
        console.log('메타 데이터:', metaData)
        
    } catch(e) {
        console.error('에러 발생:', e)
    }
    
    console.log('\n=== 데이터베이스 확인 완료 ===')
    process.exit(0)
}

checkDatabase()

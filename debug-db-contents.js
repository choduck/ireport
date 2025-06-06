const { findSome, findSomeWrapper, saveSome, pushSome } = require("./db-core2")

const TENANCY = "매니스탈링스"

async function checkAndAddData() {
    console.log('=== 데이터베이스 현재 상태 확인 ===')
    
    try {
        // 1. 전체 테이블 구조 확인
        console.log('\n1. 전체 테이블 조회 시도...')
        const allData = await findSomeWrapper({
            tenancy: TENANCY,
            some: `table-TB_NOTICE1`
        })
        console.log('전체 데이터:', allData)
        console.log('데이터 타입:', typeof allData)
        console.log('배열 여부:', Array.isArray(allData))
        
        // 2. 메타 정보 확인
        console.log('\n2. 메타 정보 확인...')
        const metaData = await findSome({
            tenancy: TENANCY,
            some: `table-TB_NOTICE1/메타`
        })
        console.log('메타 데이터:', metaData)
        
        // 3. 날짜별 데이터 확인
        console.log('\n3. 오늘 날짜 데이터 확인...')
        const today = new Date().toISOString().split('T')[0]
        const todayData = await findSome({
            tenancy: TENANCY,
            some: `table-TB_NOTICE1/${today}T12:00:00`
        })
        console.log('오늘 데이터:', todayData)
        
        // 4. 구축사례 데이터 직접 추가
        console.log('\n4. 구축사례 데이터 직접 추가...')
        
        const testCases = [
            {
                카테고리: '구축사례',
                고객사: 'A전자',
                사업명: '스마트팩토리 AI 비전 시스템 구축',
                사업기간: '2024.01 ~ 2024.06',
                작성일: '2024-06-01'
            },
            {
                카테고리: '구축사례',
                고객사: 'B자동차',
                사업명: '차량 품질검사 AI 솔루션',
                사업기간: '2024.03 ~ 2024.08',
                작성일: '2024-06-02'
            },
            {
                카테고리: '구축사례',
                고객사: 'C제약',
                사업명: '의약품 포장 결함 검출 시스템',
                사업기간: '2024.02 ~ 2024.07',
                작성일: '2024-06-03'
            }
        ]
        
        for (let i = 0; i < testCases.length; i++) {
            try {
                console.log(`${i+1}번째 구축사례 추가 중...`)
                await pushSome({
                    tenancy: TENANCY,
                    some: `table-TB_NOTICE1`,
                    value: testCases[i]
                })
                console.log(`${i+1}번째 구축사례 추가 완료`)
            } catch (error) {
                console.error(`${i+1}번째 구축사례 추가 실패:`, error.message)
            }
        }
        
        // 5. 추가 후 다시 확인
        console.log('\n5. 데이터 추가 후 재확인...')
        const afterData = await findSomeWrapper({
            tenancy: TENANCY,
            some: `table-TB_NOTICE1`
        })
        console.log('추가 후 전체 데이터:', afterData)
        
        if (Array.isArray(afterData)) {
            const constructionCases = afterData.filter(item => item && item.카테고리 === '구축사례')
            console.log('구축사례만 필터링:', constructionCases)
        }
        
    } catch (error) {
        console.error('전체 에러:', error)
    }
}

checkAndAddData().then(() => {
    console.log('\n=== 스크립트 완료 ===')
    process.exit(0)
}).catch(error => {
    console.error('스크립트 에러:', error)
    process.exit(1)
}) 
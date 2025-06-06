const { findSome, findSomeWrapper } = require('./db-core2')

async function debugDatabase() {
    console.log('=== 데이터베이스 디버깅 ===')
    
    try {
        // 1. 메타데이터 확인
        console.log('\n1. 메타데이터 확인:')
        const meta = await findSome({
            tenancy: '매니스탈링스',
            some: 'table-TB_NOTICE1/메타'
        })
        console.log('메타데이터:', meta)
        
        if (meta && meta.someMap) {
            console.log('\n2. someMap 키들:')
            Object.keys(meta.someMap).forEach((key, index) => {
                console.log(`  ${index + 1}. ${key}`)
            })
            
            // 3. 각 키의 데이터 확인
            console.log('\n3. 각 시간대별 구축사례 데이터:')
            for (let someKey of Object.keys(meta.someMap)) {
                const data = await findSome({
                    tenancy: '매니스탈링스',
                    some: someKey
                })
                
                if (Array.isArray(data)) {
                    const constructionCases = data.filter(item => 
                        item && item['카테고리'] === '구축사례'
                    )
                    
                    if (constructionCases.length > 0) {
                        console.log(`\n  키: ${someKey}`)
                        console.log(`  구축사례 개수: ${constructionCases.length}`)
                        constructionCases.forEach(item => {
                            console.log(`    - NO: ${item.NO}, 고객사: ${item.고객사}, 일시: ${item.일시}`)
                        })
                    }
                }
            }
        }
        
        // 4. 전체 데이터 확인
        console.log('\n4. 전체 구축사례 데이터:')
        const allData = await findSomeWrapper({
            tenancy: '매니스탈링스',
            some: 'table-TB_NOTICE1',
            rowId: '전체'
        })
        
        const allConstructionCases = allData.filter(item => 
            item && item['카테고리'] === '구축사례'
        )
        
        console.log(`전체 구축사례 개수: ${allConstructionCases.length}`)
        
        // NO가 중복된 항목 찾기
        console.log('\n5. NO 중복 확인:')
        const noMap = {}
        allConstructionCases.forEach(item => {
            if (!noMap[item.NO]) {
                noMap[item.NO] = []
            }
            noMap[item.NO].push({
                고객사: item.고객사,
                사업명: item.사업명,
                일시: item.일시
            })
        })
        
        Object.keys(noMap).forEach(no => {
            if (noMap[no].length > 1) {
                console.log(`  NO ${no}가 ${noMap[no].length}개 중복:`)
                noMap[no].forEach((item, index) => {
                    console.log(`    ${index + 1}. ${item.고객사} - ${item.사업명} (${item.일시})`)
                })
            }
        })
        
    } catch (error) {
        console.error('디버깅 중 오류 발생:', error)
    }
}

debugDatabase().then(() => {
    console.log('\n=== 디버깅 완료 ===')
    process.exit(0)
}).catch(error => {
    console.error('디버깅 에러:', error)
    process.exit(1)
})

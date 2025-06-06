const { Level } = require('level')
const db = new Level('many', { valueEncoding: 'json' })

async function inspectDatabase() {
    console.log('=== LevelDB 직접 검사 ===')
    
    try {
        // 모든 키 출력
        console.log('\n모든 데이터베이스 키:')
        let count = 0
        for await (const [key, value] of db.iterator()) {
            count++
            const parsedKey = JSON.parse(key)
            console.log(`\n${count}. 키: ${key}`)
            console.log(`   파싱된 키:`, parsedKey)
            
            // TB_NOTICE1 관련 키만 상세 출력
            if (parsedKey.some && parsedKey.some.includes('TB_NOTICE1')) {
                if (parsedKey.some.includes('메타')) {
                    console.log('   >>> 메타데이터:', value)
                } else {
                    console.log(`   >>> 데이터 개수: ${Array.isArray(value) ? value.length : 'N/A'}`)
                    if (Array.isArray(value)) {
                        const constructionCases = value.filter(item => 
                            item && item['카테고리'] === '구축사례'
                        )
                        if (constructionCases.length > 0) {
                            console.log(`   >>> 구축사례 개수: ${constructionCases.length}`)
                            constructionCases.forEach(item => {
                                console.log(`       - NO: ${item.NO}, 고객사: ${item.고객사}`)
                            })
                        }
                    }
                }
            }
        }
        
        console.log(`\n총 키 개수: ${count}`)
        
    } catch (error) {
        console.error('검사 중 오류:', error)
    } finally {
        await db.close()
    }
}

inspectDatabase().then(() => {
    console.log('\n=== 검사 완료 ===')
}).catch(error => {
    console.error('검사 에러:', error)
})

const { findSome, saveSome } = require('./db-core2')

async function testDirectDelete() {
    console.log('=== 직접 데이터베이스 삭제 테스트 ===')
    
    try {
        // 1. 메타데이터 확인
        console.log('\n1. 메타데이터 확인...')
        const metaKey = 'table-TB_NOTICE1/메타'
        let meta = await findSome({tenancy: '매니스탈링스', some: metaKey})
        
        if (!meta || !meta.someMap) {
            console.log('메타데이터가 없습니다.')
            return
        }
        
        console.log('메타 someMap 키들:', Object.keys(meta.someMap))
        
        // 2. NO 19 찾기
        console.log('\n2. NO 19 항목 찾기...')
        let foundKey = null
        let foundData = null
        let foundIndex = -1
        
        for (let someKey of Object.keys(meta.someMap)) {
            console.log(`\n검색 중: ${someKey}`)
            let data = await findSome({tenancy: '매니스탈링스', some: someKey})
            
            if (Array.isArray(data)) {
                console.log(`  - 데이터 개수: ${data.length}`)
                const targetIndex = data.findIndex(item => item.NO == 19)
                
                if (targetIndex !== -1) {
                    console.log(`  - NO 19 발견! (인덱스: ${targetIndex})`)
                    console.log(`  - 항목 정보:`, data[targetIndex])
                    foundKey = someKey
                    foundData = data
                    foundIndex = targetIndex
                    break
                }
            }
        }
        
        if (!foundKey) {
            console.log('\nNO 19 항목을 찾을 수 없습니다.')
            return
        }
        
        // 3. 삭제 실행
        console.log('\n3. 삭제 실행...')
        console.log('삭제 전 데이터 개수:', foundData.length)
        
        foundData.splice(foundIndex, 1)
        
        console.log('삭제 후 데이터 개수:', foundData.length)
        
        // 4. 저장
        console.log('\n4. 변경사항 저장...')
        if (foundData.length === 0) {
            console.log('데이터가 비어있으므로 메타에서 제거')
            delete meta.someMap[foundKey]
            await saveSome({tenancy: '매니스탈링스', some: metaKey, value: meta})
        } else {
            console.log('수정된 데이터 저장')
            await saveSome({tenancy: '매니스탈링스', some: foundKey, value: foundData})
        }
        
        // 5. 확인
        console.log('\n5. 삭제 확인...')
        let verifyData = await findSome({tenancy: '매니스탈링스', some: foundKey})
        
        if (!verifyData || (Array.isArray(verifyData) && verifyData.findIndex(item => item.NO == 19) === -1)) {
            console.log('✅ 삭제 성공!')
        } else {
            console.log('❌ 삭제 실패!')
            if (Array.isArray(verifyData)) {
                const stillExists = verifyData.find(item => item.NO == 19)
                if (stillExists) {
                    console.log('여전히 존재하는 항목:', stillExists)
                }
            }
        }
        
    } catch (error) {
        console.error('테스트 중 오류:', error)
    }
}

testDirectDelete().then(() => {
    console.log('\n=== 테스트 완료 ===')
    process.exit(0)
}).catch(error => {
    console.error('테스트 에러:', error)
    process.exit(1)
})

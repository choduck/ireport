const axios = require('axios')

async function testDelete() {
    console.log('=== 삭제 기능 디버깅 ===')
    
    try {
        // 1. 로그인
        console.log('1. 로그인...')
        const loginResponse = await axios.patch('http://localhost:8888/api/v2/login', {
            id: '아이디',
            pw: '이것은 비밀번호입니다.'
        })
        
        const cookies = loginResponse.headers['set-cookie']
        
        // 2. 전체 데이터 조회해서 NO 19 찾기
        console.log('\n2. NO 19번 항목 찾기...')
        const checkResponse = await axios.patch('http://localhost:8888/api/v2/table', {
            tableName: 'TB_NOTICE1',
            row: {},
            option: {
                rowId: '전체'
            }
        })
        
        const allData = checkResponse.data.data
        const item19 = allData.find(item => item.NO == 19)
        
        if (item19) {
            console.log('NO 19 항목 발견:')
            console.log('  - NO:', item19.NO)
            console.log('  - id:', item19.id)
            console.log('  - 고객사:', item19.고객사)
            console.log('  - 사업명:', item19.사업명)
            console.log('  - 일시:', item19.일시)
            
            // 3. 삭제 시도
            console.log('\n3. NO 19 삭제 시도...')
            const deleteResponse = await axios.delete('http://localhost:8888/api/v2/table/delete', {
                data: {
                    tableName: 'TB_NOTICE1',
                    option: {
                        rowId: 19
                    }
                },
                headers: {
                    'Cookie': cookies ? cookies.join('; ') : ''
                }
            })
            
            console.log('삭제 응답:', deleteResponse.data)
            
            // 4. 삭제 확인
            console.log('\n4. 삭제 확인...')
            const finalCheckResponse = await axios.patch('http://localhost:8888/api/v2/table', {
                tableName: 'TB_NOTICE1',
                row: {},
                option: {
                    rowId: '전체'
                }
            })
            
            const finalData = finalCheckResponse.data.data
            const item19After = finalData.find(item => item.NO == 19)
            
            if (!item19After) {
                console.log('✅ 삭제 성공!')
            } else {
                console.log('❌ 삭제 실패! 항목이 여전히 존재합니다.')
                console.log('남아있는 항목:', {
                    NO: item19After.NO,
                    고객사: item19After.고객사,
                    사업명: item19After.사업명
                })
            }
            
            // 5. 전체 테스트전자 항목 개수 확인
            console.log('\n5. 모든 "테스트전자" 항목:')
            const testItems = finalData.filter(item => 
                item.고객사 && item.고객사.includes('테스트')
            )
            
            testItems.forEach((item, idx) => {
                console.log(`  ${idx + 1}. NO: ${item.NO}, 고객사: ${item.고객사}, 사업명: ${item.사업명}`)
            })
            
        } else {
            console.log('NO 19 항목을 찾을 수 없습니다.')
        }
        
    } catch (error) {
        console.error('디버깅 실패:', error.message)
        if (error.response) {
            console.error('에러 응답:', error.response.data)
        }
    }
}

testDelete().then(() => {
    console.log('\n=== 디버깅 완료 ===')
}).catch(error => {
    console.error('디버깅 에러:', error)
})

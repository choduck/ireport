const axios = require('axios')

async function checkDatabase() {
    console.log('=== API를 통한 데이터베이스 확인 ===')
    
    try {
        // 1. 로그인
        console.log('1. 관리자 로그인 중...')
        const loginResponse = await axios.patch('http://localhost:8888/api/v2/login', {
            id: '아이디',
            pw: '이것은 비밀번호입니다.'
        })
        
        console.log('로그인 성공:', loginResponse.data)
        const cookies = loginResponse.headers['set-cookie']
        
        // 2. 전체 데이터 조회
        console.log('\n2. 전체 데이터 조회...')
        const checkResponse = await axios.patch('http://localhost:8888/api/v2/table', {
            tableName: 'TB_NOTICE1',
            row: {},
            option: {
                rowId: '전체'
            }
        }, {
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        })
        
        const allData = checkResponse.data.data
        const constructionCases = allData.filter(item => 
            item && item['카테고리'] === '구축사례'
        )
        
        console.log(`\n구축사례 총 개수: ${constructionCases.length}`)
        console.log('\n구축사례 목록:')
        constructionCases.forEach((item, index) => {
            console.log(`${index + 1}. NO: ${item.NO}, id: ${item.id}, 고객사: ${item.고객사}, 사업명: ${item.사업명}, 일시: ${item.일시}`)
        })
        
        // NO 중복 확인
        console.log('\n3. NO 중복 확인:')
        const noGroups = {}
        constructionCases.forEach(item => {
            if (!noGroups[item.NO]) {
                noGroups[item.NO] = []
            }
            noGroups[item.NO].push(item)
        })
        
        Object.keys(noGroups).forEach(no => {
            if (noGroups[no].length > 1) {
                console.log(`\nNO ${no}가 ${noGroups[no].length}개 중복됨:`)
                noGroups[no].forEach((item, idx) => {
                    console.log(`  ${idx + 1}. 고객사: ${item.고객사}, 사업명: ${item.사업명}`)
                })
            }
        })
        
        // 수정된전자 찾기
        console.log('\n4. "수정된전자" 항목 찾기:')
        const modifiedItems = constructionCases.filter(item => 
            item.고객사 === '수정된전자' || item.고객사 === '테스트전자'
        )
        
        if (modifiedItems.length > 0) {
            console.log('발견된 테스트 항목들:')
            modifiedItems.forEach(item => {
                console.log(`  - NO: ${item.NO}, 고객사: ${item.고객사}, 사업명: ${item.사업명}`)
            })
        }
        
    } catch (error) {
        console.error('확인 실패:', error.message)
        if (error.response) {
            console.error('에러 응답:', error.response.data)
        }
    }
}

checkDatabase().then(() => {
    console.log('\n=== 확인 완료 ===')
}).catch(error => {
    console.error('확인 에러:', error)
})

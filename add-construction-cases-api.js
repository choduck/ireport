const axios = require('axios')

async function addConstructionCases() {
    console.log('=== API를 통한 구축사례 데이터 추가 ===')
    
    // 먼저 로그인
    console.log('1. 관리자 로그인 중...')
    
    try {
        const loginResponse = await axios.patch('http://localhost:8888/api/v2/login', {
            id: '아이디',
            pw: '이것은 비밀번호입니다.'
        })
        
        console.log('로그인 성공:', loginResponse.data)
        
        // 쿠키 추출
        const cookies = loginResponse.headers['set-cookie']
        console.log('쿠키:', cookies)
        
        // 구축사례 데이터 정의
        const constructionCases = [
            {
                카테고리: '구축사례',
                고객사: 'A전자',
                사업명: '스마트팩토리 AI 비전 시스템 구축',
                사업기간: '2024.01 ~ 2024.06',
                작성일: new Date().toISOString()
            },
            {
                카테고리: '구축사례',
                고객사: 'B자동차',
                사업명: '차량 품질검사 AI 솔루션',
                사업기간: '2024.03 ~ 2024.08',
                작성일: new Date().toISOString()
            },
            {
                카테고리: '구축사례',
                고객사: 'C제약',
                사업명: '의약품 포장 결함 검출 시스템',
                사업기간: '2024.02 ~ 2024.07',
                작성일: new Date().toISOString()
            }
        ]
        
        console.log('\n2. 구축사례 데이터 추가 중...')
        
        for (let i = 0; i < constructionCases.length; i++) {
            try {
                console.log(`${i+1}번째 구축사례 추가 중:`, constructionCases[i].고객사)
                
                const response = await axios.post('http://localhost:8888/api/v2/table', {
                    tableName: 'TB_NOTICE1',
                    row: constructionCases[i]
                }, {
                    headers: {
                        'Cookie': cookies ? cookies.join('; ') : ''
                    }
                })
                
                console.log(`${i+1}번째 추가 결과:`, response.data)
                
            } catch (error) {
                console.error(`${i+1}번째 추가 실패:`, error.message)
                if (error.response) {
                    console.error('에러 응답:', error.response.data)
                }
            }
        }
        
        console.log('\n3. 추가된 데이터 확인 중...')
        
        // 데이터 조회
        const checkResponse = await axios.patch('http://localhost:8888/api/v2/table', {
            tableName: 'TB_NOTICE1',
            row: {},
            option: {
                rowId: '목록전체'
            }
        })
        
        console.log('조회 결과:', checkResponse.data)
        
    } catch (error) {
        console.error('전체 작업 실패:', error.message)
        if (error.response) {
            console.error('에러 응답:', error.response.data)
            console.error('상태 코드:', error.response.status)
        }
    }
}

addConstructionCases().then(() => {
    console.log('\n=== API 작업 완료 ===')
}).catch(error => {
    console.error('API 작업 에러:', error)
}) 
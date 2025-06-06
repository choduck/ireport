const axios = require('axios')

async function testConstructionCases() {
    console.log('=== 구축사례 관리 기능 테스트 ===')
    
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
        
        // 2. 테스트용 구축사례 추가
        console.log('\n2. 테스트용 구축사례 추가 중...')
        
        const testCase = {
            카테고리: '구축사례',
            고객사: '테스트전자',
            사업명: '삭제 테스트용 프로젝트',
            사업기간: '2025.01 ~ 2025.02',
            작성일: new Date().toISOString()
        }
        
        const addResponse = await axios.post('http://localhost:8888/api/v2/table', {
            tableName: 'TB_NOTICE1',
            row: testCase
        }, {
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        })
        
        console.log('추가 결과:', addResponse.data)
        
        // 3. 추가된 데이터 확인
        console.log('\n3. 추가된 데이터 확인 중...')
        
        const checkResponse = await axios.patch('http://localhost:8888/api/v2/table', {
            tableName: 'TB_NOTICE1',
            row: {},
            option: {
                rowId: '전체'
            }
        })
        
        const allData = checkResponse.data.data
        const constructionCases = allData.filter(item => 
            item && item['카테고리'] === '구축사례'
        )
        
        console.log('구축사례 총 개수:', constructionCases.length)
        
        // 방금 추가한 항목 찾기
        const addedItem = constructionCases.find(item => 
            item['고객사'] === '테스트전자' && 
            item['사업명'] === '삭제 테스트용 프로젝트'
        )
        
        if (addedItem) {
            console.log('추가된 항목 확인:', {
                NO: addedItem.NO,
                고객사: addedItem.고객사,
                사업명: addedItem.사업명
            })
            
            // 4. 수정 테스트
            console.log('\n4. 항목 수정 테스트...')
            
            const updateResponse = await axios.patch('http://localhost:8888/api/v2/table/update', {
                tableName: 'TB_NOTICE1',
                row: {
                    ...addedItem,
                    고객사: '수정된전자',
                    사업명: '수정된 프로젝트',
                    사업기간: '2025.02 ~ 2025.03'
                },
                option: {
                    rowId: addedItem.NO
                }
            }, {
                headers: {
                    'Cookie': cookies ? cookies.join('; ') : ''
                }
            })
            
            console.log('수정 결과:', updateResponse.data)
            
            // 5. 삭제 테스트
            console.log('\n5. 항목 삭제 테스트...')
            
            const deleteResponse = await axios.delete('http://localhost:8888/api/v2/table/delete', {
                data: {
                    tableName: 'TB_NOTICE1',
                    option: {
                        rowId: addedItem.NO
                    }
                },
                headers: {
                    'Cookie': cookies ? cookies.join('; ') : ''
                }
            })
            
            console.log('삭제 결과:', deleteResponse.data)
            
            // 6. 삭제 확인
            console.log('\n6. 삭제 확인 중...')
            
            const finalCheckResponse = await axios.patch('http://localhost:8888/api/v2/table', {
                tableName: 'TB_NOTICE1',
                row: {},
                option: {
                    rowId: '전체'
                }
            })
            
            const finalData = finalCheckResponse.data.data
            const finalConstructionCases = finalData.filter(item => 
                item && item['카테고리'] === '구축사례'
            )
            
            const deletedItem = finalConstructionCases.find(item => 
                item.NO === addedItem.NO
            )
            
            if (!deletedItem) {
                console.log('✅ 삭제 성공! 항목이 정상적으로 삭제되었습니다.')
            } else {
                console.log('❌ 삭제 실패! 항목이 여전히 존재합니다.')
            }
            
        } else {
            console.log('추가된 항목을 찾을 수 없습니다.')
        }
        
    } catch (error) {
        console.error('테스트 실패:', error.message)
        if (error.response) {
            console.error('에러 응답:', error.response.data)
            console.error('상태 코드:', error.response.status)
        }
    }
}

testConstructionCases().then(() => {
    console.log('\n=== 테스트 완료 ===')
}).catch(error => {
    console.error('테스트 에러:', error)
})

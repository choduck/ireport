const axios = require('axios')

async function addTestData() {
    const baseURL = 'http://localhost:8888'
    
    // 먼저 로그인
    try {
        console.log('로그인 시도...')
        const loginRes = await axios.patch(`${baseURL}/api/v2/login`, {
            id: '아이디',
            pw: '이것은 비밀번호입니다.'
        })
        
        const cookie = loginRes.headers['set-cookie'][0]
        console.log('로그인 성공')
        
        // 테스트 구축사례 데이터
        const testData = [
            {
                '카테고리': '구축사례',
                '제목': '통계청 가구주택기초조사 지도 구축',
                '고객사': '통계청',
                '사업명': '통계청 가구주택기초조사 지도 구축', 
                '사업기간': '25.01 ~ 25.04',
                '작성일': '2025-01-01',
                '일자': '2025-01-01',
                '일시': new Date().toISOString(),
                'NO': Date.now() + 1,
                '국문제목': '통계청 가구주택기초조사 지도 구축',
                '국문내용': '통계청 가구주택기초조사를 위한 지도 시스템 구축'
            },
            {
                '카테고리': '구축사례',
                '제목': '창원특례시 도시계획 지도 구축',
                '고객사': '창원특례시',
                '사업명': '창원특례시 도시계획 지도 구축',
                '사업기간': '25.01 ~ 25.04', 
                '작성일': '2025-01-02',
                '일자': '2025-01-02',
                '일시': new Date().toISOString(),
                'NO': Date.now() + 2,
                '국문제목': '창원특례시 도시계획 지도 구축',
                '국문내용': '창원특례시 도시계획을 위한 GIS 시스템 구축'
            },
            {
                '카테고리': '구축사례',
                '제목': '국립환경과학원 환경지도 구축',
                '고객사': '국립환경과학원',
                '사업명': '국립환경과학원 환경지도 구축',
                '사업기간': '25.01 ~ 25.04',
                '작성일': '2025-01-03',
                '일자': '2025-01-03',
                '일시': new Date().toISOString(),
                'NO': Date.now() + 3,
                '국문제목': '국립환경과학원 환경지도 구축',
                '국문내용': '환경 모니터링을 위한 통합 지도 시스템 구축'
            },
            {
                '카테고리': '구축사례',
                '제목': 'KEITI 환경기술 평가 시스템',
                '고객사': 'KEITI',
                '사업명': 'KEITI 환경기술 평가 시스템',
                '사업기간': '25.01 ~ 25.04',
                '작성일': '2025-01-04',
                '일자': '2025-01-04',
                '일시': new Date().toISOString(),
                'NO': Date.now() + 4,
                '국문제목': 'KEITI 환경기술 평가 시스템',
                '국문내용': '환경기술 평가를 위한 통합 관리 시스템 구축'
            },
            {
                '카테고리': '구축사례',
                '제목': 'EPIS 환경정보 통합시스템',
                '고객사': 'EPIS',
                '사업명': 'EPIS 환경정보 통합시스템',
                '사업기간': '25.01 ~ 25.04',
                '작성일': '2025-01-05',
                '일자': '2025-01-05',
                '일시': new Date().toISOString(),
                'NO': Date.now() + 5,
                '국문제목': 'EPIS 환경정보 통합시스템',
                '국문내용': '환경정보 통합 관리를 위한 시스템 구축'
            }
        ]
        
        // 각 테스트 데이터 추가
        for (const data of testData) {
            try {
                await axios.post(`${baseURL}/api/v2/table`, {
                    tableName: 'TB_NOTICE1',
                    row: data,
                    origin: 'localhost-1'
                }, {
                    headers: {
                        'Cookie': cookie,
                        'Content-Type': 'application/json'
                    }
                })
                console.log('추가됨:', data['제목'])
            } catch(e) {
                console.error('데이터 추가 실패:', data['제목'], e.message)
            }
        }
        
        console.log('완료!')
        
    } catch(e) {
        console.error('에러:', e.message)
        console.log('\n서버가 실행 중인지 확인해주세요.')
        console.log('서버 실행: node main.js')
    }
}

addTestData()